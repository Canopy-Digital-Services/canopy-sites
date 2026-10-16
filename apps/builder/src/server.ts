import { timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import type { ChangeOp } from "@canopy/site-contract";
import { resolveFile, sendFile } from "./serve.ts";
import { BUILD_ID, getBuild, publish, readSiteContent, siteStatus, SLUG, startPreview, viewRoot, type SiteRef } from "./sites.ts";
import { StepError } from "./run.ts";

/**
 * Internal API for the portal. Not routed by Traefik: only containers on the
 * same Docker network reach it, and every route except /healthz needs the
 * shared bearer token. The portal is the authority on which site is whose;
 * the builder trusts the site reference it sends.
 */

const TOKEN = process.env.BUILDER_TOKEN ?? "";
if (TOKEN.length < 32) {
  console.error("BUILDER_TOKEN must be set to at least 32 characters");
  process.exit(1);
}
const PORT = Number(process.env.PORT ?? 4100);
const MAX_BODY = 1_000_000;

function authorized(req: IncomingMessage) {
  const header = req.headers.authorization ?? "";
  const given = Buffer.from(header.startsWith("Bearer ") ? header.slice(7) : "");
  const expected = Buffer.from(TOKEN);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function json(res: ServerResponse, status: number, body: unknown) {
  const text = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(text) });
  res.end(text);
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) throw new StepError("Request body too large");
    chunks.push(chunk as Buffer);
  }
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new StepError("Expected a JSON object");
  return parsed;
}

function siteRef(slug: string, body: Record<string, unknown>): SiteRef {
  const { repoUrl, branch } = body;
  if (typeof repoUrl !== "string" || typeof branch !== "string") throw new StepError("repoUrl and branch are required");
  return { slug, repoUrl, branch };
}

const OPS = new Set(["add", "remove", "replace", "move"]);
function parseOps(value: unknown): ChangeOp[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 100) throw new StepError("ops must be a list of at most 100 changes");
  return value.map((o, i) => {
    if (!o || typeof o !== "object") throw new StepError(`Change ${i + 1} is not an object`);
    const { collection, op, path: p, value: v, from } = o as Record<string, unknown>;
    if (typeof collection !== "string" || typeof op !== "string" || !OPS.has(op) || typeof p !== "string") {
      throw new StepError(`Change ${i + 1} needs collection, op (add, remove, replace, move), and path`);
    }
    if (from !== undefined && typeof from !== "string") throw new StepError(`Change ${i + 1}: from must be a path`);
    return { collection, op: op as ChangeOp["op"], path: p, value: v, from: from as string | undefined };
  });
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://builder");
  const parts = url.pathname.split("/").filter(Boolean);

  if (req.method === "GET" && url.pathname === "/healthz") return json(res, 200, { ok: true });
  if (!authorized(req)) return json(res, 401, { error: "Unauthorized" });

  // /v1/sites/:slug/...
  if (parts[0] !== "v1" || parts[1] !== "sites" || !parts[2]) return json(res, 404, { error: "Not found" });
  const slug = parts[2];
  if (!SLUG.test(slug) || slug.length > 40) return json(res, 400, { error: "Bad site slug" });
  const action = parts[3];

  // GET /v1/sites/:slug/status
  if (req.method === "GET" && action === "status") return json(res, 200, await siteStatus(slug));

  // GET /v1/sites/:slug/builds/:id
  if (req.method === "GET" && action === "builds" && parts[4]) {
    if (!BUILD_ID.test(parts[4])) return json(res, 400, { error: "Bad build id" });
    const rec = await getBuild(slug, parts[4]);
    return rec ? json(res, 200, rec) : json(res, 404, { error: "No such build" });
  }

  // GET /v1/sites/:slug/files/(current|preview)/<path>
  if (req.method === "GET" && action === "files" && (parts[4] === "current" || parts[4] === "preview")) {
    const root = await viewRoot(slug, parts[4]);
    if (!root) return json(res, 404, { error: "Nothing built yet" });
    const rest = "/" + url.pathname.split("/").slice(6).join("/");
    const file = await resolveFile(root, rest);
    const headers = { "X-Canopy-Build": path.basename(root) };
    if (file) return sendFile(res, file, 200, headers);
    const notFound = await resolveFile(root, "/404.html");
    if (notFound) return sendFile(res, notFound, 404, headers);
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }

  if (req.method !== "POST") return json(res, 404, { error: "Not found" });
  const body = await readJson(req);

  // POST /v1/sites/:slug/content  { repoUrl, branch }
  if (action === "content") return json(res, 200, await readSiteContent(siteRef(slug, body)));

  // POST /v1/sites/:slug/previews  { repoUrl, branch, buildId, ops, baseCommit? }
  if (action === "previews") {
    const buildId = body.buildId;
    if (typeof buildId !== "string" || !BUILD_ID.test(buildId)) throw new StepError("buildId is required");
    const base = typeof body.baseCommit === "string" ? body.baseCommit : undefined;
    const rec = startPreview(siteRef(slug, body), buildId, parseOps(body.ops), base);
    return json(res, 202, { id: rec.id, status: rec.status });
  }

  // POST /v1/sites/:slug/publish  { repoUrl, branch, buildId, ops, baseCommit, message, authorName, authorEmail }
  if (action === "publish") {
    const { buildId, baseCommit, message, authorName, authorEmail } = body;
    if (typeof buildId !== "string" || !BUILD_ID.test(buildId)) throw new StepError("buildId is required");
    if (typeof baseCommit !== "string" || !/^[0-9a-f]{40}$/.test(baseCommit)) throw new StepError("baseCommit is required");
    if (typeof message !== "string" || !message.trim() || message.length > 2000) throw new StepError("message is required");
    if (typeof authorName !== "string" || typeof authorEmail !== "string") throw new StepError("author is required");
    const result = await publish(siteRef(slug, body), buildId, parseOps(body.ops), baseCommit, message, {
      name: authorName.replace(/[\n\r<>]/g, "").slice(0, 100) || "Canopy",
      email: /^[^\s<>@]+@[^\s<>@]+$/.test(authorEmail) ? authorEmail : "sites@canopyds.com",
    });
    return json(res, 200, result);
  }

  return json(res, 404, { error: "Not found" });
}

createServer((req, res) => {
  handle(req, res).catch((err) => {
    const known = err instanceof StepError || err instanceof SyntaxError;
    if (!known) console.error(JSON.stringify({ event: "builder_error", message: (err as Error).message, stack: (err as Error).stack }));
    if (!res.headersSent) json(res, known ? 422 : 500, { error: known ? (err as Error).message : "Builder error", issues: (err as { issues?: unknown }).issues });
    else res.end();
  });
}).listen(PORT, () => console.log(JSON.stringify({ event: "builder_listening", port: PORT })));

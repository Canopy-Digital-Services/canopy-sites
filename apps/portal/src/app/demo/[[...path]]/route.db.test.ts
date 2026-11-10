import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createMember, createSite, resetDatabase } from "../../../../test/db";
import { resetRequest, signInAs } from "../../../../test/next-request";

vi.mock("next/headers", () => import("../../../../test/next-request"));

// The builder stands in over HTTP, so the portal's own client runs; the
// database is real. It answers every route it is asked for, and `requests`
// keeps each path.
const BUILDER = "http://builder.test:4100";
const FILES = /^\/v1\/sites\/demo\/files\/(current|preview)\/(.*)$/;
const PAGES = ["", "services", "about/index.html"];
const builder = { built: true, calls: [] as string[], requests: [] as string[], onlyInPreview: [] as string[] };

vi.stubEnv("BUILDER_URL", BUILDER);
vi.stubEnv("BUILDER_TOKEN", "t".repeat(32));
vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
  const url = new URL(String(input));
  if (url.origin !== BUILDER) throw new Error(`Unexpected request to ${url.origin}`);
  builder.requests.push(url.pathname);
  const files = FILES.exec(url.pathname);
  if (!files) return Response.json({ current: "b1", preview: "b2" });
  const view = files[1];
  const path = decodeURIComponent(files[2]);
  builder.calls.push(view);
  if (!builder.built) return Response.json({ error: "Nothing built yet" }, { status: 404 });
  const inPreview = builder.onlyInPreview.includes(path);
  if (path.endsWith(".css") && (view === "preview" || !inPreview)) {
    return new Response("body{}", { headers: { "Content-Type": "text/css; charset=utf-8" } });
  }
  if (PAGES.includes(path) && !inPreview) {
    return new Response(`<html><head><title>t</title></head><body>${view}</body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const { GET } = await import("./route");

function get(path: string[] = []) {
  return GET(new Request(`https://sites.example.com/demo/${path.join("/")}`), { params: Promise.resolve({ path }) });
}

async function demoAccount({ draft = true }: { draft?: boolean } = {}) {
  const { account, user } = await createAccount({ planCode: "SITES" });
  const site = await createSite(account.id, { slug: "demo" });
  await prisma.site.update({ where: { id: site.id }, data: { isDemo: true } });
  if (draft) {
    await prisma.changeSet.create({ data: { siteId: site.id, source: "EDITOR", summary: "Price", ops: [], baseCommit: "a".repeat(40) } });
  }
  return { account, user, site };
}

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
  builder.built = true;
  builder.calls = [];
  builder.requests = [];
  builder.onlyInPreview = [];
});

describe("/demo", () => {
  it("sandboxes every response: pages, assets, and the unpublished notice", async () => {
    await demoAccount();
    const responses = [await get(), await get(["_astro", "app.css"])];
    builder.built = false;
    responses.push(await get());

    for (const res of responses) {
      const csp = res.headers.get("content-security-policy") ?? "";
      expect(csp.startsWith("sandbox ")).toBe(true);
      expect(csp).not.toContain("allow-same-origin");
    }
    expect(responses[0].headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(responses[0].headers.get("x-frame-options")).toBe("DENY");
  });

  it("serves the published build to everyone, members with a draft included (drafts preview on /canvas)", async () => {
    const { account, user } = await demoAccount();
    const member = await createMember(account.id);
    for (const id of [user.id, member.id, null]) {
      resetRequest();
      if (id) await signInAs(id);
      const html = await (await get(["services"])).text();
      expect(html).toContain("<body>current");
      expect(html).not.toContain("canopy-canvas");
    }
    expect(builder.calls).not.toContain("preview");
  });

  it("serves a fingerprinted asset only the draft's build has, for the canvas's sessionless requests", async () => {
    await demoAccount();
    builder.onlyInPreview = ["_astro/new.css"];
    const res = await get(["_astro", "new.css"]);
    expect(res.status).toBe(200);
    expect(builder.calls).toEqual(["current", "preview"]);
    builder.calls = [];
    builder.onlyInPreview = ["about/index.html"];
    expect((await get(["about", "index.html"])).status).toBe(404);
    expect(builder.calls).toEqual(["current"]);
  });

  it("is a 404 for a path that isn't a file's own, and asks the builder for nothing outside the demo's files", async () => {
    await demoAccount();
    // Segments as the route's params give them: decoded once.
    for (const path of [
      ["..", "..", "..", "demo", "status"],
      ["services", ".."],
      [".", "services"],
      ["../../../demo/status"],
      ["..\\..\\..\\demo\\status"],
      ["services\0"],
      // The same, still percent-encoded after that one decode.
      ["%2e%2e", "%2e%2e", "%2e%2e", "demo", "status"],
      ["_astro", "%2E%2E", "%2e%2e", "preview", "index.html"],
      ["..%2F..%2F..%2Fdemo%2Fstatus"],
      ["..%5c..%5Cdemo%5cstatus"],
      ["services%00"],
    ]) {
      expect((await get(path)).status, JSON.stringify(path)).toBe(404);
    }
    expect(builder.requests).toEqual([]);

    // Any other name is sent as it is, encoded once, under the demo's files.
    expect((await get(["a b", "50%", "café.html"])).status).toBe(404);
    expect(builder.requests).toEqual(["/v1/sites/demo/files/current/a%20b/50%25/caf%C3%A9.html"]);
  });

  it("is a 404 unless the site with the demo slug is marked as the demo", async () => {
    const { account } = await createAccount({ planCode: "SITES" });
    await createSite(account.id, { slug: "demo" });
    expect((await get()).status).toBe(404);
    expect(builder.calls).toEqual([]);
  });
});

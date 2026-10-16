import type { ChangeOp, ContentIssue, RawContent } from "@canopy/site-contract";

/**
 * The portal's client for apps/builder, an internal service reached over the
 * Docker network (BUILDER_URL) with a shared token (BUILDER_TOKEN). The portal
 * decides which site is whose; the builder trusts the site reference sent.
 */

export interface BuilderSite {
  slug: string;
  repoUrl: string;
  branch: string;
}

export interface BuilderBuild {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  baseCommit?: string;
  error?: string;
  issues?: ContentIssue[];
  log: string;
  startedAt?: string;
  finishedAt?: string;
}

export class BuilderError extends Error {
  issues?: ContentIssue[];
  constructor(message: string, issues?: ContentIssue[]) {
    super(message);
    this.issues = issues;
  }
}

export function builderConfigured(): boolean {
  return Boolean(process.env.BUILDER_URL && process.env.BUILDER_TOKEN);
}

async function call<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const base = process.env.BUILDER_URL;
  const token = process.env.BUILDER_TOKEN;
  if (!base || !token) throw new BuilderError("The site builder isn't configured in this environment.");
  let res: Response;
  try {
    res = await fetch(new URL(path, base), {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
      signal: AbortSignal.timeout(init.timeoutMs ?? 60_000),
      cache: "no-store",
    });
  } catch (err) {
    throw new BuilderError(`The site builder didn't respond (${(err as Error).name}).`);
  }
  const body = (await res.json().catch(() => ({}))) as T & { error?: string; issues?: ContentIssue[] };
  if (!res.ok) throw new BuilderError(body.error ?? `The site builder returned ${res.status}.`, body.issues);
  return body;
}

const siteBody = (site: BuilderSite) => ({ repoUrl: site.repoUrl, branch: site.branch });

export function fetchContent(site: BuilderSite) {
  return call<{ commit: string; content: RawContent; contractVersion: string | null }>(`/v1/sites/${site.slug}/content`, {
    method: "POST",
    body: JSON.stringify(siteBody(site)),
  });
}

export function requestPreview(site: BuilderSite, buildId: string, ops: ChangeOp[], baseCommit: string) {
  return call<{ id: string; status: string }>(`/v1/sites/${site.slug}/previews`, {
    method: "POST",
    body: JSON.stringify({ ...siteBody(site), buildId, ops, baseCommit }),
  });
}

export function fetchBuild(slug: string, buildId: string) {
  return call<BuilderBuild>(`/v1/sites/${slug}/builds/${buildId}`);
}

export function requestPublish(
  site: BuilderSite,
  args: { buildId: string; ops: ChangeOp[]; baseCommit: string; message: string; authorName: string; authorEmail: string },
) {
  return call<{ commit: string | null; log: string }>(`/v1/sites/${site.slug}/publish`, {
    method: "POST",
    body: JSON.stringify({ ...siteBody(site), ...args }),
    timeoutMs: 120_000,
  });
}

/** A built file for the portal to pass through (the /demo route). */
export async function fetchSiteFile(slug: string, view: "current" | "preview", path: string): Promise<Response> {
  const base = process.env.BUILDER_URL;
  const token = process.env.BUILDER_TOKEN;
  if (!base || !token) return new Response("Not found", { status: 404 });
  const safe = path
    .split("/")
    .map((p) => encodeURIComponent(decodeURIComponentSafe(p)))
    .join("/");
  return fetch(new URL(`/v1/sites/${slug}/files/${view}/${safe}`, base), {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
}

function decodeURIComponentSafe(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

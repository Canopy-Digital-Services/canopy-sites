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
  /** IANA zone; the builder rebuilds the site at its local midnight (PRD D42). */
  timeZone?: string;
}

export interface BuilderBuild {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed" | "superseded";
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

export type AppRepo = { fullName: string; url: string };

/**
 * The repos the Canopy Sites GitHub App is installed on (Epic 38 section 4.2),
 * for Link a site's picker; null when the builder or the App isn't set up
 * here, and the form takes a URL instead.
 */
export async function listAppRepos(): Promise<AppRepo[] | null> {
  if (!builderConfigured()) return null;
  try {
    const { repos } = await call<{ repos: AppRepo[] }>("/v1/repos");
    return repos.map(({ fullName, url }) => ({ fullName, url }));
  } catch (err) {
    console.warn(JSON.stringify({ event: "app_repos_unavailable", message: (err as Error).message }));
    return null;
  }
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

const siteBody = (site: BuilderSite) => ({ repoUrl: site.repoUrl, branch: site.branch, timeZone: site.timeZone });

/**
 * The branch's content and site guide (null when the repo has none). The
 * builder answers from its clone, fetching only when its copy is stale or
 * `refresh` asks it to.
 */
export function fetchContent(site: BuilderSite, opts: { refresh?: boolean } = {}) {
  return call<{ commit: string; content: RawContent; guide?: string | null; contractVersion: string | null }>(`/v1/sites/${site.slug}/content`, {
    method: "POST",
    body: JSON.stringify({ ...siteBody(site), refresh: opts.refresh === true }),
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

/** Force the branch back to a baseline tag (demo reset). */
export function requestReset(site: BuilderSite, tag: string) {
  return call<{ commit: string }>(`/v1/sites/${site.slug}/reset`, {
    method: "POST",
    body: JSON.stringify({ ...siteBody(site), tag }),
    timeoutMs: 120_000,
  });
}

/**
 * Whether a request path names a file inside a site. `segments` are a
 * catch-all route's params, which Next has decoded once: each is one name,
 * so none may be `.` or `..` or hold a separator or a NUL. One that still
 * holds any of those percent-encoded is refused as well: no built file is
 * named that way, and nothing after this gets to decode it.
 */
export function isSiteFilePath(segments: string[]): boolean {
  return segments.every((s) => s !== "." && s !== ".." && !/[/\\\0]|%(?:2e|2f|5c|00)/i.test(s));
}

/**
 * A built file for the portal to pass through (the /demo and /canvas routes).
 * `segments` are the request path as the route's params give it, and are not
 * decoded again. The request is for a file under the site's view and nothing
 * else: any other path is a 404 here, and the builder is not asked.
 */
export async function fetchSiteFile(slug: string, view: "current" | "preview", segments: string[]): Promise<Response> {
  const base = process.env.BUILDER_URL;
  const token = process.env.BUILDER_TOKEN;
  const notFound = () => new Response("Not found", { status: 404 });
  if (!base || !token || !isSiteFilePath(segments)) return notFound();
  const files = `/v1/sites/${slug}/files/${view}/`;
  const url = new URL(files + segments.map(encodeURIComponent).join("/"), base);
  if (!url.pathname.startsWith(files)) return notFound();
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
}

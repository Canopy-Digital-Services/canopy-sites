import { createPrivateKey, sign, type KeyObject } from "node:crypto";

/**
 * The "Canopy Sites" GitHub App (Epic 38 section 4.2): how the builder
 * reaches a site's repo. The App is owned by Canopy's org and installed only
 * on site repos, with Contents read and write: on Canopy's org for the sites
 * Canopy holds, and on a client's own org or account for a site whose repo is
 * theirs (PRD D61). Each of those is a separate installation, so the builder
 * never holds one installation's id: it signs a JWT with the App's private
 * key, asks GitHub which installation covers the repo a job names (by owner
 * and name), and trades the JWT for a token of that installation limited to
 * that one repo, cached until shortly before its hour is up. The key and the
 * tokens stay in this process: git gets the token through its environment
 * (gitEnv), and site build steps get no secret.
 *
 * The App is public, so that a client's org can install it, which means any
 * GitHub account can. The builder therefore builds only for the accounts it
 * is told to: the App's own owner, always, and those named in
 * GITHUB_APP_OWNERS. An installation anywhere else is not listed, and a repo
 * there gets no token, whatever a site's row says.
 *
 *   GITHUB_APP_ID           the App's numeric id
 *   GITHUB_APP_PRIVATE_KEY  the PEM, as is or base64-encoded (one line)
 *   GITHUB_APP_OWNERS       other accounts whose repos it builds: logins, comma-separated
 */

const API = "https://api.github.com";
/** A cached token is reused until this long before it expires. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export interface AppConfig {
  appId: string;
  key: KeyObject;
  /** Accounts besides the App's owner whose repos the builder builds, lowercased. */
  otherOwners: string[];
}

/** Thrown when the App can't reach a repo: it isn't installed there, or GitHub refused. */
export class AppAccessError extends Error {}

/** The App's settings from the environment, or null when it isn't configured. */
export function appConfig(env: Record<string, string | undefined> = process.env): AppConfig | null {
  const appId = env.GITHUB_APP_ID?.trim();
  const raw = env.GITHUB_APP_PRIVATE_KEY?.trim();
  if (!appId || !raw) return null;
  const otherOwners = (env.GITHUB_APP_OWNERS ?? "")
    .split(",")
    .map((o) => o.trim().toLowerCase())
    .filter(Boolean);
  const pem = raw.startsWith("-----BEGIN") ? raw.replace(/\\n/g, "\n") : Buffer.from(raw, "base64").toString("utf8");
  try {
    return { appId, key: createPrivateKey(pem), otherOwners };
  } catch {
    throw new AppAccessError("The Canopy Sites GitHub App's private key on the builder can't be read");
  }
}

const base64url = (data: Buffer | string) => Buffer.from(data).toString("base64url");

/** The App's own JWT (RS256), valid nine minutes, issued a minute back for clock drift. */
export function appJwt(cfg: AppConfig, now = Date.now()): string {
  const iat = Math.floor(now / 1000) - 60;
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ iat, exp: iat + 600, iss: cfg.appId }));
  const signature = sign("RSA-SHA256", Buffer.from(`${header}.${payload}`), cfg.key);
  return `${header}.${payload}.${base64url(signature)}`;
}

const HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "canopy-builder",
};

type Fetch = typeof fetch;
const tokens = new Map<string, { token: string; expiresAt: number }>();
/** `owner/name`, lowercased → the id of the installation that covers it. */
const installations = new Map<string, string>();

/** The App's own owner, by App id: asked once, since it only changes if the App is transferred. */
const appOwners = new Map<string, string>();

/** Forgets cached tokens, installations, and the App's owner (tests). */
export function clearTokenCache() {
  tokens.clear();
  installations.clear();
  appOwners.clear();
}

const asApp = (cfg: AppConfig, now: number) => ({ ...HEADERS, Authorization: `Bearer ${appJwt(cfg, now)}` });
const reason = async (res: Response) => ((await res.json().catch(() => ({}))) as { message?: string }).message ?? `HTTP ${res.status}`;

/**
 * The accounts the builder builds for, lowercased: the App's own owner and
 * those the configuration names. The App is public, so an installation proves
 * only that someone installed it, not that Canopy builds for them.
 */
async function allowedOwners(cfg: AppConfig, fetchImpl: Fetch, now: number): Promise<Set<string>> {
  let own = appOwners.get(cfg.appId);
  if (!own) {
    const res = await fetchImpl(`${API}/app`, { headers: asApp(cfg, now) });
    if (!res.ok) throw new AppAccessError(`The Canopy Sites GitHub App refused: ${await reason(res)}`);
    own = ((await res.json()) as { owner?: { login?: string } }).owner?.login?.toLowerCase();
    if (!own) throw new AppAccessError("The Canopy Sites GitHub App didn't say who owns it");
    appOwners.set(cfg.appId, own);
  }
  return new Set([own, ...cfg.otherOwners]);
}

/**
 * The installation that covers a repo, by its owner and name: the App's
 * installation on that owner's org or account, if this repo is one of the
 * repos chosen for it. Remembered, since it changes only when the App is
 * removed and installed again (repoToken forgets it when a token is refused).
 */
async function repoInstallation(cfg: AppConfig, owner: string, repo: string, fetchImpl: Fetch, now: number): Promise<string> {
  const key = `${owner}/${repo}`.toLowerCase();
  const hit = installations.get(key);
  if (hit) return hit;
  const res = await fetchImpl(`${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/installation`, { headers: asApp(cfg, now) });
  if (res.status === 404) throw new AppAccessError(`The Canopy Sites GitHub App isn't installed on ${owner}/${repo}`);
  if (!res.ok) throw new AppAccessError(`The Canopy Sites GitHub App can't reach ${owner}/${repo}: ${await reason(res)}`);
  const { id } = (await res.json()) as { id: number };
  installations.set(key, String(id));
  return String(id);
}

/** A token of one installation: for one of its repos with Contents write, or for listing its repos. */
async function mintToken(cfg: AppConfig, installationId: string, repo: string | null, fetchImpl: Fetch, now: number): Promise<Response> {
  const body = repo ? { repositories: [repo], permissions: { contents: "write", metadata: "read" } } : { permissions: { metadata: "read" } };
  return fetchImpl(`${API}/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: { ...asApp(cfg, now), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * A token for one repo, named by owner and name, with Contents write and
 * nothing else of its owner's. Cached per repo. The owner is part of the
 * question: a repo of the same name under another owner is another repo, and
 * usually another installation.
 */
export async function repoToken(cfg: AppConfig, owner: string, repo: string, fetchImpl: Fetch = fetch, now = Date.now()): Promise<string> {
  const key = `${owner}/${repo}`.toLowerCase();
  if (!(await allowedOwners(cfg, fetchImpl, now)).has(owner.toLowerCase())) {
    throw new AppAccessError(`The builder doesn't build for ${owner}: ${owner}/${repo} is outside the accounts it is set up for (GITHUB_APP_OWNERS)`);
  }
  const hit = tokens.get(key);
  if (hit && hit.expiresAt - REFRESH_MARGIN_MS > now) return hit.token;

  let res = await mintToken(cfg, await repoInstallation(cfg, owner, repo, fetchImpl, now), repo, fetchImpl, now);
  if (res.status === 404 || res.status === 401 || res.status === 403) {
    // The installation we remembered may be gone (the App removed and installed again): ask once more.
    installations.delete(key);
    res = await mintToken(cfg, await repoInstallation(cfg, owner, repo, fetchImpl, now), repo, fetchImpl, now);
  }
  if (!res.ok) throw new AppAccessError(`The Canopy Sites GitHub App can't reach ${owner}/${repo}: ${await reason(res)}`);
  const { token, expires_at } = (await res.json()) as { token: string; expires_at: string };
  tokens.set(key, { token, expiresAt: Date.parse(expires_at) });
  return token;
}

export interface AppRepo {
  /** `owner/name` */
  fullName: string;
  /** `https://github.com/owner/name`, the form the portal stores */
  url: string;
  private: boolean;
  defaultBranch: string;
}

/** The repos one installation covers. */
async function reposOf(cfg: AppConfig, installationId: string, fetchImpl: Fetch, now: number): Promise<AppRepo[]> {
  const minted = await mintToken(cfg, installationId, null, fetchImpl, now);
  if (!minted.ok) throw new AppAccessError(`The Canopy Sites GitHub App refused: ${await reason(minted)}`);
  const { token } = (await minted.json()) as { token: string };
  const repos: AppRepo[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetchImpl(`${API}/installation/repositories?per_page=100&page=${page}`, {
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new AppAccessError(`Listing the App's repos failed: HTTP ${res.status}`);
    const body = (await res.json()) as {
      total_count: number;
      repositories: Array<{ full_name: string; private: boolean; default_branch: string }>;
    };
    for (const r of body.repositories) {
      repos.push({ fullName: r.full_name, url: `https://github.com/${r.full_name}`, private: r.private, defaultBranch: r.default_branch });
    }
    if (repos.length >= body.total_count || body.repositories.length === 0) break;
  }
  return repos;
}

/**
 * Every repo the builder builds for: those the App is installed on in the
 * accounts it is set up for (Canopy's org and each client's named in
 * GITHUB_APP_OWNERS), sorted by `owner/name`. An installation in any other
 * account is left out, and so is a suspended one, whose repos can't be
 * reached until its owner lifts the suspension.
 */
export async function appRepos(cfg: AppConfig, fetchImpl: Fetch = fetch, now = Date.now()): Promise<AppRepo[]> {
  const owners = await allowedOwners(cfg, fetchImpl, now);
  const ids: string[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetchImpl(`${API}/app/installations?per_page=100&page=${page}`, { headers: asApp(cfg, now) });
    if (!res.ok) throw new AppAccessError(`Listing the App's installations failed: ${await reason(res)}`);
    const list = (await res.json()) as Array<{ id: number; suspended_at?: string | null; account?: { login?: string } | null }>;
    for (const i of list) if (!i.suspended_at && owners.has(i.account?.login?.toLowerCase() ?? "")) ids.push(String(i.id));
    if (list.length < 100) break;
  }
  const repos = (await Promise.all(ids.map((id) => reposOf(cfg, id, fetchImpl, now)))).flat();
  return repos.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

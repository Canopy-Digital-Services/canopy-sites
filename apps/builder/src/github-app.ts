import { createPrivateKey, sign, type KeyObject } from "node:crypto";

/**
 * The "Canopy Sites" GitHub App (Epic 38 section 4.2): how the builder
 * reaches a site's repo. The App is owned by the org and installed only on
 * the site repos, with Contents read and write. The builder signs a JWT with
 * the App's private key, trades it for an installation token limited to the
 * one repo a job names, and caches that token until shortly before its hour
 * is up. The key and the tokens stay in this process: git gets the token
 * through its environment (gitEnv), and site build steps get no secret.
 *
 *   GITHUB_APP_ID               the App's numeric id
 *   GITHUB_APP_INSTALLATION_ID  its installation on the org
 *   GITHUB_APP_PRIVATE_KEY      the PEM, as is or base64-encoded (one line)
 */

const API = "https://api.github.com";
/** A cached token is reused until this long before it expires. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export interface AppConfig {
  appId: string;
  installationId: string;
  key: KeyObject;
}

/** Thrown when the App can't reach a repo: it isn't installed there, or GitHub refused. */
export class AppAccessError extends Error {}

/** The App's settings from the environment, or null when it isn't configured. */
export function appConfig(env: Record<string, string | undefined> = process.env): AppConfig | null {
  const appId = env.GITHUB_APP_ID?.trim();
  const installationId = env.GITHUB_APP_INSTALLATION_ID?.trim();
  const raw = env.GITHUB_APP_PRIVATE_KEY?.trim();
  if (!appId || !installationId || !raw) return null;
  const pem = raw.startsWith("-----BEGIN") ? raw.replace(/\\n/g, "\n") : Buffer.from(raw, "base64").toString("utf8");
  try {
    return { appId, installationId, key: createPrivateKey(pem) };
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
const cache = new Map<string, { token: string; expiresAt: number }>();

/** Forgets cached tokens (tests). */
export function clearTokenCache() {
  cache.clear();
}

/**
 * An installation token for one repo (by name, under the installation's
 * owner) with Contents write, or for listing the installation's repos when
 * `repo` is null. Cached per repo.
 */
export async function installationToken(cfg: AppConfig, repo: string | null, fetchImpl: Fetch = fetch, now = Date.now()): Promise<string> {
  const key = repo ?? "*";
  const hit = cache.get(key);
  if (hit && hit.expiresAt - REFRESH_MARGIN_MS > now) return hit.token;

  const body = repo
    ? { repositories: [repo], permissions: { contents: "write", metadata: "read" } }
    : { permissions: { metadata: "read" } };
  const res = await fetchImpl(`${API}/app/installations/${cfg.installationId}/access_tokens`, {
    method: "POST",
    headers: { ...HEADERS, Authorization: `Bearer ${appJwt(cfg, now)}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = ((await res.json().catch(() => ({}))) as { message?: string }).message ?? `HTTP ${res.status}`;
    throw new AppAccessError(repo ? `The Canopy Sites GitHub App can't reach ${repo}: ${detail}` : `The Canopy Sites GitHub App refused: ${detail}`);
  }
  const { token, expires_at } = (await res.json()) as { token: string; expires_at: string };
  cache.set(key, { token, expiresAt: Date.parse(expires_at) });
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

/** Every repo the App is installed on, sorted by name. */
export async function installationRepos(cfg: AppConfig, fetchImpl: Fetch = fetch): Promise<AppRepo[]> {
  const token = await installationToken(cfg, null, fetchImpl);
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
  return repos.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

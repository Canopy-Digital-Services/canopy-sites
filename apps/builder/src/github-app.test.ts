import { generateKeyPairSync, verify } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppAccessError, appConfig, appJwt, appRepos, clearTokenCache, repoToken } from "./github-app.ts";
import { resolveRepo } from "./git.ts";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
// The App belongs to "org"; the builder is also set up for a client's org and for "canopy" (any case).
const ENV = { GITHUB_APP_ID: "123", GITHUB_APP_PRIVATE_KEY: PEM, GITHUB_APP_OWNERS: "client-org, Canopy" };
const HOUR = 60 * 60 * 1000;

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const token = (value: string, now = Date.now()) => reply(201, { token: value, expires_at: new Date(now + HOUR).toISOString() });

/**
 * GitHub, as far as the App sees it: `installed` maps `owner/name` to the id
 * of the installation that covers it. Every token names its installation and
 * repo, so a test can see which one a job was given.
 */
function github(installed: Record<string, number>, now = Date.now()) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/app")) return reply(200, { owner: { login: "Org" } });
    const lookup = /\/repos\/([^/]+)\/([^/]+)\/installation$/.exec(url);
    if (lookup) {
      const id = installed[`${lookup[1]}/${lookup[2]}`];
      return id ? reply(200, { id }) : reply(404, { message: "Not Found" });
    }
    const mint = /\/app\/installations\/(\d+)\/access_tokens$/.exec(url);
    if (mint) {
      const repo = (JSON.parse(String(init?.body)) as { repositories?: string[] }).repositories?.[0];
      return Object.values(installed).includes(Number(mint[1])) ? token(`ghs_${mint[1]}_${repo ?? "list"}`, now) : reply(404, { message: "Not Found" });
    }
    return reply(500, { message: `unexpected ${url}` });
  });
}
const calls = (fetchImpl: ReturnType<typeof vi.fn>) => fetchImpl.mock.calls.map((c) => String(c[0]).replace("https://api.github.com", ""));

beforeEach(() => clearTokenCache());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("appConfig", () => {
  it("reads the id and the key as PEM or base64, and is null when either is missing", () => {
    expect(appConfig(ENV)).toMatchObject({ appId: "123", otherOwners: ["client-org", "canopy"] });
    expect(appConfig({ ...ENV, GITHUB_APP_OWNERS: undefined })).toMatchObject({ otherOwners: [] });
    expect(appConfig({ ...ENV, GITHUB_APP_PRIVATE_KEY: Buffer.from(PEM).toString("base64") })).not.toBeNull();
    expect(appConfig({ ...ENV, GITHUB_APP_PRIVATE_KEY: PEM.replace(/\n/g, "\\n") })).not.toBeNull();
    expect(appConfig({ ...ENV, GITHUB_APP_ID: "" })).toBeNull();
    expect(appConfig({})).toBeNull();
    expect(() => appConfig({ ...ENV, GITHUB_APP_PRIVATE_KEY: "bm90IGEga2V5" })).toThrow(AppAccessError);
  });
});

describe("appJwt", () => {
  it("is an RS256 JWT the App's public key verifies, issued by the App, good under ten minutes", () => {
    const cfg = appConfig(ENV)!;
    const now = Date.UTC(2026, 10, 5, 12);
    const [header, payload, signature] = appJwt(cfg, now).split(".");

    expect(JSON.parse(Buffer.from(header, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    expect(claims).toMatchObject({ iss: "123", iat: now / 1000 - 60 });
    expect(claims.exp - claims.iat).toBeLessThanOrEqual(600);
    expect(verify("RSA-SHA256", Buffer.from(`${header}.${payload}`), publicKey, Buffer.from(signature, "base64url"))).toBe(true);
  });
});

describe("repoToken", () => {
  it("finds the repo's installation, asks for Contents write on the one repo, and reuses the token until near its expiry", async () => {
    const cfg = appConfig(ENV)!;
    const now = Date.now();
    const fetchImpl = github({ "org/toroz": 456 }, now);

    expect(await repoToken(cfg, "org", "toroz", fetchImpl, now)).toBe("ghs_456_toroz");
    expect(await repoToken(cfg, "org", "toroz", fetchImpl, now + 30 * 60 * 1000)).toBe("ghs_456_toroz");
    expect(calls(fetchImpl)).toEqual(["/app", "/repos/org/toroz/installation", "/app/installations/456/access_tokens"]);
    const init = fetchImpl.mock.calls[2][1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({ repositories: ["toroz"], permissions: { contents: "write", metadata: "read" } });

    // A new token near the hour's end, from the installation it already knows.
    await repoToken(cfg, "org", "toroz", fetchImpl, now + 56 * 60 * 1000);
    expect(calls(fetchImpl).slice(3)).toEqual(["/app/installations/456/access_tokens"]);
  });

  it("reaches a repo in a client's own org through that org's installation", async () => {
    const cfg = appConfig(ENV)!;
    const fetchImpl = github({ "canopy/toroz": 1, "client-org/their-site": 2 });

    expect(await repoToken(cfg, "canopy", "toroz", fetchImpl)).toBe("ghs_1_toroz");
    expect(await repoToken(cfg, "client-org", "their-site", fetchImpl)).toBe("ghs_2_their-site");
  });

  it("never answers for a repo of the same name under another owner", async () => {
    const cfg = appConfig(ENV)!;
    const fetchImpl = github({ "canopy/website": 1 });

    expect(await repoToken(cfg, "canopy", "website", fetchImpl)).toBe("ghs_1_website");
    await expect(repoToken(cfg, "client-org", "website", fetchImpl)).rejects.toThrow("isn't installed on client-org/website");
    // Owner and name are matched as GitHub matches them: without regard to case.
    expect(await repoToken(cfg, "Canopy", "Website", fetchImpl)).toBe("ghs_1_website");
  });

  it("builds only for the App's owner and the accounts it is set up for, though anyone can install a public App", async () => {
    const cfg = appConfig(ENV)!;
    const fetchImpl = github({ "stranger/their-site": 9, "org/toroz": 456 });

    await expect(repoToken(cfg, "stranger", "their-site", fetchImpl)).rejects.toThrow("The builder doesn't build for stranger");
    // It never asked GitHub for the stranger's installation, let alone a token.
    expect(calls(fetchImpl)).toEqual(["/app"]);

    // With no accounts named, only the App's own owner counts.
    const alone = appConfig({ ...ENV, GITHUB_APP_OWNERS: "" })!;
    expect(await repoToken(alone, "org", "toroz", fetchImpl)).toBe("ghs_456_toroz");
    await expect(repoToken(alone, "client-org", "their-site", github({ "client-org/their-site": 2 }))).rejects.toBeInstanceOf(AppAccessError);
  });

  it("refuses with the reason when the App isn't installed on the repo", async () => {
    const cfg = appConfig(ENV)!;
    await expect(repoToken(cfg, "org", "elsewhere", github({}))).rejects.toBeInstanceOf(AppAccessError);
    await expect(repoToken(cfg, "org", "elsewhere", github({}))).rejects.toThrow("The Canopy Sites GitHub App isn't installed on org/elsewhere");
  });

  it("asks for the installation again when the one it remembered is gone", async () => {
    const cfg = appConfig(ENV)!;
    const now = Date.now();
    expect(await repoToken(cfg, "org", "toroz", github({ "org/toroz": 456 }, now), now)).toBe("ghs_456_toroz");

    // The App was removed and installed again: a new installation id.
    const later = now + 2 * HOUR;
    const fetchImpl = github({ "org/toroz": 789 }, later);
    expect(await repoToken(cfg, "org", "toroz", fetchImpl, later)).toBe("ghs_789_toroz");
    expect(calls(fetchImpl)).toEqual(["/app/installations/456/access_tokens", "/repos/org/toroz/installation", "/app/installations/789/access_tokens"]);
    // (No second /app: who owns the App is asked once.)
  });
});

describe("appRepos", () => {
  const page = (names: string[], total: number) =>
    reply(200, { total_count: total, repositories: names.map((n) => ({ full_name: n, private: true, default_branch: "main" })) });

  it("lists every repo of one installation, across pages, sorted", async () => {
    const cfg = appConfig(ENV)!;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(reply(200, { owner: { login: "org" } }))
      .mockResolvedValueOnce(reply(200, [{ id: 456, account: { login: "org" } }]))
      .mockResolvedValueOnce(token("ghs_list"))
      .mockResolvedValueOnce(page(Array.from({ length: 100 }, (_, i) => `org/site-${String(i).padStart(3, "0")}`), 101))
      .mockResolvedValueOnce(page(["org/toroz"], 101));

    const repos = await appRepos(cfg, fetchImpl);

    expect(repos).toHaveLength(101);
    expect(repos.at(-1)).toEqual({ fullName: "org/toroz", url: "https://github.com/org/toroz", private: true, defaultBranch: "main" });
  });

  it("lists the repos of Canopy's installation and each client's it is set up for, and leaves out a stranger's and a suspended one", async () => {
    const cfg = appConfig(ENV)!;
    const byInstallation: Record<string, string[]> = { "1": ["canopy/toroz", "canopy/demo"], "3": ["client-org/their-site"], "4": ["stranger/their-site"] };
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/app")) return reply(200, { owner: { login: "org" } });
      if (url.includes("/app/installations?")) {
        return reply(200, [
          { id: 1, account: { login: "Canopy" } },
          { id: 2, account: { login: "client-org" }, suspended_at: "2026-11-01T00:00:00Z" },
          { id: 3, account: { login: "client-org" } },
          { id: 4, account: { login: "stranger" } },
        ]);
      }
      const mint = /\/app\/installations\/(\d+)\/access_tokens$/.exec(url);
      if (mint) return token(`ghs_${mint[1]}`);
      const who = String(new Headers(init?.headers).get("Authorization")).replace("Bearer ghs_", "");
      return page(byInstallation[who] ?? [], (byInstallation[who] ?? []).length);
    });

    expect((await appRepos(cfg, fetchImpl)).map((r) => r.fullName)).toEqual(["canopy/demo", "canopy/toroz", "client-org/their-site"]);
    expect(calls(fetchImpl).some((u) => u.includes("/installations/2/") || u.includes("/installations/4/"))).toBe(false);
  });
});

describe("resolveRepo", () => {
  it("reaches a site's repo with the App's token for that repo, whichever org owns it", async () => {
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
    vi.stubGlobal("fetch", github({ "org/toroz": 456, "client-org/their-site": 7 }));

    expect(await resolveRepo("toroz", "https://github.com/org/toroz", "main")).toEqual({
      remote: "https://github.com/org/toroz.git",
      branch: "main",
      token: "ghs_456_toroz",
    });
    expect(await resolveRepo("theirs", "https://github.com/client-org/their-site", "main")).toEqual({
      remote: "https://github.com/client-org/their-site.git",
      branch: "main",
      token: "ghs_7_their-site",
    });
  });

  it("falls back to the site's own token while the App can't reach the repo, and says what to do with neither", async () => {
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
    vi.stubGlobal("fetch", github({}));
    vi.stubEnv("GIT_TOKEN_CANOPYDS", "github_pat_x");

    expect(await resolveRepo("canopyds", "https://github.com/org/canopy-website", "main")).toMatchObject({ token: "github_pat_x" });
    await expect(resolveRepo("toroz", "https://github.com/org/toroz", "main")).rejects.toThrow("isn't installed on org/toroz");
  });

  it("falls back to the site's token when the App's key can't be read", async () => {
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
    vi.stubEnv("GITHUB_APP_PRIVATE_KEY", "bm90IGEga2V5");
    vi.stubEnv("GIT_TOKEN_DEMO", "github_pat_demo");
    expect(await resolveRepo("demo", "https://github.com/org/canopy-demo-site", "main")).toMatchObject({ token: "github_pat_demo" });
  });

  it("uses the site's token when the App isn't configured, and refuses without one", async () => {
    vi.stubEnv("GITHUB_APP_ID", "");
    vi.stubEnv("GIT_TOKEN_DEMO", "github_pat_demo");
    expect(await resolveRepo("demo", "https://github.com/org/canopy-demo-site", "main")).toMatchObject({ token: "github_pat_demo" });
    await expect(resolveRepo("toroz", "https://github.com/org/toroz", "main")).rejects.toThrow("No access to org/toroz: install the Canopy Sites GitHub App on it");
  });
});

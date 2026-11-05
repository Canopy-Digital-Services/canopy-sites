import { generateKeyPairSync, verify } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppAccessError, appConfig, appJwt, clearTokenCache, installationRepos, installationToken } from "./github-app.ts";
import { resolveRepo } from "./git.ts";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const ENV = { GITHUB_APP_ID: "123", GITHUB_APP_INSTALLATION_ID: "456", GITHUB_APP_PRIVATE_KEY: PEM };
const HOUR = 60 * 60 * 1000;

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => clearTokenCache());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("appConfig", () => {
  it("reads the id, the installation, and the key as PEM or base64, and is null when any is missing", () => {
    expect(appConfig(ENV)).toMatchObject({ appId: "123", installationId: "456" });
    expect(appConfig({ ...ENV, GITHUB_APP_PRIVATE_KEY: Buffer.from(PEM).toString("base64") })).not.toBeNull();
    expect(appConfig({ ...ENV, GITHUB_APP_PRIVATE_KEY: PEM.replace(/\n/g, "\\n") })).not.toBeNull();
    expect(appConfig({ ...ENV, GITHUB_APP_ID: "" })).toBeNull();
    expect(appConfig({})).toBeNull();
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

describe("installationToken", () => {
  it("asks for Contents write on the one repo, and reuses the token until near its expiry", async () => {
    const cfg = appConfig(ENV)!;
    const now = Date.now();
    const fetchImpl = vi.fn(async () => reply(201, { token: "ghs_one", expires_at: new Date(now + HOUR).toISOString() }));

    expect(await installationToken(cfg, "toroz", fetchImpl, now)).toBe("ghs_one");
    expect(await installationToken(cfg, "toroz", fetchImpl, now + 30 * 60 * 1000)).toBe("ghs_one");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.github.com/app/installations/456/access_tokens");
    expect(JSON.parse(String(init.body))).toEqual({ repositories: ["toroz"], permissions: { contents: "write", metadata: "read" } });

    await installationToken(cfg, "toroz", fetchImpl, now + 56 * 60 * 1000);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("refuses with the reason when the App isn't installed on the repo", async () => {
    const cfg = appConfig(ENV)!;
    const fetchImpl = vi.fn(async () => reply(422, { message: "There is at least one repository that does not exist or is not accessible" }));
    await expect(installationToken(cfg, "elsewhere", fetchImpl)).rejects.toBeInstanceOf(AppAccessError);
  });
});

describe("installationRepos", () => {
  it("lists every repo the App is installed on, across pages, sorted", async () => {
    const cfg = appConfig(ENV)!;
    const page = (names: string[], total: number) =>
      reply(200, { total_count: total, repositories: names.map((n) => ({ full_name: `org/${n}`, private: true, default_branch: "main" })) });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(reply(201, { token: "ghs_list", expires_at: new Date(Date.now() + HOUR).toISOString() }))
      .mockResolvedValueOnce(page(Array.from({ length: 100 }, (_, i) => `site-${String(i).padStart(3, "0")}`), 101))
      .mockResolvedValueOnce(page(["toroz"], 101));

    const repos = await installationRepos(cfg, fetchImpl);

    expect(repos).toHaveLength(101);
    expect(repos.at(-1)).toEqual({ fullName: "org/toroz", url: "https://github.com/org/toroz", private: true, defaultBranch: "main" });
  });
});

describe("resolveRepo", () => {
  it("reaches a site's repo with the App's token for that repo", async () => {
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
    vi.stubGlobal("fetch", vi.fn(async () => reply(201, { token: "ghs_app", expires_at: new Date(Date.now() + HOUR).toISOString() })));

    expect(await resolveRepo("toroz", "https://github.com/org/toroz", "main")).toEqual({
      remote: "https://github.com/org/toroz.git",
      branch: "main",
      token: "ghs_app",
    });
  });

  it("falls back to the site's own token while the App can't reach the repo, and says what to do with neither", async () => {
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
    vi.stubGlobal("fetch", vi.fn(async () => reply(422, { message: "not accessible" })));
    vi.stubEnv("GIT_TOKEN_CANOPYDS", "github_pat_x");

    expect(await resolveRepo("canopyds", "https://github.com/org/canopy-website", "main")).toMatchObject({ token: "github_pat_x" });
    await expect(resolveRepo("toroz", "https://github.com/org/toroz", "main")).rejects.toThrow(/can't reach toroz/);
  });

  it("uses the site's token when the App isn't configured, and refuses without one", async () => {
    vi.stubEnv("GITHUB_APP_ID", "");
    vi.stubEnv("GIT_TOKEN_DEMO", "github_pat_demo");
    expect(await resolveRepo("demo", "https://github.com/org/canopy-demo-site", "main")).toMatchObject({ token: "github_pat_demo" });
    await expect(resolveRepo("toroz", "https://github.com/org/toroz", "main")).rejects.toThrow("No access to org/toroz: add it to the Canopy Sites GitHub App");
  });
});

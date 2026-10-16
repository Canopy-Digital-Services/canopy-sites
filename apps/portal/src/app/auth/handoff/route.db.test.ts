import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionHandoff, hashSessionToken, SESSION_COOKIE } from "@/lib/session";
import { createAccount, resetDatabase } from "../../../../test/db";
import { jar, resetRequest } from "../../../../test/next-request";

vi.mock("next/headers", () => import("../../../../test/next-request"));

const { POST } = await import("./route");

const SITES = "sites.example.com";

function post(token: string, opts: { origin?: string | null; host?: string } = {}) {
  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
    host: opts.host ?? SITES,
  };
  const origin = opts.origin === undefined ? "https://forms.example.com" : opts.origin;
  if (origin) headers.origin = origin;
  return POST(new NextRequest(`https://${SITES}/auth/handoff`, { method: "POST", headers, body: `token=${token}` }));
}

beforeEach(async () => {
  vi.stubEnv("NEXTAUTH_URL", "https://forms.example.com/");
  vi.stubEnv("SITES_URL", "https://sites.example.com");
  resetRequest();
  await resetDatabase();
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /auth/handoff", () => {
  it("starts a session on the Sites host from a pass posted by the Forms host's page", async () => {
    const { user } = await createAccount({ planCode: "SITES" });
    const token = await createSessionHandoff(user.id, true, SITES);

    const res = await post(token);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/");
    const cookie = jar.get(SESSION_COOKIE)?.value ?? "";
    expect(await prisma.session.findUnique({ where: { id: hashSessionToken(cookie) } })).toMatchObject({
      userId: user.id,
      rememberMe: true,
    });
  });

  it("refuses a post from any other origin, and leaves the pass unused", async () => {
    const { user } = await createAccount({ planCode: "SITES" });
    const token = await createSessionHandoff(user.id, false, SITES);

    for (const origin of ["https://evil.example.net", "https://sites.example.com", null]) {
      expect((await post(token, { origin })).status).toBe(403);
    }
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    expect(await prisma.sessionHandoff.count()).toBe(1);
  });

  it("sends a used, unknown, or other-host pass to sign-in without a session", async () => {
    const { user } = await createAccount({ planCode: "SITES" });
    const token = await createSessionHandoff(user.id, false, SITES);
    expect((await post(token)).status).toBe(303);
    jar.clear();

    for (const res of [await post(token), await post("not-a-token"), await post(token, { host: "forms.example.com" })]) {
      expect(res.status).toBe(303);
      expect(res.headers.get("location")).toBe("/login");
    }
    expect(jar.has(SESSION_COOKIE)).toBe(false);
  });
});

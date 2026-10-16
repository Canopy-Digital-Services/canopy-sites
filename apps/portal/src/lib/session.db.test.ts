import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, resetDatabase } from "../../test/db";
import {
  consumeSessionHandoff,
  createSession,
  createSessionHandoff,
  HANDOFF_TTL_MS,
  hashSessionToken,
  invalidateUserSessions,
  SESSION_POLICY,
  validateSessionToken,
} from "./session";

beforeEach(resetDatabase);

const at = (base: Date, ms: number) => new Date(base.getTime() + ms);
const MIN = 60 * 1000;

describe("createSession", () => {
  it("stores only the token's SHA-256, never the token", async () => {
    const { user } = await createAccount();
    const { token, session } = await createSession(user.id, false);

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 random bytes, base64url
    expect(session.id).toBe(hashSessionToken(token));
    expect(session.id).not.toContain(token);
  });

  it("issues a different token every time", async () => {
    const { user } = await createAccount();
    const a = await createSession(user.id, false);
    const b = await createSession(user.id, false);
    expect(a.token).not.toBe(b.token);
  });
});

describe("validateSessionToken", () => {
  it("returns the user, current role, and memberships", async () => {
    const { account, user } = await createAccount();
    const { token } = await createSession(user.id, false);

    expect(await validateSessionToken(token)).toMatchObject({
      user: { id: user.id, email: user.email, role: "USER" },
      memberships: [{ accountId: account.id, role: "OWNER" }],
    });
  });

  it("rejects an unknown or altered token", async () => {
    const { user } = await createAccount();
    const { token } = await createSession(user.id, false);

    expect(await validateSessionToken("not-a-token")).toBeNull();
    expect(await validateSessionToken(token.slice(0, -1) + (token.endsWith("A") ? "B" : "A"))).toBeNull();
    expect(await validateSessionToken("")).toBeNull();
  });

  it("reflects a role change on the next request", async () => {
    const { user } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { token } = await createSession(user.id, false);
    await prisma.user.update({ where: { id: user.id }, data: { roleCode: "USER" } });

    expect((await validateSessionToken(token))?.user.role).toBe("USER");
  });

  it("expires after the idle timeout and deletes the row", async () => {
    const now = new Date();
    const { user } = await createAccount();
    const { token, session } = await createSession(user.id, false, now);

    expect(await validateSessionToken(token, at(now, SESSION_POLICY.default.idleMs + 1))).toBeNull();
    expect(await prisma.session.count({ where: { id: session.id } })).toBe(0);
  });

  it("rolls the idle expiry forward with use", async () => {
    const now = new Date();
    const { user } = await createAccount();
    const { token, session } = await createSession(user.id, false, now);

    // Active every three hours for twelve hours: past the 4h idle limit, still signed in.
    for (const hours of [3, 6, 9, 12]) {
      expect(await validateSessionToken(token, at(now, hours * 60 * MIN))).not.toBeNull();
    }
    const row = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    expect(row.expiresAt.getTime()).toBe(at(now, 12 * 60 * MIN + SESSION_POLICY.default.idleMs).getTime());
  });

  it("skips the write when the expiry would move less than a minute", async () => {
    const now = new Date();
    const { user } = await createAccount();
    const { token, session } = await createSession(user.id, false, now);

    await validateSessionToken(token, at(now, 30 * 1000));
    const row = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    expect(row.expiresAt.getTime()).toBe(session.expiresAt.getTime());
  });

  it("never rolls past the absolute cap, and ends there", async () => {
    const now = new Date();
    const { user } = await createAccount();
    const { token, session } = await createSession(user.id, false, now);
    const { absoluteMs, idleMs } = SESSION_POLICY.default;

    // Keep it busy until just before the cap.
    for (let t = idleMs / 2; t < absoluteMs; t += idleMs / 2) {
      expect(await validateSessionToken(token, at(now, t))).not.toBeNull();
    }
    const row = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    expect(row.expiresAt.getTime()).toBeLessThanOrEqual(row.absoluteExpiresAt.getTime());
    expect(await validateSessionToken(token, at(now, absoluteMs))).toBeNull();
  });

  it("gives Keep me signed in the longer limits", async () => {
    const now = new Date();
    const { user } = await createAccount();
    const { token, session } = await createSession(user.id, true, now);

    expect(session.absoluteExpiresAt.getTime()).toBe(at(now, SESSION_POLICY.remember.absoluteMs).getTime());
    expect(await validateSessionToken(token, at(now, 2 * 24 * 60 * MIN))).not.toBeNull();
  });
});

describe("revocation", () => {
  it("invalidateUserSessions ends every session but the one kept", async () => {
    const { user } = await createAccount();
    const kept = await createSession(user.id, false);
    const other = await createSession(user.id, false);

    await invalidateUserSessions(user.id, kept.session.id);

    expect(await validateSessionToken(kept.token)).not.toBeNull();
    expect(await validateSessionToken(other.token)).toBeNull();
  });

  it("deleting the user ends their sessions", async () => {
    const { user } = await createAccount();
    const { token } = await createSession(user.id, false);
    await prisma.user.delete({ where: { id: user.id } });

    expect(await validateSessionToken(token)).toBeNull();
  });
});

describe("session handoff (E29 D8)", () => {
  const SITES = "sites.example.com";

  it("stores only the token's hash and hands over once, on the host it names", async () => {
    const { user } = await createAccount({ planCode: "SITES" });
    const token = await createSessionHandoff(user.id, true, SITES);

    const row = await prisma.sessionHandoff.findUniqueOrThrow({ where: { id: hashSessionToken(token) } });
    expect(row).toMatchObject({ userId: user.id, rememberMe: true, targetHost: SITES });
    expect(await consumeSessionHandoff(token, SITES)).toEqual({ userId: user.id, rememberMe: true });
    expect(await consumeSessionHandoff(token, SITES)).toBeNull();
  });

  it("refuses another host and leaves the pass for the right one", async () => {
    const { user } = await createAccount({ planCode: "SITES" });
    const token = await createSessionHandoff(user.id, false, SITES);

    expect(await consumeSessionHandoff(token, "forms.example.com")).toBeNull();
    expect(await consumeSessionHandoff(token, SITES)).toMatchObject({ userId: user.id });
  });

  it("expires after two minutes", async () => {
    const { user } = await createAccount({ planCode: "SITES" });
    const now = new Date();
    const token = await createSessionHandoff(user.id, false, SITES, now);

    expect(await consumeSessionHandoff(token, SITES, at(now, HANDOFF_TTL_MS))).toBeNull();
  });

  it("is used once even when two requests race", async () => {
    const { user } = await createAccount({ planCode: "SITES" });
    const token = await createSessionHandoff(user.id, false, SITES);

    const results = await Promise.all([consumeSessionHandoff(token, SITES), consumeSessionHandoff(token, SITES)]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("replaces the user's earlier pass, and goes with their sessions", async () => {
    const { user } = await createAccount({ planCode: "SITES" });
    const first = await createSessionHandoff(user.id, false, SITES);
    const second = await createSessionHandoff(user.id, false, SITES);
    expect(await consumeSessionHandoff(first, SITES)).toBeNull();

    await invalidateUserSessions(user.id);
    expect(await consumeSessionHandoff(second, SITES)).toBeNull();
  });
});


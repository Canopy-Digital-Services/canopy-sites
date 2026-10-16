/**
 * Server-side sessions (Epic 28). The cookie carries a random 256-bit token;
 * the database stores only its SHA-256 as the session id, so neither a
 * database read nor this source code yields a usable session, and there is
 * no signing secret to leak. Deleting a row signs that browser out.
 *
 * Policy (unchanged from Epic 12): idle timeout 4h, or 7d with "Keep me
 * signed in"; absolute cap 7d, or 30d. The idle expiry rolls forward on use,
 * in the database, at most once a minute, never past the absolute cap.
 *
 * The core functions take a token and work against the database only, so
 * tests drive them directly. The cookie functions are the thin request layer.
 */

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import type { MembershipRole } from "@prisma/client";
import { prisma } from "@/lib/db";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const SESSION_POLICY = {
  default: { idleMs: 4 * HOUR, absoluteMs: 7 * DAY },
  remember: { idleMs: 7 * DAY, absoluteMs: 30 * DAY },
} as const;

/** Rolling the idle expiry is a write; skip it unless it would move this far. */
const ROLL_THRESHOLD_MS = 60 * 1000;

export type SessionContext = {
  /** The row id (token hash). Never the token itself. */
  id: string;
  rememberMe: boolean;
  user: { id: string; email: string; role: string };
  /** At most two rows: enough to tell none, one, and more than one apart. */
  memberships: { accountId: string; role: MembershipRole }[];
};

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function policyFor(rememberMe: boolean) {
  return rememberMe ? SESSION_POLICY.remember : SESSION_POLICY.default;
}

/** Creates a session and returns the token for the cookie. A new token on every sign-in, so a planted cookie can never become a session. */
export async function createSession(userId: string, rememberMe: boolean, now = new Date()) {
  const token = generateSessionToken();
  const { idleMs, absoluteMs } = policyFor(rememberMe);
  const absoluteExpiresAt = new Date(now.getTime() + absoluteMs);
  const session = await prisma.session.create({
    data: {
      id: hashSessionToken(token),
      userId,
      rememberMe,
      createdAt: now,
      expiresAt: new Date(now.getTime() + idleMs),
      absoluteExpiresAt,
    },
  });
  return { token, session };
}

/**
 * The session for a token, or null when it is unknown or expired. An expired
 * row is deleted on sight. A live one has its idle expiry rolled forward.
 */
export async function validateSessionToken(token: string, now = new Date()): Promise<SessionContext | null> {
  if (!token) return null;
  const id = hashSessionToken(token);
  const row = await prisma.session.findUnique({
    where: { id },
    select: {
      id: true,
      rememberMe: true,
      expiresAt: true,
      absoluteExpiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          roleCode: true,
          memberships: { select: { accountId: true, role: true }, take: 2 },
        },
      },
    },
  });
  if (!row) return null;

  if (now >= row.expiresAt || now >= row.absoluteExpiresAt) {
    await prisma.session.deleteMany({ where: { id } });
    return null;
  }

  const rolled = new Date(
    Math.min(now.getTime() + policyFor(row.rememberMe).idleMs, row.absoluteExpiresAt.getTime())
  );
  if (rolled.getTime() - row.expiresAt.getTime() >= ROLL_THRESHOLD_MS) {
    await prisma.session.update({ where: { id }, data: { expiresAt: rolled } });
  }

  return {
    id: row.id,
    rememberMe: row.rememberMe,
    user: { id: row.user.id, email: row.user.email, role: row.user.roleCode },
    memberships: row.user.memberships,
  };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

/** Signs a user out everywhere, optionally keeping one session (the one making the request). */
export async function invalidateUserSessions(userId: string, keepSessionId?: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId, ...(keepSessionId ? { id: { not: keepSessionId } } : {}) },
  });
}

// ---------------------------------------------------------------------------
// Request layer

/**
 * HTTPS deployments get the `__Host-` prefix, which browsers only accept on a
 * Secure, host-only, Path=/ cookie. Plain-HTTP local dev cannot use it.
 */
const SECURE = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
export const SESSION_COOKIE = SECURE ? "__Host-canopy_session" : "canopy_session";

/** NextAuth's cookies from before Epic 28; cleared on sign-in and sign-out. */
const LEGACY_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
];

/**
 * Sets the session cookie. "Keep me signed in" persists it until the absolute
 * cap; otherwise it lasts until the browser closes. The database enforces
 * both timeouts either way. Only callable from server actions and route
 * handlers, where Next allows writing cookies.
 */
export async function setSessionCookie(token: string, rememberMe: boolean, absoluteExpiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: SECURE,
    sameSite: "lax",
    path: "/",
    ...(rememberMe ? { expires: absoluteExpiresAt } : {}),
  });
  expireLegacyCookies(jar);
}

export async function clearSessionCookie() {
  const jar = await cookies();
  expireCookie(jar, SESSION_COOKIE);
  expireLegacyCookies(jar);
}

type CookieJar = Awaited<ReturnType<typeof cookies>>;

/**
 * Expires a cookie with the attributes it was set with. A browser ignores a
 * deletion of a `__Host-` or `__Secure-` cookie that lacks `Secure`, which a
 * bare `cookies().delete(name)` omits.
 */
function expireCookie(jar: CookieJar, name: string) {
  const prefixed = name.startsWith("__Host-") || name.startsWith("__Secure-");
  jar.set(name, "", { httpOnly: true, secure: prefixed || SECURE, sameSite: "lax", path: "/", maxAge: 0 });
}

function expireLegacyCookies(jar: CookieJar) {
  for (const name of LEGACY_COOKIES) if (jar.get(name)) expireCookie(jar, name);
}

/**
 * The current request's session, or null. Memoized per request, so layouts,
 * pages, and helpers share one database round trip.
 */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? validateSessionToken(token) : null;
});

import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import { getHomePath } from "@/lib/product";
import { MultipleMembershipsError } from "@/lib/data-access/memberships";
import { getSession, type SessionContext } from "@/lib/session";

/**
 * Generate a cryptographically secure random token
 */
export function generateToken(bytes: number = 32): string {
  return randomBytes(bytes).toString("hex");
}

/** SHA-256 hex of a high-entropy token, for storing tokens that must not be readable from the database. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * The current session, or redirect to /login. The session carries the user's
 * id, email, and platform role as stored now, plus their memberships.
 */
export async function requireAuth(): Promise<SessionContext> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

/**
 * Get the current user ID or redirect to login
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await requireAuth();
  return session.user.id;
}

/** The session user's only membership, or null. Throws for more than one (account switching is not built). */
function soleMembership(session: SessionContext) {
  if (session.memberships.length > 1) {
    throw new MultipleMembershipsError(session.user.id);
  }
  return session.memberships[0] ?? null;
}

/**
 * The signed-in user's membership, or redirect to login. Throws when the user
 * has none (account deletion removes sole members, so this means bad data).
 */
export async function getCurrentMembership() {
  const session = await requireAuth();
  const membership = soleMembership(session);

  if (!membership) {
    throw new Error(`User ${session.user.id} has no account membership`);
  }

  return membership;
}

/** The signed-in user's account, through their membership. */
export async function getCurrentAccountId(): Promise<string> {
  return (await getCurrentMembership()).accountId;
}

/**
 * Home for a signed-in user, or null when signed out or the account cannot
 * be resolved. For the login pages and `/`, which must render the sign-in
 * form rather than an error whenever there is no usable session.
 */
export async function getSignedInHomePath(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const membership = soleMembership(session);
  return membership ? getHomePath(membership.accountId) : null;
}

/**
 * The current session, if the user holds the GLOBAL_ADMIN role; otherwise
 * redirect home. The role is read from the database on every request, so a
 * role change applies on the affected user's next request.
 */
export async function requireGlobalAdmin(): Promise<SessionContext> {
  const session = await requireAuth();

  if (session.user.role !== "GLOBAL_ADMIN") {
    redirect(await getHomePath(await getCurrentAccountId()));
  }

  return session;
}

import * as bcrypt from "bcrypt";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { getHomePath } from "@/lib/product";
import { getSoleMembership } from "@/lib/data-access/memberships";

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure random token
 */
export function generateToken(bytes: number = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Get the current session or redirect to login
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
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

/**
 * The signed-in user's account, through their membership. Redirects to
 * /login when signed out. Throws when the user has no membership (account
 * deletion removes sole members, so this means bad data) or more than one
 * (account switching is not built).
 */
export async function getCurrentAccountId(): Promise<string> {
  const session = await requireAuth();
  const membership = await getSoleMembership(session.user.id);

  if (!membership) {
    throw new Error(`User ${session.user.id} has no account membership`);
  }

  return membership.accountId;
}

/**
 * Home for a signed-in user, or null when signed out or the account cannot
 * be resolved. For the login pages and `/`, which must render the sign-in
 * form rather than an error whenever there is no usable session.
 */
export async function getSignedInHomePath(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await getSoleMembership(session.user.id);
  return membership ? getHomePath(membership.accountId) : null;
}

/**
 * Get the current session and verify the user holds the GLOBAL_ADMIN role.
 * Redirects home if not. The role claim is read from the session JWT;
 * a role change takes effect on the affected user's next login.
 */
export async function requireGlobalAdmin() {
  const session = await requireAuth();

  if (session.user.role !== "GLOBAL_ADMIN") {
    redirect(await getHomePath(await getCurrentAccountId()));
  }

  return session;
}

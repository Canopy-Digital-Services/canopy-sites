import * as bcrypt from "bcrypt";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";

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
 * Get the current account ID or redirect to login
 */
export async function getCurrentAccountId(): Promise<string> {
  const session = await requireAuth();
  const { prisma } = await import("@/lib/db");
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accountId: true },
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  return user.accountId;
}

/**
 * Get the current session and verify the user holds the GLOBAL_ADMIN role.
 * Redirects to /forms if not. The role claim is read from the session JWT;
 * a role change takes effect on the affected user's next login.
 */
export async function requireGlobalAdmin() {
  const session = await requireAuth();

  if (session.user.role !== "GLOBAL_ADMIN") {
    redirect("/forms");
  }

  return session;
}

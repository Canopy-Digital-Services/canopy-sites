import * as bcrypt from "bcrypt";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

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
 * Get the current session or redirect to login
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session || !session.user) {
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

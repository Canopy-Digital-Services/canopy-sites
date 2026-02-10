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
 * Get the current session and verify user is the platform operator
 * Redirects to /forms if not operator
 */
export async function requireOperator() {
  const session = await requireAuth();
  
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = session.user.email?.trim().toLowerCase();
  
  if (!adminEmail) {
    console.error("ADMIN_EMAIL environment variable is not set");
    redirect("/forms");
  }
  
  if (userEmail !== adminEmail) {
    // Log for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("Operator check failed:", {
        userEmail,
        adminEmail,
        match: userEmail === adminEmail,
      });
    }
    redirect("/forms");
  }
  
  return session;
}

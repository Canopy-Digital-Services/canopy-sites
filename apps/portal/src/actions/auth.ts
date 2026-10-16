"use server";

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, generateToken } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  createSession,
  getSession,
  invalidateSession,
  invalidateUserSessions,
  setSessionCookie,
} from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/validation";
import { getAccountEntitlements } from "@/lib/data-access/entitlements";
import { getSoleMembership } from "@/lib/data-access/memberships";
import { appUrlFor, productNameFor } from "@/lib/product";
import {
  clearPasswordChangeThrottle,
  clearSignInThrottle,
  passwordChangeThrottled,
  resetRequestThrottled,
  signInThrottled,
  signUpThrottled,
  THROTTLED_MESSAGE,
} from "@/lib/auth-throttle";

/**
 * Sign up a new user with email and password
 * Creates an account automatically and signs the user in
 */
export async function signUp(formData: FormData) {
  const email = normalizeEmail((formData.get("email") as string | null) ?? "");
  const password = formData.get("password") as string;

  // Validate inputs
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  if (await signUpThrottled()) {
    return { error: THROTTLED_MESSAGE };
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Email already registered" };
  }

  try {
    // Hash password
    const hashedPassword = await hashPassword(password);

    // User, account, and the OWNER membership linking them, in one write
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        memberships: {
          create: { role: "OWNER", account: { create: {} } },
        },
      },
    });

    // Sign the new user in
    const { token, session } = await createSession(user.id, false);
    await setSessionCookie(token, session.rememberMe, session.absoluteExpiresAt);

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return { error: "Failed to create account" };
  }
}

const INVALID_CREDENTIALS = "Invalid email or password";

/**
 * A bcrypt hash of a random string nobody knows, compared against when the
 * email is unknown so sign-in takes as long as for a real account.
 */
const UNKNOWN_USER_HASH = "$2b$10$eDrFTE/YEInPF9KbUxiK/eC/Ql2y2hUGZJl9UJETV5pdu.GmZjlDW";

/**
 * Sign in with email and password. On success sets the session cookie; the
 * client then navigates to `/`, which resolves home. Every failure returns
 * the same message, so the response never says whether an email exists.
 */
export async function signInAction(input: {
  email: string;
  password: string;
  rememberMe: boolean;
}): Promise<{ error: string } | { success: true }> {
  const email = normalizeEmail(input.email ?? "");
  const password = input.password ?? "";

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (await signInThrottled(email)) {
    return { error: THROTTLED_MESSAGE };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true, _count: { select: { memberships: true } } },
  });

  const valid = await verifyPassword(password, user?.password ?? UNKNOWN_USER_HASH);

  // A user with no membership has nowhere to land, so it cannot sign in.
  if (!user || !valid || user._count.memberships === 0) {
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: { increment: 1 }, lastFailedLoginAt: new Date() },
      });
    }
    return { error: INVALID_CREDENTIALS };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), failedLoginCount: 0, lastFailedLoginAt: null },
  });
  clearSignInThrottle(email);

  const { token, session } = await createSession(user.id, input.rememberMe === true);
  await setSessionCookie(token, session.rememberMe, session.absoluteExpiresAt);

  return { success: true };
}

/**
 * Request a password reset email
 * Always returns success to prevent email enumeration
 */
type ResetRequestResult =
  | { success: true; message: string; error?: never }
  | { error: string; success?: never; message?: never };

export async function requestPasswordReset(formData: FormData): Promise<ResetRequestResult> {
  const email = normalizeEmail((formData.get("email") as string | null) ?? "");

  if (!email) {
    return { error: "Email is required" };
  }

  const genericSuccess: ResetRequestResult = {
    success: true,
    message: "If an account exists with that email, a reset link has been sent.",
  };

  // Throttled requests get the same answer and send nothing, so nobody can
  // flood an inbox and the response still says nothing about the account.
  if (await resetRequestThrottled(email)) {
    return genericSuccess;
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always return success, even if user doesn't exist (prevent enumeration)
  if (!user) {
    return genericSuccess;
  }

  try {
    // Generate secure token
    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store token in database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send password reset email. The account, not the request host, picks
    // the link host and product name (see appUrlFor).
    const membership = await getSoleMembership(user.id);
    const entitlements = membership
      ? await getAccountEntitlements(membership.accountId)
      : { sitesEnabled: false };
    const productName = productNameFor(entitlements);
    const resetUrl = `${appUrlFor(entitlements)}/reset-password?token=${token}`;
    
    await sendEmail({
      to: email,
      subject: `Password Reset Request - ${productName}`,
      text: `
You requested a password reset for your ${productName} account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

---
${productName}
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2>Password Reset Request</h2>
  <p>You requested a password reset for your ${productName} account.</p>
  <p>Click the button below to reset your password:</p>
  <p style="margin: 20px 0;">
    <a href="${resetUrl}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
  </p>
  <p>Or copy and paste this link into your browser:</p>
  <p style="color: #666; word-break: break-all;">${resetUrl}</p>
  <p style="margin-top: 20px; color: #666; font-size: 14px;">
    This link will expire in 1 hour.
  </p>
  <p style="color: #666; font-size: 14px;">
    If you didn't request this, you can safely ignore this email.
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">${productName}</p>
</body>
</html>
      `.trim(),
    });

    return genericSuccess;
  } catch (error) {
    console.error("Password reset request error:", error);
    // Still return success to prevent enumeration
    return genericSuccess;
  }
}

/**
 * Validate a password reset token
 */
export async function validateResetToken(token: string) {
  if (!token) {
    return { valid: false, error: "Token is required" };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { email: true } } },
  });

  if (!resetToken) {
    return { valid: false, error: "Invalid or expired reset link" };
  }

  if (resetToken.usedAt) {
    return { valid: false, error: "This reset link has already been used" };
  }

  if (resetToken.expiresAt < new Date()) {
    return { valid: false, error: "This reset link has expired" };
  }

  return { valid: true, email: resetToken.user.email };
}

/**
 * Reset password using a valid token
 */
export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token || !password) {
    return { error: "Token and password are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  // Validate token
  const validation = await validateResetToken(token);
  if (!validation.valid) {
    return { error: validation.error };
  }

  try {
    // Get the token with user info
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return { error: "Invalid reset token" };
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update the password, mark the token used, and sign the user out
    // everywhere: whoever held the old password loses their sessions.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword, passwordChangedAt: new Date() },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.session.deleteMany({ where: { userId: resetToken.userId } }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "Failed to reset password" };
  }
}

/**
 * Sign out: delete this browser's session and its cookie, then go to the
 * login page on the current host (a relative redirect never changes host).
 */
export async function signOutAction() {
  const session = await getSession();
  if (session) await invalidateSession(session.id);
  await clearSessionCookie();
  redirect("/login");
}

/**
 * Change password for the currently authenticated user
 */
export async function changePassword(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!currentPassword || !newPassword) {
    return { error: "Current password and new password are required" };
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters" };
  }

  if (passwordChangeThrottled(session.user.id)) {
    return { error: THROTTLED_MESSAGE };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return { error: "Current password is incorrect" };
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword, passwordChangedAt: new Date() },
    });
    // This browser stays signed in; every other session ends.
    await invalidateUserSessions(session.user.id, session.id);
    clearPasswordChangeThrottle(session.user.id);

    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { error: "Failed to change password" };
  }
}

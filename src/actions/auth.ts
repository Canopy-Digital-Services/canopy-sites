"use server";

import { prisma } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth-utils";
import { signIn } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { redirect } from "next/navigation";

/**
 * Sign up a new user with email and password
 * Creates an account automatically and signs the user in
 */
export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate inputs
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
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

    // Create account and user together
    const account = await prisma.account.create({
      data: {
        user: {
          create: {
            email,
            password: hashedPassword,
          },
        },
      },
      include: {
        user: true,
      },
    });

    // Sign in the user automatically
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return { error: "Failed to create account" };
  }
}

/**
 * Request a password reset email
 * Always returns success to prevent email enumeration
 */
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always return success, even if user doesn't exist (prevent enumeration)
  if (!user) {
    return {
      success: true,
      message: "If an account exists with that email, a reset link has been sent.",
    };
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

    // Send password reset email
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3006"}/reset-password?token=${token}`;
    
    await sendEmail({
      to: email,
      subject: "Password Reset Request - Canopy Forms",
      text: `
You requested a password reset for your Canopy Forms account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

---
Canopy Forms
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2>Password Reset Request</h2>
  <p>You requested a password reset for your Canopy Forms account.</p>
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
  <p style="color: #999; font-size: 12px;">Canopy Forms</p>
</body>
</html>
      `.trim(),
    });

    return {
      success: true,
      message: "If an account exists with that email, a reset link has been sent.",
    };
  } catch (error) {
    console.error("Password reset request error:", error);
    // Still return success to prevent enumeration
    return {
      success: true,
      message: "If an account exists with that email, a reset link has been sent.",
    };
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

  return { valid: true };
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

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "Failed to reset password" };
  }
}

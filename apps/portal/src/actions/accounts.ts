"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireGlobalAdmin, getCurrentAccountId } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

/**
 * Delete an account (hard delete).
 * Cascade handles: User, Forms → Fields, Forms → Submissions, PasswordResetTokens.
 *
 * Guarded by Global Admin; additionally refuses to delete the last remaining
 * Global Admin so the deployment cannot brick itself.
 */
export async function deleteAccount(accountId: string) {
  const session = await requireGlobalAdmin();

  // Prevent self-deletion
  const operatorUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { accountId: true },
  });

  if (operatorUser?.accountId === accountId) {
    throw new Error("Cannot delete your own account");
  }

  // Prevent deletion of the last remaining Global Admin.
  const targetUser = await prisma.user.findFirst({
    where: { accountId },
    select: { roleCode: true },
  });

  if (targetUser?.roleCode === "GLOBAL_ADMIN") {
    const adminCount = await prisma.user.count({
      where: { roleCode: "GLOBAL_ADMIN" },
    });
    if (adminCount <= 1) {
      throw new Error(
        "At least one Global Admin is required. Promote another user first."
      );
    }
  }

  await prisma.account.delete({
    where: { id: accountId },
  });

  revalidatePath("/operator/accounts");
}

/**
 * Delete the current user's own account (hard delete).
 * Cascade handles: User, Forms → Fields, Forms → Submissions, PasswordResetTokens.
 *
 * Epic 14: Self-service account deletion
 */
export async function deleteSelfAccount() {
  await requireAuth();
  const accountId = await getCurrentAccountId();

  await prisma.account.delete({
    where: { id: accountId },
  });
}

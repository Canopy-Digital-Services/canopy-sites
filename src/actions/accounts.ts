"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireOperator, getCurrentAccountId } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

/**
 * Delete an account (hard delete).
 * Cascade handles: User, Forms → Fields, Forms → Submissions, PasswordResetTokens.
 *
 * Epic 6: Operator-only action
 */
export async function deleteAccount(accountId: string) {
  const session = await requireOperator();

  // Prevent self-deletion
  const operatorUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { accountId: true },
  });

  if (operatorUser?.accountId === accountId) {
    throw new Error("Cannot delete your own account");
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

"use server";

import { prisma } from "@/lib/db";
import { requireOperator } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

/**
 * Delete an account (hybrid delete):
 * 1. Purge all forms, sites, and submissions (via cascade)
 * 2. Clear user password
 * 3. Mark account as deleted (tombstone)
 * 
 * Epic 6: Operator-only action
 */
export async function deleteAccount(accountId: string) {
  // Verify operator
  const session = await requireOperator();
  
  // Prevent self-deletion
  const operatorUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { accountId: true },
  });
  
  if (operatorUser?.accountId === accountId) {
    throw new Error("Cannot delete your own account");
  }
  
  // Get account
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      user: {
        select: { id: true },
      },
    },
  });
  
  if (!account) {
    throw new Error("Account not found");
  }
  
  if (account.deletedAt) {
    throw new Error("Account already deleted");
  }
  
  // Purge all data associated with the account
  // Forms cascade to submissions and fields
  // Sites have forms that will be deleted
  await prisma.form.deleteMany({
    where: { accountId },
  });
  
  await prisma.site.deleteMany({
    where: { accountId },
  });
  
  // Clear user password and mark account as deleted
  if (account.user) {
    await prisma.user.update({
      where: { id: account.user.id },
      data: { password: "" },
    });
  }
  
  // Mark account as deleted (tombstone)
  await prisma.account.update({
    where: { id: accountId },
    data: { deletedAt: new Date() },
  });
  
  revalidatePath("/operator/accounts");
}

"use server";

import { prisma } from "@/lib/db";
import { requireGlobalAdmin, getCurrentMembership } from "@/lib/auth-utils";
import { clearSessionCookie } from "@/lib/session";
import {
  deleteAccountAndSoleMembers,
  getSoleMembership,
} from "@/lib/data-access/memberships";
import { revalidatePath } from "next/cache";

/**
 * Delete an account (hard delete), with every user whose only membership it
 * was. See deleteAccountAndSoleMembers for what cascades.
 *
 * Guarded by Global Admin; refuses the operator's own account and anything
 * that would remove the last Global Admin, so the deployment cannot brick
 * itself.
 */
export async function deleteAccount(accountId: string) {
  const session = await requireGlobalAdmin();

  const own = await getSoleMembership(session.user.id);
  if (own?.accountId === accountId) {
    throw new Error("Cannot delete your own account");
  }

  const adminsRemoved = await prisma.user.count({
    where: {
      roleCode: "GLOBAL_ADMIN",
      memberships: { some: { accountId }, every: { accountId } },
    },
  });
  if (adminsRemoved > 0) {
    const adminCount = await prisma.user.count({ where: { roleCode: "GLOBAL_ADMIN" } });
    if (adminCount - adminsRemoved < 1) {
      throw new Error(
        "At least one Global Admin is required. Promote another user first."
      );
    }
  }

  await deleteAccountAndSoleMembers(accountId);

  revalidatePath("/operator/accounts");
}

/**
 * Delete the signed-in user's own account (hard delete). Owners only.
 *
 * Epic 14: Self-service account deletion
 */
export async function deleteSelfAccount() {
  const membership = await getCurrentMembership();

  if (membership.role !== "OWNER") {
    throw new Error("Only the account owner can delete the account");
  }

  // The user's sessions went with them; this clears the browser's cookie.
  await deleteAccountAndSoleMembers(membership.accountId);
  await clearSessionCookie();
}

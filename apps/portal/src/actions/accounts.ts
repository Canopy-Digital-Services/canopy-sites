"use server";

import { prisma } from "@/lib/db";
import { requireGlobalAdmin, getCurrentMembership } from "@/lib/auth-utils";
import { clearSessionCookie } from "@/lib/session";
import {
  AccountHasSiteError,
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
 * itself. An account that owns a site is refused until the site moves.
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

  try {
    await deleteAccountAndSoleMembers(accountId);
  } catch (error) {
    if (error instanceof AccountHasSiteError) {
      throw new Error("This account has a site. Move the site to another account first.");
    }
    throw error;
  }

  revalidatePath("/operator/accounts");
}

/**
 * Delete the signed-in user's own account (hard delete). Owners only. An
 * account with a site is refused with a message: closing it is a
 * conversation, not a click (PRD D19).
 *
 * Epic 14: Self-service account deletion
 */
export async function deleteSelfAccount(): Promise<{ success: true } | { error: string }> {
  const membership = await getCurrentMembership();

  if (membership.role !== "OWNER") {
    throw new Error("Only the account owner can delete the account");
  }

  try {
    await deleteAccountAndSoleMembers(membership.accountId);
  } catch (error) {
    if (error instanceof AccountHasSiteError) {
      return { error: "Your account includes a website. Contact support to close it." };
    }
    throw error;
  }
  // The user's sessions went with them; this clears the browser's cookie.
  await clearSessionCookie();
  return { success: true };
}

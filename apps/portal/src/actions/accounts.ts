"use server";

import { prisma } from "@/lib/db";
import { requireGlobalAdmin, getCurrentAccountId, getCurrentMembership } from "@/lib/auth-utils";
import { clearSessionCookie, getSession } from "@/lib/session";
import { isActing } from "@/lib/act-as";
import { requireId } from "@/lib/ids";
import {
  AccountHasSiteError,
  deleteAccountAndSoleMembers,
  getSoleMembership,
} from "@/lib/data-access/memberships";
import { sendSiteTimeZone } from "@/lib/site-tools";
import { canonicalTimeZone } from "@/lib/time-zone";
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
  requireId(accountId, "account id");
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
  // The operator acting as a client (PRD D49) never deletes the client's account.
  if (isActing(await getSession())) {
    return { error: "Stop acting as the client first." };
  }
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

/**
 * Sets the time zone of the signed-in user's account, or of the client's when
 * a Global Admin is acting as it (PRD D49): `getCurrentAccountId` resolves
 * both. The zone is whatever the client sent, so only one the runtime knows
 * is stored. An account with a site tells the builder, so the site's nightly
 * rebuild moves to the new local midnight.
 */
export async function setAccountTimeZone(timeZone: string): Promise<{ success: true } | { error: string }> {
  const accountId = await getCurrentAccountId();
  const zone = canonicalTimeZone(timeZone);
  if (!zone) return { error: "That isn't a time zone we know." };

  await prisma.account.update({ where: { id: accountId }, data: { timeZone: zone } });
  await sendSiteTimeZone(accountId);
  revalidatePath("/account");
  return { success: true };
}

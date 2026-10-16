"use server";

/**
 * Global-Admin-gated role management. Every action here runs through
 * requireGlobalAdmin so non-admins cannot change anyone's role.
 */

import { prisma } from "@/lib/db";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { getRole } from "@/lib/data-access/roles";
import { getSoleMembership } from "@/lib/data-access/memberships";
import { revalidatePath } from "next/cache";

/**
 * Change a user's role. Guards:
 *   1. Actor cannot change their own role (self-demotion guard).
 *   2. Demoting the last remaining GLOBAL_ADMIN is blocked.
 *   3. Promotion to GLOBAL_ADMIN moves an account on a capped plan to
 *      UNLOCKED in the same transaction, so a new admin is never capped on
 *      their own forms. Uncapped plans stay put, so promoting a Sites
 *      account keeps Sites. Demotion does NOT automatically revert the plan.
 *
 * The affected user's current session continues to reflect the old role
 * until they re-authenticate; the UI copy states this explicitly.
 */
export async function setUserRole(
  userId: string,
  roleCode: string
): Promise<{
  success: true;
  planAutoUpgraded: boolean;
}> {
  const session = await requireGlobalAdmin();
  const actorUserId = session.user.id;
  const actorEmail = session.user.email ?? "unknown";

  if (userId === actorUserId) {
    throw new Error("You cannot change your own role.");
  }

  const role = await getRole(roleCode);

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      roleCode: true,
    },
  });

  if (!target) {
    throw new Error(`User not found: ${userId}`);
  }

  if (target.roleCode === roleCode) {
    return { success: true, planAutoUpgraded: false };
  }

  const demotingFromAdmin =
    target.roleCode === "GLOBAL_ADMIN" && roleCode !== "GLOBAL_ADMIN";

  if (demotingFromAdmin) {
    const adminCount = await prisma.user.count({
      where: { roleCode: "GLOBAL_ADMIN" },
    });
    if (adminCount <= 1) {
      throw new Error(
        "At least one Global Admin is required. Promote another user first."
      );
    }
  }

  // The account to move to UNLOCKED on promotion: the target's only one.
  const membership = await getSoleMembership(userId);
  const account = membership
    ? await prisma.account.findUnique({
        where: { id: membership.accountId },
        select: { id: true, plan: { select: { maxPublishedForms: true } } },
      })
    : null;

  const shouldUpgradePlan =
    roleCode === "GLOBAL_ADMIN" && !!account && account.plan.maxPublishedForms !== null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { roleCode },
    });
    if (shouldUpgradePlan && account) {
      await tx.account.update({
        where: { id: account.id },
        data: { planCode: "UNLOCKED" },
      });
    }
  });

  console.log(
    JSON.stringify({
      event: "setUserRole",
      actorUserId,
      actorEmail,
      targetUserId: userId,
      targetEmail: target.email,
      fromRole: target.roleCode,
      toRole: roleCode,
      planAutoUpgraded: shouldUpgradePlan,
      roleDisplayName: role.displayName,
      at: new Date().toISOString(),
    })
  );

  revalidatePath("/operator/accounts");

  return { success: true, planAutoUpgraded: shouldUpgradePlan };
}

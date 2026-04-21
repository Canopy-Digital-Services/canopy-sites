"use server";

/**
 * Global-Admin-gated role management. Every action here runs through
 * requireGlobalAdmin so non-admins cannot change anyone's role.
 */

import { prisma } from "@/lib/db";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { getRole } from "@/lib/data-access/roles";
import { revalidatePath } from "next/cache";

/**
 * Change a user's role. Guards:
 *   1. Actor cannot change their own role (self-demotion guard).
 *   2. Demoting the last remaining GLOBAL_ADMIN is blocked.
 *   3. Promotion to GLOBAL_ADMIN also moves the account to UNLOCKED in the
 *      same transaction so a new admin is never capped on their own forms.
 *      Demotion does NOT automatically revert the plan.
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
      accountId: true,
      account: { select: { planCode: true } },
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

  const shouldUpgradePlan =
    roleCode === "GLOBAL_ADMIN" && target.account.planCode !== "UNLOCKED";

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { roleCode },
    });
    if (shouldUpgradePlan) {
      await tx.account.update({
        where: { id: target.accountId },
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

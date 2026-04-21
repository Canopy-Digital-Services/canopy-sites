"use server";

/**
 * Global-Admin-gated plan management. Every action here runs through
 * requireGlobalAdmin so non-admins cannot change anyone's plan.
 */

import { prisma } from "@/lib/db";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { getPlan } from "@/lib/data-access/plans";
import { revalidatePath } from "next/cache";

/**
 * Change an account's plan. If the new plan's maxPublishedForms is below
 * the account's current published form count, all of that account's forms
 * are unpublished atomically and the account is flagged for resolution so
 * the user must pick which (up to new cap) forms stay live on next login.
 *
 * The flag is flipped on inside the same transaction that updates the plan
 * so the account is never in a half-state where limits disagree with data.
 */
export async function setAccountPlan(
  accountId: string,
  planCode: string
): Promise<{
  success: true;
  unpublishedCount: number;
  resolutionRequired: boolean;
}> {
  const session = await requireGlobalAdmin();
  const actorEmail = session.user?.email ?? "unknown";

  const plan = await getPlan(planCode);

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: {
      planCode: true,
      user: { select: { email: true } },
    },
  });

  if (!account) {
    throw new Error(`Account not found: ${accountId}`);
  }

  const publishedCount = await prisma.form.count({
    where: { accountId, published: true },
  });

  const overCap =
    plan.maxPublishedForms !== null &&
    publishedCount > plan.maxPublishedForms;

  let unpublishedCount = 0;

  if (overCap) {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.form.updateMany({
        where: { accountId, published: true },
        data: { published: false },
      });
      await tx.account.update({
        where: { id: accountId },
        data: {
          planCode,
          requiresPlanResolution: true,
        },
      });
      return updated.count;
    });
    unpublishedCount = result;
  } else {
    await prisma.account.update({
      where: { id: accountId },
      data: { planCode },
    });
  }

  console.log(
    JSON.stringify({
      event: "setAccountPlan",
      actorEmail,
      targetAccountId: accountId,
      targetEmail: account.user?.email ?? null,
      fromPlan: account.planCode,
      toPlan: planCode,
      unpublishedCount,
      resolutionRequired: overCap,
      at: new Date().toISOString(),
    })
  );

  revalidatePath("/operator/accounts");

  return {
    success: true,
    unpublishedCount,
    resolutionRequired: overCap,
  };
}

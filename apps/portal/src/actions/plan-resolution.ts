"use server";

/**
 * Plan resolution action. Called from the blocking dialog that appears
 * after a downgrade has unpublished all of the account's forms. The user
 * picks up to maxPublishedForms to republish (zero is allowed — "keep
 * everything as draft"); this action republishes the selection and
 * clears the resolution flag.
 */

import { prisma } from "@/lib/db";
import { getCurrentAccountId } from "@/lib/auth-utils";
import { getAccountEntitlements } from "@/lib/data-access/entitlements";
import { revalidatePath } from "next/cache";

export async function resolvePlan(selectedFormIds: string[]): Promise<{
  success: true;
  publishedCount: number;
}> {
  const accountId = await getCurrentAccountId();
  const entitlements = await getAccountEntitlements(accountId);

  if (!entitlements.requiresPlanResolution) {
    // Already resolved (e.g. user opened two tabs and submitted twice).
    // Idempotent no-op rather than an error.
    return { success: true, publishedCount: 0 };
  }

  const uniqueIds = Array.from(new Set(selectedFormIds));

  if (
    entitlements.maxPublishedForms !== null &&
    uniqueIds.length > entitlements.maxPublishedForms
  ) {
    throw new Error(
      `Selection exceeds plan cap: selected ${uniqueIds.length}, max ${entitlements.maxPublishedForms}.`
    );
  }

  // Verify every id actually belongs to this account before we publish
  // anything. One round-trip; cheap compared to the write.
  if (uniqueIds.length > 0) {
    const ownedCount = await prisma.form.count({
      where: { id: { in: uniqueIds }, accountId },
    });
    if (ownedCount !== uniqueIds.length) {
      throw new Error("One or more selected forms do not belong to this account.");
    }
  }

  await prisma.$transaction(async (tx) => {
    if (uniqueIds.length > 0) {
      await tx.form.updateMany({
        where: { id: { in: uniqueIds }, accountId },
        data: { published: true },
      });
    }
    await tx.account.update({
      where: { id: accountId },
      data: { requiresPlanResolution: false },
    });
  });

  revalidatePath("/forms");
  revalidatePath("/account");

  return { success: true, publishedCount: uniqueIds.length };
}

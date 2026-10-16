"use server";

/**
 * Global-Admin-gated billing state (PRD D12). Billing happens outside the
 * portal; the account stores a status and a reference to it, nothing more.
 */

import { prisma } from "@/lib/db";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { parseBillingInput } from "@/lib/billing";
import { revalidatePath } from "next/cache";

export async function setAccountBilling(
  accountId: string,
  status: string,
  billingRef: string
): Promise<{ success: true }> {
  const session = await requireGlobalAdmin();

  const input = parseBillingInput(status, billingRef);
  if (!input.ok) {
    throw new Error(input.error);
  }

  const before = await prisma.account.findUnique({
    where: { id: accountId },
    select: { status: true, billingRef: true },
  });
  if (!before) {
    throw new Error(`Account not found: ${accountId}`);
  }

  await prisma.account.update({
    where: { id: accountId },
    data: { status: input.status, billingRef: input.billingRef },
  });

  console.log(
    JSON.stringify({
      event: "setAccountBilling",
      actorEmail: session.user.email ?? "unknown",
      targetAccountId: accountId,
      fromStatus: before.status,
      toStatus: input.status,
      fromBillingRef: before.billingRef,
      toBillingRef: input.billingRef,
      at: new Date().toISOString(),
    })
  );

  revalidatePath("/operator/accounts");

  return { success: true };
}

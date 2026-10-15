import { prisma } from "@/lib/db";

export type AccountEntitlements = {
  planCode: string;
  planDisplayName: string;
  maxPublishedForms: number | null;
  publishedFormsCount: number;
  totalFormsCount: number;
  canPublishAnother: boolean;
  requiresPlanResolution: boolean;
  /** The account has Canopy Sites: Sites chrome and the /editor and /stats routes. */
  sitesEnabled: boolean;
};

/**
 * Resolve every entitlement decision for an account through this helper so
 * publishing, UI state, and future add-ons all share one source of truth.
 * When billing and AddOns land the return shape grows; call sites stay put.
 */
export async function getAccountEntitlements(
  accountId: string
): Promise<AccountEntitlements> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: {
      planCode: true,
      requiresPlanResolution: true,
      plan: {
        select: {
          displayName: true,
          maxPublishedForms: true,
        },
      },
      _count: {
        select: { forms: true },
      },
    },
  });

  if (!account) {
    throw new Error(`Account not found: ${accountId}`);
  }

  const publishedFormsCount = await prisma.form.count({
    where: { accountId, published: true },
  });

  const max = account.plan.maxPublishedForms;
  const canPublishAnother = max === null || publishedFormsCount < max;

  return {
    planCode: account.planCode,
    planDisplayName: account.plan.displayName,
    maxPublishedForms: max,
    publishedFormsCount,
    totalFormsCount: account._count.forms,
    canPublishAnother,
    requiresPlanResolution: account.requiresPlanResolution,
    // Stand-in until Epic 29 adds Plan.sitesEnabled, whose seed enables
    // UNLOCKED and no other existing plan. Swap this for the column then.
    sitesEnabled: account.planCode === "UNLOCKED",
  };
}

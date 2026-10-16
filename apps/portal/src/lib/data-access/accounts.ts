import { prisma } from "@/lib/db";
import type { AccountStatus } from "@prisma/client";

/**
 * Account metadata with counts (for operator console)
 */
export type AccountMetadata = {
  id: string;
  createdAt: Date;
  userId: string;
  email: string;
  lastLoginAt: Date | null;
  formsCount: number;
  publishedFormsCount: number;
  submissionsCount: number;
  planCode: string;
  planDisplayName: string;
  requiresPlanResolution: boolean;
  status: AccountStatus;
  billingRef: string | null;
  roleCode: string;
  roleDisplayName: string;
};

/**
 * List all active accounts with metadata only.
 * Does not include form content or submission data.
 * Returns counts via aggregation queries.
 */
export async function listAccountsMetadata(): Promise<AccountMetadata[]> {
  // Get accounts with user info, plan info, and form counts
  const accounts = await prisma.account.findMany({
    select: {
      id: true,
      createdAt: true,
      planCode: true,
      requiresPlanResolution: true,
      status: true,
      billingRef: true,
      plan: {
        select: {
          displayName: true,
        },
      },
      // v1 has one member per account, the owner; list the first owner.
      memberships: {
        where: { role: "OWNER" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          user: {
            select: {
              id: true,
              email: true,
              lastLoginAt: true,
              roleCode: true,
              role: {
                select: { displayName: true },
              },
            },
          },
        },
      },
      _count: {
        select: {
          forms: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Count published forms per account in a single grouped query
  const publishedCounts = await prisma.form.groupBy({
    by: ["accountId"],
    _count: true,
    where: {
      accountId: { in: accounts.map((a) => a.id) },
      published: true,
    },
  });
  const publishedCountMap = new Map(
    publishedCounts.map((pc) => [pc.accountId, pc._count])
  );

  // Submission totals per account: one query, summing each form's count.
  const formSubmissionCounts = await prisma.form.findMany({
    where: { accountId: { in: accounts.map((a) => a.id) } },
    select: { accountId: true, _count: { select: { submissions: true } } },
  });
  const accountSubmissionCounts = new Map<string, number>();
  for (const form of formSubmissionCounts) {
    accountSubmissionCounts.set(
      form.accountId,
      (accountSubmissionCounts.get(form.accountId) ?? 0) + form._count.submissions
    );
  }

  // Map to metadata format
  return accounts.map((account) => {
    const owner = account.memberships[0]?.user;
    return {
      id: account.id,
      createdAt: account.createdAt,
      userId: owner?.id ?? "",
      email: owner?.email ?? "Unknown",
      lastLoginAt: owner?.lastLoginAt ?? null,
      formsCount: account._count.forms,
      publishedFormsCount: publishedCountMap.get(account.id) ?? 0,
      submissionsCount: accountSubmissionCounts.get(account.id) ?? 0,
      planCode: account.planCode,
      planDisplayName: account.plan.displayName,
      requiresPlanResolution: account.requiresPlanResolution,
      status: account.status,
      billingRef: account.billingRef,
      roleCode: owner?.roleCode ?? "USER",
      roleDisplayName: owner?.role.displayName ?? "User",
    };
  });
}

/**
 * Get submission count for a specific account
 */
export async function getAccountSubmissionsCount(
  accountId: string
): Promise<number> {
  return prisma.submission.count({
    where: {
      form: {
        accountId,
      },
    },
  });
}

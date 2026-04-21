import { prisma } from "@/lib/db";

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
      plan: {
        select: {
          displayName: true,
        },
      },
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

  // Get submission counts for all accounts in one query
  const submissionCounts = await prisma.submission.groupBy({
    by: ["formId"],
    _count: true,
    where: {
      form: {
        accountId: {
          in: accounts.map((a) => a.id),
        },
      },
    },
  });

  // Build a map of accountId -> submission count
  const accountSubmissionCounts = new Map<string, number>();
  
  for (const account of accounts) {
    const forms = await prisma.form.findMany({
      where: { accountId: account.id },
      select: { id: true },
    });
    
    const formIds = forms.map((f) => f.id);
    const count = submissionCounts
      .filter((sc) => formIds.includes(sc.formId))
      .reduce((sum, sc) => sum + sc._count, 0);
    
    accountSubmissionCounts.set(account.id, count);
  }

  // Map to metadata format
  return accounts.map((account) => ({
    id: account.id,
    createdAt: account.createdAt,
    userId: account.user?.id ?? "",
    email: account.user?.email ?? "Unknown",
    lastLoginAt: account.user?.lastLoginAt ?? null,
    formsCount: account._count.forms,
    publishedFormsCount: publishedCountMap.get(account.id) ?? 0,
    submissionsCount: accountSubmissionCounts.get(account.id) ?? 0,
    planCode: account.planCode,
    planDisplayName: account.plan.displayName,
    requiresPlanResolution: account.requiresPlanResolution,
    roleCode: account.user?.roleCode ?? "USER",
    roleDisplayName: account.user?.role.displayName ?? "User",
  }));
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

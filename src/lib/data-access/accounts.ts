import { prisma } from "@/lib/db";

/**
 * Account metadata with counts (for operator console)
 */
export type AccountMetadata = {
  id: string;
  createdAt: Date;
  email: string;
  lastLoginAt: Date | null;
  formsCount: number;
  submissionsCount: number;
};

/**
 * List all active accounts with metadata only.
 * Does not include form content or submission data.
 * Returns counts via aggregation queries.
 */
export async function listAccountsMetadata(): Promise<AccountMetadata[]> {
  // Get accounts with user info and form counts
  const accounts = await prisma.account.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      createdAt: true,
      user: {
        select: {
          email: true,
          lastLoginAt: true,
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
    email: account.user?.email ?? "Unknown",
    lastLoginAt: account.user?.lastLoginAt ?? null,
    formsCount: account._count.forms,
    submissionsCount: accountSubmissionCounts.get(account.id) ?? 0,
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

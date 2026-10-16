/**
 * Sites. An account has at most one (PRD D19). Client code reaches a site
 * only through getAccountSite with the session's account, and sees only its
 * id, name, slug, and whether it is the demo site: the rest (runbook
 * overlay, locked fields, repo) is operator configuration. The operator
 * functions below read every site and must only be called behind
 * requireGlobalAdmin.
 */

import { prisma } from "@/lib/db";

export type AccountSite = { id: string; name: string; slug: string; isDemo: boolean };

/** The account's site as its own users may see it, or null when it has none. */
export async function getAccountSite(accountId: string): Promise<AccountSite | null> {
  return prisma.site.findUnique({
    where: { accountId },
    select: { id: true, name: true, slug: true, isDemo: true },
  });
}

const ownerEmail = {
  memberships: {
    where: { role: "OWNER" as const },
    orderBy: { createdAt: "asc" as const },
    take: 1,
    select: { user: { select: { email: true } } },
  },
};

/** Operator only. Every site with its account's owner email, newest first. */
export async function listSitesForOperator() {
  const sites = await prisma.site.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      productionHostnames: true,
      contractVersion: true,
      createdAt: true,
      account: { select: { id: true, ...ownerEmail } },
    },
  });
  return sites.map(({ account, ...site }) => ({
    ...site,
    accountId: account.id,
    ownerEmail: account.memberships[0]?.user.email ?? null,
  }));
}

export type OperatorSiteListItem = Awaited<ReturnType<typeof listSitesForOperator>>[number];

/** Operator only. One site with every field, or null. */
export async function getSiteForOperator(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { account: { select: { id: true, ...ownerEmail } } },
  });
  if (!site) return null;
  const { account, ...rest } = site;
  return { ...rest, ownerEmail: account.memberships[0]?.user.email ?? null };
}

export type OperatorSite = NonNullable<Awaited<ReturnType<typeof getSiteForOperator>>>;

/** Operator only. Accounts a site can be assigned to: a plan with Sites and no site yet. */
export async function listAccountsAvailableForSite() {
  const accounts = await prisma.account.findMany({
    where: { plan: { sitesEnabled: true }, site: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, ...ownerEmail },
  });
  return accounts.map((a) => ({ id: a.id, ownerEmail: a.memberships[0]?.user.email ?? null }));
}

export type SiteAccountOption = Awaited<ReturnType<typeof listAccountsAvailableForSite>>[number];

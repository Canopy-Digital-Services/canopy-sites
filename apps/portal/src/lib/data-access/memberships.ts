/**
 * Membership is how a user reaches an account. v1 gives every user exactly
 * one membership, as OWNER; the many-membership path is the throw below, not
 * a feature. Resolve accounts for a user only through this module.
 */

import { prisma } from "@/lib/db";
import type { MembershipRole } from "@prisma/client";
import type { SessionContext } from "@/lib/session";

export class MultipleMembershipsError extends Error {
  constructor(userId: string) {
    super(`User ${userId} belongs to more than one account; account switching is not built yet.`);
    this.name = "MultipleMembershipsError";
  }
}

/** Thrown by deleteAccountAndSoleMembers: an account that owns a site is not deleted (PRD D19). */
export class AccountHasSiteError extends Error {
  constructor(accountId: string) {
    super(`Account ${accountId} has a site. Move the site to another account first.`);
    this.name = "AccountHasSiteError";
  }
}

export type SoleMembership = { accountId: string; role: MembershipRole };

/**
 * The user's only membership, or null when they have none. Throws
 * MultipleMembershipsError for more than one.
 */
export async function getSoleMembership(userId: string): Promise<SoleMembership | null> {
  const rows = await prisma.membership.findMany({
    where: { userId },
    select: { accountId: true, role: true },
    take: 2,
  });
  if (rows.length > 1) throw new MultipleMembershipsError(userId);
  return rows[0] ?? null;
}

type SessionAccess = Pick<SessionContext, "user" | "memberships" | "actingAs">;

/**
 * The account a session works in without throwing: the client's while a
 * Global Admin acts as one (PRD D49), else the user's one membership, else
 * null. For routes that answer "no" rather than error; signed-in pages use
 * getCurrentAccountId.
 */
export function sessionAccountId(session: SessionAccess): string | null {
  if (session.actingAs) return session.actingAs.accountId;
  return session.memberships.length === 1 ? session.memberships[0].accountId : null;
}

/** Whether a session may work in an account: one of its members, or a Global Admin acting as it (PRD D49). */
export async function sessionCanUseAccount(session: SessionAccess, accountId: string): Promise<boolean> {
  if (session.actingAs?.accountId === accountId) return true;
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, accountId },
    select: { id: true },
  });
  return membership !== null;
}

/** The email of the account's first owner, or null when it has none. */
export async function getAccountOwnerEmail(accountId: string): Promise<string | null> {
  const owner = await prisma.membership.findFirst({
    where: { accountId, role: "OWNER" },
    orderBy: { createdAt: "asc" },
    select: { user: { select: { email: true } } },
  });
  return owner?.user.email ?? null;
}

/** Lowercased emails of every user who can sign in to the account. */
export async function listAccountMemberEmails(accountId: string): Promise<string[]> {
  const rows = await prisma.membership.findMany({
    where: { accountId },
    select: { user: { select: { email: true } } },
  });
  return rows.map((r) => r.user.email.trim().toLowerCase());
}

/**
 * Deletes an account and every user whose only membership was this account,
 * in one transaction. Account cascades remove memberships, forms, and their
 * fields, submissions, and notifications; user cascades remove reset tokens.
 * Users who also belong to another account keep their login.
 *
 * Throws AccountHasSiteError for an account that owns a site, which the
 * database also refuses (Site.accountId is onDelete: Restrict).
 */
export async function deleteAccountAndSoleMembers(accountId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    if (await tx.site.findUnique({ where: { accountId }, select: { id: true } })) {
      throw new AccountHasSiteError(accountId);
    }
    const members = await tx.membership.findMany({
      where: { accountId },
      select: { userId: true, user: { select: { _count: { select: { memberships: true } } } } },
    });
    const soleMemberIds = members
      .filter((m) => m.user._count.memberships === 1)
      .map((m) => m.userId);

    await tx.account.delete({ where: { id: accountId } });
    if (soleMemberIds.length > 0) {
      await tx.user.deleteMany({ where: { id: { in: soleMemberIds } } });
    }
  });
}

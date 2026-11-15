/**
 * Membership is how a user reaches an account. v1 gives every user exactly
 * one membership, as the account's OWNER or a MEMBER the operator added (PRD
 * D63); the many-membership path is the throw below, not a feature. Resolve
 * accounts for a user only through this module.
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

/**
 * Whether the site's welcome video (ROADMAP E39) has yet to open by itself
 * for the session's own user: they are one of the account's people and their
 * membership has no shown time. Never true for a Global Admin acting as the
 * account (PRD D49), who is not one of its people.
 */
export async function welcomeNotYetShown(session: SessionAccess, accountId: string): Promise<boolean> {
  if (session.actingAs) return false;
  const membership = await prisma.membership.findUnique({
    where: { userId_accountId: { userId: session.user.id, accountId } },
    select: { welcomeShownAt: true },
  });
  return membership !== null && membership.welcomeShownAt === null;
}

/** Records that the welcome video opened for the session's own user. The first time stays; acting records nothing. */
export async function markWelcomeShown(session: SessionAccess, accountId: string): Promise<void> {
  if (session.actingAs) return;
  await prisma.membership.updateMany({
    where: { userId: session.user.id, accountId, welcomeShownAt: null },
    data: { welcomeShownAt: new Date() },
  });
}

/**
 * How far the signed-in person has played their site's welcome video: the
 * furthest point of a video `length` seconds long. It only moves forward,
 * an account whose site has no video keeps no figure, and an operator
 * acting as the client records nothing: the figure is the person's.
 */
export async function recordWelcomeWatched(session: SessionAccess, accountId: string, seconds: number, length: number): Promise<void> {
  if (session.actingAs) return;
  await prisma.membership.updateMany({
    where: {
      userId: session.user.id,
      accountId,
      account: { site: { welcomeVideoKey: { not: null } } },
      OR: [{ welcomeWatchedSeconds: null }, { welcomeWatchedSeconds: { lt: seconds } }],
    },
    data: { welcomeWatchedSeconds: seconds, welcomeVideoSeconds: length },
  });
}

/**
 * For the transaction that changes or removes a site's welcome video: what
 * each person on the account watched was of the video it had, so that goes.
 * A removal also forgets that it was shown to them, so the next video opens
 * once for each of them, as a first one does; a replacement doesn't.
 */
export function forgetWelcomeVideo(accountId: string, removed: boolean) {
  return prisma.membership.updateMany({
    where: { accountId },
    data: { welcomeWatchedSeconds: null, welcomeVideoSeconds: null, ...(removed ? { welcomeShownAt: null } : {}) },
  });
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

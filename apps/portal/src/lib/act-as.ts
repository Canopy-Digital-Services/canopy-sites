/**
 * A Global Admin acting as a client (PRD D49): for acceptance, support, and
 * building a client a form, never with the client's password. Acting is a
 * state of the operator's own session (`Session.actAsId`), resolved on every
 * request in `validateSessionToken`; account lookups then answer with the
 * client's account (`soleMembership` in auth-utils, `sessionAccountId` and
 * `sessionCanUseAccount` in memberships.ts). The `ActAs` row records who was
 * in which account and when. Callers check `requireGlobalAdmin` first.
 */

import { prisma } from "@/lib/db";
import { endActAs, type SessionContext } from "@/lib/session";

/**
 * Whether this session is the operator acting as a client, not the owner.
 * Anything only the owner may do, or that must happen only for the owner
 * (a password, deleting the account, later the welcome video), checks it.
 */
export function isActing(session: Pick<SessionContext, "actingAs"> | null): boolean {
  return Boolean(session?.actingAs);
}

/** Points this session at the account, closing any earlier record this session had open. */
export async function startActAs(session: SessionContext, accountId: string): Promise<string> {
  const record = await prisma.$transaction(async (tx) => {
    if (session.actingAs) {
      await tx.actAs.updateMany({ where: { id: session.actingAs.id, endedAt: null }, data: { endedAt: new Date() } });
    }
    const created = await tx.actAs.create({ data: { operatorUserId: session.user.id, accountId }, select: { id: true } });
    await tx.session.update({ where: { id: session.id }, data: { actAsId: created.id } });
    return created;
  });
  return record.id;
}

/** Ends this session's acting and returns the account it was in, or null when it wasn't acting. */
export async function stopActAs(session: SessionContext): Promise<string | null> {
  if (!session.actingAs) return null;
  await prisma.session.update({ where: { id: session.id }, data: { actAsId: null } });
  await endActAs(session.actingAs.id);
  return session.actingAs.accountId;
}

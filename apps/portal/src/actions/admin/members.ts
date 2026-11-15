"use server";

/**
 * Global-Admin-gated: the people on an account (PRD D63). The operator adds
 * each person by name and email, renames them, and removes them; nobody on
 * the account does any of it, and nothing here sends an email.
 *
 * v1 gives each user exactly one membership (getCurrentAccountId asserts it),
 * so only a new email can be added. A new person starts with no password,
 * like a linked site's owner (PRD D49), and the operator gets a claim link to
 * pass on; Forgot password sends them one too.
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { createClaimLink } from "@/lib/claim";
import { parsePersonName } from "@/lib/person";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

function log(event: string, actorEmail: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({ event, actorEmail, ...details, at: new Date().toISOString() }));
}

/** The operator's pages that list an account's people. */
async function revalidatePeople(accountId: string) {
  revalidatePath("/operator/accounts");
  const site = await prisma.site.findUnique({ where: { accountId }, select: { id: true } });
  if (site) revalidatePath(`/operator/sites/${site.id}`);
}

export async function addAccountMember(
  accountId: string,
  email: string,
  name?: string
): Promise<{ success: true; email: string; claimUrl: string } | { error: string }> {
  const session = await requireGlobalAdmin();

  const normalized = normalizeEmail(String(email ?? ""));
  if (!isValidEmail(normalized)) return { error: "Enter a valid email address." };
  const parsedName = parsePersonName(name);
  if (!parsedName.ok) return { error: parsedName.error };

  const account = await prisma.account.findUnique({ where: { id: String(accountId) }, select: { id: true } });
  if (!account) return { error: "That account doesn't exist." };

  const existing = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true } });
  if (existing) return { error: "That email already has its own account. A person can belong to only one account for now." };

  const user = await prisma.user.create({
    data: {
      email: normalized,
      name: parsedName.name,
      password: null,
      memberships: { create: { accountId: account.id, role: "MEMBER" } },
    },
    select: { id: true },
  });

  log("addAccountMember", session.user.email ?? "unknown", { targetAccountId: account.id, userId: user.id });
  const { url } = await createClaimLink(user.id, { createdByUserId: session.user.id });
  await revalidatePeople(account.id);
  return { success: true, email: normalized, claimUrl: url };
}

/** The membership of a person on an account, by ids the client sent: null unless that person is on that account. */
async function memberOf(accountId: string, userId: string) {
  return prisma.membership.findUnique({
    where: { userId_accountId: { userId: String(userId), accountId: String(accountId) } },
    select: { id: true, role: true, accountId: true, user: { select: { id: true, email: true, roleCode: true } } },
  });
}

const NOT_ON_ACCOUNT = "That person isn't on this account.";

/** What the other people on the account see this person called. A blank name goes back to their email. */
export async function setPersonName(accountId: string, userId: string, name: string): Promise<{ success: true } | { error: string }> {
  const session = await requireGlobalAdmin();
  const parsed = parsePersonName(name);
  if (!parsed.ok) return { error: parsed.error };
  const membership = await memberOf(accountId, userId);
  if (!membership) return { error: NOT_ON_ACCOUNT };

  await prisma.user.update({ where: { id: membership.user.id }, data: { name: parsed.name } });
  log("setPersonName", session.user.email, { targetAccountId: membership.accountId, userId: membership.user.id });
  await revalidatePeople(membership.accountId);
  return { success: true };
}

/**
 * Takes a person off an account. Their membership goes, and their login with
 * it when this was their only account, which ends their sessions and frees
 * whatever they held. What they published and sent keeps its record, without
 * their name. Never the owner: an account without one can't be claimed or
 * closed.
 */
export async function removeAccountMember(accountId: string, userId: string): Promise<{ success: true } | { error: string }> {
  const session = await requireGlobalAdmin();
  const membership = await memberOf(accountId, userId);
  if (!membership) return { error: NOT_ON_ACCOUNT };
  if (membership.role === "OWNER") return { error: "The owner can't be removed." };
  if (membership.user.id === session.user.id) return { error: "You can't remove yourself." };
  // An operator's login is never deleted as a side effect of tidying a client's account.
  if (membership.user.roleCode === "GLOBAL_ADMIN") return { error: "That person is a Canopy operator. Change their role first." };

  await prisma.$transaction(async (tx) => {
    await tx.membership.delete({ where: { id: membership.id } });
    const left = await tx.membership.count({ where: { userId: membership.user.id } });
    if (left === 0) await tx.user.delete({ where: { id: membership.user.id } });
  });

  log("removeAccountMember", session.user.email, { targetAccountId: membership.accountId, userId: membership.user.id });
  await revalidatePeople(membership.accountId);
  return { success: true };
}

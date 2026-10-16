"use server";

/**
 * Global-Admin-gated: add a person to an existing account as a MEMBER, e.g. a
 * partner on the shared demo account (PRD D23). v1 gives each user exactly one
 * membership (getCurrentAccountId asserts it), so only a new email can be
 * added. The user is created with an unusable random password and sets their
 * own through "Forgot password" on the account's home host. Not an invite
 * flow: no email is sent from here.
 */

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { hashPassword } from "@/lib/password";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

export async function addAccountMember(
  accountId: string,
  email: string
): Promise<{ success: true; email: string } | { error: string }> {
  const session = await requireGlobalAdmin();

  const normalized = normalizeEmail(String(email ?? ""));
  if (!isValidEmail(normalized)) return { error: "Enter a valid email address." };

  const account = await prisma.account.findUnique({ where: { id: String(accountId) }, select: { id: true } });
  if (!account) return { error: "That account doesn't exist." };

  const existing = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true } });
  if (existing) return { error: "That email already has its own account. A person can belong to only one account for now." };

  const user = await prisma.user.create({
    data: {
      email: normalized,
      password: await hashPassword(randomBytes(32).toString("base64url")),
      memberships: { create: { accountId: account.id, role: "MEMBER" } },
    },
    select: { id: true },
  });

  console.log(
    JSON.stringify({
      event: "addAccountMember",
      actorEmail: session.user.email ?? "unknown",
      targetAccountId: account.id,
      userId: user.id,
      at: new Date().toISOString(),
    })
  );
  revalidatePath("/operator/accounts");
  return { success: true, email: normalized };
}

/**
 * Claiming an account the operator linked (PRD D49, Epic 38 section 4.4).
 * The owner has no password until they open a claim link and set one. A
 * claim link lasts a week and works once; issuing any new link (claim or
 * reset) retires the user's earlier unused ones, so only the newest works.
 *
 * A link is retired by moving its expiry to now, never by marking it used:
 * `usedAt` on a claim token means the owner claimed with it, which is what
 * the operator's page reads.
 */

import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth-utils";
import { hashPassword } from "@/lib/password";
import { sendEmail } from "@/lib/email";
import { getAccountEntitlements } from "@/lib/data-access/entitlements";
import { getSoleMembership } from "@/lib/data-access/memberships";
import { appUrlFor, productNameFor, senderFor } from "@/lib/product";
import type { PasswordTokenPurpose } from "@prisma/client";

const HOUR = 60 * 60 * 1000;
export const RESET_TTL_MS = HOUR;
export const CLAIM_TTL_MS = 7 * 24 * HOUR;

/** Refusals the operator or the claim page shows as they are. */
export class ClaimError extends Error {}

/**
 * Issues a password link for the user and retires their earlier unused ones.
 * Returns the token, which only the link carries; the database keeps its hash.
 */
export async function issuePasswordToken(
  userId: string,
  purpose: PasswordTokenPurpose,
  opts: { createdByUserId?: string | null; now?: Date } = {}
): Promise<{ id: string; token: string; expiresAt: Date }> {
  const now = opts.now ?? new Date();
  const token = generateToken(32);
  const expiresAt = new Date(now.getTime() + (purpose === "CLAIM" ? CLAIM_TTL_MS : RESET_TTL_MS));
  const [, row] = await prisma.$transaction([
    prisma.passwordToken.updateMany({
      where: { userId, usedAt: null, expiresAt: { gt: now } },
      data: { expiresAt: now },
    }),
    prisma.passwordToken.create({
      data: { userId, purpose, tokenHash: hashToken(token), expiresAt, createdByUserId: opts.createdByUserId ?? null },
      select: { id: true },
    }),
  ]);
  return { id: row.id, token, expiresAt };
}

/** Who a user is to the emails and pages a claim needs: their account's host, product, and site. */
async function accountOf(userId: string) {
  const membership = await getSoleMembership(userId);
  const entitlements = membership ? await getAccountEntitlements(membership.accountId) : { sitesEnabled: false };
  const site = membership
    ? await prisma.site.findUnique({
        where: { accountId: membership.accountId },
        select: { name: true, productionHostnames: true, timeZone: true },
      })
    : null;
  return { entitlements, site };
}

function claimEmail(args: { url: string; expiresAt: Date; site: { name: string; productionHostnames: string[]; timeZone: string } | null; productName: string }) {
  const { url, site, productName } = args;
  const what = site?.productionHostnames[0] ?? "your website";
  const expires = args.expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: site?.timeZone ?? "America/Los_Angeles",
  });
  const subject = site ? `Your website account for ${site.name}` : `Your ${productName} account`;
  const text = [
    `Michael at Canopy set up an account for you to update ${what}.`,
    "",
    `Set your password: ${url}`,
    "",
    `The link works once and expires on ${expires}.`,
    "",
    "---",
    productName,
  ].join("\n");
  const html = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <p>Michael at Canopy set up an account for you to update ${escapeHtml(what)}.</p>
  <p style="margin: 20px 0;">
    <a href="${url}" style="background: #005f6a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Set your password</a>
  </p>
  <p style="color: #666; font-size: 14px;">The link works once and expires on ${expires}.</p>
  <p style="color: #666; word-break: break-all; font-size: 12px;">${url}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">${productName}</p>
</body>
</html>`;
  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * A new claim link for an owner who hasn't claimed: the account's home host
 * (appUrlFor) plus /claim, never the request's host. Emails it when asked,
 * from the account's sender, and records when it went. Throws ClaimError for
 * an owner who has already set a password.
 */
export async function createClaimLink(
  userId: string,
  opts: { createdByUserId?: string | null; email?: boolean } = {}
): Promise<{ url: string; email: string; emailed: boolean; expiresAt: Date }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, password: true } });
  if (user.password !== null) throw new ClaimError(`${user.email} has already claimed the account.`);

  const { entitlements, site } = await accountOf(userId);
  const { id, token, expiresAt } = await issuePasswordToken(userId, "CLAIM", { createdByUserId: opts.createdByUserId });
  const url = `${appUrlFor(entitlements)}/claim?token=${token}`;

  let emailed = false;
  if (opts.email) {
    const { subject, text, html } = claimEmail({ url, expiresAt, site, productName: productNameFor(entitlements) });
    emailed = await sendEmail({ to: user.email, subject, text, html, from: senderFor(entitlements) });
    if (emailed) await prisma.passwordToken.update({ where: { id }, data: { emailedAt: new Date() } });
  }
  return { url, email: user.email, emailed, expiresAt };
}

export type ClaimView =
  | { state: "ready"; email: string; siteName: string | null }
  | { state: "claimed" | "expired" | "invalid" };

/**
 * What a claim link is, for the claim page. Reading consumes nothing, so a
 * messaging app's link preview can't use it up.
 */
export async function readClaim(token: string, now = new Date()): Promise<ClaimView> {
  if (!token) return { state: "invalid" };
  const row = await prisma.passwordToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { purpose: true, usedAt: true, expiresAt: true, userId: true, user: { select: { email: true, password: true } } },
  });
  if (!row || row.purpose !== "CLAIM") return { state: "invalid" };
  if (row.usedAt || row.user.password !== null) return { state: "claimed" };
  if (row.expiresAt <= now) return { state: "expired" };
  const { site } = await accountOf(row.userId);
  return { state: "ready", email: row.user.email, siteName: site?.name ?? null };
}

/**
 * The claim link's title and description, for the browser tab and a
 * messaging app's preview, and the name on the preview picture's tag. Never
 * the owner's email: a forwarded preview would show it to whoever receives it.
 */
export function claimPreview(claim: ClaimView, productName: string): { title: string; description: string; tag: string } {
  const siteName = claim.state === "ready" ? claim.siteName : null;
  return siteName
    ? { title: `Claim your ${siteName} website`, description: `Set your password to start updating your website with ${productName}.`, tag: siteName }
    : { title: `Claim your ${productName} account`, description: "Set your password to get started.", tag: productName };
}

/**
 * Sets the owner's first password from a claim link: one conditional update
 * consumes the link, so it works once even when submitted twice, and an
 * owner who already has a password is refused. Returns the user to sign in.
 */
export async function consumeClaim(token: string, password: string, now = new Date()): Promise<{ userId: string }> {
  const hashed = await hashPassword(password);
  const tokenHash = hashToken(token);
  return prisma.$transaction(async (tx) => {
    const row = await tx.passwordToken.findUnique({ where: { tokenHash }, select: { id: true, userId: true } });
    if (!row) throw new ClaimError("This link isn't valid.");
    const consumed = await tx.passwordToken.updateMany({
      where: { id: row.id, purpose: "CLAIM", usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) throw new ClaimError("This link has expired or has been used.");
    const set = await tx.user.updateMany({
      where: { id: row.userId, password: null },
      data: { password: hashed, passwordChangedAt: now, lastLoginAt: now, failedLoginCount: 0, lastFailedLoginAt: null },
    });
    if (set.count !== 1) throw new ClaimError("This account is already set up. Sign in instead.");
    await tx.passwordToken.updateMany({
      where: { userId: row.userId, usedAt: null, expiresAt: { gt: now } },
      data: { expiresAt: now },
    });
    return { userId: row.userId };
  });
}

export type OwnerAccess = {
  userId: string;
  email: string;
  claimed: boolean;
  /** When the owner claimed, from the claim link they used; null when they haven't, or got in before claims existed. */
  claimedAt: Date | null;
  /** The newest claim link: when it was made, whether the portal emailed it, and by whom. */
  link: { createdAt: Date; emailedAt: Date | null; by: string | null } | null;
  lastLoginAt: Date | null;
};

/** The account's owner and where they stand on claiming, for the operator's site page. */
export async function getOwnerAccess(accountId: string): Promise<OwnerAccess | null> {
  const owner = await prisma.membership.findFirst({
    where: { accountId, role: "OWNER" },
    orderBy: { createdAt: "asc" },
    select: { user: { select: { id: true, email: true, password: true, lastLoginAt: true } } },
  });
  if (!owner) return null;
  const { user } = owner;
  const [newest, used] = await Promise.all([
    prisma.passwordToken.findFirst({
      where: { userId: user.id, purpose: "CLAIM" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, emailedAt: true, createdBy: { select: { email: true } } },
    }),
    prisma.passwordToken.findFirst({
      where: { userId: user.id, purpose: "CLAIM", usedAt: { not: null } },
      orderBy: { usedAt: "desc" },
      select: { usedAt: true },
    }),
  ]);
  return {
    userId: user.id,
    email: user.email,
    claimed: user.password !== null,
    claimedAt: used?.usedAt ?? null,
    link: newest ? { createdAt: newest.createdAt, emailedAt: newest.emailedAt, by: newest.createdBy?.email ?? null } : null,
    lastLoginAt: user.lastLoginAt,
  };
}

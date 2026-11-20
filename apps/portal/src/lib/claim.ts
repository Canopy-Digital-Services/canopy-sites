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

import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth-utils";
import { hashPassword } from "@/lib/password";
import { sendEmail } from "@/lib/email";
import { claimImageJpeg } from "@/lib/claim-image";
import { getAccountEntitlements } from "@/lib/data-access/entitlements";
import { getAccountTimeZone } from "@/lib/data-access/accounts";
import { getSoleMembership } from "@/lib/data-access/memberships";
import { appUrlFor, productNameFor, senderFor } from "@/lib/product";
import { UNKNOWN_TIME_ZONE } from "@/lib/time-zone";
import type { MembershipRole, PasswordTokenPurpose } from "@prisma/client";

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

/** Who a user is to the emails and pages a claim needs: their account's host, product, time zone, and site, and whether they own it. */
async function accountOf(userId: string) {
  const membership = await getSoleMembership(userId);
  const entitlements = membership ? await getAccountEntitlements(membership.accountId) : { sitesEnabled: false };
  const timeZone = membership ? await getAccountTimeZone(membership.accountId) : UNKNOWN_TIME_ZONE;
  const site = membership
    ? await prisma.site.findUnique({
        where: { accountId: membership.accountId },
        select: { id: true, name: true, productionHostnames: true },
      })
    : null;
  return { entitlements, timeZone, site, owner: membership?.role === "OWNER" };
}

/** The claim email's picture, as the HTML names it. */
const CLAIM_PICTURE_CID = "claim-keys";

/**
 * The claim email. To the owner it is the handoff of the website Canopy built
 * them; to a person added to the account since (PRD D63) it says only that
 * they were added. With `picture`, the HTML opens with the link preview's
 * picture (Canopy Boy holding the keys, the site's name on the tag), which
 * the caller sends along as `CLAIM_PICTURE_CID`.
 */
export function claimEmail(args: {
  url: string;
  expiresAt: Date;
  timeZone: string;
  site: { name: string } | null;
  productName: string;
  owner: boolean;
  picture: boolean;
}) {
  const { url, site, productName } = args;
  const headline = args.owner ? "Your Canopy Site is ready!" : "You're in!";
  /** What the added person is told first; the owner's headline has said it all. */
  const added = args.owner ? null : `You've been added as a user ${site ? `on the ${site.name} website in` : "in"} ${productName}.`;
  const invitation = args.owner ? "Click the button below to log in and start managing it." : `${added} Click the button below to set your password and log in.`;
  const button = args.owner ? "Claim my site" : "Set my password";
  const expires = args.expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: args.timeZone,
  });
  const subject = args.owner ? "Your Canopy Site is ready" : `You've been added to ${site ? `the ${site.name} website` : productName}`;
  const text = [
    ...(added ? [headline, "", added] : [headline]),
    "",
    `${button}: ${url}`,
    "",
    `The link works once and expires on ${expires}.`,
    "",
    "---",
    productName,
  ].join("\n");
  // Tables and inline styles: what Outlook and Gmail both lay out. The picture is 1200 by 630, shown at the card's width.
  const picture = args.picture
    ? `
        <tr>
          <td style="font-size: 0; line-height: 0;">
            <a href="${url}"><img src="cid:${CLAIM_PICTURE_CID}" width="560" alt="${escapeHtml(`The keys to ${site?.name ?? `your ${productName} account`}`)}" style="display: block; width: 100%; max-width: 560px; height: auto; border: 0;"></a>
          </td>
        </tr>`
    : "";
  const html = `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background: #f2f5f4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f2f5f4;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 560px; background: #ffffff; border-radius: 12px; overflow: hidden; font-family: Arial, sans-serif; line-height: 1.6; color: #1d1d1f;">${picture}
        <tr>
          <td style="padding: 28px 32px 24px;">
            <h1 style="margin: 0 0 8px; font-size: 28px; line-height: 1.25; color: #005e69;">${headline}</h1>
            <p style="margin: 0; font-size: 16px;">${escapeHtml(invitation)}</p>
            <p style="margin: 24px 0;">
              <a href="${url}" style="background: #005e69; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: bold;">${button}</a>
            </p>
            <p style="margin: 0; color: #666; font-size: 14px;">The link works once and expires on ${expires}.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 32px; border-top: 1px solid #eee; color: #999; font-size: 12px;">${productName}</td>
        </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * A new claim link for a person who hasn't claimed, the owner or anyone added
 * to the account since (PRD D63): the account's home host (appUrlFor) plus
 * /claim, never the request's host. Emails it when asked, from the account's
 * sender, and records when it went. Throws ClaimError for a person who has
 * already set a password.
 */
export async function createClaimLink(
  userId: string,
  opts: { createdByUserId?: string | null; email?: boolean } = {}
): Promise<{ url: string; email: string; emailed: boolean; expiresAt: Date }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, password: true } });
  if (user.password !== null) throw new ClaimError(`${user.email} has already claimed the account.`);

  const { entitlements, timeZone, site, owner } = await accountOf(userId);
  const { id, token, expiresAt } = await issuePasswordToken(userId, "CLAIM", { createdByUserId: opts.createdByUserId });
  const url = `${appUrlFor(entitlements)}/claim?token=${token}`;

  let emailed = false;
  if (opts.email) {
    const productName = productNameFor(entitlements);
    // The email goes without its picture if drawing fails: the link is what the owner needs.
    const picture = await claimImageJpeg(site?.name ?? productName).catch((error) => {
      console.error("Could not draw the claim email's picture:", error);
      return null;
    });
    const { subject, text, html } = claimEmail({ url, expiresAt, timeZone, site, productName, owner, picture: picture !== null });
    const images = picture ? [{ cid: CLAIM_PICTURE_CID, filename: "keys.jpg", content: picture }] : undefined;
    emailed = await sendEmail({ to: user.email, subject, text, html, images, from: senderFor(entitlements) });
    if (emailed) await prisma.passwordToken.update({ where: { id }, data: { emailedAt: new Date() } });
  }
  return { url, email: user.email, emailed, expiresAt };
}

export type ClaimView =
  | { state: "ready"; email: string; siteId: string | null; siteName: string | null }
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
  return { state: "ready", email: row.user.email, siteId: site?.id ?? null, siteName: site?.name ?? null };
}

/**
 * The claim link's title and description, for the browser tab and a
 * messaging app's preview, and the preview picture's file under
 * /claim/image/. Never the owner's email: a forwarded preview would show it
 * to whoever receives it. The picture is named by the site and a hash of its
 * name, not the link's token, so Cloudflare can cache it and a rename gets a
 * new picture.
 */
export function claimPreview(claim: ClaimView, productName: string): { title: string; description: string; image: string } {
  const site = claim.state === "ready" && claim.siteId && claim.siteName ? { id: claim.siteId, name: claim.siteName } : null;
  return site
    ? {
        title: `Claim your ${site.name} website`,
        description: `Set your password to start updating your website with ${productName}.`,
        image: `${site.id}-${createHash("sha256").update(site.name).digest("hex").slice(0, 8)}.jpg`,
      }
    : {
        title: `Claim your ${productName} account`,
        description: "Set your password to get started.",
        image: `${productName.toLowerCase().replace(/\s+/g, "-")}.jpg`,
      };
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

export type PersonAccess = {
  userId: string;
  name: string | null;
  email: string;
  role: MembershipRole;
  claimed: boolean;
  /** When they claimed, from the claim link they used; null when they haven't, or got in before claims existed. */
  claimedAt: Date | null;
  /** The newest claim link: when it was made, whether the portal emailed it, and by whom. */
  link: { createdAt: Date; emailedAt: Date | null; by: string | null } | null;
  lastLoginAt: Date | null;
  /** How far they have played each of the site's welcome videos (ROADMAP E39), in seconds of its length; a tab's is listed once they play it. */
  watched: { tab: string; seconds: number; of: number }[];
};

/**
 * Everyone on the account and where each stands on claiming, for the
 * operator's site page (PRD D63): the owner first, then in the order they
 * were added.
 */
export async function listPeopleAccess(accountId: string): Promise<PersonAccess[]> {
  const memberships = await prisma.membership.findMany({
    where: { accountId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      welcomeViews: { select: { watchedSeconds: true, videoSeconds: true, video: { select: { tab: true } } } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          lastLoginAt: true,
          passwordTokens: {
            where: { purpose: "CLAIM" },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true, emailedAt: true, usedAt: true, createdBy: { select: { email: true } } },
          },
        },
      },
    },
  });
  const people = memberships.map(({ role, user, welcomeViews }): PersonAccess => {
    const newest = user.passwordTokens[0];
    const used = user.passwordTokens
      .map((t) => t.usedAt)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role,
      claimed: user.password !== null,
      claimedAt: used ?? null,
      link: newest ? { createdAt: newest.createdAt, emailedAt: newest.emailedAt, by: newest.createdBy?.email ?? null } : null,
      lastLoginAt: user.lastLoginAt,
      watched: welcomeViews.flatMap(({ watchedSeconds, videoSeconds, video }) =>
        watchedSeconds !== null && videoSeconds !== null ? [{ tab: video.tab, seconds: watchedSeconds, of: videoSeconds }] : [],
      ),
    };
  });
  return [...people.filter((p) => p.role === "OWNER"), ...people.filter((p) => p.role !== "OWNER")];
}

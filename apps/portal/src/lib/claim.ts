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
import { emailCardHtml, emailCardText } from "@/lib/email-card";
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
 * Returns the token, which only the link carries (the database keeps its
 * hash), and how many links that still worked it retired.
 */
export async function issuePasswordToken(
  userId: string,
  purpose: PasswordTokenPurpose,
  opts: { createdByUserId?: string | null; now?: Date } = {}
): Promise<{ id: string; token: string; expiresAt: Date; retired: number }> {
  const now = opts.now ?? new Date();
  const token = generateToken(32);
  const expiresAt = new Date(now.getTime() + (purpose === "CLAIM" ? CLAIM_TTL_MS : RESET_TTL_MS));
  const [retired, row] = await prisma.$transaction([
    prisma.passwordToken.updateMany({
      where: { userId, usedAt: null, expiresAt: { gt: now } },
      data: { expiresAt: now },
    }),
    prisma.passwordToken.create({
      data: { userId, purpose, tokenHash: hashToken(token), expiresAt, createdByUserId: opts.createdByUserId ?? null },
      select: { id: true },
    }),
  ]);
  return { id: row.id, token, expiresAt, retired: retired.count };
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
 * What a claim says, wherever it says it: the email, the link's preview in a
 * messaging app, and the claim page. To the owner it is the handoff of the
 * website Canopy built them; to a person added to the account since (PRD
 * D63) it says that they were added.
 */
export function claimWords(args: { owner: boolean; siteName: string | null; productName: string }): {
  headline: string;
  /** What an added person is told first; null for the owner, whose headline has said it. */
  added: string | null;
  button: string;
  /** What the picture is, where it can't be seen. */
  pictureAlt: string;
} {
  const { owner, siteName, productName } = args;
  return {
    headline: owner ? "Your Canopy Site is ready!" : "You're in!",
    added: owner ? null : `You've been added as a user ${siteName ? `on the ${siteName} website in` : "in"} ${productName}.`,
    button: owner ? "Claim my site" : "Set my password",
    pictureAlt: `The keys to ${siteName ?? `your ${productName} account`}`,
  };
}

/**
 * The claim email, in the card every email to a person uses. With `picture`,
 * it opens with the link preview's picture (Canopy Boy holding the keys, the
 * site's name on the tag), which the caller sends along as `CLAIM_PICTURE_CID`.
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
  const words = claimWords({ owner: args.owner, siteName: site?.name ?? null, productName });
  const expires = args.expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: args.timeZone,
  });
  const card = {
    picture: args.picture ? { src: `cid:${CLAIM_PICTURE_CID}`, alt: words.pictureAlt } : undefined,
    heading: words.headline,
    body: words.added ? `${words.added} Click the button below to set your password and log in.` : "Click the button below to log in and start managing it.",
    button: { label: words.button, url },
    note: `The link works once and expires on ${expires}.`,
    footer: productName,
  };
  return {
    subject: args.owner ? "Your Canopy Site is ready" : `You've been added to ${site ? `the ${site.name} website` : productName}`,
    text: emailCardText({ ...card, lead: words.added }),
    html: emailCardHtml(card),
  };
}

/**
 * Emails a claim link from the account's sender and records when it went.
 * The email goes without its picture if drawing fails: the link is what the
 * person needs.
 */
async function emailClaim(args: { tokenId: string; url: string; expiresAt: Date; to: string; account: Awaited<ReturnType<typeof accountOf>> }): Promise<boolean> {
  const { entitlements, timeZone, site, owner } = args.account;
  const productName = productNameFor(entitlements);
  const picture = await claimImageJpeg(site?.name ?? productName).catch((error) => {
    console.error("Could not draw the claim email's picture:", error);
    return null;
  });
  const { subject, text, html } = claimEmail({ url: args.url, expiresAt: args.expiresAt, timeZone, site, productName, owner, picture: picture !== null });
  const images = picture ? [{ cid: CLAIM_PICTURE_CID, filename: "keys.jpg", content: picture }] : undefined;
  const emailed = await sendEmail({ to: args.to, subject, text, html, images, from: senderFor(entitlements) });
  if (emailed) await prisma.passwordToken.update({ where: { id: args.tokenId }, data: { emailedAt: new Date() } });
  return emailed;
}

/**
 * A new claim link for a person who hasn't claimed, the owner or anyone added
 * to the account since (PRD D63): the account's home host (appUrlFor) plus
 * /claim, never the request's host. Emails it when asked. `retired` says the
 * person had a link that still worked, which this one replaced. Throws
 * ClaimError for a person who has already set a password.
 */
export async function createClaimLink(
  userId: string,
  opts: { createdByUserId?: string | null; email?: boolean } = {}
): Promise<{ url: string; email: string; emailed: boolean; expiresAt: Date; retired: boolean }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, password: true } });
  if (user.password !== null) throw new ClaimError(`${user.email} has already claimed the account.`);

  const account = await accountOf(userId);
  const { id, token, expiresAt, retired } = await issuePasswordToken(userId, "CLAIM", { createdByUserId: opts.createdByUserId });
  const url = `${appUrlFor(account.entitlements)}/claim?token=${token}`;
  const emailed = opts.email ? await emailClaim({ tokenId: id, url, expiresAt, to: user.email, account }) : false;
  return { url, email: user.email, emailed, expiresAt, retired: retired > 0 };
}

/**
 * Emails a claim link the operator already has in hand, so the one they
 * copied and the one in the person's inbox are the same link. Throws
 * ClaimError once the link has been used, replaced, or has expired.
 */
export async function emailClaimLink(token: string, now = new Date()): Promise<{ email: string; emailed: boolean; siteId: string | null }> {
  const row = token
    ? await prisma.passwordToken.findUnique({
        where: { tokenHash: hashToken(token) },
        select: { id: true, purpose: true, usedAt: true, expiresAt: true, userId: true, user: { select: { email: true, password: true } } },
      })
    : null;
  if (!row || row.purpose !== "CLAIM" || row.usedAt || row.user.password !== null || row.expiresAt <= now) {
    throw new ClaimError("That link no longer works. Make a new one.");
  }
  const account = await accountOf(row.userId);
  const url = `${appUrlFor(account.entitlements)}/claim?token=${token}`;
  const emailed = await emailClaim({ tokenId: row.id, url, expiresAt: row.expiresAt, to: row.user.email, account });
  return { email: row.user.email, emailed, siteId: account.site?.id ?? null };
}

export type ClaimView =
  | { state: "ready"; email: string; siteId: string | null; siteName: string | null; owner: boolean }
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
  const { site, owner } = await accountOf(row.userId);
  return { state: "ready", email: row.user.email, siteId: site?.id ?? null, siteName: site?.name ?? null, owner };
}

/**
 * The claim link's title and description, for the browser tab and a
 * messaging app's preview, and the preview picture's file under
 * /claim/image/. A link that's ready says what its email says (`claimWords`).
 * Never the person's email: a forwarded preview would show it to whoever
 * receives it. The picture is named by the site and a hash of its name, not
 * the link's token, so Cloudflare can cache it and a rename gets a new
 * picture.
 */
export function claimPreview(claim: ClaimView, productName: string): { title: string; description: string; image: string } {
  const productImage = `${productName.toLowerCase().replace(/\s+/g, "-")}.jpg`;
  if (claim.state !== "ready") return { title: `Claim your ${productName} account`, description: "Set your password to get started.", image: productImage };

  const { headline, added } = claimWords({ owner: claim.owner, siteName: claim.siteName, productName });
  return {
    title: headline,
    description: added ?? `Set your password and start managing ${claim.siteName ?? "it"}.`,
    image: claim.siteId && claim.siteName ? `${claim.siteId}-${createHash("sha256").update(claim.siteName).digest("hex").slice(0, 8)}.jpg` : productImage,
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
  /** How far they have played each of the site's welcome videos, in seconds of its length; a tab's is listed once they play it. */
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

"use server";

/**
 * The operator's claim links (PRD D49, D63; Epic 38 section 4.4): a new link
 * for anyone on a site's account who hasn't claimed, copied to text or
 * emailed by the portal. Each retires the last, so a lost link is replaced,
 * never recovered.
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { ClaimError, createClaimLink } from "@/lib/claim";

type Result =
  | { success: true; url: string; expires: string }
  | { success: true; message: string }
  | { error: string };

export async function sendClaimLink(siteId: string, userId: string, how: "copy" | "email"): Promise<Result> {
  const session = await requireGlobalAdmin();
  const site = await prisma.site.findUnique({
    where: { id: String(siteId) },
    select: { id: true, accountId: true, account: { select: { timeZone: true } } },
  });
  if (!site) return { error: "That site doesn't exist." };
  // The person is whoever the client sent: only someone on this site's account gets a link.
  const person = await prisma.membership.findUnique({
    where: { userId_accountId: { userId: String(userId), accountId: site.accountId } },
    select: { userId: true },
  });
  if (!person) return { error: "That person isn't on this site's account." };

  let link;
  try {
    link = await createClaimLink(person.userId, { createdByUserId: session.user.id, email: how === "email" });
  } catch (err) {
    if (err instanceof ClaimError) return { error: err.message };
    throw err;
  }
  console.log(
    JSON.stringify({ event: "sendClaimLink", actorEmail: session.user.email, siteId: site.id, userId: person.userId, how, emailed: link.emailed, at: new Date().toISOString() })
  );
  revalidatePath(`/operator/sites/${site.id}`);

  if (how === "email") {
    return link.emailed
      ? { success: true, message: `Sent to ${link.email}.` }
      : { error: "The email didn't go out. Copy the link instead." };
  }
  const expires = link.expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: site.account.timeZone });
  return { success: true, url: link.url, expires };
}

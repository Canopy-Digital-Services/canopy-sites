"use server";

/**
 * The operator's claim links (PRD D49, Epic 38 section 4.4): a new link for a
 * site's owner who hasn't claimed, copied to text or emailed by the portal.
 * Each retires the last, so a lost link is replaced, never recovered.
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { ClaimError, createClaimLink } from "@/lib/claim";

type Result =
  | { success: true; url: string; expires: string }
  | { success: true; message: string }
  | { error: string };

export async function sendClaimLink(siteId: string, how: "copy" | "email"): Promise<Result> {
  const session = await requireGlobalAdmin();
  const site = await prisma.site.findUnique({
    where: { id: String(siteId) },
    select: { id: true, accountId: true, timeZone: true },
  });
  if (!site) return { error: "That site doesn't exist." };
  const owner = await prisma.membership.findFirst({
    where: { accountId: site.accountId, role: "OWNER" },
    orderBy: { createdAt: "asc" },
    select: { userId: true },
  });
  if (!owner) return { error: "This site's account has no owner." };

  let link;
  try {
    link = await createClaimLink(owner.userId, { createdByUserId: session.user.id, email: how === "email" });
  } catch (err) {
    if (err instanceof ClaimError) return { error: err.message };
    throw err;
  }
  console.log(
    JSON.stringify({ event: "sendClaimLink", actorEmail: session.user.email, siteId: site.id, how, emailed: link.emailed, at: new Date().toISOString() })
  );
  revalidatePath(`/operator/sites/${site.id}`);

  if (how === "email") {
    return link.emailed
      ? { success: true, message: `Sent to ${link.email}.` }
      : { error: "The email didn't go out. Copy the link instead." };
  }
  const expires = link.expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: site.timeZone });
  return { success: true, url: link.url, expires };
}

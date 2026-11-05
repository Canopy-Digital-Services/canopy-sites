"use server";

/**
 * Acting as a client (PRD D49, Epic 38 section 4.5): Global Admin only, on an
 * account with a site (a Sites account, so the session stays on its host).
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, requireGlobalAdmin } from "@/lib/auth-utils";
import { startActAs, stopActAs } from "@/lib/act-as";

function log(event: string, actorEmail: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({ event, actorEmail, ...details, at: new Date().toISOString() }));
}

/** Opens the site's account in this browser as its client, and goes to its home. */
export async function actAsClient(siteId: string): Promise<void> {
  const session = await requireGlobalAdmin();
  const site = await prisma.site.findUnique({ where: { id: String(siteId) }, select: { id: true, accountId: true } });
  if (!site) redirect("/operator/sites");

  const actAsId = await startActAs(session, site.accountId);
  log("actAsClient", session.user.email, { actAsId, siteId: site.id, accountId: site.accountId });
  redirect("/");
}

/** Back to the operator's own account, on the site's operator page. */
export async function stopActing(): Promise<void> {
  const session = await requireAuth();
  const accountId = await stopActAs(session);
  if (!accountId) redirect("/");

  log("stopActing", session.user.email, { accountId });
  const site = await prisma.site.findUnique({ where: { accountId }, select: { id: true } });
  redirect(site ? `/operator/sites/${site.id}` : "/operator/sites");
}

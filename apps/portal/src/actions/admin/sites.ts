"use server";

/**
 * Global-Admin-gated site management. A site arrives by linking a live one
 * (PRD D49, `createLinkedSite`); the repo, DNS, and Umami website are made
 * outside the portal. Refusals come back as `{ error }` rather than a throw,
 * so the operator sees the reason in production builds too.
 *
 * Guards: an account holds at most one site (PRD D19, also a unique
 * constraint), only on a plan with sitesEnabled; no hostname belongs to two
 * sites; the slug is fixed at creation.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { requireId } from "@/lib/ids";
import { parseSiteSettings, type FieldErrors, type LinkSiteInput, type SiteSettingsInput } from "@/lib/sites";
import { createLinkedSite, type LinkSiteResult } from "@/lib/site-link";
import { revalidatePath } from "next/cache";

export type SiteActionResult<I> =
  | { success: true; siteId: string }
  | { error: string; fieldErrors?: FieldErrors<I> };

const INVALID = "Fix the highlighted fields.";

/** Why the account cannot take a site, or null when it can. */
async function accountRefusal(accountId: string): Promise<string | null> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { plan: { select: { sitesEnabled: true, displayName: true } }, site: { select: { id: true } } },
  });
  if (!account) return "Account not found.";
  if (!account.plan.sitesEnabled) {
    return `The ${account.plan.displayName} plan does not include Sites. Move the account to the Sites plan first.`;
  }
  if (account.site) return "That account already has a site.";
  return null;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function log(event: string, actorEmail: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({ event, actorEmail, ...details, at: new Date().toISOString() }));
}

/**
 * Links a live site: the client's account, its unclaimed owner, and the Site
 * row (PRD D49). The first build is the caller's next step
 * (`publishSiteFromRepo`). `attach` links to the email's existing Sites
 * account when it has no site, after the form has asked.
 */
export async function linkSite(input: LinkSiteInput, opts: { attach?: boolean } = {}): Promise<LinkSiteResult> {
  const session = await requireGlobalAdmin();
  const result = await createLinkedSite(input, session.user.email, { attach: opts.attach === true });
  if ("success" in result) revalidatePath("/operator/sites");
  return result;
}

export async function updateSite(
  siteId: string,
  input: SiteSettingsInput
): Promise<SiteActionResult<SiteSettingsInput>> {
  requireId(siteId, "site id");
  const session = await requireGlobalAdmin();

  const parsed = parseSiteSettings(input);
  if (!parsed.ok) return { error: INVALID, fieldErrors: parsed.errors };
  const settings = parsed.value;

  if (!(await prisma.site.findUnique({ where: { id: siteId }, select: { id: true } }))) {
    return { error: "Site not found." };
  }

  // Caddy will route each hostname to one site's build; a second claim would
  // serve one client's domain from another client's site.
  if (settings.productionHostnames.length > 0) {
    const other = await prisma.site.findFirst({
      where: { id: { not: siteId }, productionHostnames: { hasSome: settings.productionHostnames } },
      select: { name: true, productionHostnames: true },
    });
    if (other) {
      const taken = settings.productionHostnames.find((h) => other.productionHostnames.includes(h));
      return { error: INVALID, fieldErrors: { productionHostnames: `${taken} belongs to ${other.name}` } };
    }
  }

  await prisma.site.update({ where: { id: siteId }, data: settings });

  log("updateSite", session.user.email, { siteId, fields: Object.keys(settings) });
  revalidatePath("/operator/sites");
  revalidatePath(`/operator/sites/${siteId}`);
  return { success: true, siteId };
}

/** Move a site to another account, which must have Sites and no site of its own. */
export async function assignSite(siteId: string, accountId: string): Promise<SiteActionResult<never>> {
  requireId(siteId, "site id");
  requireId(accountId, "account id");
  const session = await requireGlobalAdmin();

  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { accountId: true } });
  if (!site) return { error: "Site not found." };
  if (site.accountId === accountId) return { success: true, siteId };

  const refusal = await accountRefusal(accountId);
  if (refusal) return { error: refusal };

  try {
    await prisma.site.update({ where: { id: siteId }, data: { accountId } });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "That account already has a site." };
    throw error;
  }

  log("assignSite", session.user.email, { siteId, fromAccountId: site.accountId, toAccountId: accountId });
  revalidatePath("/operator/sites");
  revalidatePath(`/operator/sites/${siteId}`);
  return { success: true, siteId };
}

"use server";

/**
 * Global-Admin-gated site management. Creating a site records it; the repo,
 * DNS, and Umami website are made by hand (v1). Refusals come back as
 * `{ error }` rather than a throw, so the operator sees the reason in
 * production builds too.
 *
 * Guards: an account holds at most one site (PRD D19, also a unique
 * constraint), only on a plan with sitesEnabled; no hostname belongs to two
 * sites; the slug is fixed at creation.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import {
  DEFAULT_LOCKED_FIELDS,
  parseNewSite,
  parseSiteSettings,
  type FieldErrors,
  type NewSiteInput,
  type SiteSettingsInput,
} from "@/lib/sites";
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

export async function createSite(
  accountId: string,
  input: NewSiteInput
): Promise<SiteActionResult<NewSiteInput>> {
  const session = await requireGlobalAdmin();

  const parsed = parseNewSite(input);
  if (!parsed.ok) return { error: INVALID, fieldErrors: parsed.errors };
  const { name, slug } = parsed.value;

  const refusal = await accountRefusal(accountId);
  if (refusal) return { error: refusal };
  if (await prisma.site.findUnique({ where: { slug }, select: { id: true } })) {
    return { error: INVALID, fieldErrors: { slug: "Another site uses this slug" } };
  }

  let siteId: string;
  try {
    ({ id: siteId } = await prisma.site.create({
      data: { accountId, name, slug, lockedFields: DEFAULT_LOCKED_FIELDS },
      select: { id: true },
    }));
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Another site took that slug or account just now. Try again." };
    throw error;
  }

  log("createSite", session.user.email, { siteId, accountId, slug });
  revalidatePath("/operator/sites");
  return { success: true, siteId };
}

export async function updateSite(
  siteId: string,
  input: SiteSettingsInput
): Promise<SiteActionResult<SiteSettingsInput>> {
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

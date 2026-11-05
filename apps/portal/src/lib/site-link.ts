/**
 * Linking a live site (PRD D49): the client's account on the Sites plan, its
 * owner, who hasn't claimed it (no password), and the Site row, in one
 * transaction. The first build is the caller's next step (`buildAndPublish`),
 * outside it, so a failed build never takes the account with it.
 *
 * No session of its own: the server action checks `requireGlobalAdmin` and
 * passes the operator's email, and so will the command-line link (Epic 38,
 * section 4.9). Refusals come back as `{ error }`, with field errors where a
 * field is at fault.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSoleMembership, MultipleMembershipsError } from "@/lib/data-access/memberships";
import { DEFAULT_LOCKED_FIELDS, normalizeGitHubRepo, parseLinkSite, type FieldErrors, type LinkSiteInput } from "@/lib/sites";

export type LinkSiteResult =
  | { success: true; siteId: string; accountId: string; attached: boolean }
  | {
      error: string;
      fieldErrors?: FieldErrors<LinkSiteInput>;
      /** The email's account is on the Sites plan with no site: linking to it needs `attach`. */
      attachable?: true;
    };

const INVALID = "Fix the highlighted fields.";

/** Why the email can't become a new owner, or the account it can be linked to. */
async function existingAccount(email: string): Promise<
  { none: true } | { attachTo: string } | { refusal: string }
> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return { none: true };
  let membership;
  try {
    membership = await getSoleMembership(user.id);
  } catch (err) {
    if (err instanceof MultipleMembershipsError) return { refusal: "That email belongs to more than one account." };
    throw err;
  }
  if (!membership) return { refusal: "That email has a login but no account." };
  const account = await prisma.account.findUniqueOrThrow({
    where: { id: membership.accountId },
    select: { id: true, plan: { select: { sitesEnabled: true, displayName: true } }, site: { select: { name: true } } },
  });
  if (account.site) return { refusal: `That email's account already has a site, ${account.site.name}.` };
  if (!account.plan.sitesEnabled) return { refusal: `That email already has an account on the ${account.plan.displayName} plan.` };
  return { attachTo: account.id };
}

/** A field another site already holds, or null. */
async function conflicts(slug: string, repoUrl: string, hostnames: string[]): Promise<FieldErrors<LinkSiteInput> | null> {
  if (await prisma.site.findUnique({ where: { slug }, select: { id: true } })) {
    return { slug: "Another site uses this slug" };
  }
  // A hostname routes to one site's build (Caddy, E36); a second claim would
  // serve one client's domain from another client's site.
  const holder = await prisma.site.findFirst({
    where: { productionHostnames: { hasSome: hostnames } },
    select: { name: true, productionHostnames: true },
  });
  if (holder) {
    const taken = hostnames.find((h) => holder.productionHostnames.includes(h));
    return { productionHostnames: `${taken} belongs to ${holder.name}` };
  }
  // Linking is how a new client arrives: a repo another site builds from is
  // almost certainly the wrong one. (Two sites may still share a repo through
  // the site settings, PRD D24.)
  const others = await prisma.site.findMany({ where: { repoUrl: { not: null } }, select: { name: true, repoUrl: true } });
  const same = others.find((o) => normalizeGitHubRepo(o.repoUrl ?? "")?.toLowerCase() === repoUrl.toLowerCase());
  if (same) return { repoUrl: `${same.name} is linked to this repository` };
  return null;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createLinkedSite(
  input: LinkSiteInput,
  actorEmail: string,
  opts: { attach?: boolean } = {}
): Promise<LinkSiteResult> {
  const parsed = parseLinkSite(input);
  if (!parsed.ok) return { error: INVALID, fieldErrors: parsed.errors };
  const site = parsed.value;

  const clash = await conflicts(site.slug, site.repoUrl, site.productionHostnames);
  if (clash) return { error: INVALID, fieldErrors: clash };

  const existing = await existingAccount(site.email);
  if ("refusal" in existing) return { error: existing.refusal, fieldErrors: { email: existing.refusal } };
  if ("attachTo" in existing && !opts.attach) {
    return { error: "That email has a Sites account with no site.", attachable: true };
  }

  const siteData = {
    name: site.name,
    slug: site.slug,
    repoUrl: site.repoUrl,
    productionHostnames: site.productionHostnames,
    umamiWebsiteId: site.umamiWebsiteId,
    lockedFields: DEFAULT_LOCKED_FIELDS,
  };

  let accountId: string;
  let siteId: string;
  try {
    ({ accountId, siteId } = await prisma.$transaction(async (tx) => {
      let accountId: string;
      if ("attachTo" in existing) {
        accountId = existing.attachTo;
      } else {
        // The owner has no password until they claim the account (PRD D49).
        const user = await tx.user.create({
          data: {
            email: site.email,
            password: null,
            memberships: { create: { role: "OWNER", account: { create: { planCode: "SITES" } } } },
          },
          select: { memberships: { select: { accountId: true } } },
        });
        accountId = user.memberships[0].accountId;
      }
      const created = await tx.site.create({ data: { ...siteData, accountId }, select: { id: true } });
      return { accountId, siteId: created.id };
    }));
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Another site or account took one of these just now. Try again." };
    throw error;
  }

  console.log(
    JSON.stringify({
      event: "linkSite",
      actorEmail,
      siteId,
      accountId,
      slug: site.slug,
      attached: "attachTo" in existing,
      at: new Date().toISOString(),
    })
  );
  return { success: true, siteId, accountId, attached: "attachTo" in existing };
}

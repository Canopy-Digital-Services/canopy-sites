"use server";

/**
 * Global-Admin-gated site operations that aren't a client's edit: publish
 * what the repo holds (a site's first build, or after a push made outside the
 * portal), reset the demo to its baseline between calls, and mark a site as
 * the demo (PRD D23). Client edits go through the site tool layer instead.
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { BuilderError, requestReset } from "@/lib/builder-client";
import { buildAndPublish, operatorSite } from "@/lib/repo-publish";

type Result = { success: true; message: string } | { error: string };

function failure(err: unknown): { error: string } {
  if (err instanceof BuilderError) return { error: err.message };
  console.error(JSON.stringify({ event: "site_build_error", message: (err as Error).message }));
  return { error: "Something went wrong talking to the builder." };
}

export async function publishSiteFromRepo(siteId: string): Promise<Result> {
  const session = await requireGlobalAdmin();
  try {
    const commit = await buildAndPublish(siteId, session.user.email);
    console.log(JSON.stringify({ event: "publishSiteFromRepo", actorEmail: session.user.email, siteId, commit, at: new Date().toISOString() }));
    revalidatePath(`/operator/sites/${siteId}`);
    return { success: true, message: `Published ${commit.slice(0, 7)}.` };
  } catch (err) {
    return failure(err);
  }
}

export async function resetDemoSite(siteId: string): Promise<Result> {
  const session = await requireGlobalAdmin();
  try {
    const { site, ref } = await operatorSite(siteId);
    if (!site.isDemo) return { error: "Only a demo site can be reset." };
    await requestReset(ref, "demo-baseline");
    // A reset starts the demo over: the changes and conversations it removes
    // would otherwise still be listed in the Editor.
    await prisma.$transaction([
      prisma.changeSet.deleteMany({ where: { siteId: site.id } }),
      prisma.conversation.deleteMany({ where: { siteId: site.id } }),
    ]);
    const commit = await buildAndPublish(site.id, session.user.email);
    console.log(JSON.stringify({ event: "resetDemoSite", actorEmail: session.user.email, siteId, commit, at: new Date().toISOString() }));
    revalidatePath(`/operator/sites/${siteId}`);
    return { success: true, message: "The demo is back at its baseline and published." };
  } catch (err) {
    return failure(err);
  }
}

export async function setSiteDemo(siteId: string, isDemo: boolean): Promise<Result> {
  const session = await requireGlobalAdmin();
  const site = await prisma.site.findUnique({ where: { id: String(siteId) }, select: { id: true } });
  if (!site) return { error: "That site doesn't exist." };
  await prisma.site.update({ where: { id: site.id }, data: { isDemo: Boolean(isDemo) } });
  console.log(JSON.stringify({ event: "setSiteDemo", actorEmail: session.user.email, siteId, isDemo: Boolean(isDemo), at: new Date().toISOString() }));
  revalidatePath(`/operator/sites/${siteId}`);
  return { success: true, message: isDemo ? "Marked as the demo site." : "No longer a demo site." };
}

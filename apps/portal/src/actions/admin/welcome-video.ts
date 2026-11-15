"use server";

/**
 * Global-Admin-gated: taking a site's welcome video for a tab away (ROADMAP
 * E39). Its upload is a route handler beside the site's page, since it
 * streams a file.
 */

import { revalidatePath } from "next/cache";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { isSitesTab, sitesTabLabel, type SitesTabId } from "@/lib/sites-tabs";
import { removeWelcomeVideo } from "@/lib/welcome-video";

export async function removeSiteWelcomeVideo(siteId: string, tab: SitesTabId): Promise<{ success: true; message: string } | { error: string }> {
  const session = await requireGlobalAdmin();
  if (!isSitesTab(tab)) return { error: "That tab doesn't exist." };
  if (!(await removeWelcomeVideo(siteId, tab))) return { error: "That site doesn't exist." };
  console.log(JSON.stringify({ event: "removeSiteWelcomeVideo", actorEmail: session.user.email, siteId, tab, at: new Date().toISOString() }));
  revalidatePath(`/operator/sites/${siteId}`);
  return { success: true, message: `${sitesTabLabel(tab)} video removed.` };
}

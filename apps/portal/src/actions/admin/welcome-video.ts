"use server";

/**
 * Global-Admin-gated: taking a site's welcome video away (ROADMAP E39). Its
 * upload is a route handler beside the site's page, since it streams a file.
 */

import { revalidatePath } from "next/cache";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { removeWelcomeVideo } from "@/lib/welcome-video";

export async function removeSiteWelcomeVideo(siteId: string): Promise<{ success: true; message: string } | { error: string }> {
  const session = await requireGlobalAdmin();
  if (!(await removeWelcomeVideo(siteId))) return { error: "That site doesn't exist." };
  console.log(JSON.stringify({ event: "removeSiteWelcomeVideo", actorEmail: session.user.email, siteId, at: new Date().toISOString() }));
  revalidatePath(`/operator/sites/${siteId}`);
  return { success: true, message: "Welcome video removed." };
}

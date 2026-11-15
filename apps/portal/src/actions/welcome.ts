"use server";

/** The welcome video (ROADMAP E39): what the signed-in person's own viewing records. */

import { getCurrentAccountId, requireAuth } from "@/lib/auth-utils";
import { markWelcomeShown } from "@/lib/data-access/memberships";

/** The dialog opened by itself for this person, so it won't again. An operator acting as them records nothing. */
export async function welcomeVideoShown(): Promise<void> {
  const session = await requireAuth();
  await markWelcomeShown(session, await getCurrentAccountId());
}

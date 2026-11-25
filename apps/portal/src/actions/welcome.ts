"use server";

/** The welcome videos: what the signed-in person's own viewing records. */

import { getCurrentAccountId, requireAuth } from "@/lib/auth-utils";
import { isSitesTab, type SitesTabId } from "@/lib/sites-tabs";
import { markWelcomeShown, recordWelcomeWatched } from "@/lib/welcome-video";

/** The tab's video opened by itself for this person, so it won't again. An operator acting as them records nothing. */
export async function welcomeVideoShown(tab: SitesTabId): Promise<void> {
  const session = await requireAuth();
  if (!isSitesTab(tab)) return;
  await markWelcomeShown(session, await getCurrentAccountId(), tab);
}

/** No welcome video runs a day; a longer length is not a player's report. */
const LONGEST_SECONDS = 24 * 60 * 60;

/**
 * The player's report of how far this person has got in a tab's video:
 * `seconds` into a video `length` seconds long. Kept in whole seconds, and
 * only as their furthest point. A report that isn't a tab and two sensible
 * numbers is dropped.
 */
export async function welcomeVideoWatched(tab: SitesTabId, seconds: number, length: number): Promise<void> {
  const session = await requireAuth();
  const of = Math.floor(Number(length));
  const watched = Math.min(Math.floor(Number(seconds)), of);
  if (!isSitesTab(tab) || !Number.isFinite(watched) || !Number.isFinite(of) || watched < 1 || of > LONGEST_SECONDS) return;
  await recordWelcomeWatched(session, await getCurrentAccountId(), tab, watched, of);
}

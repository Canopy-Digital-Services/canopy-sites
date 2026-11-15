"use server";

/** The welcome video (ROADMAP E39): what the signed-in person's own viewing records. */

import { getCurrentAccountId, requireAuth } from "@/lib/auth-utils";
import { markWelcomeShown, recordWelcomeWatched } from "@/lib/data-access/memberships";

/** The dialog opened by itself for this person, so it won't again. An operator acting as them records nothing. */
export async function welcomeVideoShown(): Promise<void> {
  const session = await requireAuth();
  await markWelcomeShown(session, await getCurrentAccountId());
}

/** No welcome video runs a day; a longer length is not a player's report. */
const LONGEST_SECONDS = 24 * 60 * 60;

/**
 * The player's report of how far this person has got: `seconds` into a video
 * `length` seconds long. Kept in whole seconds, and only as their furthest
 * point. A report that isn't two sensible numbers is dropped.
 */
export async function welcomeVideoWatched(seconds: number, length: number): Promise<void> {
  const session = await requireAuth();
  const of = Math.floor(Number(length));
  const watched = Math.min(Math.floor(Number(seconds)), of);
  if (!Number.isFinite(watched) || !Number.isFinite(of) || watched < 1 || of > LONGEST_SECONDS) return;
  await recordWelcomeWatched(session, await getCurrentAccountId(), watched, of);
}

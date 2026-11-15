/**
 * Who is editing a site (PRD D64, Epic 54). One person holds a site at a
 * time: the tool layer takes or keeps the hold for the caller on every write
 * and refuses anyone else's, and the editing pages keep it between writes.
 * A hold is a person's, whatever browser or tab asks, so someone's own
 * devices never refuse each other. Nothing else reads or writes `site_holds`.
 *
 * A hold ends by running out. Nobody takes one from its holder.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { personName } from "@/lib/person";

/**
 * How long a hold lasts past its last take or keep. The editing pages keep it
 * about every 25 seconds, and a browser slows a hidden tab's timers to one a
 * minute, which this still covers.
 */
export const HOLD_TTL_MS = 90_000;

export type HoldResult =
  | {
      held: true;
      /** Taken just now, from nobody or from a hold that had run out, rather than kept. */
      fresh: boolean;
    }
  | {
      held: false;
      /** Who is editing, as the other people on the account know them. */
      by: string;
    };

const isUniqueViolation = (err: unknown) => err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

/**
 * Takes the site's hold for a person, or keeps the one they have. Refused
 * only while someone else's is live. Each step is one conditional write, so
 * two people asking at the same moment get one hold between them.
 */
export async function takeHold(siteId: string, userId: string, now = new Date()): Promise<HoldResult> {
  const expiresAt = new Date(now.getTime() + HOLD_TTL_MS);
  for (let attempt = 0; attempt < 3; attempt++) {
    // Theirs and still live: keep it.
    const kept = await prisma.siteHold.updateMany({ where: { siteId, userId, expiresAt: { gt: now } }, data: { expiresAt } });
    if (kept.count === 1) return { held: true, fresh: false };
    // Run out, whoever's it was: take it.
    const taken = await prisma.siteHold.updateMany({ where: { siteId, expiresAt: { lte: now } }, data: { userId, takenAt: now, expiresAt } });
    if (taken.count === 1) return { held: true, fresh: true };
    // Someone else's, and live: the usual refusal, settled by a read.
    const holder = await currentHold(siteId, now);
    if (holder && holder.userId !== userId) return { held: false, by: holder.by };
    if (holder) continue; // Theirs from another tab just now: keep it on the next round.
    // The site has never been held: make its row. Losing that to a first hold made at the same moment goes round again.
    try {
      await prisma.siteHold.create({ data: { siteId, userId, takenAt: now, expiresAt } });
      return { held: true, fresh: true };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  throw new Error(`Could not settle who holds site ${siteId}`);
}

/** Whoever is editing the site now, or null when nobody is. */
export async function currentHold(siteId: string, now = new Date()): Promise<{ userId: string; by: string; takenAt: Date } | null> {
  const hold = await prisma.siteHold.findUnique({
    where: { siteId },
    select: { userId: true, takenAt: true, expiresAt: true, user: { select: { name: true, email: true } } },
  });
  if (!hold || hold.expiresAt <= now) return null;
  return { userId: hold.userId, by: personName(hold.user), takenAt: hold.takenAt };
}

/** Gives up a person's hold on one site, when they hold it. */
export async function releaseHold(siteId: string, userId: string): Promise<void> {
  await prisma.siteHold.deleteMany({ where: { siteId, userId } });
}

/** Gives up every hold a person has: they signed out. */
export async function releaseHolds(userId: string): Promise<void> {
  await prisma.siteHold.deleteMany({ where: { userId } });
}

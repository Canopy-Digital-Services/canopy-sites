/**
 * Site stats for the Stats page. This is the seam a real source plugs into:
 * the page asks getSiteStats and renders whatever SiteStats comes back.
 * Demo sites get deterministic sample data; every other site has no source
 * until Umami lands (Epic 35), and the page shows its empty state.
 */

import { statsRangeDays, type StatsRange } from "./range";
import { sampleSiteStats } from "./sample";
import type { SiteStats } from "./types";

export * from "./range";
export type * from "./types";

/** The site fields a stats source needs. */
export type StatsSite = { id: string; isDemo: boolean };

/** Stats for the range ending today, or null when the site has no stats source yet. */
export async function getSiteStats(site: StatsSite, range: StatsRange, now: Date = new Date()): Promise<SiteStats | null> {
  if (site.isDemo) return sampleSiteStats(site.id, statsRangeDays(range), now);
  return null;
}

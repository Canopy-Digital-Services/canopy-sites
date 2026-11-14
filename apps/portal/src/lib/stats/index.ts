/**
 * Site stats for the Stats page. The page asks getSiteStats and renders
 * whatever comes back: demo sites get deterministic sample data, a site with
 * an Umami website id gets its numbers from Umami (Epic 35), and any other
 * site has none yet.
 */

import { datesEnding, startOfDayIn, statsRangeDays, type StatsRange } from "./range";
import { sampleSiteStats } from "./sample";
import { fetchUmami, umamiSiteStats } from "./umami";
import type { SiteStats } from "./types";

export * from "./range";
export type * from "./types";

/** The site fields a stats source needs, from the session account's own site row. */
export type StatsSite = { id: string; isDemo: boolean; umamiWebsiteId: string | null; productionHostnames: string[] };

export type StatsResult =
  | { status: "ready"; stats: SiteStats }
  /** The site has no stats source. */
  | { status: "none" }
  /** It has one, and it couldn't be read just now. */
  | { status: "unavailable" };

/** Stats for the range ending today in `timeZone` (the account's). */
export async function getSiteStats(
  site: StatsSite,
  range: StatsRange,
  { timeZone, now = new Date() }: { timeZone: string; now?: Date },
): Promise<StatsResult> {
  const days = statsRangeDays(range);
  if (site.isDemo) return { status: "ready", stats: sampleSiteStats(site.id, days, now, timeZone) };
  if (!site.umamiWebsiteId) return { status: "none" };

  const dates = datesEnding(now, days, timeZone);
  try {
    const responses = await fetchUmami(site.umamiWebsiteId, startOfDayIn(dates[0], timeZone), now, timeZone);
    return { status: "ready", stats: umamiSiteStats(responses, dates, site.productionHostnames) };
  } catch (err) {
    console.warn(JSON.stringify({ event: "stats_unavailable", siteId: site.id, message: (err as Error).message }));
    return { status: "unavailable" };
  }
}

/**
 * The shape every stats source returns, so the Stats page never knows where
 * the numbers came from. Dates are calendar days (`YYYY-MM-DD`) in the
 * account's time zone.
 */

export type DailyStats = { date: string; visitors: number; pageviews: number };

/** Visitors are people; visits are their separate trips to the site. */
export type StatsTotals = { visitors: number; visits: number; pageviews: number };

export type PageStats = { path: string; pageviews: number };

export type ReferrerStats = { source: string; visitors: number };

export type SiteStats = {
  /** True when the numbers are generated rather than measured (demo sites). */
  sample: boolean;
  totals: StatsTotals;
  /** One entry per day of the range, oldest first. */
  daily: DailyStats[];
  /** Most viewed first. */
  topPages: PageStats[];
  /** Most visitors first. */
  referrers: ReferrerStats[];
};

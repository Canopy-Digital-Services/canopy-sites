/**
 * Sample stats for demo sites, which have no real traffic. Plausible for a
 * small local salon: about 20 to 70 visitors a day, busier Tuesday to
 * Saturday, gently drifting over the weeks, with 1.6 to 2.4 pageviews per
 * visitor.
 *
 * Deterministic: each day is generated from the site id and that day's date
 * alone, so a reload shows the same numbers and a day keeps its values as
 * the range moves. No I/O, no Math.random.
 */

import { datesEnding } from "./range";
import type { DailyStats, SiteStats, StatsTotals } from "./types";

export const SAMPLE_MIN_VISITORS = 20;
export const SAMPLE_MAX_VISITORS = 70;
export const SAMPLE_MIN_VIEWS_PER_VISITOR = 1.6;
export const SAMPLE_MAX_VIEWS_PER_VISITOR = 2.4;

/** Sunday to Saturday. Salons are quiet Sunday and Monday. */
const WEEKDAY = [0.58, 0.64, 0.98, 1, 1.06, 1.14, 1.2];

/** The demo site's pages, with their usual share of pageviews. */
const PAGES = [
  { path: "/demo/", weight: 0.52 },
  { path: "/demo/services", weight: 0.31 },
  { path: "/demo/policies", weight: 0.17 },
];

/** Where visitors come from, with their usual share. */
const REFERRERS = [
  { source: "Google", weight: 0.36 },
  { source: "Direct", weight: 0.22 },
  { source: "Instagram", weight: 0.17 },
  { source: "Google Maps", weight: 0.11 },
  { source: "Facebook", weight: 0.08 },
  { source: "Yelp", weight: 0.06 },
];

const DAY_MS = 86_400_000;
/** Length in days of the slow swell in traffic, so long ranges aren't flat. */
const DRIFT_PERIOD = 63;

/** FNV-1a: a stable 32-bit hash of a string. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32: a small seeded generator returning floats in [0, 1). */
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Splits `total` into integers proportional to `weights` that sum to exactly `total`. */
function apportion(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (w / sum) * total);
  const shares = exact.map(Math.floor);
  const remainder = total - shares.reduce((a, b) => a + b, 0);
  const byFraction = exact.map((e, i) => ({ i, fraction: e - shares[i] })).sort((a, b) => b.fraction - a.fraction || a.i - b.i);
  for (let k = 0; k < remainder; k++) shares[byFraction[k].i]++;
  return shares;
}

type SampleDay = DailyStats & { pages: number[]; referrers: number[] };

function sampleDay(siteId: string, date: string): SampleDay {
  const site = seededRandom(hash(siteId));
  const level = 43 + 5 * site();
  const phase = DRIFT_PERIOD * site();

  const random = seededRandom(hash(`${siteId}:${date}`));
  const dayNumber = Date.parse(`${date}T00:00:00Z`) / DAY_MS;
  const weekday = WEEKDAY[new Date(dayNumber * DAY_MS).getUTCDay()];
  const drift = 1 + 0.06 * Math.sin((2 * Math.PI * (dayNumber + phase)) / DRIFT_PERIOD);
  const noise = 0.88 + 0.24 * random();

  const visitors = Math.min(
    SAMPLE_MAX_VISITORS,
    Math.max(SAMPLE_MIN_VISITORS, Math.round(level * weekday * drift * noise)),
  );
  const viewsPerVisitor = SAMPLE_MIN_VIEWS_PER_VISITOR + (SAMPLE_MAX_VIEWS_PER_VISITOR - SAMPLE_MIN_VIEWS_PER_VISITOR) * random();
  const pageviews = Math.round(visitors * viewsPerVisitor);
  const pages = apportion(pageviews, PAGES.map((p) => p.weight * (0.8 + 0.4 * random())));
  const referrers = apportion(visitors, REFERRERS.map((r) => r.weight * (0.7 + 0.6 * random())));

  return { date, visitors, pageviews, pages, referrers };
}

function sum(days: DailyStats[]): StatsTotals {
  return days.reduce((t, d) => ({ visitors: t.visitors + d.visitors, pageviews: t.pageviews + d.pageviews }), {
    visitors: 0,
    pageviews: 0,
  });
}

/** Most first; ties keep their declared order. */
function ranked<T extends { count: number }>(items: T[]): T[] {
  return items.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
}

/** Sample stats for the `days` days ending today (UTC), today included. */
export function sampleSiteStats(siteId: string, days: number, today: Date): SiteStats {
  const current = datesEnding(today, days).map((date) => sampleDay(siteId, date));

  const pageCounts = PAGES.map((p, i) => ({ path: p.path, count: current.reduce((n, d) => n + d.pages[i], 0) }));
  const referrerCounts = REFERRERS.map((r, i) => ({ source: r.source, count: current.reduce((n, d) => n + d.referrers[i], 0) }));

  return {
    sample: true,
    totals: sum(current),
    daily: current.map(({ date, visitors, pageviews }) => ({ date, visitors, pageviews })),
    topPages: ranked(pageCounts).map(({ path, count }) => ({ path, pageviews: count })),
    referrers: ranked(referrerCounts).map(({ source, count }) => ({ source, visitors: count })),
  };
}

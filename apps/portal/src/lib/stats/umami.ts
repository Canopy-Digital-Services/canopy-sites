/**
 * Stats from Umami, read with the portal's own key: the view-only
 * `canopy-portal` user, a member of the Umami team that holds the client
 * websites, so the key reads them and can change nothing (Epic 35, 4.6).
 * Server only: the key never reaches the browser.
 *
 * The website id is always the site row's, never anything from a request.
 */

import { buildSources } from "./sources";
import type { SiteStats } from "./types";

const TIMEOUT_MS = 8_000;
const TOP_PAGES = 10;
/** Referrer domains asked for, before they are merged by name. */
const REFERRER_DOMAINS = 50;
const WEBSITE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UmamiError extends Error {}

/** One value in a Umami series or ranking: a day or a name, and its count. */
type Point = { x: string; y: number };

export type UmamiResponses = {
  totals: { pageviews: number; visitors: number; visits: number };
  /** Per day in the zone asked for; a day with no visits is left out. */
  series: { pageviews: Point[]; sessions: Point[] };
  paths: Point[];
  referrers: Point[];
  channels: Point[];
};

async function get(path: string, params: Record<string, string | number>): Promise<unknown> {
  const base = process.env.UMAMI_URL;
  const key = process.env.UMAMI_API_KEY;
  if (!base || !key) throw new UmamiError("Umami isn't configured in this environment.");
  const url = new URL(path, base);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, String(value));
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    throw new UmamiError(`Umami didn't respond to ${url.pathname} (${(err as Error).name}).`);
  }
  if (!res.ok) throw new UmamiError(`Umami returned ${res.status} for ${url.pathname}.`);
  try {
    return await res.json();
  } catch {
    throw new UmamiError(`Umami's answer for ${url.pathname} isn't JSON.`);
  }
}

const count = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

function points(value: unknown, what: string): Point[] {
  if (!Array.isArray(value)) throw new UmamiError(`Umami's ${what} isn't a list.`);
  return value
    .filter((p): p is { x: string; y: unknown } => typeof p?.x === "string")
    .map((p) => ({ x: p.x, y: count(p.y) }));
}

/** Everything the Stats page shows, for `startAt` to `endAt`, with days in `timeZone`. */
export async function fetchUmami(websiteId: string, startAt: Date, endAt: Date, timeZone: string): Promise<UmamiResponses> {
  if (!WEBSITE_ID.test(websiteId)) throw new UmamiError("The site's Umami website id isn't a UUID.");
  const at = `/api/websites/${websiteId}`;
  const range = { startAt: startAt.getTime(), endAt: endAt.getTime() };
  const [totals, series, paths, referrers, channels] = await Promise.all([
    get(`${at}/stats`, range),
    get(`${at}/pageviews`, { ...range, unit: "day", timezone: timeZone }),
    get(`${at}/metrics`, { ...range, type: "path", limit: TOP_PAGES }),
    get(`${at}/metrics`, { ...range, type: "referrer", limit: REFERRER_DOMAINS }),
    get(`${at}/metrics`, { ...range, type: "channel" }),
  ]);
  if (typeof totals !== "object" || totals === null) throw new UmamiError("Umami's totals aren't an object.");
  const t = totals as Record<string, unknown>;
  const s = (series ?? {}) as Record<string, unknown>;
  return {
    totals: { pageviews: count(t.pageviews), visitors: count(t.visitors), visits: count(t.visits) },
    series: { pageviews: points(s.pageviews, "pageviews per day"), sessions: points(s.sessions, "visitors per day") },
    paths: points(paths, "top pages"),
    referrers: points(referrers, "referrers"),
    channels: points(channels, "channels"),
  };
}

/** The Stats page's numbers from Umami's answers, one day for each of `dates`. */
export function umamiSiteStats(responses: UmamiResponses, dates: string[], ownHostnames: string[]): SiteStats {
  const byDay = (series: Point[]) => new Map(series.map((p) => [p.x.slice(0, 10), p.y]));
  const visitors = byDay(responses.series.sessions);
  const pageviews = byDay(responses.series.pageviews);

  return {
    sample: false,
    totals: responses.totals,
    daily: dates.map((date) => ({ date, visitors: visitors.get(date) ?? 0, pageviews: pageviews.get(date) ?? 0 })),
    topPages: responses.paths
      .filter((p) => p.y > 0)
      .sort((a, b) => b.y - a.y)
      .slice(0, TOP_PAGES)
      .map((p) => ({ path: p.x, pageviews: p.y })),
    referrers: buildSources(
      responses.channels.find((c) => c.x === "direct")?.y ?? 0,
      responses.referrers.map((r) => ({ domain: r.x, visitors: r.y })),
      ownHostnames,
    ),
  };
}

import { describe, expect, it } from "vitest";
import { getSiteStats, parseStatsRange } from "./index";
import {
  SAMPLE_MAX_VIEWS_PER_VISITOR,
  SAMPLE_MAX_VISITORS,
  SAMPLE_MIN_VIEWS_PER_VISITOR,
  SAMPLE_MIN_VISITORS,
  sampleSiteStats,
} from "./sample";

const SITE = "cmsite0demo0000000000001";
const TODAY = new Date("2026-10-16T09:30:00Z");

describe("sampleSiteStats", () => {
  it("returns the same numbers for the same site and day", () => {
    expect(sampleSiteStats(SITE, 30, TODAY)).toEqual(sampleSiteStats(SITE, 30, new Date("2026-10-16T23:59:59Z")));
  });

  it("gives another site different numbers", () => {
    const a = sampleSiteStats(SITE, 30, TODAY).daily.map((d) => d.visitors);
    const b = sampleSiteStats("cmsite0other000000000002", 30, TODAY).daily.map((d) => d.visitors);
    expect(a).not.toEqual(b);
  });

  it.each([7, 30, 90])("returns %i consecutive days ending today", (days) => {
    const { daily } = sampleSiteStats(SITE, days, TODAY);
    expect(daily).toHaveLength(days);
    expect(daily.at(-1)?.date).toBe("2026-10-16");
    for (let i = 1; i < daily.length; i++) {
      expect(Date.parse(daily[i].date) - Date.parse(daily[i - 1].date)).toBe(86_400_000);
    }
  });

  it("keeps each day's values as the range moves", () => {
    const month = sampleSiteStats(SITE, 30, TODAY).daily;
    expect(sampleSiteStats(SITE, 7, TODAY).daily).toEqual(month.slice(-7));
    expect(sampleSiteStats(SITE, 30, new Date("2026-10-17T12:00:00Z")).daily.slice(0, 29)).toEqual(month.slice(1));
  });

  it("keeps visitors in range and pageviews at 1.6 to 2.4 per visitor", () => {
    for (const { visitors, pageviews } of sampleSiteStats(SITE, 90, TODAY).daily) {
      expect(Number.isInteger(visitors) && Number.isInteger(pageviews)).toBe(true);
      expect(visitors).toBeGreaterThanOrEqual(SAMPLE_MIN_VISITORS);
      expect(visitors).toBeLessThanOrEqual(SAMPLE_MAX_VISITORS);
      expect(pageviews).toBeGreaterThanOrEqual(visitors);
      expect(pageviews).toBeGreaterThanOrEqual(Math.round(visitors * SAMPLE_MIN_VIEWS_PER_VISITOR));
      expect(pageviews).toBeLessThanOrEqual(Math.round(visitors * SAMPLE_MAX_VIEWS_PER_VISITOR));
    }
  });

  it("is busier Tuesday to Saturday than Sunday and Monday", () => {
    const daily = sampleSiteStats(SITE, 90, TODAY).daily;
    const mean = (days: typeof daily) => days.reduce((n, d) => n + d.visitors, 0) / days.length;
    const quiet = daily.filter((d) => [0, 1].includes(new Date(d.date).getUTCDay()));
    const busy = daily.filter((d) => ![0, 1].includes(new Date(d.date).getUTCDay()));
    expect(mean(busy)).toBeGreaterThan(mean(quiet) * 1.3);
  });

  it.each([7, 30, 90])("totals the %i-day series, and pages and referrers add up to the totals", (days) => {
    const stats = sampleSiteStats(SITE, days, TODAY);
    expect(stats.totals).toEqual({
      visitors: stats.daily.reduce((n, d) => n + d.visitors, 0),
      pageviews: stats.daily.reduce((n, d) => n + d.pageviews, 0),
    });
    expect(stats.topPages.reduce((n, p) => n + p.pageviews, 0)).toBe(stats.totals.pageviews);
    expect(stats.referrers.reduce((n, r) => n + r.visitors, 0)).toBe(stats.totals.visitors);
  });

  it("lists the demo site's pages and the expected referrers, most first", () => {
    const { topPages, referrers } = sampleSiteStats(SITE, 30, TODAY);
    expect(topPages.map((p) => p.path).sort()).toEqual(["/demo/", "/demo/policies", "/demo/services"]);
    expect(referrers.map((r) => r.source).sort()).toEqual(["Direct", "Facebook", "Google", "Google Maps", "Instagram", "Yelp"]);
    expect(topPages.map((p) => p.pageviews)).toEqual([...topPages.map((p) => p.pageviews)].sort((a, b) => b - a));
    expect(referrers.map((r) => r.visitors)).toEqual([...referrers.map((r) => r.visitors)].sort((a, b) => b - a));
  });
});

describe("getSiteStats", () => {
  it("serves sample data to a demo site", async () => {
    const stats = await getSiteStats({ id: SITE, isDemo: true }, "7d", TODAY);
    expect(stats).toEqual(sampleSiteStats(SITE, 7, TODAY));
    expect(stats?.sample).toBe(true);
  });

  it("has no stats for a site that isn't a demo", async () => {
    expect(await getSiteStats({ id: SITE, isDemo: false }, "30d", TODAY)).toBeNull();
  });
});

describe("parseStatsRange", () => {
  it.each([
    ["7d", "7d"],
    ["30d", "30d"],
    ["90d", "90d"],
    [undefined, "30d"],
    ["365d", "30d"],
    [["7d", "90d"], "30d"],
  ] as const)("reads %j as %s", (value, range) => {
    expect(parseStatsRange(value as string | string[] | undefined)).toBe(range);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSiteStats } from "./index";
import { DIRECT_SOURCE } from "./sources";

const WEBSITE = "118c62e1-bfe4-4edd-ad5b-c712cdebb3b6";
const SITE = {
  id: "cmsitevets0000000000001",
  isDemo: false,
  umamiWebsiteId: WEBSITE,
  productionHostnames: ["veteranentrepreneurtribe.org", "vetstribe.org"],
};
const LA = "America/Los_Angeles";
// 09:40 on Saturday the 14th in Los Angeles.
const NOW = new Date("2026-11-14T17:40:00Z");

/** What Umami 3.4 answered for this website on 2026-11-14 (shapes checked live), trimmed. */
function answer(url: URL): unknown {
  const tail = url.pathname.split("/").at(-1);
  if (tail === "stats") return { pageviews: 138, visitors: 43, visits: 47, bounces: 30, totaltime: 8858, comparison: {} };
  if (tail === "pageviews") {
    return {
      pageviews: [
        { x: "2026-11-13T00:00:00Z", y: 124 },
        { x: "2026-11-14T00:00:00Z", y: 14 },
      ],
      sessions: [
        { x: "2026-11-13T00:00:00Z", y: 33 },
        { x: "2026-11-14T00:00:00Z", y: 10 },
      ],
    };
  }
  switch (url.searchParams.get("type")) {
    case "path":
      return [
        { x: "/events", y: 31 },
        { x: "/", y: 70 },
        { x: "/team", y: 0 },
      ];
    case "referrer":
      return [
        { x: "facebook.com", y: 6 },
        { x: "veteranentrepreneurtribe.org", y: 4 },
        { x: "l.facebook.com", y: 2 },
        { x: "linkedin.com", y: 3 },
      ];
    case "channel":
      return [
        { x: "direct", y: 30 },
        { x: "organicSocial", y: 8 },
        { x: "referral", y: 3 },
      ];
  }
  throw new Error(`unexpected request ${url}`);
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv("UMAMI_URL", "https://analytics.example.com");
  vi.stubEnv("UMAMI_API_KEY", "umami_test_key");
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input) => Response.json(answer(new URL(String(input)))));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const requested = () => fetchMock.mock.calls.map(([input, init]) => ({ url: new URL(String(input)), init }));

describe("getSiteStats from Umami", () => {
  it("asks Umami about the site's own website only, with the key, from local midnight", async () => {
    await getSiteStats(SITE, "7d", { timeZone: LA, now: NOW });
    const calls = requested();
    expect(calls).toHaveLength(5);
    for (const { url, init } of calls) {
      expect(url.origin).toBe("https://analytics.example.com");
      expect(url.pathname.startsWith(`/api/websites/${WEBSITE}/`)).toBe(true);
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer umami_test_key");
      // The 8th begins at 08:00 UTC in Los Angeles; the range runs to now.
      expect(url.searchParams.get("startAt")).toBe(String(Date.parse("2026-11-08T08:00:00Z")));
      expect(url.searchParams.get("endAt")).toBe(String(NOW.getTime()));
    }
    const series = calls.find((c) => c.url.pathname.endsWith("/pageviews"))!.url;
    expect(series.searchParams.get("unit")).toBe("day");
    expect(series.searchParams.get("timezone")).toBe(LA);
  });

  it("gives every day of the range, zero where Umami has none, and Umami's totals", async () => {
    const result = await getSiteStats(SITE, "7d", { timeZone: LA, now: NOW });
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    const { stats } = result;
    expect(stats.sample).toBe(false);
    expect(stats.totals).toEqual({ pageviews: 138, visitors: 43, visits: 47 });
    expect(stats.daily.map((d) => d.date)).toEqual([
      "2026-11-08",
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
    expect(stats.daily.slice(0, 5).every((d) => d.visitors === 0 && d.pageviews === 0)).toBe(true);
    expect(stats.daily.slice(5)).toEqual([
      { date: "2026-11-13", visitors: 33, pageviews: 124 },
      { date: "2026-11-14", visitors: 10, pageviews: 14 },
    ]);
  });

  it("ranks pages, and lists how visitors found the site without its own hostnames", async () => {
    const result = await getSiteStats(SITE, "30d", { timeZone: LA, now: NOW });
    if (result.status !== "ready") throw new Error(result.status);
    expect(result.stats.topPages).toEqual([
      { path: "/", pageviews: 70 },
      { path: "/events", pageviews: 31 },
    ]);
    expect(result.stats.referrers).toEqual([
      { source: DIRECT_SOURCE, visitors: 30 },
      { source: "Facebook", visitors: 8 },
      { source: "LinkedIn", visitors: 3 },
    ]);
  });

  it.each([
    ["Umami refuses the key", async () => new Response("{}", { status: 401 })],
    ["Umami is down", async () => new Response("Bad Gateway", { status: 502 })],
    ["Umami doesn't answer", async () => Promise.reject(new DOMException("timed out", "TimeoutError"))],
    ["Umami answers with something else", async () => new Response("<html>", { status: 200 })],
  ])("is unavailable, and says why in the log, when %s", async (_, impl) => {
    fetchMock.mockImplementation(impl as typeof fetch);
    expect(await getSiteStats(SITE, "7d", { timeZone: LA, now: NOW })).toEqual({ status: "unavailable" });
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('"event":"stats_unavailable"'));
  });

  it("is unavailable without asking anyone when Umami isn't configured here", async () => {
    vi.stubEnv("UMAMI_API_KEY", "");
    expect(await getSiteStats(SITE, "7d", { timeZone: LA, now: NOW })).toEqual({ status: "unavailable" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never puts a website id that isn't a UUID into a request", async () => {
    const bad = { ...SITE, umamiWebsiteId: "../../api/users" };
    expect(await getSiteStats(bad, "7d", { timeZone: LA, now: NOW })).toEqual({ status: "unavailable" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

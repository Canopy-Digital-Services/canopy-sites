import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { domainMatchesSite, getStatsHealth, QUIET_DAYS, umamiIdRefusal } from "./health";

const WEBSITE = "5b1e2c3d-8f4a-4c6b-9d2e-7a0f1b3c5d7e";
const SITE = { umamiWebsiteId: WEBSITE, productionHostnames: ["bramblebakery.example"] };
const NOW = new Date("2026-11-17T21:00:00Z");

/** Umami 3.4's answers for a website and its date range (shapes checked live 2026-11-17). */
function umami(website: unknown, range: unknown) {
  return async (input: string | URL | Request) => {
    const path = new URL(String(input)).pathname;
    return Response.json(path.endsWith("/daterange") ? range : website);
  };
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv("UMAMI_URL", "https://analytics.example.com");
  vi.stubEnv("UMAMI_API_KEY", "umami_test_key");
  fetchMock.mockReset();
  fetchMock.mockImplementation(
    umami(
      { id: WEBSITE, name: "Bramble Bakery", domain: "bramblebakery.example" },
      { startDate: "2026-11-06T18:38:47.377Z", endDate: "2026-11-16T23:43:30.331Z" },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getStatsHealth", () => {
  it("names the website, its first and last visit, from the site's own website id only", async () => {
    expect(await getStatsHealth(SITE, NOW)).toEqual({
      status: "readable",
      website: {
        name: "Bramble Bakery",
        domain: "bramblebakery.example",
        firstEvent: new Date("2026-11-06T18:38:47.377Z"),
        lastEvent: new Date("2026-11-16T23:43:30.331Z"),
      },
      domainMatches: true,
      quiet: false,
    });
    for (const [input] of fetchMock.mock.calls) {
      expect(new URL(String(input)).pathname.startsWith(`/api/websites/${WEBSITE}`)).toBe(true);
    }
  });

  it("is quiet when nothing was recorded in the last week, or ever", async () => {
    const lastWeek = new Date(NOW.getTime() - (QUIET_DAYS * 86_400_000 + 60_000)).toISOString();
    fetchMock.mockImplementation(umami({ name: "Bramble Bakery", domain: "bramblebakery.example" }, { startDate: lastWeek, endDate: lastWeek }));
    expect(await getStatsHealth(SITE, NOW)).toMatchObject({ status: "readable", quiet: true });

    fetchMock.mockImplementation(umami({ name: "New site", domain: "bramblebakery.example" }, { startDate: null, endDate: null }));
    expect(await getStatsHealth(SITE, NOW)).toMatchObject({
      status: "readable",
      quiet: true,
      website: { firstEvent: null, lastEvent: null },
    });
  });

  it("flags a website whose Umami domain is none of the site's hostnames, such as another client's", async () => {
    fetchMock.mockImplementation(umami({ name: "Thistle Boxing Club", domain: "thistleboxing.example" }, { startDate: null, endDate: null }));
    expect(await getStatsHealth(SITE, NOW)).toMatchObject({ status: "readable", domainMatches: false });
  });

  it.each([
    ["refused", async () => Response.json({ error: { status: 401 } }, { status: 401 })],
    ["unreachable", async () => new Response("Bad Gateway", { status: 502 })],
    ["unreachable", async () => Promise.reject(new DOMException("timed out", "TimeoutError"))],
    ["unreachable", async () => new Response("<html>", { status: 200 })],
  ])("is %s when Umami answers that way", async (status, impl) => {
    fetchMock.mockImplementation(impl as typeof fetch);
    expect(await getStatsHealth(SITE, NOW)).toEqual({ status });
  });

  it("is none without a website id, and unconfigured without a key, asking nobody", async () => {
    expect(await getStatsHealth({ ...SITE, umamiWebsiteId: null }, NOW)).toEqual({ status: "none" });
    vi.stubEnv("UMAMI_API_KEY", "");
    expect(await getStatsHealth(SITE, NOW)).toEqual({ status: "unconfigured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("umamiIdRefusal", () => {
  it("refuses only when Umami says the portal may not read the website", async () => {
    expect(await umamiIdRefusal(WEBSITE)).toBeNull();
    fetchMock.mockImplementation(async () => Response.json({}, { status: 401 }));
    expect(await umamiIdRefusal(WEBSITE)).toMatch(/Canopy Sites team/);
  });

  it("takes the id when Umami isn't set up here or doesn't answer", async () => {
    fetchMock.mockImplementation(async () => Promise.reject(new TypeError("fetch failed")));
    expect(await umamiIdRefusal(WEBSITE)).toBeNull();
    vi.stubEnv("UMAMI_API_KEY", "");
    expect(await umamiIdRefusal(WEBSITE)).toBeNull();
  });
});

describe("domainMatchesSite", () => {
  it.each([
    ["canopyds.com", ["www.canopyds.com"], true],
    ["northgatecyclery.example", ["northgatecyclery.example", "ngcycles.example"], true],
    ["www.thistleboxing.example", ["thistleboxing.example"], true],
    ["https://bramblebakery.example/", ["bramblebakery.example"], true],
    ["thistleboxing.example", ["bramblebakery.example"], false],
    ["northgatecyclery.example", ["northgate-prelaunch.canopyds.com"], false],
    [null, ["bramblebakery.example"], false],
  ] as const)("%s against %j is %s", (domain, hostnames, matches) => {
    expect(domainMatchesSite(domain, [...hostnames])).toBe(matches);
  });
});

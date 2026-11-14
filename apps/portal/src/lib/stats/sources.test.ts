import { describe, expect, it } from "vitest";
import { buildSources, DIRECT_SOURCE, MAX_SOURCES, sourceName } from "./sources";

describe("sourceName", () => {
  it.each([
    ["google.com", "Google"],
    ["www.google.co.uk", "Google"],
    ["maps.google.com", "Google Maps"],
    ["l.instagram.com", "Instagram"],
    ["m.facebook.com", "Facebook"],
    ["lm.facebook.com", "Facebook"],
    ["t.co", "X"],
    ["chatgpt.com", "ChatGPT"],
    ["search.brave.com", "Brave Search"],
    ["www.tapology.com", "tapology.com"],
    ["notgoogle.com", "notgoogle.com"],
  ])("%s is %s", (domain, name) => {
    expect(sourceName(domain)).toBe(name);
  });
});

describe("buildSources", () => {
  it("adds the no-referrer group, names and merges referrers, and ranks by visitors", () => {
    const rows = buildSources(
      358,
      [
        { domain: "google.com", visitors: 161 },
        { domain: "bing.com", visitors: 5 },
        { domain: "google.co.uk", visitors: 2 },
        { domain: "yelp.com", visitors: 3 },
      ],
      [],
    );
    expect(rows).toEqual([
      { source: DIRECT_SOURCE, visitors: 358 },
      { source: "Google", visitors: 163 },
      { source: "Bing", visitors: 5 },
      { source: "Yelp", visitors: 3 },
    ]);
  });

  it("leaves out the site's own hostnames, with or without www, and local testing", () => {
    const rows = buildSources(
      0,
      [
        { domain: "veteranentrepreneurtribe.org", visitors: 9 },
        { domain: "www.veteranentrepreneurtribe.org", visitors: 4 },
        { domain: "localhost", visitors: 2 },
        { domain: "sites.localhost", visitors: 1 },
        { domain: "linkedin.com", visitors: 3 },
      ],
      ["www.veteranentrepreneurtribe.org", "vetstribe.org"],
    );
    expect(rows).toEqual([{ source: "LinkedIn", visitors: 3 }]);
  });

  it("has no no-referrer row when nobody came that way, and lists at most the cap", () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ domain: `site${i}.example`, visitors: 20 - i }));
    const rows = buildSources(0, many, []);
    expect(rows).toHaveLength(MAX_SOURCES);
    expect(rows[0]).toEqual({ source: "site0.example", visitors: 20 });
    expect(rows.some((r) => r.source === DIRECT_SOURCE)).toBe(false);
  });
});

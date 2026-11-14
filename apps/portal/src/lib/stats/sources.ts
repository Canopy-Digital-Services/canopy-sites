/**
 * How visitors found the site, named the way an owner reads them: "Google",
 * not `www.google.com`, and a row for the people who came with no referrer
 * (typed the address, tapped a bookmark, or came from an app), whom a
 * referrer list leaves out and who are most of a small site's visitors.
 */

import type { ReferrerStats } from "./types";

/** Visitors with no referrer. The monthly report's label for the same group. */
export const DIRECT_SOURCE = "Typed in or from an app";

/** At most this many sources are listed. */
export const MAX_SOURCES = 10;

/** Readable names for common referrers, first match wins. */
const NAMED: [RegExp, string][] = [
  [/^maps\.google\./, "Google Maps"],
  [/(^|\.)google\.[a-z.]+$/, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)search\.brave\.com$/, "Brave Search"],
  [/(^|\.)yahoo\.com$/, "Yahoo"],
  [/(^|\.)ecosia\.org$/, "Ecosia"],
  [/(^|\.)(chatgpt\.com|chat\.openai\.com)$/, "ChatGPT"],
  [/(^|\.)perplexity\.ai$/, "Perplexity"],
  [/(^|\.)facebook\.com$|^fb\.me$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "LinkedIn"],
  [/(^|\.)(twitter|x)\.com$|^t\.co$/, "X"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/(^|\.)reddit\.com$/, "Reddit"],
  [/(^|\.)yelp\.com$/, "Yelp"],
  [/(^|\.)nextdoor\.com$/, "Nextdoor"],
];

const bare = (host: string) => host.trim().toLowerCase().replace(/\.$/, "").replace(/^www\./, "");

/** The name a referrer domain is shown under. */
export function sourceName(domain: string): string {
  const host = bare(domain);
  return NAMED.find(([pattern]) => pattern.test(host))?.[1] ?? host;
}

function isLocal(host: string): boolean {
  return host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1";
}

/**
 * The sources list: the no-referrer group plus each referrer under its name,
 * merged by name, without the site's own hostnames or local testing, most
 * visitors first. Merged rows add their visitor counts, so a person who came
 * from two of Google's domains in one range counts twice; at this size that
 * is noise.
 */
export function buildSources(
  direct: number,
  referrers: { domain: string; visitors: number }[],
  ownHostnames: string[],
): ReferrerStats[] {
  const own = new Set(ownHostnames.map(bare));
  const byName = new Map<string, number>();
  for (const { domain, visitors } of referrers) {
    const host = bare(domain);
    if (!host || own.has(host) || isLocal(host) || visitors <= 0) continue;
    const name = sourceName(host);
    byName.set(name, (byName.get(name) ?? 0) + visitors);
  }
  const rows = [...byName].map(([source, visitors]) => ({ source, visitors }));
  if (direct > 0) rows.push({ source: DIRECT_SOURCE, visitors: direct });
  return rows.sort((a, b) => b.visitors - a.visitors || a.source.localeCompare(b.source)).slice(0, MAX_SOURCES);
}

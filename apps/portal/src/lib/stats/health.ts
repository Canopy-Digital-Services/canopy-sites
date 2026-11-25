/**
 * Whether a site's Stats can work, for the operator. Stats
 * fail where the owner sees them and nobody else does: a website left out of
 * the Umami team the portal's key reads ("can't load"), a website id pasted
 * from another client (their numbers on this owner's page), or a tracker whose
 * domain filter names a host the site isn't on (zeros, which read like no
 * traffic). This puts each in front of the operator first.
 */

import { fetchUmamiWebsite, UmamiError, type UmamiWebsite } from "./umami";

/** A live site with no visit recorded in this many days is checked by hand. */
export const QUIET_DAYS = 7;
const DAY_MS = 86_400_000;

export type StatsHealth =
  /** No Umami website on the site row. */
  | { status: "none" }
  | { status: "unconfigured" }
  | { status: "unreachable" }
  /** Umami won't let the portal's key read the website. */
  | { status: "refused" }
  | {
      status: "readable";
      website: UmamiWebsite;
      /** Umami's domain for the website is one of the site's hostnames. */
      domainMatches: boolean;
      /** Nothing recorded in the last QUIET_DAYS days, or ever. */
      quiet: boolean;
    };

const bare = (host: string) =>
  host
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/:].*$/, "")
    .replace(/\.$/, "")
    .replace(/^www\./, "");

/** Whether Umami's domain names one of the site's hostnames, `www.` or not. */
export function domainMatchesSite(domain: string | null, hostnames: string[]): boolean {
  return domain !== null && hostnames.some((h) => bare(h) === bare(domain));
}

function failure(err: unknown): StatsHealth {
  const kind = err instanceof UmamiError ? err.kind : "unreachable";
  if (kind === "unconfigured") return { status: "unconfigured" };
  if (kind === "refused" || kind === "invalid") return { status: "refused" };
  return { status: "unreachable" };
}

export async function getStatsHealth(
  site: { umamiWebsiteId: string | null; productionHostnames: string[] },
  now: Date = new Date(),
): Promise<StatsHealth> {
  if (!site.umamiWebsiteId) return { status: "none" };
  try {
    const website = await fetchUmamiWebsite(site.umamiWebsiteId);
    return {
      status: "readable",
      website,
      domainMatches: domainMatchesSite(website.domain, site.productionHostnames),
      quiet: !website.lastEvent || now.getTime() - website.lastEvent.getTime() > QUIET_DAYS * DAY_MS,
    };
  } catch (err) {
    return failure(err);
  }
}

/**
 * Why a site can't take this Umami website id, or null. Only Umami's own
 * refusal counts: when Umami isn't set up here or doesn't answer, the id is
 * taken, and the site page's check shows it later.
 */
export async function umamiIdRefusal(websiteId: string): Promise<string | null> {
  try {
    await fetchUmamiWebsite(websiteId);
    return null;
  } catch (err) {
    if (failure(err).status !== "refused") return null;
    return "Umami won't let the portal read this website. Check the ID, and that the website is in the Canopy Sites team";
  }
}

/**
 * Where a site is live (PRD D47). The canvas and the preview page load a
 * page's styles, fonts, and scripts from here (a `<base>` at the page's live
 * address), and View site links here. The demo lives at /demo on the portal;
 * a client site at its first production hostname. Never derived from a
 * request's host.
 */

export interface LiveSite {
  /** "" for the portal's own origin (the demo), else "https://<hostname>". */
  origin: string;
  /** The path the site lives under on that origin: "/demo" for the demo, "" otherwise. */
  prefix: string;
}

type SiteFields = { slug: string; isDemo: boolean; productionHostnames: string[] };

/**
 * In development a client site's production hostname isn't served locally,
 * so `SITE_ASSET_ORIGIN_<SLUG>` (slug uppercased, hyphens as underscores)
 * names a local server of its build instead. Ignored in production.
 */
function developmentOrigin(slug: string): string | null {
  if (process.env.NODE_ENV === "production") return null;
  const value = process.env[`SITE_ASSET_ORIGIN_${slug.toUpperCase().replace(/-/g, "_")}`];
  return value && /^https?:\/\/[^/\s]+$/.test(value) ? value : null;
}

export function liveSite(site: SiteFields): LiveSite | null {
  if (site.isDemo) return { origin: "", prefix: "/demo" };
  const dev = developmentOrigin(site.slug);
  if (dev) return { origin: dev, prefix: "" };
  const host = site.productionHostnames[0];
  return host ? { origin: `https://${host}`, prefix: "" } : null;
}

/** A page's live address: `/demo/services` for the demo, `https://www.example.com/services` otherwise. */
export function liveUrl(live: LiveSite, path: string): string {
  const page = path.startsWith("/") ? path : `/${path}`;
  return `${live.origin}${live.prefix}${page === "/" && live.prefix ? "/" : page}`;
}

/** A path the bridge reports, as the site's own path: "/demo/services/#x" on the demo is "/services". */
export function sitePath(live: LiveSite, reported: string): string {
  let bare = reported.split("#")[0].split("?")[0];
  if (live.prefix && (bare === live.prefix || bare.startsWith(`${live.prefix}/`))) bare = bare.slice(live.prefix.length);
  bare = bare.replace(/\/+$/, "");
  return bare === "" ? "/" : bare;
}

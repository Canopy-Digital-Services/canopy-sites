/**
 * The tabs of the Canopy Sites portal, in the order the nav shows them. An
 * id is also what a welcome video is stored and named by (ROADMAP E39), so
 * it never changes once a site has a video for the tab.
 */
export const SITES_TABS = [
  { id: "quick-edit", href: "/quick-edit", label: "Quick Edit" },
  { id: "editor", href: "/editor", label: "Editor" },
  { id: "forms", href: "/forms", label: "Forms" },
  { id: "stats", href: "/stats", label: "Stats" },
] as const;

export type SitesTabId = (typeof SITES_TABS)[number]["id"];

export function isSitesTab(value: unknown): value is SitesTabId {
  return SITES_TABS.some((tab) => tab.id === value);
}

export function sitesTabLabel(id: SitesTabId): string {
  return SITES_TABS.find((tab) => tab.id === id)!.label;
}

/** The tab a path is on: its own page or any page under it. Null for the pages no tab holds, such as Account. */
export function sitesTabOf(pathname: string): SitesTabId | null {
  return SITES_TABS.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`))?.id ?? null;
}

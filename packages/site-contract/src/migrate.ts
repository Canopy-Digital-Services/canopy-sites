import type { RawContent } from "./collections.js";

/**
 * Content migrations: what a site's content needs when it moves to a newer
 * contract version that changes the shape of existing content (PRD section
 * 4.4). Canopy runs them when it upgrades a site's contract, in the same
 * commit as the dependency bump (`migrateSite` in `@canopy/site-contract/node`).
 */

const slug = (name: unknown) =>
  String(name ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/, "") || "item";

/** Gives every entry in `list` without an id one made from `nameOf`, unique among `taken`. */
function fillIds(list: unknown, nameOf: (e: Record<string, unknown>) => unknown, taken: Set<string>) {
  if (!Array.isArray(list)) return;
  for (const e of list) if (e && typeof e === "object" && typeof (e as { id?: unknown }).id === "string") taken.add((e as { id: string }).id);
  for (const e of list) {
    if (!e || typeof e !== "object" || typeof (e as { id?: unknown }).id === "string") continue;
    const base = slug(nameOf(e as Record<string, unknown>));
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    // Put the id first, the way the rest of the content is written.
    const entry = e as Record<string, unknown>;
    const rest = { ...entry };
    for (const k of Object.keys(entry)) delete entry[k];
    Object.assign(entry, { id }, rest);
  }
}

/** v0.1 → v0.2: every list of objects gets ids (PRD D36). Fills only what is missing. */
function addIds(content: RawContent) {
  const services = content.services;
  if (Array.isArray(services)) {
    // Service ids are unique across the whole menu, so collect them all first.
    const serviceIds = new Set<string>();
    const lists: unknown[] = [];
    for (const c of services as Array<Record<string, unknown>>) {
      lists.push(c.services);
      fillIds(c.groups, (g) => g.name, new Set());
      for (const g of (c.groups as Array<Record<string, unknown>> | undefined) ?? []) lists.push(g.services);
      fillIds(c.sections, (s) => s.name, new Set());
      for (const s of (c.sections as Array<Record<string, unknown>> | undefined) ?? []) {
        lists.push(s.services);
        fillIds(s.groups, (g) => g.name, new Set());
        for (const g of (s.groups as Array<Record<string, unknown>> | undefined) ?? []) lists.push(g.services);
      }
    }
    for (const list of lists) if (Array.isArray(list)) for (const e of list) if (typeof e?.id === "string") serviceIds.add(e.id);
    for (const list of lists) fillIds(list, (s) => s.name, serviceIds);
  }
  const site = content.site as { socials?: unknown } | undefined;
  if (site && typeof site === "object") fillIds(site.socials, (s) => s.network, new Set());
}

/**
 * Brings content written for an older contract version up to this one.
 * Returns a migrated copy; `content` is not modified. Content already at this
 * version comes back unchanged.
 */
export function migrateContent(content: RawContent, fromVersion: string): RawContent {
  const out = structuredClone(content);
  const [major, minor] = fromVersion.split(".").map(Number);
  if (major === 0 && minor < 2) addIds(out);
  return out;
}

import { z } from "zod";
import { collections, isCollectionName, type CollectionName, type RawContent } from "./collections.js";
import { countIssues, limitIssues, refusalIssues } from "./guide.js";
import type { Announcement, Category, ClassInfo, Faq, GalleryItem, Page, Review, Service, Site, TeamMember } from "./schemas.js";

export * from "./schemas.js";
export * from "./collections.js";
export {
  addressAt,
  applyChanges,
  isAddressOp,
  opCollection,
  PatchError,
  toAddressOps,
  type AddressOp,
  type ChangeOp,
  type PointerOp,
} from "./patch.js";
export {
  AddressError,
  addressMatches,
  field,
  fieldInfo,
  fieldLimit,
  parseAddress,
  resolveAddress,
  stringValues,
  type FieldInfo,
  type ResolvedAddress,
} from "./address.js";
export {
  AVOID_CHECKS,
  avoidWarnings,
  countIssues,
  FORMAT_KEYS,
  limitIssues,
  parseSiteGuide,
  phrasePattern,
  refusalIssues,
  SiteGuideError,
  type AvoidCheck,
  type AvoidWarning,
  type SiteGuide,
} from "./guide.js";
export { migrateContent } from "./migrate.js";
export { FIXED_EVERYWHERE, LaneRuleError, laneViolations, type LaneReason, type LaneRules, type LaneViolation } from "./lane.js";

/** Keep in step with package.json; a test checks it. */
export const CONTRACT_VERSION = "0.5.0";

export interface SiteContent {
  site?: Site;
  pages?: Page[];
  services?: Category[];
  reviews?: Review[];
  faqs?: Faq[];
  gallery?: GalleryItem[];
  announcements?: Announcement[];
  classes?: ClassInfo[];
  team?: TeamMember[];
}

export interface ContentIssue {
  collection: CollectionName;
  /** JSON Pointer into the collection document, e.g. /2/services/0/priceLabel */
  path: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; content: SiteContent; issues: [] }
  | { ok: false; issues: ContentIssue[] };

const pointer = (path: ReadonlyArray<PropertyKey>) =>
  path.length ? "/" + path.map((p) => String(p).replace(/~/g, "~0").replace(/\//g, "~1")).join("/") : "";

/** Every service id on the menu, wherever it sits in the nesting. */
export function serviceIndex(categories: Category[]): Map<string, Service> {
  const out = new Map<string, Service>();
  const add = (list?: Service[]) => list?.forEach((s) => s.id && out.set(s.id, s));
  for (const c of categories) {
    add(c.services);
    c.groups?.forEach((g) => add(g.services));
    c.sections?.forEach((s) => {
      add(s.services);
      s.groups?.forEach((g) => add(g.services));
    });
  }
  return out;
}

/**
 * The address (PRD D36) of every service on the menu, by service id, so a
 * template rendering a featured service can mark the menu entry it came from.
 */
export function serviceAddresses(categories: Category[]): Map<string, string> {
  const out = new Map<string, string>();
  const add = (prefix: string, list?: Service[]) => list?.forEach((s) => out.set(s.id, `${prefix}/services/${s.id}`));
  for (const c of categories) {
    const cat = `services/${c.id}`;
    add(cat, c.services);
    c.groups?.forEach((g) => add(`${cat}/groups/${g.id}`, g.services));
    c.sections?.forEach((s) => {
      add(`${cat}/sections/${s.id}`, s.services);
      s.groups?.forEach((g) => add(`${cat}/sections/${s.id}/groups/${g.id}`, g.services));
    });
  }
  return out;
}

export interface ValidateOptions {
  /** A site guide's limits (PRD D40), applied once the content is otherwise valid. */
  limits?: Record<string, number>;
  /** A site guide's counts: the most entries a list may hold (PRD D40). */
  counts?: Record<string, number>;
  /** A site guide's refused phrases (PRD D40). */
  refuse?: readonly string[];
}

/**
 * Validates every collection present in `raw` against the contract, then the
 * references between them, then any site guide limits, counts, and refused
 * phrases. Unknown collections are
 * an error, not ignored, so a typo can't silently write a file nothing reads.
 */
export function validateContent(raw: RawContent, options: ValidateOptions = {}): ValidationResult {
  const issues: ContentIssue[] = [];
  const content: SiteContent = {};

  for (const key of Object.keys(raw)) {
    if (!isCollectionName(key)) {
      issues.push({ collection: key as CollectionName, path: "", message: `Unknown collection "${key}"` });
      continue;
    }
    const parsed = collections[key].schema.safeParse(raw[key]);
    if (parsed.success) {
      (content as Record<string, unknown>)[key] = parsed.data;
    } else {
      for (const issue of parsed.error.issues) {
        issues.push({ collection: key, path: pointer(issue.path), message: issue.message });
      }
    }
  }

  // References: a featured service must exist on the menu, and service ids
  // must be unique across the whole menu.
  if (content.services) {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    const walk = (list?: Service[]) =>
      list?.forEach((s) => {
        if (!s.id) return;
        if (seen.has(s.id)) dupes.add(s.id);
        seen.add(s.id);
      });
    for (const c of content.services) {
      walk(c.services);
      c.groups?.forEach((g) => walk(g.services));
      c.sections?.forEach((s) => {
        walk(s.services);
        s.groups?.forEach((g) => walk(g.services));
      });
    }
    for (const id of dupes) issues.push({ collection: "services", path: "", message: `Service id "${id}" is used more than once` });
  }
  if (content.pages) {
    const menu = content.services ? serviceIndex(content.services) : new Map<string, Service>();
    content.pages.forEach((page, pi) =>
      page.sections.forEach((section, si) =>
        section.serviceIds?.forEach((id, ii) => {
          if (!menu.has(id)) {
            issues.push({
              collection: "pages",
              path: pointer([pi, "sections", si, "serviceIds", ii]),
              message: `"${id}" is not a service on the menu`,
            });
          }
        }),
      ),
    );
  }

  if (!issues.length) {
    const raw = content as RawContent;
    if (options.limits) for (const issue of limitIssues(raw, options.limits)) issues.push(issue as ContentIssue);
    if (options.counts) for (const issue of countIssues(raw, options.counts)) issues.push(issue as ContentIssue);
    if (options.refuse) for (const issue of refusalIssues(raw, options.refuse)) issues.push(issue as ContentIssue);
  }

  return issues.length ? { ok: false, issues } : { ok: true, content, issues: [] };
}

/**
 * Locked fields as dotted paths from the collection name, e.g.
 * `site.contact.phone`. Returns the locked paths whose value differs between
 * `before` and `after`, including being added or removed.
 *
 * @deprecated laneViolations takes locks as addresses, with Canopy's fields and
 * fixed lists (PRD D50). Kept until the portal moves to it (Epic 40, 4.2).
 */
export function lockedFieldViolations(before: RawContent, after: RawContent, lockedFields: readonly string[]): string[] {
  const get = (root: unknown, parts: string[]) =>
    parts.reduce<unknown>((node, part) => (node !== null && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined), root);
  return lockedFields.filter((field) => {
    const [collection, ...rest] = field.split(".");
    if (!isCollectionName(collection)) return false;
    const a = get(before[collection], rest);
    const b = get(after[collection], rest);
    return JSON.stringify(a) !== JSON.stringify(b);
  });
}

/** JSON Schema per collection, for model tool inputs and documentation. */
export function jsonSchemaFor(name: CollectionName): Record<string, unknown> {
  return z.toJSONSchema(collections[name].schema, { unrepresentable: "any" }) as Record<string, unknown>;
}

/** Announcements whose window includes `today` (YYYY-MM-DD). */
export function activeAnnouncements(list: Announcement[], today: string): Announcement[] {
  return list.filter((a) => (!a.startsOn || a.startsOn <= today) && (!a.endsOn || today <= a.endsOn));
}

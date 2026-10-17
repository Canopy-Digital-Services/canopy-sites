import { z } from "zod";
import {
  AnnouncementsSchema,
  GallerySchema,
  PagesSchema,
  ReviewsSchema,
  ServicesSchema,
  SiteSchema,
  type Announcement,
  type Category,
  type GalleryItem,
  type Page,
  type Review,
  type Service,
  type Site,
} from "./schemas.js";

export * from "./schemas.js";
export { applyChanges, PatchError, type ChangeOp } from "./patch.js";

/** Keep in step with package.json; a test checks it. */
export const CONTRACT_VERSION = "0.1.1";

/**
 * Every collection a site may have. Each is one JSON document at
 * src/content/<file> in the site repo; a site has the subset it renders.
 */
export const collections = {
  site: { file: "site.json", schema: SiteSchema, label: "Business details" },
  pages: { file: "pages.json", schema: PagesSchema, label: "Pages" },
  services: { file: "services.json", schema: ServicesSchema, label: "Services and prices" },
  reviews: { file: "reviews.json", schema: ReviewsSchema, label: "Reviews" },
  gallery: { file: "gallery.json", schema: GallerySchema, label: "Gallery" },
  announcements: { file: "announcements.json", schema: AnnouncementsSchema, label: "Announcements" },
} as const;

export type CollectionName = keyof typeof collections;
export const COLLECTION_NAMES = Object.keys(collections) as CollectionName[];

export function isCollectionName(v: unknown): v is CollectionName {
  return typeof v === "string" && Object.hasOwn(collections, v);
}

export interface SiteContent {
  site?: Site;
  pages?: Page[];
  services?: Category[];
  reviews?: Review[];
  gallery?: GalleryItem[];
  announcements?: Announcement[];
}

/** Content as read from disk or a request: shape not yet checked. */
export type RawContent = Partial<Record<CollectionName, unknown>>;

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
 * Validates every collection present in `raw` against the contract, then the
 * references between them. Unknown collections are an error, not ignored, so
 * a typo can't silently write a file nothing reads.
 */
export function validateContent(raw: RawContent): ValidationResult {
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

  return issues.length ? { ok: false, issues } : { ok: true, content, issues: [] };
}

/**
 * Locked fields are dotted paths from the collection name, e.g.
 * `site.contact.phone`. Returns the locked paths whose value differs between
 * `before` and `after`, including being added or removed.
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

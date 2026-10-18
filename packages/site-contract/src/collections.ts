import { AnnouncementsSchema, GallerySchema, PagesSchema, ReviewsSchema, ServicesSchema, SiteSchema } from "./schemas.js";

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

/** Content as read from disk or a request: shape not yet checked. */
export type RawContent = Partial<Record<CollectionName, unknown>>;

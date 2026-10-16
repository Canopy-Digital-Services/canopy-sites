import { z } from "zod";

// Every editable string is plain text: no markup, so no validator can be
// defeated by a span inside a field, and nothing a client or a model writes
// can become HTML on the page.
const plain = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Can't be empty")
    .max(max, `Must be ${max} characters or fewer`)
    .refine((v) => !/[<>]/.test(v), "Plain text only: no < or >");

/** Stable identifier for an entry: lowercase letters, digits, inner hyphens. */
export const Id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, digits, and hyphens only")
  .max(60);

const HttpsUrl = z
  .string()
  .max(500)
  .refine((v) => {
    try {
      return new URL(v).protocol === "https:";
    } catch {
      return false;
    }
  }, "Must be a full https:// link");

/** A link target: a path on this site, an in-page anchor, or an https URL. */
export const Href = z
  .string()
  .max(500)
  .refine(
    (v) => /^\/[A-Za-z0-9\-._~/#?=&%]*$/.test(v) || /^#[A-Za-z0-9\-_]+$/.test(v) || HttpsUrl.safeParse(v).success,
    "Must be a path on this site (/services), an anchor (#contact), or an https:// link",
  );

const Time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM");
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export const SOCIAL_NETWORKS = ["instagram", "facebook", "tiktok", "google", "yelp", "x", "youtube", "pinterest", "other"] as const;

const Cta = z.object({ label: plain(40), href: Href }).strict();

// ---------------------------------------------------------------------------
// site: the business itself (singleton)

export const WeeklyHours = z
  .object({
    kind: z.literal("weekly"),
    days: z
      .array(
        z
          .object({ day: z.enum(DAYS), opens: Time, closes: Time })
          .strict()
          .refine((d) => d.opens < d.closes, { message: "Closing time must be after opening time", path: ["closes"] }),
      )
      .max(14),
    note: plain(200).optional(),
  })
  .strict();

export const FreeformHours = z.object({ kind: z.literal("freeform"), text: plain(300) }).strict();

export const SiteSchema = z
  .object({
    name: plain(80),
    tagline: plain(200).optional(),
    description: plain(300),
    contact: z
      .object({
        phone: plain(30).optional(),
        email: z.email().max(254).optional(),
        address: z
          .object({
            street: plain(120).optional(),
            locality: plain(80),
            region: plain(40),
            postalCode: plain(20).optional(),
            country: z.string().regex(/^[A-Z]{2}$/, "Two-letter country code, e.g. US"),
          })
          .strict()
          .optional(),
        bookingUrl: HttpsUrl.optional(),
      })
      .strict(),
    hours: z.discriminatedUnion("kind", [WeeklyHours, FreeformHours]),
    socials: z
      .array(z.object({ network: z.enum(SOCIAL_NETWORKS), url: HttpsUrl, handle: plain(60).optional() }).strict())
      .max(10),
  })
  .strict();

// ---------------------------------------------------------------------------
// pages: one entry per page; each section renders once, in one place

export const SectionSchema = z
  .object({
    id: Id,
    eyebrow: plain(60).optional(),
    heading: plain(120).optional(),
    body: z.array(plain(1200)).max(12).optional(),
    quote: plain(400).optional(),
    cta: Cta.optional(),
    /** Featured services, by service id; name and price come from the menu. */
    serviceIds: z.array(Id).max(24).optional(),
  })
  .strict();

export const PageSchema = z
  .object({
    id: Id,
    path: z.string().regex(/^\/(?:[a-z0-9-]+\/?)*$/, "A path like / or /services"),
    navLabel: plain(30).optional(),
    title: plain(70),
    description: plain(200),
    hero: z
      .object({ headline: plain(120).optional(), subheadline: plain(300).optional(), cta: Cta.optional() })
      .strict()
      .optional(),
    sections: z.array(SectionSchema).max(20),
  })
  .strict()
  .superRefine((page, ctx) => {
    const seen = new Set<string>();
    page.sections.forEach((s, i) => {
      if (seen.has(s.id)) ctx.addIssue({ code: "custom", message: `Duplicate section id "${s.id}"`, path: ["sections", i, "id"] });
      seen.add(s.id);
    });
  });

// ---------------------------------------------------------------------------
// services: the menu (Client 2's services.json is the reference shape)

export const ServiceSchema = z
  .object({
    id: Id.optional(),
    name: plain(80),
    priceLabel: plain(40),
    duration: plain(30).nullable().optional(),
    description: plain(200).optional(),
  })
  .strict();

export const ServiceGroupSchema = z.object({ name: plain(80), services: z.array(ServiceSchema).min(1) }).strict();

const hasItems = (v: { services?: unknown[]; groups?: unknown[]; sections?: unknown[] }) =>
  Boolean(v.services?.length || v.groups?.length || v.sections?.length);

export const CategorySectionSchema = z
  .object({
    name: plain(80),
    services: z.array(ServiceSchema).optional(),
    groups: z.array(ServiceGroupSchema).optional(),
  })
  .strict()
  .refine(hasItems, "A section needs services or groups");

export const CategorySchema = z
  .object({
    id: Id,
    name: plain(60),
    fromPriceLabel: plain(40).optional(),
    description: plain(400).nullable().optional(),
    services: z.array(ServiceSchema).optional(),
    groups: z.array(ServiceGroupSchema).optional(),
    sections: z.array(CategorySectionSchema).optional(),
  })
  .strict()
  .refine(hasItems, "A category needs services, groups, or sections");

// ---------------------------------------------------------------------------
// reviews, gallery, announcements

export const ReviewSchema = z
  .object({ id: Id, quote: plain(500), author: plain(60), source: plain(60).optional() })
  .strict();

/** Path under the site's src/assets, e.g. images/gallery/gallery-1.jpg. */
export const AssetPath = z
  .string()
  .max(200)
  .regex(/^[a-z0-9][a-z0-9_\-/]*\.(?:jpe?g|png|webp|avif)$/i, "An image path under src/assets, like images/gallery/photo.jpg")
  .refine((v) => !v.split("/").includes(".."), "Must stay under src/assets");

export const GalleryItemSchema = z.object({ id: Id, src: AssetPath, alt: plain(200) }).strict();

export const AnnouncementSchema = z
  .object({
    id: Id,
    message: plain(160),
    startsOn: IsoDate.optional(),
    endsOn: IsoDate.optional(),
    link: Cta.optional(),
  })
  .strict()
  .refine((a) => !a.startsOn || !a.endsOn || a.startsOn <= a.endsOn, {
    message: "The end date must be on or after the start date",
    path: ["endsOn"],
  });

const uniqueIds = <T extends z.ZodType<{ id: string }>>(item: T, max: number) =>
  z
    .array(item)
    .max(max)
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((it, i) => {
        if (seen.has(it.id)) ctx.addIssue({ code: "custom", message: `Duplicate id "${it.id}"`, path: [i, "id"] });
        seen.add(it.id);
      });
    });

export const PagesSchema = uniqueIds(PageSchema, 30);
export const ServicesSchema = uniqueIds(CategorySchema, 30);
export const ReviewsSchema = uniqueIds(ReviewSchema, 30);
export const GallerySchema = uniqueIds(GalleryItemSchema, 60);
export const AnnouncementsSchema = uniqueIds(AnnouncementSchema, 5);

export type Site = z.infer<typeof SiteSchema>;
export type Page = z.infer<typeof PageSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type GalleryItem = z.infer<typeof GalleryItemSchema>;
export type Announcement = z.infer<typeof AnnouncementSchema>;

import { z } from "zod";

// ---------------------------------------------------------------------------
// Field metadata (PRD D36). Every value an owner can see carries a kind (which
// picks the visual editor's input), a label (what the editor and change
// summaries call it), and optionally a description (what the model reads in
// the JSON Schema; wording from QUICK_EDIT_GUIDANCE.md section 3).

export const FIELD_KINDS = [
  "text",
  "paragraph",
  "price",
  "date",
  "time",
  "hours",
  "link",
  "url",
  "email",
  "phone",
  "image",
  "reference",
  "choice",
  "id",
] as const;
export type FieldKind = (typeof FIELD_KINDS)[number];

export interface FieldMeta {
  kind: FieldKind;
  label: string;
  description?: string;
}

const field = <T extends z.ZodType>(schema: T, meta: FieldMeta): T => schema.meta({ ...meta });

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

const text = (max: number, label: string, description?: string) => field(plain(max), { kind: "text", label, description });
const paragraph = (max: number, label: string, description?: string) => field(plain(max), { kind: "paragraph", label, description });

/** Stable identifier for an entry: lowercase letters, digits, inner hyphens. */
export const Id = field(
  z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, digits, and hyphens only")
    .max(60),
  { kind: "id", label: "ID", description: "Stable once set; never renamed to match a new name." },
);

// A link is written into attributes and structured data, so it may not carry
// the characters that end one (markup, quotes, whitespace), even though a
// browser would accept some of them.
const HttpsUrl = z
  .string()
  .max(500)
  .refine((v) => {
    try {
      return new URL(v).protocol === "https:";
    } catch {
      return false;
    }
  }, "Must be a full https:// link")
  .refine((v) => !/[\s<>"'`\\]/.test(v), "Links can't contain spaces, quotes, or < >");

/** A link target: a path on this site, an in-page anchor, or an https URL. */
export const Href = z
  .string()
  .max(500)
  .refine(
    (v) => /^\/[A-Za-z0-9\-._~/#?=&%]*$/.test(v) || /^#[A-Za-z0-9\-_]+$/.test(v) || HttpsUrl.safeParse(v).success,
    "Must be a path on this site (/services), an anchor (#contact), or an https:// link",
  );

const Time = field(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM"), { kind: "time", label: "Time" });
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export const SOCIAL_NETWORKS = ["instagram", "facebook", "tiktok", "google", "yelp", "x", "youtube", "pinterest", "other"] as const;

const Cta = z
  .object({ label: text(40, "Button label"), href: field(Href, { kind: "link", label: "Button link" }) })
  .strict();

/**
 * A list whose entries carry ids, each unique within the list. Entries are
 * addressed by id (PRD D36), so an id never repeats in its list.
 */
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
    note: text(200, "Hours note").optional(),
  })
  .strict();

export const FreeformHours = z.object({ kind: z.literal("freeform"), text: paragraph(300, "Hours") }).strict();

export const SocialSchema = z
  .object({
    id: Id,
    network: field(z.enum(SOCIAL_NETWORKS), { kind: "choice", label: "Network" }),
    url: field(HttpsUrl, { kind: "url", label: "Link" }),
    handle: text(60, "Handle").optional(),
  })
  .strict();

/** A certification the business holds, as its certifying body records it. */
export const CertificationSchema = z
  .object({
    id: Id,
    name: text(120, "Certification", "The full name, as structured data and anyone spelling it out use it."),
    shortName: text(40, "Short name", "Where space is tight, such as a line of designations.").optional(),
    number: field(
      plain(40).regex(/^[A-Za-z0-9-]+$/, "Letters, digits, and hyphens only, without a leading #"),
      { kind: "text", label: "Certification number" },
    ).optional(),
    verifyOn: text(80, "Where to verify", "Where a buyer can look the certification up, such as Cal eProcure.").optional(),
  })
  .strict();

const NaicsCode = field(z.string().regex(/^\d{6}$/, "Six digits, like 541511"), { kind: "text", label: "NAICS code" });

export const CredentialsSchema = z
  .object({
    certifications: uniqueIds(CertificationSchema, 12).optional(),
    naics: field(
      z
        .array(NaicsCode)
        .max(20)
        .superRefine((codes, ctx) => {
          codes.forEach((c, i) => {
            if (codes.indexOf(c) !== i) ctx.addIssue({ code: "custom", message: `${c} is listed twice`, path: [i] });
          });
        }),
      { kind: "text", label: "NAICS codes", description: "Six digits each, in the order shown." },
    ).optional(),
  })
  .strict();

export const SiteSchema = z
  .object({
    name: text(80, "Business name"),
    tagline: text(200, "Tagline").optional(),
    description: paragraph(300, "Description"),
    contact: z
      .object({
        phone: field(plain(30), { kind: "phone", label: "Phone" }).optional(),
        email: field(z.email().max(254), { kind: "email", label: "Email" }).optional(),
        address: z
          .object({
            street: text(120, "Street").optional(),
            locality: text(80, "City"),
            region: text(40, "State"),
            postalCode: text(20, "ZIP code").optional(),
            country: field(z.string().regex(/^[A-Z]{2}$/, "Two-letter country code, e.g. US"), { kind: "text", label: "Country" }),
          })
          .strict()
          .optional(),
        bookingUrl: field(HttpsUrl, { kind: "url", label: "Booking link" }).optional(),
      })
      .strict(),
    hours: field(z.discriminatedUnion("kind", [WeeklyHours, FreeformHours]), {
      kind: "hours",
      label: "Hours",
      description: "The regular week, 24-hour times. One-off closures and holiday hours are announcements.",
    }),
    socials: uniqueIds(SocialSchema, 10),
    credentials: CredentialsSchema.optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// pages: one entry per page; each section renders once, in one place

/** One of a section's cards: a step, a reason, a value; a grouping that means nothing outside its section (PRD D48). */
export const CardSchema = z
  .object({
    id: Id,
    eyebrow: text(60, "Card eyebrow").optional(),
    title: text(120, "Card title").optional(),
    body: paragraph(800, "Card text").optional(),
    cta: Cta.optional(),
  })
  .strict();

export const SectionSchema = z
  .object({
    id: Id,
    eyebrow: text(60, "Eyebrow").optional(),
    heading: text(120, "Heading").optional(),
    body: field(z.array(paragraph(1200, "Paragraph")).max(12), { kind: "paragraph", label: "Paragraphs" }).optional(),
    quote: paragraph(400, "Quote").optional(),
    cta: Cta.optional(),
    /** The section's cards, in page order. */
    cards: uniqueIds(CardSchema, 24).optional(),
    /** Featured services, by service id; name and price come from the menu. */
    serviceIds: field(z.array(Id).max(24), {
      kind: "reference",
      label: "Featured services",
      description: "A featured service shows the menu's name and price. To change either, edit the menu.",
    }).optional(),
  })
  .strict();

export const PageSchema = z
  .object({
    id: Id,
    path: z.string().regex(/^\/(?:[a-z0-9-]+\/?)*$/, "A path like / or /services"),
    navLabel: text(30, "Menu label").optional(),
    title: text(70, "Page title"),
    description: paragraph(200, "Search description"),
    hero: z
      .object({ headline: text(120, "Headline").optional(), subheadline: text(300, "Subheadline").optional(), cta: Cta.optional() })
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
// services: the menu (H&H's services.json is the reference shape)

const PriceLabel = field(plain(40), {
  kind: "price",
  label: "Price",
  description: 'Display text, written the way the menu writes it ("$90", "From $150").',
});

/** A service. Its id is unique across the whole menu, since pages feature services by id. */
export const ServiceSchema = z
  .object({
    id: Id,
    name: text(80, "Service name"),
    priceLabel: PriceLabel,
    duration: text(30, "Duration").nullable().optional(),
    description: paragraph(200, "Description").optional(),
  })
  .strict();

export const ServiceGroupSchema = z.object({ id: Id, name: text(80, "Group name"), services: z.array(ServiceSchema).min(1) }).strict();

const hasItems = (v: { services?: unknown[]; groups?: unknown[]; sections?: unknown[] }) =>
  Boolean(v.services?.length || v.groups?.length || v.sections?.length);

export const CategorySectionSchema = z
  .object({
    id: Id,
    name: text(80, "Section name"),
    services: z.array(ServiceSchema).optional(),
    groups: uniqueIds(ServiceGroupSchema, 50).optional(),
  })
  .strict()
  .refine(hasItems, "A section needs services or groups");

export const CategorySchema = z
  .object({
    id: Id,
    name: text(60, "Category name"),
    fromPriceLabel: field(plain(40), { kind: "price", label: "Starting price" }).optional(),
    description: paragraph(400, "Description").nullable().optional(),
    services: z.array(ServiceSchema).optional(),
    groups: uniqueIds(ServiceGroupSchema, 50).optional(),
    sections: uniqueIds(CategorySectionSchema, 50).optional(),
  })
  .strict()
  .refine(hasItems, "A category needs services, groups, or sections");

// ---------------------------------------------------------------------------
// reviews, gallery, announcements

export const ReviewSchema = z
  .object({
    id: Id,
    quote: paragraph(500, "Review", "A real customer's exact words, as the owner gives them."),
    author: text(60, "Name"),
    source: text(60, "Source").optional(),
  })
  .strict();

/** Path under the site's src/assets, e.g. images/gallery/gallery-1.jpg. */
export const AssetPath = z
  .string()
  .max(200)
  .regex(/^[a-z0-9][a-z0-9_\-/]*\.(?:jpe?g|png|webp|avif)$/i, "An image path under src/assets, like images/gallery/photo.jpg")
  .refine((v) => !v.split("/").includes(".."), "Must stay under src/assets");

export const GalleryItemSchema = z
  .object({
    id: Id,
    src: field(AssetPath, { kind: "image", label: "Photo" }),
    alt: text(200, "Alt text", "Describes what is in the photo for someone who can't see it; it does not sell."),
  })
  .strict();

export const AnnouncementSchema = z
  .object({
    id: Id,
    message: text(160, "Message", "160 characters or fewer."),
    startsOn: field(IsoDate, { kind: "date", label: "Starts", description: "YYYY-MM-DD; set whenever the message is about a date." }).optional(),
    endsOn: field(IsoDate, { kind: "date", label: "Ends", description: "YYYY-MM-DD; the banner hides itself after this day." }).optional(),
    link: Cta.optional(),
  })
  .strict()
  .refine((a) => !a.startsOn || !a.endsOn || a.startsOn <= a.endsOn, {
    message: "The end date must be on or after the start date",
    path: ["endsOn"],
  });

// ---------------------------------------------------------------------------
// faqs: questions and answers, in the order a page shows them

export const FaqSchema = z
  .object({
    id: Id,
    question: text(200, "Question", "As a customer would ask it."),
    answer: paragraph(1200, "Answer"),
  })
  .strict();

export const PagesSchema = uniqueIds(PageSchema, 30);
export const FaqsSchema = uniqueIds(FaqSchema, 40);
export const ServicesSchema = uniqueIds(CategorySchema, 30);
export const ReviewsSchema = uniqueIds(ReviewSchema, 30);
export const GallerySchema = field(uniqueIds(GalleryItemSchema, 60), { kind: "image", label: "Gallery", description: "Page order is list order." });
export const AnnouncementsSchema = uniqueIds(AnnouncementSchema, 5);

export type Site = z.infer<typeof SiteSchema>;
export type Social = z.infer<typeof SocialSchema>;
export type Credentials = z.infer<typeof CredentialsSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Faq = z.infer<typeof FaqSchema>;
export type Page = z.infer<typeof PageSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Card = z.infer<typeof CardSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type GalleryItem = z.infer<typeof GalleryItemSchema>;
export type Announcement = z.infer<typeof AnnouncementSchema>;

import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  AddressError,
  addressAt,
  applyChanges,
  toAddressOps,
  field,
  fieldInfo,
  jsonSchemaFor,
  limitIssues,
  migrateContent,
  opCollection,
  parseSiteGuide,
  PatchError,
  resolveAddress,
  serviceAddresses,
  SiteGuideError,
  validateContent,
  type Category,
} from "../src/index.js";
import { readContent } from "../src/node.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const GOOD = path.join(here, "fixtures/good");

const load = async () => (await readContent(GOOD)).content as Record<string, any>;

describe("ids", () => {
  it("are required on services, groups, sections, and socials, and unique in their list", async () => {
    const bad = await load();
    delete bad.services[0].services[1].id;
    delete bad.services[1].sections[0].id;
    delete bad.site.socials[0].id;
    const text = validateContent(bad).issues.map((i) => `${i.collection}${i.path}`);
    expect(text).toEqual(expect.arrayContaining(["services/0/services/1/id", "services/1/sections/0/id", "site/socials/0/id"]));

    const dupes = await load();
    dupes.services[1].sections.push({ ...dupes.services[1].sections[0], services: [{ id: "other", name: "Other", priceLabel: "$1" }] });
    expect(validateContent(dupes).issues.map((i) => i.message)).toContain('Duplicate id "face"');
  });
});

describe("resolveAddress", () => {
  it("turns ids and keys into a pointer, and paragraphs by position", async () => {
    const c = await load();
    expect(resolveAddress(c, "pages/home/sections/featured/heading").pointer).toBe("/0/sections/0/heading");
    expect(resolveAddress(c, "services/haircuts/services/haircut/priceLabel").pointer).toBe("/0/services/0/priceLabel");
    expect(resolveAddress(c, "services/waxing/sections/face/services/full-face-wax").pointer).toBe("/1/sections/0/services/0");
    expect(resolveAddress(c, "pages/home/sections/about/body/1")).toMatchObject({ pointer: "/0/sections/1/body/1", node: "Second paragraph." });
    expect(resolveAddress(c, "site/contact/phone")).toMatchObject({ pointer: "/contact/phone", exists: false });
  });

  it("refuses missing entries, bad segments, and unknown collections", async () => {
    const c = await load();
    expect(() => resolveAddress(c, "services/nope/name")).toThrow(AddressError);
    expect(() => resolveAddress(c, "site/contact/nope/deeper")).toThrow(AddressError);
    expect(() => resolveAddress(c, "site/__proto__/x")).toThrow(AddressError);
    expect(() => resolveAddress(c, "widgets/x")).toThrow(/collection/);
  });
});

describe("address ops", () => {
  it("replace, add, remove, and move by address, after a reorder too", async () => {
    const c = await load();
    const after = applyChanges(c, [
      // Moving waxing first shifts every haircut position; the address still finds it.
      { op: "move", address: "services/waxing", before: "haircuts" },
      { op: "replace", address: "services/haircuts/services/haircut/priceLabel", value: "$90" },
      { op: "replace", address: "site/tagline", value: "New tagline." },
      { op: "replace", address: "site/contact/phone", value: "530-555-0100" },
      { op: "add", address: "announcements", value: { id: "first", message: "First." }, before: "closed-monday" },
      { op: "add", address: "reviews", value: { id: "zoe", quote: "Great.", author: "Zoe" } },
      { op: "remove", address: "reviews/ashley" },
      { op: "move", address: "services/haircuts/services/haircut" },
    ]) as any;
    expect(after.services.map((s: Category) => s.id)).toEqual(["waxing", "haircuts"]);
    expect(after.services[1].services.map((s: { id: string }) => s.id)).toEqual(["clipper-cut", "haircut"]);
    expect(after.services[1].services[1].priceLabel).toBe("$90");
    expect(after.site.tagline).toBe("New tagline.");
    expect(after.site.contact.phone).toBe("530-555-0100");
    expect(after.announcements.map((a: { id: string }) => a.id)).toEqual(["first", "closed-monday"]);
    expect(after.reviews.map((r: { id: string }) => r.id)).toEqual(["zoe"]);
    expect(validateContent(after).ok).toBe(true);
  });

  it("refuses with the address in the reason", async () => {
    const c = await load();
    expect(() => applyChanges(c, [{ op: "add", address: "site/tagline", value: "x" }])).toThrow(/site\/tagline.*not a list/);
    expect(() => applyChanges(c, [{ op: "remove", address: "reviews/nobody" }])).toThrow(PatchError);
    expect(() => applyChanges(c, [{ op: "move", address: "reviews/ashley", before: "nobody" }])).toThrow(/No entry "nobody"/);
  });

  it("rewrites pointer ops as address ops that change the content the same way", async () => {
    const c = await load();
    const pointerOps = [
      { collection: "services", op: "replace" as const, path: "/0/services/0/priceLabel", value: "$90" },
      { collection: "announcements", op: "add" as const, path: "/-", value: { id: "holiday", message: "Closed for the holiday." } },
      { collection: "announcements", op: "add" as const, path: "/0", value: { id: "first", message: "First." } },
      { collection: "site", op: "add" as const, path: "/contact/phone", value: "530-555-0100" },
      { collection: "services", op: "move" as const, from: "/0/services/1", path: "/0/services/0" },
      { collection: "pages", op: "remove" as const, path: "/0/sections/1/body/0" },
    ];
    const addressOps = toAddressOps(c, pointerOps);
    expect(addressOps).toEqual([
      { op: "replace", address: "services/haircuts/services/haircut/priceLabel", value: "$90" },
      { op: "add", address: "announcements", value: { id: "holiday", message: "Closed for the holiday." }, before: undefined },
      { op: "add", address: "announcements", value: { id: "first", message: "First." }, before: "closed-monday" },
      { op: "replace", address: "site/contact/phone", value: "530-555-0100" },
      { op: "move", address: "services/haircuts/services/clipper-cut", before: "haircut" },
      { op: "remove", address: "pages/home/sections/about/body/0" },
    ]);
    expect(applyChanges(c, addressOps)).toEqual(applyChanges(c, pointerOps));
    expect(() => toAddressOps(c, [{ collection: "services", op: "move", from: "/0/services/0", path: "/1/sections/0/services/0" }])).toThrow(/one list/);
    expect(addressAt(c, "pages", "/0/sections/0/heading")).toBe("pages/home/sections/featured/heading");
  });

  it("names the collection an op changes", () => {
    expect(opCollection({ op: "replace", address: "pages/home/title", value: "x" })).toBe("pages");
    expect(opCollection({ collection: "site", op: "replace", path: "/name", value: "x" })).toBe("site");
  });
});

describe("field metadata", () => {
  it("gives each field's kind and label from the schemas", () => {
    expect(fieldInfo("services/any/services/any/priceLabel")).toMatchObject({ kind: "price", label: "Price" });
    expect(fieldInfo("services/any/sections/any/groups/any/services/any/name")).toMatchObject({ kind: "text", label: "Service name" });
    expect(fieldInfo("pages/home/sections/about/body/0")).toMatchObject({ kind: "paragraph", label: "Paragraph" });
    expect(fieldInfo("pages/home/sections/about/body")).toMatchObject({ kind: "paragraph", label: "Paragraphs" });
    expect(fieldInfo("announcements/x/endsOn")).toMatchObject({ kind: "date", label: "Ends" });
    expect(fieldInfo("site/hours")?.kind).toBe("hours");
    expect(fieldInfo("site/contact")).toBeNull();
    expect(fieldInfo("site/nope")).toBeNull();
  });

  it("reaches the model through the JSON Schema", () => {
    expect(JSON.stringify(jsonSchemaFor("services"))).toContain('"kind":"price"');
  });

  it("marks elements for the canvas, refusing a malformed address", () => {
    expect(field("pages", "home", "hero", "subheadline")).toEqual({ "data-canopy-field": "pages/home/hero/subheadline" });
    expect(() => field("nope/x")).toThrow(AddressError);
  });

  it("finds every service's address on the menu", async () => {
    const c = await load();
    const map = serviceAddresses(c.services);
    expect(map.get("haircut")).toBe("services/haircuts/services/haircut");
    expect(map.get("full-face-wax")).toBe("services/waxing/sections/face/services/full-face-wax");
    for (const address of map.values()) expect(resolveAddress(c, address).exists).toBe(true);
  });
});

describe("site guide", () => {
  const GUIDE = `---
limits:
  pages/*/hero/subheadline: 20   # the hero holds about four words
  "services/*/services/*/name": 12
formats:
  phone: "(530) 555-1234"
  time: '5:00 pm'
---

# Fixture Salon

Never advertise discounts.
`;

  it("parses front matter for code and prose for the model", () => {
    const g = parseSiteGuide(GUIDE);
    expect(g.limits).toEqual({ "pages/*/hero/subheadline": 20, "services/*/services/*/name": 12 });
    expect(g.formats).toEqual({ phone: "(530) 555-1234", time: "5:00 pm" });
    expect(g.prose).toBe("# Fixture Salon\n\nNever advertise discounts.");
    expect(parseSiteGuide(null)).toEqual({ limits: {}, formats: {}, prose: "" });
    expect(parseSiteGuide("Just prose.").prose).toBe("Just prose.");
  });

  it("refuses front matter it can't read rather than ignoring it", () => {
    expect(() => parseSiteGuide("---\nlimit:\n  pages/x/title: 5\n---\n")).toThrow(/unknown key "limit"/);
    expect(() => parseSiteGuide("---\nlimits:\n  pages/x/title: five\n---\n")).toThrow(/whole number/);
    expect(() => parseSiteGuide("---\nlimits:\n  widgets/x: 5\n---\n")).toThrow(/address pattern/);
    expect(() => parseSiteGuide("---\nformats:\n  color: red\n---\n")).toThrow(/unknown format/);
    expect(() => parseSiteGuide("---\nlimits:\n  pages/x/title: 5\n")).toThrow(/closing/);
  });

  it("limits apply after the contract, with the tighter of two patterns winning", async () => {
    const c = await load();
    expect(validateContent(c, { limits: parseSiteGuide(GUIDE).limits }).issues).toEqual([
      { collection: "pages", path: "/0/hero/subheadline", message: "Must be 20 characters or fewer on this site" },
    ]);
    expect(limitIssues(c, { "services/*/services/*/name": 10, "services/haircuts/services/clipper-cut/name": 5 })).toEqual([
      { collection: "services", path: "/0/services/1/name", message: "Must be 5 characters or fewer on this site" },
    ]);
  });
});

describe("migrateContent", () => {
  it("adds the ids v0.2 requires, unique where they must be, and nothing else", async () => {
    const v01 = await load();
    delete v01.services[0].services[1].id;
    v01.services[0].services.push({ name: "Haircut", priceLabel: "$70" });
    delete v01.services[1].sections[0].id;
    v01.services[1].sections[0].groups = [{ name: "Brows & Lips", services: [{ name: "Brow Wax", priceLabel: "$20" }] }];
    delete v01.site.socials[0].id;
    const before = JSON.stringify(v01);

    const after = migrateContent(v01, "0.1.1") as any;
    expect(JSON.stringify(v01)).toBe(before);
    expect(after.services[0].services.map((s: { id: string }) => s.id)).toEqual(["haircut", "clipper-cut", "haircut-2"]);
    expect(Object.keys(after.services[0].services[1])[0]).toBe("id");
    expect(after.services[1].sections[0].id).toBe("face");
    expect(after.services[1].sections[0].groups[0].id).toBe("brows-and-lips");
    expect(after.site.socials[0].id).toBe("instagram");
    expect(validateContent(after).ok).toBe(true);
    expect(migrateContent(after, "0.2.0")).toEqual(after);
  });
});

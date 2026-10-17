import { cp, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  activeAnnouncements,
  applyChanges,
  CONTRACT_VERSION,
  jsonSchemaFor,
  lockedFieldViolations,
  PatchError,
  validateContent,
  COLLECTION_NAMES,
} from "../src/index.js";
import { formatIssues, readContent, validateSite } from "../src/node.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const GOOD = path.join(here, "fixtures/good");

async function copyFixture() {
  const dir = await mkdtemp(path.join(tmpdir(), "site-contract-"));
  await cp(GOOD, dir, { recursive: true });
  return dir;
}

async function edit(dir: string, file: string, fn: (doc: any) => void) {
  const p = path.join(dir, "src/content", file);
  const doc = JSON.parse(await readFile(p, "utf8"));
  fn(doc);
  await writeFile(p, JSON.stringify(doc));
}

describe("validateSite", () => {
  it("passes on a fixture mirroring the demo site", async () => {
    const result = await validateSite(GOOD);
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("fails with readable, located errors on a bad fixture", async () => {
    const dir = await copyFixture();
    await edit(dir, "services.json", (d) => {
      d[0].services[0].priceLabel = "";
    });
    await edit(dir, "site.json", (d) => {
      d.hours.days[0].closes = "11:00";
    });
    await edit(dir, "pages.json", (d) => {
      d[0].sections[0].serviceIds.push("not-on-menu");
    });
    await edit(dir, "gallery.json", (d) => {
      d[0].src = "images/gallery/missing.jpg";
    });
    const result = await validateSite(dir);
    expect(result.ok).toBe(false);
    const text = formatIssues(result.issues);
    expect(text).toContain("services/0/services/0/priceLabel: Can't be empty");
    expect(text).toContain("site/hours/days/0/closes: Closing time must be after opening time");
    // References are checked only once each document is valid on its own.
    const refs = await validateSite(await copyFixture().then(async (d) => {
      await edit(d, "pages.json", (p) => p[0].sections[0].serviceIds.push("not-on-menu"));
      return d;
    }));
    expect(formatIssues(refs.issues)).toContain('pages/0/sections/0/serviceIds/2: "not-on-menu" is not a service on the menu');
  });

  it("reports a missing gallery image", async () => {
    const dir = await copyFixture();
    await edit(dir, "gallery.json", (d) => {
      d[0].src = "images/gallery/missing.jpg";
    });
    const result = await validateSite(dir);
    expect(formatIssues(result.issues)).toContain("No image at src/assets/images/gallery/missing.jpg");
  });

  it("reports malformed JSON instead of throwing", async () => {
    const dir = await copyFixture();
    await writeFile(path.join(dir, "src/content/reviews.json"), "[{");
    const result = await validateSite(dir);
    expect(result.ok).toBe(false);
    expect(formatIssues(result.issues)).toContain("reviews.json is not valid JSON");
  });
});

describe("validateContent", () => {
  it("rejects markup, javascript: links, and unknown collections", async () => {
    const { content } = await readContent(GOOD);
    const bad = structuredClone(content) as any;
    bad.reviews[0].quote = 'Great <script>alert(1)</script>';
    bad.pages[0].hero.cta.href = "javascript:alert(1)";
    bad.widgets = [];
    const result = validateContent(bad);
    expect(result.ok).toBe(false);
    const text = formatIssues(result.issues);
    expect(text).toContain("reviews/0/quote: Plain text only");
    expect(text).toContain("pages/0/hero/cta/href");
    expect(text).toContain('Unknown collection "widgets"');
  });

  it("rejects links that could end an attribute or a script block", async () => {
    const { content } = await readContent(GOOD);
    const bad = structuredClone(content) as any;
    bad.site.socials = [{ network: "instagram", url: "https://x.com/</script><script>alert(1)</script>" }];
    bad.site.contact.bookingUrl = 'https://book.example.com/a"onmouseover="alert(1)';
    bad.pages[0].hero.cta.href = "https://example.com/a b";
    const text = formatIssues(validateContent(bad).issues);
    expect(text).toContain("site/socials/0/url: Links can't contain");
    expect(text).toContain("site/contact/bookingUrl: Links can't contain");
    expect(text).toContain("pages/0/hero/cta/href");
  });

  it("rejects duplicate ids", async () => {
    const { content } = await readContent(GOOD);
    const bad = structuredClone(content) as any;
    bad.reviews.push({ ...bad.reviews[0] });
    expect(formatIssues(validateContent(bad).issues)).toContain('Duplicate id "ashley"');
  });
});

describe("applyChanges", () => {
  it("applies replace, add, remove, and move without touching the input", async () => {
    const { content } = await readContent(GOOD);
    const before = JSON.stringify(content);
    const after = applyChanges(content as Record<string, unknown>, [
      { collection: "services", op: "replace", path: "/0/services/0/priceLabel", value: "$90" },
      { collection: "announcements", op: "add", path: "/-", value: { id: "holiday", message: "Closed for the holiday." } },
      { collection: "reviews", op: "remove", path: "/0" },
      { collection: "services", op: "move", from: "/1", path: "/0" },
    ]) as any;
    expect(JSON.stringify(content)).toBe(before);
    expect(after.services[1].services[0].priceLabel).toBe("$90");
    expect(after.services[0].id).toBe("waxing");
    expect(after.announcements).toHaveLength(2);
    expect(after.reviews).toHaveLength(0);
  });

  it("refuses paths that don't exist, whole-document replacement, and prototype keys", async () => {
    const { content } = await readContent(GOOD);
    const c = content as Record<string, unknown>;
    expect(() => applyChanges(c, [{ collection: "services", op: "replace", path: "/9/name", value: "x" }])).toThrow(PatchError);
    expect(() => applyChanges(c, [{ collection: "site", op: "replace", path: "", value: {} }])).toThrow(/whole collection/);
    expect(() => applyChanges(c, [{ collection: "site", op: "add", path: "/__proto__/x", value: 1 }])).toThrow(/not an allowed path/);
    expect(() => applyChanges(c, [{ collection: "events", op: "add", path: "/-", value: {} }])).toThrow(/no "events" collection/);
  });
});

describe("lockedFieldViolations", () => {
  it("names locked paths that changed, were added, or were removed", async () => {
    const { content } = await readContent(GOOD);
    const after = applyChanges(content as Record<string, unknown>, [
      { collection: "site", op: "add", path: "/contact/phone", value: "555-0100" },
      { collection: "site", op: "replace", path: "/name", value: "New Name" },
    ]);
    expect(lockedFieldViolations(content, after, ["site.contact.phone", "site.contact.email", "site.contact.address"])).toEqual([
      "site.contact.phone",
    ]);
  });
});

describe("misc", () => {
  it("keeps CONTRACT_VERSION in step with package.json", async () => {
    const pkg = JSON.parse(await readFile(path.join(here, "../package.json"), "utf8"));
    expect(CONTRACT_VERSION).toBe(pkg.version);
  });

  it("produces a JSON Schema for every collection", () => {
    for (const name of COLLECTION_NAMES) expect(jsonSchemaFor(name)).toHaveProperty("type");
  });

  it("filters announcements by date", () => {
    const list = [
      { id: "a", message: "A", startsOn: "2026-10-16", endsOn: "2026-10-20" },
      { id: "b", message: "B", endsOn: "2026-10-01" },
      { id: "c", message: "C" },
    ];
    expect(activeAnnouncements(list, "2026-10-17").map((a) => a.id)).toEqual(["a", "c"]);
  });
});

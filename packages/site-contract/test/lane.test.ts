import { mkdtemp, cp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  applyChanges,
  avoidWarnings,
  LaneRuleError,
  laneViolations,
  parseSiteGuide,
  phrasePattern,
  SiteGuideError,
  validateContent,
} from "../src/index.js";
import { readContent, validateSite } from "../src/node.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const GOOD = path.join(here, "fixtures/good");

const CLASSES = [
  {
    id: "fundamentals",
    name: "Muay Thai Fundamentals",
    level: "Beginner",
    description: "Stance, strikes, and clinch, drilled from the ground up.",
    sessions: [{ id: "weeknights", days: ["monday", "tuesday", "wednesday", "thursday", "friday"], starts: "19:00", ends: "20:00" }],
  },
  {
    id: "personal",
    name: "1-on-1 Personal Training",
    shortName: "1-on-1 Personals",
    description: "Private coaching, by appointment.",
    lengths: ["30 min", "45 min", "60 min"],
    sessions: [{ id: "mornings", days: ["monday", "friday"], starts: "07:00", ends: "10:00", note: "By appointment" }],
  },
];
const TEAM = [
  { id: "iggy", name: "Coach Iggy", role: "Head Coach", bio: "IKF champion.", photo: "images/staff/coach-iggy.jpg" },
  { id: "steven", name: "Coach Steven Nasrallah", role: "Brazilian Jiu-Jitsu" },
];

const load = async () => {
  const content = (await readContent(GOOD)).content as Record<string, any>;
  return { ...content, classes: structuredClone(CLASSES), team: structuredClone(TEAM) } as Record<string, any>;
};
const messages = (raw: Record<string, unknown>) => validateContent(raw).issues.map((i) => `${i.collection}${i.path}: ${i.message}`);

describe("classes and team", () => {
  it("accept a gym's classes, sessions, and coaches", async () => {
    expect(messages(await load())).toEqual([]);
  });

  it("refuse a session that ends before it starts, a day listed twice, and fields the contract doesn't know", async () => {
    const c = await load();
    c.classes[0].sessions[0].ends = "18:00";
    c.classes[1].sessions[0].days = ["monday", "monday"];
    c.classes[1].sessions[0].starts = "7:00";
    c.team[1].featured = true;
    expect(messages(c)).toEqual(
      expect.arrayContaining([
        "classes/0/sessions/0/ends: The end time must be after the start time",
        "classes/1/sessions/0/days/1: monday is listed twice",
        "classes/1/sessions/0/starts: Use 24-hour HH:MM",
        expect.stringMatching(/^team\/1: .*featured/),
      ]),
    );
  });

  it("accept a person's note and group, and an FAQ's link, each optional", async () => {
    const c = await load();
    c.team[0].note = "IKF champion";
    c.team[0].group = "Coaches";
    c.faqs = [
      { id: "cost", question: "Is it free?", answer: "Yes, for members.", link: { label: "Join", href: "/join" } },
      { id: "who", question: "Who is it for?", answer: "Anyone starting out." },
    ];
    expect(messages(c)).toEqual([]);

    c.team[0].note = "";
    c.faqs[0].link = { label: "Join" };
    expect(messages(c)).toEqual(expect.arrayContaining([expect.stringMatching(/^team\/0\/note: /), expect.stringMatching(/^faqs\/0\/link\/href: /)]));
  });

  it("checks that a team photo exists under src/assets", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "site-contract-"));
    await cp(GOOD, dir, { recursive: true });
    await writeFile(path.join(dir, "src/content/team.json"), JSON.stringify(TEAM));
    const result = await validateSite(dir);
    expect(result.issues).toEqual([{ collection: "team", path: "/0/photo", message: "No image at src/assets/images/staff/coach-iggy.jpg" }]);
  });
});

describe("plain text", () => {
  it("is one line, without markdown", async () => {
    const c = await load();
    c.classes[0].name = "Muay Thai\nFundamentals";
    c.classes[0].description = "**Free** for everyone";
    c.classes[1].description = "- Private coaching";
    c.team[0].bio = "# Coach Iggy";
    expect(messages(c)).toEqual([
      "classes/0/name: One line only: no line breaks",
      "classes/0/description: Plain text only: no markdown (**, __, #, or a list marker)",
      "classes/1/description: Plain text only: no markdown (**, __, #, or a list marker)",
      "team/0/bio: Plain text only: no markdown (**, __, #, or a list marker)",
    ]);
  });

  it("still allows a # or a hyphen inside a sentence", async () => {
    const c = await load();
    c.team[0].bio = "The #1 gym in Oak Park, five-time champion - and counting.";
    expect(messages(c)).toEqual([]);
  });
});

describe("laneViolations", () => {
  const edit = (c: Record<string, any>, fn: (d: Record<string, any>) => void) => {
    const d = structuredClone(c);
    fn(d);
    return d;
  };
  const reasons = (v: ReturnType<typeof laneViolations>) => v.map((x) => `${x.reason} ${x.address}`);

  it("allows the owner's content: copy, sessions, coaches", async () => {
    const c = await load();
    const after = edit(c, (d) => {
      d.classes[0].description = "Where most people start.";
      d.classes[0].sessions.push({ id: "saturday", days: ["saturday"], starts: "09:00", ends: "10:00" });
      d.team.splice(1, 1);
      d.team.push({ id: "maria", name: "Coach Maria", role: "Youth" });
      d.pages[0].hero.subheadline = "New line";
    });
    expect(laneViolations(c, after)).toEqual([]);
  });

  it("lets the owner write a person's note, and keeps their group and an FAQ's link Canopy's", async () => {
    const c = await load();
    c.team[0].note = "IKF champion";
    c.team[0].group = "Coaches";
    c.faqs = [{ id: "cost", question: "Is it free?", answer: "Yes, for members.", link: { label: "Join", href: "/join" } }];

    const owners = edit(c, (d) => {
      d.team[0].note = "Two-time IKF champion";
      d.team[1].note = "Black belt";
      d.team.push({ id: "maria", name: "Coach Maria", role: "Youth", note: "Former national team" });
      d.faqs[0].answer = "Yes. Joining is free too.";
      d.faqs.push({ id: "when", question: "When do you meet?", answer: "Every month." });
    });
    expect(laneViolations(c, owners)).toEqual([]);

    const canopys = edit(c, (d) => {
      d.team[0].group = "Owners";
      d.team[1].group = "Coaches";
      d.faqs[0].link.href = "/elsewhere";
    });
    expect(reasons(laneViolations(c, canopys)).sort()).toEqual(["canopy faqs/cost/link", "canopy team/iggy/group", "canopy team/steven/group"]);
  });

  it("refuses changes to Canopy's fields: SEO, navigation, eyebrows, buttons, ids", async () => {
    const c = await load();
    const after = edit(c, (d) => {
      d.pages[0].title = "Cheap haircuts";
      d.pages[0].description = "Now 50% off";
      d.pages[0].hero.cta.label = "Book now!";
      d.pages[0].sections[0].eyebrow = "Hot deals";
    });
    expect(reasons(laneViolations(c, after))).toEqual([
      "canopy pages/home/title",
      "canopy pages/home/description",
      "canopy pages/home/hero/cta",
      "canopy pages/home/sections/featured/eyebrow",
    ]);
    expect(laneViolations(c, after)[0]).toMatchObject({ label: "Page title", message: "Page title is Canopy's to change" });
  });

  it("refuses an eyebrow removed on its own or added to a new card, but not one leaving with its entry", async () => {
    const c = await load();
    c.pages[0].sections[1].cards = [{ id: "why", eyebrow: "Why", title: "Because" }];
    const removeEyebrow = edit(c, (d) => delete d.pages[0].sections[0].eyebrow);
    expect(reasons(laneViolations(c, removeEyebrow))).toEqual(["canopy pages/home/sections/featured/eyebrow"]);
    const removeCard = edit(c, (d) => (d.pages[0].sections[1].cards = []));
    expect(laneViolations(c, removeCard)).toEqual([]);
    const newCard = edit(c, (d) => d.pages[0].sections[1].cards.push({ id: "more", eyebrow: "More", title: "Also" }));
    expect(reasons(laneViolations(c, newCard))).toEqual(["canopy pages/home/sections/about/cards/more/eyebrow"]);
  });

  it("holds locks by address, covering everything under one, with * for any segment", async () => {
    const c = await load();
    const after = edit(c, (d) => {
      d.site.contact.address.locality = "Shelbyville";
      d.site.contact.phone = "(530) 555-0100";
      d.pages[0].hero.subheadline = "Changed";
    });
    const locked = ["site/contact/phone", "site/contact/address", "pages/*/hero/subheadline"];
    expect(reasons(laneViolations(c, after, { locked }))).toEqual([
      "locked site/contact/phone",
      "locked site/contact/address",
      "locked pages/home/hero/subheadline",
    ]);
  });

  it("keeps fixed lists' entries: pages and sections everywhere, and a site's own", async () => {
    const c = await load();
    const reorderPages = edit(c, (d) => d.pages.reverse());
    expect(reasons(laneViolations(c, reorderPages))).toEqual(["fixed pages"]);
    const newSection = edit(c, (d) => d.pages[0].sections.push({ id: "promo", heading: "Promo" }));
    expect(reasons(laneViolations(c, newSection))).toEqual(["fixed pages/home/sections"]);
    const newClass = edit(c, (d) => d.classes.push({ id: "kickboxing", name: "Kickboxing", description: "New." }));
    expect(reasons(laneViolations(c, newClass, { fixed: ["classes"] }))).toEqual(["fixed classes"]);
    expect(laneViolations(c, newClass)).toEqual([]);
    const editClass = edit(c, (d) => (d.classes[1].description = "Private coaching with Coach Iggy."));
    expect(laneViolations(c, editClass, { fixed: ["classes"] })).toEqual([]);
    // A new id is a new entry: the old one leaves and a new one arrives, which a fixed list refuses.
    const renameClass = edit(c, (d) => (d.classes[0].id = "basics"));
    expect(reasons(laneViolations(c, renameClass, { fixed: ["classes"] }))).toEqual(["fixed classes"]);
  });

  it("throws on a rule that isn't an address pattern, rather than ignoring it", async () => {
    const c = await load();
    expect(() => laneViolations(c, c, { locked: ["site.contact.phone"] })).toThrow(LaneRuleError);
    expect(() => laneViolations(c, c, { fixed: ["widgets"] })).toThrow(/not an address pattern/);
  });

  it("works on ops the way the tool layer applies them", async () => {
    const c = await load();
    const after = applyChanges(c, [{ collection: "pages", op: "add", path: "/0/navLabel", value: "Deals" }]);
    expect(reasons(laneViolations(c, after))).toEqual(["canopy pages/home/navLabel"]);
  });
});

describe("site guide counts, avoid, and refuse", () => {
  const GUIDE = `---
counts:
  team: 2
  classes/*/sessions: 1
avoid:
  - em-dash
  - emoji
  - all-caps
  - exclamations
  - special offer
refuse:
  - free trial
  - "discount*"
  - "% off"
  - $
---
Prose.
`;

  it("parses list keys, telling named checks from phrases", () => {
    const g = parseSiteGuide(GUIDE);
    expect(g.counts).toEqual({ team: 2, "classes/*/sessions": 1 });
    expect(g.avoid).toEqual({ checks: ["em-dash", "emoji", "all-caps", "exclamations"], phrases: ["special offer"] });
    expect(g.refuse).toEqual(["free trial", "discount*", "% off", "$"]);
    expect(() => parseSiteGuide("---\nrefuse:\n  free trial\n---\n")).toThrow(SiteGuideError);
    expect(() => parseSiteGuide("---\ncounts:\n  team: lots\n---\n")).toThrow(/whole number/);
    expect(() => parseSiteGuide("---\navoids:\n  - emoji\n---\n")).toThrow(/unknown key "avoids"/);
  });

  it("enforces counts and refused phrases as content issues", async () => {
    const g = parseSiteGuide(GUIDE);
    const refuse = g.refuse.filter((p) => p !== "$"); // the fixture is a salon with prices
    const c = await load();
    c.team.push({ id: "maria", name: "Coach Maria", role: "Youth" });
    c.classes[0].sessions.push({ id: "sat", days: ["saturday"], starts: "09:00", ends: "10:00" });
    c.classes[1].description = "Your first class is a FREE  trial, now 20% off.";
    expect(validateContent(c, { counts: g.counts, refuse }).issues).toEqual([
      { collection: "classes", path: "/0/sessions", message: "Sessions: at most 1 on this site" },
      { collection: "team", path: "", message: "Team: at most 2 on this site" },
      { collection: "classes", path: "/1/description", message: `This site doesn't say "FREE  trial": that's Canopy's call` },
    ]);
  });

  it("matches phrases as whole words, ignoring case, with a trailing * for any ending", () => {
    expect(phrasePattern("free trial").test("A Free Trial!")).toBe(true);
    expect(phrasePattern("free trial").test("free trials")).toBe(false);
    expect(phrasePattern("discount*").test("Discounted rates")).toBe(true);
    expect(phrasePattern("discount*").test("nodiscount")).toBe(false);
    expect(phrasePattern("% off").test("50% off")).toBe(true);
    expect(phrasePattern("$").test("Only $20")).toBe(true);
    expect(phrasePattern("promo").test("promotion")).toBe(false);
  });

  it("warns about what the copy avoids, only in text the edit changed", async () => {
    const { avoid } = parseSiteGuide(GUIDE);
    const c = await load();
    c.team[0].bio = "Old bio — with a dash nobody touched.";
    const after = structuredClone(c);
    after.classes[0].description = "OPEN NOW for everyone 💪";
    after.classes[1].description = "IKF champion, see you there!";
    after.team[1].bio = "A special offer — ask Steven™.";
    expect(avoidWarnings(c, after, avoid).map((w) => `${w.address}: ${w.message}`)).toEqual([
      "classes/fundamentals/description: Description has an emoji and words in capitals, which this site's copy avoids",
      "classes/personal/description: Description has an exclamation mark, which this site's copy avoids",
      `team/steven/bio: Bio has an em dash and "special offer", which this site's copy avoids`,
    ]);
  });
});

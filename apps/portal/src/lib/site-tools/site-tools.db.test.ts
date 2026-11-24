import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { prisma } from "@/lib/db";
import { isRateLimited, resetRateLimits } from "@/lib/rate-limit";
import { createAccount, createMember, createSite, resetDatabase } from "../../../test/db";

// The builder is another service; stand in for it. Prisma is real.
const builder = vi.hoisted(() => ({
  commit: "a".repeat(40),
  content: {} as Record<string, unknown>,
  previews: [] as Array<{ buildId: string; ops: unknown[]; baseCommit: string }>,
  publishes: [] as Array<{ buildId: string; baseCommit: string; ops: unknown[] }>,
  guide: null as string | null,
  buildStatus: "succeeded" as "queued" | "running" | "succeeded" | "failed",
  /** The publish the builder is running, and something to run in the middle of one. */
  publishing: null as null | Promise<void>,
  duringPublish: null as null | (() => Promise<unknown>),
  /** A push the portal hasn't read: the builder refuses the next publish. */
  moved: false,
  /** The builder restarted: it answers 404 for every build it had (E47). */
  buildGone: false,
}));
vi.mock("@/lib/builder-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/builder-client")>("@/lib/builder-client");
  return {
    ...actual,
    fetchContent: vi.fn(async () => ({ commit: builder.commit, content: structuredClone(builder.content), guide: builder.guide, contractVersion: "0.2.0" })),
    requestPreview: vi.fn(async (_site, buildId: string, ops: unknown[], baseCommit: string) => {
      builder.previews.push({ buildId, ops, baseCommit });
      return { id: buildId, status: "queued" };
    }),
    fetchBuild: vi.fn(async (_slug, id: string) => {
      if (builder.buildGone) throw new actual.BuilderError("No such build", undefined, 404);
      return { id, status: builder.buildStatus, log: "", error: builder.buildStatus === "failed" ? "boom" : undefined };
    }),
    requestPublish: vi.fn(async (_site, args: { buildId: string; baseCommit: string; ops: unknown[] }) => {
      // The builder runs one job per site: a second publish of a build waits for the
      // first, then finds the branch moved (apps/builder/src/sites.ts, publish).
      if (builder.moved || builder.publishes.some((p) => p.buildId === args.buildId)) {
        await builder.publishing;
        if (builder.duringPublish) await builder.duringPublish();
        await new Promise((r) => setTimeout(r, 50));
        throw new actual.BuilderError("The site changed since this preview. Preview the change again.");
      }
      let done!: () => void;
      builder.publishing = new Promise<void>((r) => (done = r));
      builder.publishes.push(args);
      try {
        if (builder.duringPublish) await builder.duringPublish();
      } finally {
        builder.publishing = null;
        done();
      }
      return { commit: "b".repeat(40), log: "" };
    }),
  };
});

const tools = await import("./index");
const hold = await import("./hold");
const { BUILDER_FAILED } = await import("./builder-failure");

/** The JSON lines logged under an event. */
function loggedEvents(spy: MockInstance<typeof console.error>, event: string): unknown[] {
  return spy.mock.calls.flatMap(([line]) => {
    try {
      const parsed = JSON.parse(String(line));
      return parsed?.event === event ? [parsed] : [];
    } catch {
      return [];
    }
  });
}

type Menu = Array<{ services: Array<Record<string, string>> }>;
const { ToolError } = tools;

const CONTENT = {
  site: {
    name: "Demo Salon",
    description: "A salon.",
    contact: { phone: "555-0100", bookingUrl: "https://book.example.com" },
    hours: { kind: "weekly", days: [{ day: "tuesday", opens: "12:00", closes: "17:00" }] },
    socials: [],
  },
  services: [{ id: "haircuts", name: "Haircuts", services: [{ id: "haircut", name: "Haircut", priceLabel: "$85" }] }],
  announcements: [],
};

const PRICE = [{ collection: "services", op: "replace", path: "/0/services/0/priceLabel", value: "$90" }];
const ANNOUNCE = [{ collection: "announcements", op: "add", path: "/-", value: { id: "closed", message: "Closed Monday the 20th." } }];
// The same changes as the draft stores them: by address (PRD D36).
const PRICE_AT = "services/haircuts/services/haircut/priceLabel";
const PRICE_OP = { op: "replace", address: PRICE_AT, value: "$90" };
const ANNOUNCE_OP = { op: "add", address: "announcements", value: { id: "closed", message: "Closed Monday the 20th." } };

async function siteAccount() {
  const { account, user } = await createAccount({ planCode: "SITES" });
  const site = await createSite(account.id);
  await prisma.site.update({
    where: { id: site.id },
    data: { repoUrl: "https://github.com/example/site", lockedFields: ["site/contact/phone", "site/contact/email", "site/contact/address"] },
  });
  return { account, user, site, ctx: { accountId: account.id, userId: user.id, source: "QUICK_EDIT" as const } };
}

/** A session as the preview checks see it: the user's own memberships, not acting. */
function as(userId: string) {
  return { user: { id: userId, email: "", name: null, role: "USER" }, memberships: [], actingAs: null };
}

beforeEach(async () => {
  await resetDatabase();
  resetRateLimits();
  builder.content = structuredClone(CONTENT);
  builder.commit = "a".repeat(40);
  builder.previews = [];
  builder.publishes = [];
  builder.guide = null;
  builder.buildStatus = "succeeded";
  builder.publishing = null;
  builder.duringPublish = null;
  builder.moved = false;
  builder.buildGone = false;
});

describe("the site's time zone", () => {
  it("is its account's, for the builder and for the view quick edit reads today's date from", async () => {
    const { account } = await siteAccount();
    await prisma.account.update({ where: { id: account.id }, data: { timeZone: "America/New_York" } });
    const { fetchContent } = await import("@/lib/builder-client");

    const view = await tools.getContentView(account.id);

    expect(view.site.timeZone).toBe("America/New_York");
    expect(vi.mocked(fetchContent).mock.lastCall?.[0]).toMatchObject({ timeZone: "America/New_York" });
  });
});

describe("proposeChange", () => {
  it("records a DRAFT change with a queued build and starts the preview at the published commit", async () => {
    const { ctx, site } = await siteAccount();
    const { changeSetId, buildId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    const cs = await prisma.changeSet.findUniqueOrThrow({ where: { id: changeSetId }, include: { builds: true } });
    expect(cs).toMatchObject({ siteId: site.id, status: "DRAFT", baseCommit: builder.commit, source: "QUICK_EDIT", version: 1 });
    expect(cs.builds.map((b) => [b.id, b.draftVersion])).toEqual([[buildId, 1]]);
    // The model's pointer ops are kept as addresses, so the draft survives reordering.
    expect(cs.ops).toEqual([{ ...PRICE_OP, summary: "Haircut to $90" }]);
    expect(builder.previews).toEqual([{ buildId, ops: [PRICE_OP], baseCommit: builder.commit }]);
  });

  it("refuses a change to a locked field", async () => {
    const { ctx } = await siteAccount();
    const err = await tools
      .proposeChange(ctx, { summary: "New phone", ops: [{ collection: "site", op: "replace", path: "/contact/phone", value: "555-9999" }] })
      .catch((e) => e);
    expect(err).toBeInstanceOf(ToolError);
    expect(err.message).toBe("Phone is locked: Canopy changes it.");
    expect(err.outOfLane).toBe(true);
    expect(err.issues).toEqual([{ collection: "site", path: "/contact/phone", address: "site/contact/phone", message: "Phone is locked: Canopy changes it" }]);
    expect(await prisma.changeSet.count()).toBe(0);
    expect(builder.previews).toHaveLength(0);
  });

  it("refuses a change that breaks the contract, with the reason", async () => {
    const { ctx } = await siteAccount();
    const err = await tools
      .proposeChange(ctx, { summary: "Markup", ops: [{ collection: "services", op: "replace", path: "/0/name", value: "<b>Cuts</b>" }] })
      .catch((e) => e);
    expect(err).toBeInstanceOf(ToolError);
    expect(err.message).toContain("services/0/name: Plain text only");
    expect(await prisma.changeSet.count()).toBe(0);
  });

  it("refuses ops that don't apply, ops in the wrong shape, and changes that change nothing", async () => {
    const { ctx } = await siteAccount();
    await expect(tools.proposeChange(ctx, { summary: "x", ops: [{ collection: "services", op: "replace", path: "/7/name", value: "x" }] })).rejects.toThrow(
      /past the end/,
    );
    await expect(tools.proposeChange(ctx, { summary: "x", ops: [{ collection: "widgets", op: "add", path: "/-", value: 1 }] })).rejects.toThrow(
      /right shape/,
    );
    await expect(
      tools.proposeChange(ctx, { summary: "x", ops: [{ collection: "services", op: "replace", path: "/0/services/0/priceLabel", value: "$85" }] }),
    ).rejects.toThrow(/doesn't change anything/);
  });

  it("adds to the site's one draft, superseding the build of the version before", async () => {
    const { ctx } = await siteAccount();
    builder.buildStatus = "running";
    const first = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    const second = await tools.proposeChange(ctx, { summary: "Closed Monday", ops: ANNOUNCE });
    expect(second.changeSetId).toBe(first.changeSetId);
    const cur = await prisma.changeSet.findUniqueOrThrow({ where: { id: first.changeSetId }, include: { builds: { orderBy: { createdAt: "asc" } } } });
    expect(cur).toMatchObject({ status: "DRAFT", version: 2, summary: "Haircut to $90; Closed Monday" });
    expect(cur.ops).toEqual([
      { ...PRICE_OP, summary: "Haircut to $90" },
      { ...ANNOUNCE_OP, summary: "Closed Monday" },
    ]);
    expect(cur.builds.map((b) => [b.status, b.draftVersion])).toEqual([
      ["SUPERSEDED", 1],
      ["QUEUED", 2],
    ]);
  });

  it("rebases the draft onto a Canopy push when its changes still fit", async () => {
    const { ctx } = await siteAccount();
    const first = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    // Canopy adds a category ahead of haircuts: every position moves, the address doesn't.
    builder.commit = "c".repeat(40);
    builder.content.services = [{ id: "color", name: "Color", services: [{ id: "gloss", name: "Gloss", priceLabel: "$60" }] }, ...(builder.content.services as object[])];
    const view = await tools.getContentView(ctx.accountId);
    expect(view.pending).toMatchObject({ id: first.changeSetId, version: 2 });
    expect((view.content.services as Menu)[1].services[0].priceLabel).toBe("$90");
    expect(await prisma.changeSet.findUniqueOrThrow({ where: { id: first.changeSetId } })).toMatchObject({ baseCommit: "c".repeat(40), status: "DRAFT" });
    expect(builder.previews.at(-1)).toMatchObject({ baseCommit: "c".repeat(40), ops: [PRICE_OP] });
  });

  it("fails a draft that no longer fits after a Canopy push, and starts a new one", async () => {
    const { ctx } = await siteAccount();
    const first = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    builder.commit = "c".repeat(40);
    (builder.content.services as Menu)[0].services = [{ id: "trim", name: "Trim", priceLabel: "$30" }];
    const second = await tools.proposeChange(ctx, { summary: "Closed Monday", ops: ANNOUNCE });
    expect(await prisma.changeSet.findUniqueOrThrow({ where: { id: first.changeSetId } })).toMatchObject({ status: "FAILED" });
    expect((await prisma.changeSet.findUniqueOrThrow({ where: { id: first.changeSetId } })).error).toMatch(/no longer fits/);
    expect((await prisma.changeSet.findUniqueOrThrow({ where: { id: second.changeSetId } })).ops).toEqual([{ ...ANNOUNCE_OP, summary: "Closed Monday" }]);
  });

  it("is rate limited per account", async () => {
    const { ctx } = await siteAccount();
    for (let i = 0; i < tools.PROPOSALS_PER_HOUR; i++) {
      await tools.proposeChange(ctx, { summary: `Price ${i}`, ops: [{ ...PRICE[0], value: `$${100 + i}` }] });
    }
    await expect(tools.proposeChange(ctx, { summary: "One more", ops: PRICE })).rejects.toThrow(/Too many changes/);
  });

  it("refuses an account without a site", async () => {
    const { account, user } = await createAccount({ planCode: "SITES" });
    await expect(tools.proposeChange({ accountId: account.id, userId: user.id, source: "QUICK_EDIT" }, { summary: "x", ops: PRICE })).rejects.toThrow(
      /no site/,
    );
  });
});

describe("the lane (PRD D50)", () => {
  const PAGES = [
    {
      id: "home",
      path: "/",
      title: "Demo Salon",
      description: "A salon.",
      hero: { subheadline: "Cuts and color.", cta: { label: "Book", href: "https://book.example.com" } },
      sections: [{ id: "why", eyebrow: "Why us", heading: "Why people come back" }],
    },
  ];
  const withPages = () => {
    builder.content = { ...structuredClone(CONTENT), pages: structuredClone(PAGES) };
  };

  it("refuses Canopy's fields from the canvas and from quick edit alike, naming each", async () => {
    withPages();
    const { ctx, site } = await siteAccount();
    const canvas = await tools.saveDraft({ ...ctx, source: "EDITOR" }, site.id, { ops: [{ op: "replace", address: "pages/home/title", value: "Cheap cuts" }] }).catch((e) => e);
    expect(canvas).toBeInstanceOf(ToolError);
    expect(canvas.issues).toEqual([{ collection: "pages", path: "/0/title", address: "pages/home/title", message: "Page title is Canopy's to change" }]);
    await expect(
      tools.proposeChange(ctx, { summary: "Eyebrow", ops: [{ collection: "pages", op: "replace", path: "/0/sections/0/eyebrow", value: "Deals" }] }),
    ).rejects.toThrow(/Eyebrow is Canopy's to change/);
    await expect(
      tools.proposeChange(ctx, { summary: "Button", ops: [{ collection: "pages", op: "replace", path: "/0/hero/cta/label", value: "Buy" }] }),
    ).rejects.toThrow(/Button is Canopy's to change/);
    expect(await prisma.changeSet.count()).toBe(0);
    // The owner's own copy beside them is theirs.
    const ok = await tools.proposeChange(ctx, { summary: "Hero", ops: [{ collection: "pages", op: "replace", path: "/0/hero/subheadline", value: "Cuts, color, and care." }] });
    expect(ok.changes.map((c) => c.address)).toEqual(["pages/home/hero/subheadline"]);
  });

  it("keeps fixed lists' entries: sections everywhere, and the lists a site fixes", async () => {
    withPages();
    const { ctx, site } = await siteAccount();
    await expect(
      tools.proposeChange(ctx, { summary: "Promo", ops: [{ collection: "pages", op: "add", path: "/0/sections/-", value: { id: "promo", heading: "Deals" } }] }),
    ).rejects.toThrow(/only Canopy adds, removes, or reorders these/);
    await prisma.site.update({ where: { id: site.id }, data: { fixedLists: ["services"] } });
    const NEW_CATEGORY = { id: "color", name: "Color", services: [{ id: "gloss", name: "Gloss", priceLabel: "$60" }] };
    await expect(
      tools.proposeChange(ctx, { summary: "Color", ops: [{ collection: "services", op: "add", path: "/-", value: NEW_CATEGORY }] }),
    ).rejects.toThrow(/Services and prices: only Canopy adds/);
    // Inside a fixed list, the fields stay the owner's.
    expect((await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE })).changeSetId).toBeTruthy();
  });

  it("fails closed on a lock that isn't an address, rather than letting the edit through", async () => {
    const { ctx, site } = await siteAccount();
    await prisma.site.update({ where: { id: site.id }, data: { lockedFields: ["site.contact.phone"] } });
    await expect(tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE })).rejects.toThrow(/can't be edited until Canopy fixes its settings/);
    expect(await prisma.changeSet.count()).toBe(0);
  });

  it("enforces the site guide's counts and refused phrases", async () => {
    const { ctx } = await siteAccount();
    builder.guide = "---\ncounts:\n  services/*/services: 1\nrefuse:\n  - free trial\n---\n";
    await expect(
      tools.proposeChange(ctx, {
        summary: "Trim",
        ops: [{ collection: "services", op: "add", path: "/0/services/-", value: { id: "trim", name: "Trim", priceLabel: "$40" } }],
      }),
    ).rejects.toThrow(/at most 1 on this site/);
    await expect(
      tools.proposeChange(ctx, {
        summary: "Trial",
        ops: [{ collection: "announcements", op: "add", path: "/-", value: { id: "trial", message: "Free trial this week." } }],
      }),
    ).rejects.toMatchObject({ message: expect.stringMatching(/doesn't say "Free trial"/), outOfLane: true });
  });

  it("checks the guide only on what an edit changes, and shows the operator what the published site breaks (E47)", async () => {
    const { ctx, site } = await siteAccount();
    // Published copy past the guide, as a Canopy push or a tightened guide leaves it.
    const menu = builder.content.services as Menu;
    menu[0].services[0].name = "Haircut and blow-dry";
    menu[0].services.push({ id: "trim", name: "Trim", priceLabel: "$40" });
    (builder.content.site as Record<string, unknown>).description = "A salon with a free trial.";
    builder.guide = "---\nlimits:\n  services/*/services/*/name: 10\ncounts:\n  services/*/services: 1\nrefuse:\n  - free trial\n---\n";
    const editor = { ...ctx, source: "EDITOR" as const };

    // An edit elsewhere goes through, beside a list it doesn't lengthen.
    expect((await tools.saveDraft(editor, site.id, { ops: [PRICE_OP] })).changeSetId).toBeTruthy();
    expect((await tools.saveDraft(editor, site.id, { ops: [{ op: "replace", address: "services/haircuts/services/trim/priceLabel", value: "$45" }] })).version).toBe(2);
    // The rules still hold for what the owner changes.
    await expect(
      tools.saveDraft(editor, site.id, { ops: [{ op: "replace", address: "services/haircuts/services/haircut/name", value: "Haircut and style" }] }),
    ).rejects.toThrow(/10 characters or fewer/);
    await expect(
      tools.saveDraft(editor, site.id, { ops: [{ op: "add", address: "services/haircuts/services", value: { id: "gloss", name: "Gloss", priceLabel: "$60" } }] }),
    ).rejects.toThrow(/at most 1 on this site/);
    await expect(
      tools.saveDraft(editor, site.id, { ops: [{ op: "add", address: "announcements", value: { id: "trial", message: "Free trial this week." } }] }),
    ).rejects.toMatchObject({ outOfLane: true });

    vi.stubEnv("BUILDER_URL", "http://builder.test.invalid:4100");
    vi.stubEnv("BUILDER_TOKEN", "test-token");
    try {
      expect(await tools.publishedGuideIssues(site.id)).toEqual({
        status: "read",
        issues: [
          { address: "services/haircuts/services/haircut/name", message: "Must be 10 characters or fewer on this site" },
          { address: "services/haircuts/services", message: expect.stringMatching(/at most 1 on this site/) },
          { address: "site/description", message: `This site doesn't say "free trial": that's Canopy's call` },
        ],
      });
      builder.content = structuredClone(CONTENT);
      builder.guide = null;
      expect(await tools.publishedGuideIssues(site.id)).toEqual({ status: "read", issues: [] });
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("says what each write changed, against the draft it started from, with what the copy avoids", async () => {
    const { ctx } = await siteAccount();
    builder.guide = "---\navoid:\n  - em-dash\n---\n";
    const first = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    expect(first.changes).toEqual([
      { address: PRICE_AT, kind: "changed", label: "Haircut: Price", before: "$85", after: "$90", text: 'Haircut: Price: "$85" to "$90"' },
    ]);
    expect(first.warnings).toEqual([]);
    const second = await tools.proposeChange(ctx, {
      summary: "Closed Monday",
      ops: [{ collection: "announcements", op: "add", path: "/-", value: { id: "closed", message: "Closed Monday — back Tuesday." } }],
    });
    // Only this write's change, though the draft holds both.
    expect(second.changes.map((c) => c.text)).toEqual(['Added "Closed Monday — back Tuesday." to Announcements']);
    expect(second.warnings.map((w) => w.message)).toEqual(["Message has an em dash, which this site's copy avoids"]);
  });
});

describe("a builder failure (Epic 46, H6)", () => {
  let logged: MockInstance<typeof console.error>;
  beforeEach(() => {
    logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => logged.mockRestore());

  it("reaches the owner as a plain try-again from Quick Edit's read, its proposal, and the Editor's save, and is logged with the site", async () => {
    const { ctx, site } = await siteAccount();
    const { BuilderError, fetchContent } = await import("@/lib/builder-client");
    const fails = () => vi.mocked(fetchContent).mockRejectedValueOnce(new BuilderError("git fetch exited with 128"));
    const plain = { message: BUILDER_FAILED.read };
    fails();
    await expect(tools.getContentView(ctx.accountId)).rejects.toSatisfy((e) => e instanceof ToolError && e.message === plain.message);
    fails();
    await expect(tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE })).rejects.toMatchObject(plain);
    fails();
    await expect(tools.saveDraft({ ...ctx, source: "EDITOR" }, site.id, { ops: [PRICE_OP] })).rejects.toMatchObject(plain);
    expect(loggedEvents(logged, "builder_read_failed")).toEqual(
      Array(3).fill({ event: "builder_read_failed", slug: site.slug, message: "git fetch exited with 128" }),
    );
    expect(await prisma.changeSet.count()).toBe(0);
    // A minute later the builder reads the site again, and so does Quick Edit.
    await expect(tools.getContentView(ctx.accountId)).resolves.toMatchObject({ site: { slug: site.slug } });
  });

  it("saves a change whose preview the builder won't start, says so plainly, and keeps the builder's message on the build", async () => {
    const { ctx, site } = await siteAccount();
    const { BuilderError, requestPreview } = await import("@/lib/builder-client");
    const raw = "The site builder didn't respond (TimeoutError).";
    vi.mocked(requestPreview).mockRejectedValueOnce(new BuilderError(raw));
    await expect(tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE })).rejects.toMatchObject({ message: BUILDER_FAILED.preview });
    vi.mocked(requestPreview).mockRejectedValueOnce(new BuilderError(raw));
    const saved = await tools.saveDraft({ ...ctx, source: "EDITOR" }, site.id, { ops: [ANNOUNCE_OP] });
    expect(saved.buildError).toBe(BUILDER_FAILED.preview);

    const cs = await prisma.changeSet.findUniqueOrThrow({ where: { id: saved.changeSetId! }, include: { builds: { orderBy: { createdAt: "asc" } } } });
    expect(cs.ops).toHaveLength(2);
    // The operator's builds card shows what the builder said.
    expect(cs.builds.map((b) => ({ status: b.status, error: b.error }))).toEqual([
      { status: "FAILED", error: raw },
      { status: "FAILED", error: raw },
    ]);
    expect(loggedEvents(logged, "builder_preview_failed")).toEqual(
      cs.builds.map((b) => ({ event: "builder_preview_failed", slug: site.slug, buildId: b.id, message: raw })),
    );
  });

  it("leaves a draft whose preview build failed with a plain line, and the builder's reason on the build and in the log", async () => {
    const { ctx, site } = await siteAccount();
    builder.buildStatus = "failed";
    const { changeSetId, buildId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    expect(await tools.refreshChange(ctx.accountId, changeSetId)).toMatchObject({ status: "DRAFT", buildStatus: "FAILED", error: BUILDER_FAILED.build });
    // What the chrome's "Preview failed" and the preview bar read.
    expect((await tools.getEditorChanges(ctx.accountId)).pending).toMatchObject({ buildStatus: "FAILED", error: BUILDER_FAILED.build });
    // The operator's builds card shows what the builder said.
    expect(await prisma.build.findUniqueOrThrow({ where: { id: buildId } })).toMatchObject({ status: "FAILED", error: "boom" });
    expect(loggedEvents(logged, "builder_build_failed")).toEqual([{ event: "builder_build_failed", slug: site.slug, buildId, message: "boom" }]);

    // As the line says, the next edit builds it again.
    builder.buildStatus = "succeeded";
    const next = await tools.saveDraft({ ...ctx, source: "EDITOR" }, site.id, { ops: [ANNOUNCE_OP] });
    expect(await tools.refreshChange(ctx.accountId, next.changeSetId!)).toMatchObject({ status: "PREVIEWED", buildStatus: "SUCCEEDED", error: null });
  });
});

describe("content reads", () => {
  it("record the contract version the repo installs, which a Canopy push can move (PRD D24)", async () => {
    const { account, site } = await siteAccount();
    await prisma.site.update({ where: { id: site.id }, data: { contractVersion: "0.1.0" } });

    await tools.getContentView(account.id);

    expect(await prisma.site.findUniqueOrThrow({ where: { id: site.id } })).toMatchObject({ contractVersion: "0.2.0" });
  });
});

describe("ownership", () => {
  it("never lets one account refresh, publish, or discard another account's change", async () => {
    const a = await siteAccount();
    const b = await siteAccount();
    const { changeSetId, buildId } = await tools.proposeChange(a.ctx, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(a.ctx.accountId, changeSetId);
    await expect(tools.refreshChange(b.ctx.accountId, changeSetId)).rejects.toThrow("No such change.");
    await expect(tools.publishChange(b.ctx, changeSetId, buildId, { name: "B", email: "b@test.invalid" })).rejects.toThrow("No such change.");
    await expect(tools.discardChange(b.ctx, changeSetId)).rejects.toThrow("No such change.");
    expect(builder.publishes).toHaveLength(0);
    expect((await prisma.changeSet.findUniqueOrThrow({ where: { id: changeSetId } })).status).toBe("PREVIEWED");
  });

  it("lets every member of the owning account preview, and nobody else", async () => {
    const a = await siteAccount();
    const member = await createMember(a.account.id, "MEMBER");
    const b = await siteAccount();
    expect(await tools.canPreviewSite(as(a.user.id), a.site.id)).toBe(true);
    expect(await tools.canPreviewSite(as(member.id), a.site.id)).toBe(true);
    expect(await tools.canPreviewSite(as(b.user.id), a.site.id)).toBe(false);
  });

  it("lets a Global Admin acting as the account preview, and only that account (PRD D49)", async () => {
    const a = await siteAccount();
    const b = await siteAccount();
    const { user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const acting = { ...as(operator.id), actingAs: { id: "act", accountId: a.account.id } };
    expect(await tools.canPreviewSite(acting, a.site.id)).toBe(true);
    expect(await tools.previewableSite(acting, a.site.id)).toMatchObject({ id: a.site.id });
    expect(await tools.canPreviewSite(acting, b.site.id)).toBe(false);
    expect(await tools.canPreviewSite(as(operator.id), a.site.id)).toBe(false);
  });
});

describe("refresh and publish", () => {
  it("moves DRAFT to PREVIEWED when the build succeeds, then publishes it", async () => {
    const { ctx } = await siteAccount();
    const { changeSetId, buildId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    expect(await tools.refreshChange(ctx.accountId, changeSetId)).toMatchObject({ status: "PREVIEWED", buildStatus: "SUCCEEDED" });
    const { commit } = await tools.publishChange(ctx, changeSetId, buildId, { name: "Owner", email: "owner@test.invalid" });
    expect(commit).toBe("b".repeat(40));
    expect(builder.publishes).toMatchObject([{ buildId, baseCommit: builder.commit }]);
    const cs = await prisma.changeSet.findUniqueOrThrow({ where: { id: changeSetId } });
    expect(cs).toMatchObject({ status: "PUBLISHED", publishedCommit: "b".repeat(40) });
  });

  it("refuses to publish a change whose preview hasn't finished or failed", async () => {
    const { ctx } = await siteAccount();
    builder.buildStatus = "running";
    const { changeSetId, buildId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(ctx.accountId, changeSetId);
    await expect(tools.publishChange(ctx, changeSetId, buildId, { name: "O", email: "o@test.invalid" })).rejects.toThrow(/finished preview/);

    // A failed build keeps the draft, so no edit is lost.
    builder.buildStatus = "failed";
    expect(await tools.refreshChange(ctx.accountId, changeSetId)).toMatchObject({ status: "DRAFT", buildStatus: "FAILED", error: BUILDER_FAILED.build });
    await expect(tools.publishChange(ctx, changeSetId, buildId, { name: "O", email: "o@test.invalid" })).rejects.toThrow(/finished preview/);
    expect(builder.publishes).toHaveLength(0);
  });

  it("refuses to publish a PREVIEWED change whose latest build did not succeed", async () => {
    const { ctx, site } = await siteAccount();
    const { changeSetId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(ctx.accountId, changeSetId);
    const failed = await prisma.build.create({ data: { siteId: site.id, changeSetId, status: "FAILED" } });
    await expect(tools.publishChange(ctx, changeSetId, failed.id, { name: "O", email: "o@test.invalid" })).rejects.toThrow(/finished preview/);
  });

  it("publishes only the build the preview page showed", async () => {
    const { ctx } = await siteAccount();
    const { changeSetId, buildId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(ctx.accountId, changeSetId);
    // The page loaded an earlier build (or none): an edit since then must be seen first.
    await expect(tools.publishChange(ctx, changeSetId, "an-older-build", { name: "O", email: "o@test.invalid" })).rejects.toThrow(/changed since this page loaded/);
    expect(builder.publishes).toHaveLength(0);
    await tools.publishChange(ctx, changeSetId, buildId, { name: "O", email: "o@test.invalid" });
    expect(builder.publishes).toMatchObject([{ buildId }]);
  });

  it("records one publish when Publish is pressed twice, and answers both with it", async () => {
    const { ctx } = await siteAccount();
    const { changeSetId, buildId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(ctx.accountId, changeSetId);
    const author = { name: "O", email: "o@test.invalid" };
    const results = await Promise.all([
      tools.publishChange(ctx, changeSetId, buildId, author),
      tools.publishChange(ctx, changeSetId, buildId, author),
    ]);
    // The builder published once and refused the second; the change that went live reads as published.
    expect(builder.publishes).toHaveLength(1);
    expect(results).toEqual([{ commit: "b".repeat(40) }, { commit: "b".repeat(40) }]);
    const cs = await prisma.changeSet.findUniqueOrThrow({ where: { id: changeSetId } });
    expect(cs).toMatchObject({ status: "PUBLISHED", error: null, publishedCommit: "b".repeat(40) });
  });

  it("keeps a refusal from the builder off a change that has moved on", async () => {
    const { ctx, site } = await siteAccount();
    const { changeSetId, buildId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(ctx.accountId, changeSetId);
    // A Canopy push the portal hasn't read yet: the builder refuses, and an edit saved meanwhile stays a draft.
    builder.moved = true;
    builder.duringPublish = () =>
      tools.saveDraft({ ...ctx, source: "EDITOR" }, site.id, { ops: [{ op: "replace", address: "site/name", value: "Demo Salon & Spa" }] });
    await expect(tools.publishChange(ctx, changeSetId, buildId, { name: "O", email: "o@test.invalid" })).rejects.toThrow(/changed since this preview/);
    const cs = await prisma.changeSet.findUniqueOrThrow({ where: { id: changeSetId } });
    expect(cs).toMatchObject({ status: "DRAFT", version: 2 });
  });

  it("answers a publish the builder fails with a plain try-again, logged, and the change stays ready to publish", async () => {
    const { ctx, site } = await siteAccount();
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const { changeSetId, buildId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
      await tools.refreshChange(ctx.accountId, changeSetId);
      const { BuilderError, requestPublish } = await import("@/lib/builder-client");
      vi.mocked(requestPublish).mockRejectedValueOnce(new BuilderError("git push exited with 128"));
      const author = { name: "O", email: "o@test.invalid" };
      await expect(tools.publishChange(ctx, changeSetId, buildId, author)).rejects.toMatchObject({ message: BUILDER_FAILED.publish });
      expect(loggedEvents(logged, "builder_publish_failed")).toEqual([
        { event: "builder_publish_failed", slug: site.slug, changeSetId, message: "git push exited with 128" },
      ]);
      expect(await prisma.changeSet.findUniqueOrThrow({ where: { id: changeSetId } })).toMatchObject({ status: "PREVIEWED", error: null });
      // Trying again is all it takes.
      expect(await tools.publishChange(ctx, changeSetId, buildId, author)).toEqual({ commit: "b".repeat(40) });
    } finally {
      logged.mockRestore();
    }
  });

  it("keeps an edit saved during a publish as the site's new draft", async () => {
    const { ctx, site } = await siteAccount();
    const { changeSetId, buildId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(ctx.accountId, changeSetId);
    builder.duringPublish = async () => {
      await tools.saveDraft({ ...ctx, source: "EDITOR" }, site.id, { ops: [{ op: "replace", address: "site/name", value: "Demo Salon & Spa" }] });
      // The publish moves the branch: the price is now what the repo holds.
      builder.commit = "b".repeat(40);
      (builder.content.services as Menu)[0].services[0].priceLabel = "$90";
    };
    await tools.publishChange(ctx, changeSetId, buildId, { name: "O", email: "o@test.invalid" });

    // What went live is recorded as it was sent: the price, and not the name.
    expect(builder.publishes[0].ops).toEqual([PRICE_OP]);
    const cs = await prisma.changeSet.findUniqueOrThrow({ where: { id: changeSetId } });
    expect(cs).toMatchObject({ status: "PUBLISHED", publishedCommit: "b".repeat(40), version: 1 });
    expect(cs.ops).toMatchObject([PRICE_OP]);

    // The name is still a draft, on the published commit, with a build of its own.
    const view = await tools.getDraftView(ctx.accountId, site.id);
    expect(view.pending).toMatchObject({ status: "DRAFT", buildStatus: "QUEUED" });
    expect(view.pending!.id).not.toBe(changeSetId);
    expect(view.content.site).toMatchObject({ name: "Demo Salon & Spa" });
    const draft = await prisma.changeSet.findUniqueOrThrow({ where: { id: view.pending!.id } });
    expect(draft.baseCommit).toBe("b".repeat(40));
    expect(draft.ops).toEqual([{ op: "replace", address: "site/name", value: "Demo Salon & Spa" }]);
    expect(builder.previews.at(-1)).toMatchObject({ baseCommit: "b".repeat(40), ops: [{ op: "replace", address: "site/name", value: "Demo Salon & Spa" }] });
  });

  it("starts a build the builder lost in a restart again, once per version (E47)", async () => {
    const { ctx, site } = await siteAccount();
    const editor = { ...ctx, source: "EDITOR" as const };
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const saved = await tools.saveDraft(editor, site.id, { ops: [PRICE_OP] });
      const changeSetId = saved.changeSetId!;
      builder.buildGone = true;
      // Two refreshes at once start one new build, of the same version on the same commit.
      const both = await Promise.all([tools.refreshChange(ctx.accountId, changeSetId), tools.refreshChange(ctx.accountId, changeSetId)]);
      expect(both).toMatchObject([
        { status: "DRAFT", buildStatus: "QUEUED", buildVersion: 1 },
        { status: "DRAFT", buildStatus: "QUEUED", buildVersion: 1 },
      ]);
      const builds = await prisma.build.findMany({ where: { changeSetId }, orderBy: { createdAt: "asc" } });
      expect(builds).toMatchObject([
        { id: saved.buildId, status: "FAILED", error: "The builder restarted and lost this build.", draftVersion: 1 },
        { status: "QUEUED", error: null, draftVersion: 1, baseCommit: builder.commit },
      ]);
      expect(builder.previews.map((p) => p.buildId)).toEqual([saved.buildId, builds[1].id]);
      // The builder builds it, and the draft can be published.
      builder.buildGone = false;
      expect(await tools.refreshChange(ctx.accountId, changeSetId)).toMatchObject({ status: "PREVIEWED", buildStatus: "SUCCEEDED" });

      // A version lost twice isn't started a third time: the draft says so, as a failed build does.
      const next = await tools.saveDraft(editor, site.id, { ops: [ANNOUNCE_OP] });
      builder.buildGone = true;
      expect(await tools.refreshChange(ctx.accountId, changeSetId)).toMatchObject({ buildStatus: "QUEUED", buildVersion: 2 });
      expect(await tools.refreshChange(ctx.accountId, changeSetId)).toMatchObject({ status: "DRAFT", buildStatus: "FAILED", error: BUILDER_FAILED.build });
      expect(await prisma.build.count({ where: { changeSetId, draftVersion: 2 } })).toBe(2);
      expect(await tools.refreshChange(ctx.accountId, changeSetId)).toMatchObject({ buildStatus: "FAILED" });
      // Each version built twice: its own build, and the one started when it was lost.
      expect(builder.previews.map((p) => p.buildId).slice(2, 3)).toEqual([next.buildId]);
      expect(builder.previews).toHaveLength(4);
    } finally {
      logged.mockRestore();
    }
  });

  it("runs the guardrails again at publish, so a rule added since the draft was saved applies to it (E47)", async () => {
    const { ctx, site } = await siteAccount();
    const editor = { ...ctx, source: "EDITOR" as const };
    const author = { name: "O", email: "o@test.invalid" };
    const previewed = async (op: Record<string, unknown>) => {
      const saved = await tools.saveDraft(editor, site.id, { ops: [op] });
      await tools.refreshChange(ctx.accountId, saved.changeSetId!);
      return { changeSetId: saved.changeSetId!, buildId: saved.buildId! };
    };
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      // A lock added after the draft was saved.
      const named = await previewed({ op: "replace", address: "site/name", value: "Demo Salon & Spa" });
      await prisma.site.update({ where: { id: site.id }, data: { lockedFields: { push: "site/name" } } });
      await expect(tools.publishChange(ctx, named.changeSetId, named.buildId, author)).rejects.toMatchObject({
        message: expect.stringMatching(/locked/),
        outOfLane: true,
      });
      expect(await prisma.changeSet.findUniqueOrThrow({ where: { id: named.changeSetId } })).toMatchObject({
        status: "FAILED",
        error: expect.stringMatching(/^This no longer fits the site's rules\. .*locked/),
      });

      // A guide limit added after: refused too, and nothing went to the builder.
      const priced = await previewed(PRICE_OP);
      builder.guide = "---\nlimits:\n  services/*/services/*/priceLabel: 2\n---\n";
      await expect(tools.publishChange(ctx, priced.changeSetId, priced.buildId, author)).rejects.toThrow(/2 characters or fewer/);
      expect(builder.publishes).toHaveLength(0);

      // A read that fails is a plain try-again, and the draft stays ready to publish.
      builder.guide = null;
      const announced = await previewed(ANNOUNCE_OP);
      const { BuilderError, fetchContent } = await import("@/lib/builder-client");
      vi.mocked(fetchContent).mockRejectedValueOnce(new BuilderError("git fetch exited with 128"));
      await expect(tools.publishChange(ctx, announced.changeSetId, announced.buildId, author)).rejects.toMatchObject({ message: BUILDER_FAILED.read });
      expect(await prisma.changeSet.findUniqueOrThrow({ where: { id: announced.changeSetId } })).toMatchObject({ status: "PREVIEWED" });
      expect(await tools.publishChange(ctx, announced.changeSetId, announced.buildId, author)).toEqual({ commit: "b".repeat(40) });
    } finally {
      logged.mockRestore();
    }
  });

  it("discards only a pending change", async () => {
    const { ctx } = await siteAccount();
    const { changeSetId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    await tools.discardChange(ctx, changeSetId);
    await expect(tools.discardChange(ctx, changeSetId)).rejects.toThrow(/Only a pending change/);
  });
});

describe("saveDraft (the canvas)", () => {
  const price = (value: string) => [{ op: "replace", address: PRICE_AT, value }];

  it("merges edits to one field and counts versions, a build per save", async () => {
    const { ctx, site } = await siteAccount();
    const first = await tools.saveDraft(ctx, site.id, { ops: price("$88") });
    const second = await tools.saveDraft(ctx, site.id, { ops: price("$90") });
    expect(second).toMatchObject({ changeSetId: first.changeSetId, version: 2, summary: "Haircut price: $90", buildError: null });
    const cs = await prisma.changeSet.findUniqueOrThrow({ where: { id: first.changeSetId! } });
    expect(cs.ops).toEqual([PRICE_OP]);
    expect(builder.previews.map((p) => p.buildId)).toEqual([first.buildId, second.buildId]);
  });

  it("takes the last write to a field from any source, and writes that land together one after the other", async () => {
    const { ctx, site } = await siteAccount();
    await tools.saveDraft(ctx, site.id, { ops: price("$88") });
    await tools.proposeChange(ctx, { summary: "Haircut to $95", ops: [{ ...PRICE[0], value: "$95" }] });
    await tools.saveDraft(ctx, site.id, { ops: price("$90") });
    // Two saves at the same moment: neither is refused, both land.
    const [a, b] = await Promise.all([
      tools.saveDraft(ctx, site.id, { ops: [{ op: "replace", address: "site/name", value: "Demo Salon & Spa" }] }),
      tools.saveDraft(ctx, site.id, { ops: [{ op: "replace", address: "site/description", value: "A salon and spa." }] }),
    ]);
    expect([a.version, b.version].sort()).toEqual([4, 5]);
    const view = await tools.getDraftView(ctx.accountId, site.id);
    expect((view.content.services as Menu)[0].services[0].priceLabel).toBe("$90");
    expect(view.content.site).toMatchObject({ name: "Demo Salon & Spa", description: "A salon and spa." });
  });

  it("keeps two first writes at once in one draft, which the database holds a site to", async () => {
    const { ctx, site } = await siteAccount();
    await Promise.all([
      tools.saveDraft(ctx, site.id, { ops: [{ op: "replace", address: "site/name", value: "Demo Salon & Spa" }] }),
      tools.saveDraft(ctx, site.id, { ops: [{ op: "replace", address: "site/description", value: "A salon and spa." }] }),
    ]);
    expect(await prisma.changeSet.count({ where: { siteId: site.id, status: { in: ["DRAFT", "PREVIEWED"] } } })).toBe(1);
    const view = await tools.getDraftView(ctx.accountId, site.id);
    expect(view.content.site).toMatchObject({ name: "Demo Salon & Spa", description: "A salon and spa." });
    // Not by the code's care alone: a second pending change can't be stored.
    await expect(
      prisma.changeSet.create({ data: { siteId: site.id, source: "EDITOR", summary: "Another draft", ops: [], baseCommit: builder.commit } }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("drops an edit set back to the published value, and the draft when every edit is undone", async () => {
    const { ctx, site } = await siteAccount();
    const a = await tools.saveDraft(ctx, site.id, { ops: price("$90") });
    await tools.saveDraft(ctx, site.id, { ops: [{ op: "replace", address: "site/name", value: "New Name" }] });
    await tools.saveDraft(ctx, site.id, { ops: price("$85") });
    expect((await prisma.changeSet.findUniqueOrThrow({ where: { id: a.changeSetId! } })).ops).toEqual([{ op: "replace", address: "site/name", value: "New Name" }]);
    const d = await tools.saveDraft(ctx, site.id, { ops: [{ op: "replace", address: "site/name", value: "Demo Salon" }] });
    expect(d).toMatchObject({ changeSetId: null, version: 0 });
    expect(await prisma.changeSet.findUniqueOrThrow({ where: { id: a.changeSetId! } })).toMatchObject({ status: "DISCARDED" });
    // A save that changes nothing, with no draft, is not an error from the canvas.
    expect(await tools.saveDraft(ctx, site.id, { ops: price("$85") })).toMatchObject({ changeSetId: null });
  });

  it("enforces the site guide's limits, naming the field", async () => {
    const { ctx, site } = await siteAccount();
    builder.guide = "---\nlimits:\n  services/*/services/*/priceLabel: 4\n---\nPrices are whole dollars.\n";
    const err = await tools.saveDraft(ctx, site.id, { ops: price("$1,000") }).catch((e) => e);
    expect(err).toBeInstanceOf(ToolError);
    expect(err.issues).toEqual([
      { collection: "services", path: "/0/services/0/priceLabel", address: PRICE_AT, message: "Must be 4 characters or fewer on this site" },
    ]);
    expect(await prisma.changeSet.count()).toBe(0);
    // A guide Canopy mistyped doesn't stop the owner; the contract's caps still hold.
    builder.guide = "---\nlimit:\n  x: 1\n---\n";
    expect((await tools.saveDraft(ctx, site.id, { ops: price("$1,000") })).version).toBe(1);
  });

  it("is the account's own site only, and keeps every guardrail", async () => {
    const a = await siteAccount();
    const b = await siteAccount();
    await expect(tools.saveDraft(b.ctx, a.site.id, { ops: price("$90") })).rejects.toThrow("No such site.");
    await expect(tools.getDraftView(b.ctx.accountId, a.site.id)).rejects.toThrow("No such site.");
    await expect(tools.saveDraft(a.ctx, a.site.id, { ops: [{ op: "replace", address: "site/contact/phone", value: "555-9999" }] })).rejects.toThrow(
      /locked/,
    );
    await expect(tools.saveDraft(a.ctx, a.site.id, { ops: [{ op: "replace", address: "site/name", value: "<b>x</b>" }] })).rejects.toThrow(
      /Plain text only/,
    );
    await expect(tools.saveDraft(a.ctx, a.site.id, { ops: [{ collection: "site", op: "replace", path: "/name", value: "x" }] })).rejects.toThrow(
      /right shape/,
    );
    expect(await prisma.changeSet.count()).toBe(0);
  });

  it("is rate limited per account, separately from proposals", async () => {
    const { ctx, site } = await siteAccount();
    for (let i = 0; i < tools.SAVES_PER_HOUR; i++) isRateLimited(`site-tools:save:${ctx.accountId}`, tools.SAVES_PER_HOUR, 60 * 60 * 1000);
    await expect(tools.saveDraft(ctx, site.id, { ops: price("$90") })).rejects.toThrow(/Too many changes/);
    expect((await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE })).version).toBe(1);
  });

  it("publishes only a build of the draft's current version", async () => {
    const { ctx, site } = await siteAccount();
    const v1 = await tools.saveDraft(ctx, site.id, { ops: price("$88") });
    expect(await tools.refreshChange(ctx.accountId, v1.changeSetId!)).toMatchObject({ status: "PREVIEWED" });
    builder.buildStatus = "running";
    const v2 = await tools.saveDraft(ctx, site.id, { ops: price("$90") });
    expect(await prisma.changeSet.findUniqueOrThrow({ where: { id: v1.changeSetId! } })).toMatchObject({ status: "DRAFT", version: 2 });
    await expect(tools.publishChange(ctx, v1.changeSetId!, v2.buildId!, { name: "O", email: "o@test.invalid" })).rejects.toThrow(/finished preview/);
    builder.buildStatus = "succeeded";
    await tools.refreshChange(ctx.accountId, v1.changeSetId!);
    await tools.publishChange(ctx, v1.changeSetId!, v2.buildId!, { name: "O", email: "o@test.invalid" });
    expect(builder.publishes).toMatchObject([{ buildId: v2.buildId }]);
  });

  it("refuses to publish when the finished build is of an older version than the draft", async () => {
    const { ctx, site } = await siteAccount();
    const v1 = await tools.saveDraft(ctx, site.id, { ops: price("$88") });
    await tools.saveDraft(ctx, site.id, { ops: price("$90") });
    // A refresh that raced the second save: version 1's build, finished and latest.
    const stale = await prisma.build.create({ data: { siteId: site.id, changeSetId: v1.changeSetId, status: "SUCCEEDED", draftVersion: 1 } });
    await prisma.changeSet.update({ where: { id: v1.changeSetId! }, data: { status: "PREVIEWED" } });
    await expect(tools.publishChange(ctx, v1.changeSetId!, stale.id, { name: "O", email: "o@test.invalid" })).rejects.toThrow(/finished preview/);
    expect(builder.publishes).toHaveLength(0);
  });
});

describe("the canvas and the preview page (PRD D47)", () => {
  const PAGES = [
    { id: "home", path: "/", title: "Home", description: "The home page.", sections: [] },
    { id: "about", path: "/about", title: "About", description: "About us.", hero: { headline: "About" }, sections: [] },
  ];

  it("opens only for members of the site's account", async () => {
    const a = await siteAccount();
    const member = await createMember(a.account.id, "MEMBER");
    const b = await siteAccount();
    expect(await tools.previewableSite(as(a.user.id), a.site.id)).toMatchObject({ id: a.site.id, slug: a.site.slug });
    expect(await tools.previewableSite(as(member.id), a.site.id)).toMatchObject({ id: a.site.id });
    expect(await tools.previewableSite(as(b.user.id), a.site.id)).toBeNull();
    expect(await tools.previewableSite(as(a.user.id), "no-such-site")).toBeNull();
    await expect(tools.getPreviewState(b.ctx.accountId, a.site.id)).rejects.toThrow("No such site.");
    await expect(tools.previewStartPath(b.ctx.accountId, a.site.id)).rejects.toThrow("No such site.");
  });

  it("knows the draft's builds and which one Publish would put live", async () => {
    const { ctx, site } = await siteAccount();
    expect(await tools.draftBuildIds(site.id)).toBeNull();
    expect(await tools.getPreviewState(ctx.accountId, site.id)).toEqual({ pending: null });
    builder.buildStatus = "running";
    const { buildId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    expect(await tools.draftBuildIds(site.id)).toEqual([buildId]);
    expect((await tools.getPreviewState(ctx.accountId, site.id)).pending).toMatchObject({ buildId, buildStatus: "RUNNING", publishable: null });
    builder.buildStatus = "succeeded";
    expect((await tools.getPreviewState(ctx.accountId, site.id)).pending).toMatchObject({ buildId, buildStatus: "SUCCEEDED", status: "PREVIEWED", publishable: buildId });
  });

  it("opens Preview on the page a change touches, else the home page", async () => {
    const { ctx, site } = await siteAccount();
    builder.content.pages = PAGES;
    expect(await tools.previewStartPath(ctx.accountId, site.id)).toBe("/");
    await tools.saveDraft(ctx, site.id, { ops: [{ op: "replace", address: "pages/about/hero/headline", value: "About us" }] });
    expect(await tools.previewStartPath(ctx.accountId, site.id)).toBe("/about");
    await tools.discardChange(ctx, (await tools.getEditorChanges(ctx.accountId)).pending!.id);
    await tools.saveDraft(ctx, site.id, { ops: [{ op: "replace", address: PRICE_AT, value: "$90" }] });
    expect(await tools.previewStartPath(ctx.accountId, site.id)).toBe("/");
  });
});

describe("one person edits at a time (PRD D64)", () => {
  const price = (value: string) => [{ op: "replace", address: PRICE_AT, value }];
  const author = { name: "O", email: "o@test.invalid" };

  /** A site with its owner, who is editing, and a second person on the account. */
  async function twoPeople() {
    const { account, user, site, ctx } = await siteAccount();
    await prisma.user.update({ where: { id: user.id }, data: { name: "Jane Doe" } });
    const second = await createMember(account.id);
    return { account, site, jane: ctx, bob: { ...ctx, userId: second.id }, bobId: second.id };
  }

  /** The hold as it is once its holder has left the editing pages for long enough. */
  const lapse = (siteId: string) => prisma.siteHold.update({ where: { siteId }, data: { expiresAt: new Date(Date.now() - 1000) } });

  it("gives the site to whoever writes first, and refuses everyone else's save, naming who is editing", async () => {
    const { site, jane, bob } = await twoPeople();
    await tools.saveDraft(jane, site.id, { ops: price("$90") });
    expect(await hold.currentHold(site.id)).toMatchObject({ userId: jane.userId, by: "Jane Doe" });

    const refused = await tools.saveDraft(bob, site.id, { ops: price("$95") }).catch((e) => e);
    expect(refused).toBeInstanceOf(ToolError);
    expect(refused).toMatchObject({ message: "Jane Doe is currently making edits.", heldBy: "Jane Doe" });
    // Nothing of the refused save is in the draft, and it cost the account none of its saves.
    const view = await tools.getDraftView(bob.accountId, site.id);
    expect((view.content.services as Menu)[0].services[0].priceLabel).toBe("$90");
    expect(view.pending).toMatchObject({ version: 1 });
  });

  it("refuses the second person's proposal, publish, and discard, and changes nothing", async () => {
    const { jane, bob } = await twoPeople();
    const { changeSetId, buildId } = await tools.proposeChange(jane, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(jane.accountId, changeSetId);

    await expect(tools.proposeChange(bob, { summary: "Closed Monday", ops: ANNOUNCE })).rejects.toMatchObject({ heldBy: "Jane Doe" });
    await expect(tools.publishChange(bob, changeSetId, buildId, author)).rejects.toMatchObject({ heldBy: "Jane Doe" });
    await expect(tools.discardChange(bob, changeSetId)).rejects.toMatchObject({ heldBy: "Jane Doe" });
    await expect(tools.holdSite(bob)).rejects.toMatchObject({ heldBy: "Jane Doe" });

    expect(builder.publishes).toHaveLength(0);
    const cs = await prisma.changeSet.findUniqueOrThrow({ where: { id: changeSetId } });
    expect(cs).toMatchObject({ status: "PREVIEWED", version: 1 });
    expect(cs.ops).toMatchObject([PRICE_OP]);
    // The refusals took none of the account's proposals for the hour.
    expect(isRateLimited(`site-tools:propose:${bob.accountId}`, 2, 60 * 60 * 1000)).toBe(false);
  });

  it("leaves reading open to everyone on the account while someone edits", async () => {
    const { site, jane, bob, bobId } = await twoPeople();
    await tools.saveDraft(jane, site.id, { ops: price("$90") });
    const view = await tools.getDraftView(bob.accountId, site.id);
    expect((view.content.services as Menu)[0].services[0].priceLabel).toBe("$90");
    expect(await tools.canPreviewSite(as(bobId), site.id)).toBe(true);
    expect((await tools.getPreviewState(bob.accountId, site.id)).pending).not.toBeNull();
    // Looking took nothing from the person editing.
    expect(await hold.currentHold(site.id)).toMatchObject({ userId: jane.userId });
  });

  it("never refuses a person their own other tab, browser, or device", async () => {
    const { site, jane } = await twoPeople();
    await tools.saveDraft({ ...jane, source: "EDITOR" }, site.id, { ops: price("$90") });
    const { changeSetId, buildId } = await tools.proposeChange(jane, { summary: "Closed Monday", ops: ANNOUNCE });
    await tools.refreshChange(jane.accountId, changeSetId);
    await tools.publishChange(jane, changeSetId, buildId, author);
    expect(builder.publishes).toHaveLength(1);
  });

  it("keeps a draft its author's: once they have gone quiet, nobody else adds to it, and nobody takes the site by trying", async () => {
    const { site, jane, bob, bobId } = await twoPeople();
    const saved = await tools.saveDraft(jane, site.id, { ops: price("$90") });
    await lapse(site.id);
    expect(await hold.currentHold(site.id)).toBeNull();

    // Bob's own change would go out with hers, or hers with his: refused, naming whose draft it is.
    const refused = await tools.saveDraft(bob, site.id, { ops: [{ op: "replace", address: "site/name", value: "Demo Salon & Spa" }] }).catch((e) => e);
    expect(refused).toBeInstanceOf(ToolError);
    expect(refused).toMatchObject({ message: "Jane Doe has unpublished changes. Publish or discard them first.", draftBy: "Jane Doe" });
    await expect(tools.proposeChange(bob, { summary: "Closed Monday", ops: ANNOUNCE })).rejects.toMatchObject({ draftBy: "Jane Doe" });
    await expect(tools.holdSite(bob)).rejects.toMatchObject({ draftBy: "Jane Doe" });
    // Opening a field in the Editor doesn't take the site either, and his page is told why.
    expect(await tools.keepSiteHold({ ...bob, userId: bobId }, true)).toMatchObject({
      by: null,
      mine: false,
      draftBy: "Jane Doe",
      draftSummary: "Haircut price: $90",
    });
    expect(await hold.currentHold(site.id)).toBeNull();

    // The draft is as she left it, and cost the account none of its saves or proposals.
    const cs = await prisma.changeSet.findUniqueOrThrow({ where: { id: saved.changeSetId! } });
    expect(cs).toMatchObject({ version: 1, updatedByUserId: jane.userId });
    expect(cs.ops).toEqual([PRICE_OP]);
    expect(isRateLimited(`site-tools:propose:${bob.accountId}`, 2, 60 * 60 * 1000)).toBe(false);

    // Jane carries on with her own.
    expect((await tools.saveDraft(jane, site.id, { ops: price("$95") })).version).toBe(2);
  });

  it("lets anyone on the account publish or discard a draft its author left, and edit once it is gone", async () => {
    const { site, jane, bob, bobId } = await twoPeople();
    const first = await tools.saveDraft(jane, site.id, { ops: price("$90") });
    await tools.refreshChange(jane.accountId, first.changeSetId!);
    await lapse(site.id);

    // Bob looks it over and publishes it: recorded as hers to edit, his to publish.
    await tools.publishChange(bob, first.changeSetId!, first.buildId!, author);
    expect(await prisma.changeSet.findUniqueOrThrow({ where: { id: first.changeSetId! } })).toMatchObject({
      status: "PUBLISHED",
      updatedByUserId: jane.userId,
      publishedByUserId: bobId,
    });
    expect(await hold.currentHold(site.id)).toBeNull();
    // With no draft left, the site is his to edit.
    const second = await tools.saveDraft(bob, site.id, { ops: [{ op: "replace", address: "site/name", value: "Demo Salon & Spa" }] });
    expect(await prisma.changeSet.findUniqueOrThrow({ where: { id: second.changeSetId! } })).toMatchObject({ updatedByUserId: bobId });

    // And Jane, finding his, discards it and starts her own.
    await lapse(site.id);
    await expect(tools.saveDraft(jane, site.id, { ops: price("$95") })).rejects.toMatchObject({ draftBy: expect.stringContaining("@test.invalid") });
    await tools.discardChange(jane, second.changeSetId!);
    expect((await tools.saveDraft(jane, site.id, { ops: price("$95") })).changeSetId).not.toBe(second.changeSetId);
  });

  it("names the person still at work, not their draft, while they are editing", async () => {
    const { site, jane, bob, bobId } = await twoPeople();
    await tools.saveDraft(jane, site.id, { ops: price("$90") });
    await expect(tools.saveDraft(bob, site.id, { ops: price("$95") })).rejects.toMatchObject({
      message: "Jane Doe is currently making edits.",
      heldBy: "Jane Doe",
    });
    // The page is told both: who is at work now, and whose the draft will still be when they stop.
    expect(await tools.getSiteEditing(bob.accountId, bobId)).toMatchObject({ by: "Jane Doe", draftBy: "Jane Doe", hasDraft: true });
    // To Jane it is her own draft, and nobody else's.
    expect(await tools.getSiteEditing(jane.accountId, jane.userId)).toMatchObject({ by: null, draftBy: null, draftSummary: null, hasDraft: true });
  });

  it("treats a draft whose author was taken off the account as nobody's: anyone carries it on", async () => {
    const { site, jane, bob, bobId } = await twoPeople();
    const saved = await tools.saveDraft(bob, site.id, { ops: price("$90") });
    await prisma.user.delete({ where: { id: bobId } });
    expect(await tools.getSiteEditing(jane.accountId, jane.userId)).toMatchObject({ draftBy: null, hasDraft: true });
    const more = await tools.saveDraft(jane, site.id, { ops: [{ op: "replace", address: "site/name", value: "Demo Salon & Spa" }] });
    expect(more).toMatchObject({ changeSetId: saved.changeSetId, version: 2 });
  });

  it("holds a site for one of two people who ask at the same moment", async () => {
    const { site, jane, bob } = await twoPeople();
    const results = await Promise.all([hold.takeHold(site.id, jane.userId), hold.takeHold(site.id, bob.userId!)]);
    expect(results.filter((r) => r.held)).toHaveLength(1);
    expect(await prisma.siteHold.count({ where: { siteId: site.id } })).toBe(1);
    // The same race over a hold that has run out.
    await lapse(site.id);
    const again = await Promise.all([hold.takeHold(site.id, jane.userId), hold.takeHold(site.id, bob.userId!)]);
    expect(again.filter((r) => r.held)).toHaveLength(1);
  });

  it("says whether a hold was kept or taken fresh, and lasts its time past the last keep", async () => {
    const { site, jane } = await twoPeople();
    const at = new Date("2026-11-14T12:00:00Z");
    expect(await hold.takeHold(site.id, jane.userId, at)).toEqual({ held: true, fresh: true });
    const later = new Date(at.getTime() + 60_000);
    expect(await hold.takeHold(site.id, jane.userId, later)).toEqual({ held: true, fresh: false });
    // Kept at 60 s, so it is live at 149 s and gone at 150 s.
    expect(await hold.currentHold(site.id, new Date(later.getTime() + hold.HOLD_TTL_MS - 1000))).not.toBeNull();
    expect(await hold.currentHold(site.id, new Date(later.getTime() + hold.HOLD_TTL_MS))).toBeNull();
    expect(await hold.takeHold(site.id, jane.userId, new Date(later.getTime() + hold.HOLD_TTL_MS))).toEqual({ held: true, fresh: true });
  });

  it("frees the site when its holder releases it, signs out, or is taken off the account", async () => {
    const { site, jane, bob, bobId } = await twoPeople();
    await hold.takeHold(site.id, jane.userId);
    // Releasing is the holder's only: someone else's release does nothing.
    await hold.releaseHold(site.id, bobId);
    expect(await hold.currentHold(site.id)).toMatchObject({ userId: jane.userId });
    await hold.releaseHolds(jane.userId);
    expect(await hold.currentHold(site.id)).toBeNull();

    await tools.saveDraft(bob, site.id, { ops: price("$90") });
    await prisma.user.delete({ where: { id: bobId } });
    expect(await hold.currentHold(site.id)).toBeNull();
    await tools.saveDraft(jane, site.id, { ops: price("$95") });
  });

  it("holds nothing for a page that is only open: looking, and asking who has the site, never take it", async () => {
    const { site, jane, bob, bobId } = await twoPeople();
    // Rendering a page looks, and the open page asks; neither is an edit.
    expect(await tools.getSiteEditing(jane.accountId, jane.userId)).toEqual({ by: null, marker: "", hasDraft: false, draftBy: null, draftSummary: null });
    expect(await tools.keepSiteHold(jane)).toMatchObject({ by: null, mine: false });
    expect(await tools.keepSiteHold({ ...bob, userId: bobId })).toMatchObject({ by: null, mine: false });
    expect(await prisma.siteHold.count()).toBe(0);
    // So whoever edits first has the site, however long the other has had the page open.
    await tools.saveDraft(bob, site.id, { ops: price("$90") });
    expect(await hold.currentHold(site.id)).toMatchObject({ userId: bobId });
  });

  it("gives the site to a person who opens a field, before any save, and tells the other's page who has it", async () => {
    const { site, jane, bob, bobId } = await twoPeople();
    expect(await tools.keepSiteHold(jane, true)).toMatchObject({ by: null, mine: true });
    expect(await hold.currentHold(site.id)).toMatchObject({ userId: jane.userId });
    // Bob's page asking, and Bob opening a field himself, both learn it is Jane's and take nothing.
    expect(await tools.keepSiteHold({ ...bob, userId: bobId })).toMatchObject({ by: "Jane Doe", mine: false });
    expect(await tools.keepSiteHold({ ...bob, userId: bobId }, true)).toMatchObject({ by: "Jane Doe", mine: false });
    expect(await tools.getSiteEditing(bob.accountId, bobId)).toMatchObject({ by: "Jane Doe" });
    expect(await tools.getSiteEditing(jane.accountId, jane.userId)).toMatchObject({ by: null });
    // The Sites chrome and the preview bar ask only for the name: someone else's, never the viewer's own.
    expect(await tools.otherEditor(site.id, bobId)).toBe("Jane Doe");
    expect(await tools.otherEditor(site.id, jane.userId)).toBeNull();
    expect(await hold.currentHold(site.id)).toMatchObject({ userId: jane.userId });
  });

  it("keeps a hold going for its holder's page, and never brings back one that has run out", async () => {
    const { site, jane } = await twoPeople();
    await tools.saveDraft(jane, site.id, { ops: price("$90") });
    const before = (await prisma.siteHold.findUniqueOrThrow({ where: { siteId: site.id } })).expiresAt;
    await new Promise((r) => setTimeout(r, 20));
    expect(await tools.keepSiteHold(jane)).toMatchObject({ by: null, mine: true });
    expect((await prisma.siteHold.findUniqueOrThrow({ where: { siteId: site.id } })).expiresAt.getTime()).toBeGreaterThan(before.getTime());

    // Jane goes quiet and her hold runs out. Her page asking again doesn't take the site back: her next edit does.
    await lapse(site.id);
    expect(await tools.keepSiteHold(jane)).toMatchObject({ by: null, mine: false });
    expect(await hold.currentHold(site.id)).toBeNull();
    await tools.saveDraft(jane, site.id, { ops: price("$95") });
    expect(await tools.keepSiteHold(jane)).toMatchObject({ mine: true });
  });

  it("frees the site when its holder publishes or discards, and not while a draft is still theirs to finish", async () => {
    const { site, jane, bob } = await twoPeople();
    const { changeSetId, buildId } = await tools.proposeChange(jane, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(jane.accountId, changeSetId);
    // Between edits, with a draft: still hers.
    await expect(tools.saveDraft(bob, site.id, { ops: price("$95") })).rejects.toMatchObject({ heldBy: "Jane Doe" });

    await tools.publishChange(jane, changeSetId, buildId, author);
    expect(await hold.currentHold(site.id)).toBeNull();

    // Bob edits at once, then discards: free again.
    const saved = await tools.saveDraft(bob, site.id, { ops: [{ op: "replace", address: "site/name", value: "Demo Salon & Spa" }] });
    expect(await hold.currentHold(site.id)).toMatchObject({ userId: bob.userId });
    await tools.discardChange(bob, saved.changeSetId!);
    expect(await hold.currentHold(site.id)).toBeNull();
  });

  it("leaves the site with a person whose publish left an edit behind as a draft", async () => {
    const { site, jane } = await twoPeople();
    const { changeSetId, buildId } = await tools.proposeChange(jane, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(jane.accountId, changeSetId);
    builder.duringPublish = async () => {
      await tools.saveDraft({ ...jane, source: "EDITOR" }, site.id, { ops: [{ op: "replace", address: "site/name", value: "Demo Salon & Spa" }] });
      builder.commit = "b".repeat(40);
      (builder.content.services as Menu)[0].services[0].priceLabel = "$90";
    };
    await tools.publishChange(jane, changeSetId, buildId, author);
    expect(await hold.currentHold(site.id)).toMatchObject({ userId: jane.userId });
  });

  it("gives a page a marker that moves when the site does, so a page that wasn't there knows to load it again", async () => {
    const { site, jane, bob, bobId } = await twoPeople();
    const before = await tools.keepSiteHold(jane);
    expect(before).toMatchObject({ marker: "", hasDraft: false });

    // Bob edits and publishes while Jane's page isn't asking.
    const { changeSetId, buildId } = await tools.proposeChange(bob, { summary: "Haircut to $90", ops: PRICE });
    const drafted = await tools.keepSiteHold({ ...bob, userId: bobId });
    expect(drafted).toMatchObject({ by: null, mine: true, hasDraft: true });
    await tools.refreshChange(bob.accountId, changeSetId);
    // The preview finishing is not the site moving.
    expect((await tools.keepSiteHold({ ...bob, userId: bobId })).marker).toBe(drafted.marker);
    await tools.publishChange(bob, changeSetId, buildId, author);

    const back = await tools.keepSiteHold(jane);
    expect(back).toMatchObject({ by: null, mine: false, hasDraft: false });
    expect(back.marker).not.toBe(before.marker);
    expect(back.marker).not.toBe(drafted.marker);
    expect(await hold.currentHold(site.id)).toBeNull();
  });

  it("records whose a draft is and who published it, and names a draft to everyone but its author (PRD D64)", async () => {
    const { site, jane, bob, bobId } = await twoPeople();
    const first = await tools.saveDraft(jane, site.id, { ops: price("$90") });
    expect(await prisma.changeSet.findUniqueOrThrow({ where: { id: first.changeSetId! } })).toMatchObject({ createdByUserId: jane.userId, updatedByUserId: jane.userId });
    // To Jane it is her own; to Bob it is Jane's.
    expect((await tools.getEditorChanges(jane.accountId, jane.userId)).pending).toMatchObject({ by: null });
    expect((await tools.getEditorChanges(bob.accountId, bobId)).pending).toMatchObject({ by: "Jane Doe" });

    // Jane goes quiet; Bob publishes her draft.
    await tools.refreshChange(jane.accountId, first.changeSetId!);
    await lapse(site.id);
    await tools.publishChange(bob, first.changeSetId!, first.buildId!, author);
    // The published list names who published, not whose draft it was.
    const { recent } = await tools.getEditorChanges(jane.accountId, jane.userId);
    expect(recent[0].by).toEqual(expect.stringContaining("@test.invalid"));
    expect(recent[0].by).not.toBe("Jane Doe");
  });

  it("gives an edit saved during someone's publish to the person who saved it", async () => {
    const { site, jane } = await twoPeople();
    const { changeSetId, buildId } = await tools.proposeChange(jane, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(jane.accountId, changeSetId);
    builder.duringPublish = async () => {
      await tools.saveDraft({ ...jane, source: "EDITOR" }, site.id, { ops: [{ op: "replace", address: "site/name", value: "Demo Salon & Spa" }] });
      builder.commit = "b".repeat(40);
      (builder.content.services as Menu)[0].services[0].priceLabel = "$90";
    };
    await tools.publishChange(jane, changeSetId, buildId, author);
    const draft = await prisma.changeSet.findFirstOrThrow({ where: { siteId: site.id, status: { in: ["DRAFT", "PREVIEWED"] } } });
    expect(draft).toMatchObject({ createdByUserId: jane.userId, updatedByUserId: jane.userId, publishedByUserId: null });
  });

  it("tells a page where the site stands after its own save", async () => {
    const { site, jane } = await twoPeople();
    expect(await tools.getSiteMarker(jane.accountId)).toBe("");
    const saved = await tools.saveDraft(jane, site.id, { ops: price("$90") });
    expect(await tools.getSiteMarker(jane.accountId)).toBe(`${saved.changeSetId}:1:PENDING`);
    expect((await tools.keepSiteHold(jane)).marker).toBe(`${saved.changeSetId}:1:PENDING`);
  });

  it("lets a caller that is no person wait like anyone, and never hold", async () => {
    const { site, jane } = await twoPeople();
    const nobody = { ...jane, userId: null };
    await tools.saveDraft(nobody, site.id, { ops: price("$90") });
    expect(await prisma.siteHold.count()).toBe(0);
    await hold.takeHold(site.id, jane.userId);
    await expect(tools.saveDraft(nobody, site.id, { ops: price("$95") })).rejects.toMatchObject({ heldBy: "Jane Doe" });
  });
});

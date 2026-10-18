import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { isRateLimited, resetRateLimits } from "@/lib/rate-limit";
import { createAccount, createMember, createSite, resetDatabase } from "../../../test/db";

// The builder is another service; stand in for it. Prisma is real.
const builder = vi.hoisted(() => ({
  commit: "a".repeat(40),
  content: {} as Record<string, unknown>,
  previews: [] as Array<{ buildId: string; ops: unknown[]; baseCommit: string }>,
  publishes: [] as Array<{ buildId: string; baseCommit: string }>,
  guide: null as string | null,
  buildStatus: "succeeded" as "queued" | "running" | "succeeded" | "failed",
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
    fetchBuild: vi.fn(async (_slug, id: string) => ({ id, status: builder.buildStatus, log: "", error: builder.buildStatus === "failed" ? "boom" : undefined })),
    requestPublish: vi.fn(async (_site, args: { buildId: string; baseCommit: string }) => {
      builder.publishes.push(args);
      return { commit: "b".repeat(40), log: "" };
    }),
  };
});

const tools = await import("./index");

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
    data: { repoUrl: "https://github.com/example/site", lockedFields: ["site.contact.phone", "site.contact.email", "site.contact.address"] },
  });
  return { account, user, site, ctx: { accountId: account.id, userId: user.id, source: "QUICK_EDIT" as const } };
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
    await expect(
      tools.proposeChange(ctx, { summary: "New phone", ops: [{ collection: "site", op: "replace", path: "/contact/phone", value: "555-9999" }] }),
    ).rejects.toThrow(/site\.contact\.phone is locked/);
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

describe("ownership", () => {
  it("never lets one account refresh, publish, or discard another account's change", async () => {
    const a = await siteAccount();
    const b = await siteAccount();
    const { changeSetId } = await tools.proposeChange(a.ctx, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(a.ctx.accountId, changeSetId);
    await expect(tools.refreshChange(b.ctx.accountId, changeSetId)).rejects.toThrow("No such change.");
    await expect(tools.publishChange(b.ctx, changeSetId, { name: "B", email: "b@test.invalid" })).rejects.toThrow("No such change.");
    await expect(tools.discardChange(b.ctx.accountId, changeSetId)).rejects.toThrow("No such change.");
    expect(builder.publishes).toHaveLength(0);
    expect((await prisma.changeSet.findUniqueOrThrow({ where: { id: changeSetId } })).status).toBe("PREVIEWED");
  });

  it("lets every member of the owning account preview, and nobody else", async () => {
    const a = await siteAccount();
    const member = await createMember(a.account.id, "MEMBER");
    const b = await siteAccount();
    expect(await tools.canPreviewSite(a.user.id, a.site.id)).toBe(true);
    expect(await tools.canPreviewSite(member.id, a.site.id)).toBe(true);
    expect(await tools.canPreviewSite(b.user.id, a.site.id)).toBe(false);
  });
});

describe("refresh and publish", () => {
  it("moves DRAFT to PREVIEWED when the build succeeds, then publishes it", async () => {
    const { ctx } = await siteAccount();
    const { changeSetId, buildId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    expect(await tools.refreshChange(ctx.accountId, changeSetId)).toMatchObject({ status: "PREVIEWED", buildStatus: "SUCCEEDED" });
    const { commit } = await tools.publishChange(ctx, changeSetId, { name: "Owner", email: "owner@test.invalid" });
    expect(commit).toBe("b".repeat(40));
    expect(builder.publishes).toMatchObject([{ buildId, baseCommit: builder.commit }]);
    const cs = await prisma.changeSet.findUniqueOrThrow({ where: { id: changeSetId } });
    expect(cs).toMatchObject({ status: "PUBLISHED", publishedCommit: "b".repeat(40) });
  });

  it("refuses to publish a change whose preview hasn't finished or failed", async () => {
    const { ctx } = await siteAccount();
    builder.buildStatus = "running";
    const { changeSetId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(ctx.accountId, changeSetId);
    await expect(tools.publishChange(ctx, changeSetId, { name: "O", email: "o@test.invalid" })).rejects.toThrow(/finished preview/);

    // A failed build keeps the draft, with the reason, so no edit is lost.
    builder.buildStatus = "failed";
    expect(await tools.refreshChange(ctx.accountId, changeSetId)).toMatchObject({ status: "DRAFT", buildStatus: "FAILED", error: "boom" });
    await expect(tools.publishChange(ctx, changeSetId, { name: "O", email: "o@test.invalid" })).rejects.toThrow(/finished preview/);
    expect(builder.publishes).toHaveLength(0);
  });

  it("refuses to publish a PREVIEWED change whose latest build did not succeed", async () => {
    const { ctx, site } = await siteAccount();
    const { changeSetId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    await tools.refreshChange(ctx.accountId, changeSetId);
    await prisma.build.create({ data: { siteId: site.id, changeSetId, status: "FAILED" } });
    await expect(tools.publishChange(ctx, changeSetId, { name: "O", email: "o@test.invalid" })).rejects.toThrow(/finished preview/);
  });

  it("discards only a pending change", async () => {
    const { ctx } = await siteAccount();
    const { changeSetId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    await tools.discardChange(ctx.accountId, changeSetId);
    await expect(tools.discardChange(ctx.accountId, changeSetId)).rejects.toThrow(/Only a pending change/);
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
    await expect(tools.publishChange(ctx, v1.changeSetId!, { name: "O", email: "o@test.invalid" })).rejects.toThrow(/finished preview/);
    builder.buildStatus = "succeeded";
    await tools.refreshChange(ctx.accountId, v1.changeSetId!);
    await tools.publishChange(ctx, v1.changeSetId!, { name: "O", email: "o@test.invalid" });
    expect(builder.publishes).toMatchObject([{ buildId: v2.buildId }]);
  });

  it("refuses to publish when the finished build is of an older version than the draft", async () => {
    const { ctx, site } = await siteAccount();
    const v1 = await tools.saveDraft(ctx, site.id, { ops: price("$88") });
    await tools.saveDraft(ctx, site.id, { ops: price("$90") });
    // A refresh that raced the second save: version 1's build, finished and latest.
    await prisma.build.create({ data: { siteId: site.id, changeSetId: v1.changeSetId, status: "SUCCEEDED", draftVersion: 1 } });
    await prisma.changeSet.update({ where: { id: v1.changeSetId! }, data: { status: "PREVIEWED" } });
    await expect(tools.publishChange(ctx, v1.changeSetId!, { name: "O", email: "o@test.invalid" })).rejects.toThrow(/finished preview/);
    expect(builder.publishes).toHaveLength(0);
  });
});

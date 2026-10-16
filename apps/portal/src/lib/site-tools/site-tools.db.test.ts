import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetRateLimits } from "@/lib/rate-limit";
import { createAccount, createMember, createSite, resetDatabase } from "../../../test/db";

// The builder is another service; stand in for it. Prisma is real.
const builder = vi.hoisted(() => ({
  commit: "a".repeat(40),
  content: {} as Record<string, unknown>,
  previews: [] as Array<{ buildId: string; ops: unknown[]; baseCommit: string }>,
  publishes: [] as Array<{ buildId: string; baseCommit: string }>,
  buildStatus: "succeeded" as "queued" | "running" | "succeeded" | "failed",
}));
vi.mock("@/lib/builder-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/builder-client")>("@/lib/builder-client");
  return {
    ...actual,
    fetchContent: vi.fn(async () => ({ commit: builder.commit, content: structuredClone(builder.content), contractVersion: "0.1.0" })),
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
  builder.buildStatus = "succeeded";
});

describe("proposeChange", () => {
  it("records a DRAFT change with a queued build and starts the preview at the published commit", async () => {
    const { ctx, site } = await siteAccount();
    const { changeSetId, buildId } = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    const cs = await prisma.changeSet.findUniqueOrThrow({ where: { id: changeSetId }, include: { builds: true } });
    expect(cs).toMatchObject({ siteId: site.id, status: "DRAFT", baseCommit: builder.commit, source: "QUICK_EDIT" });
    expect(cs.builds.map((b) => b.id)).toEqual([buildId]);
    expect(builder.previews).toEqual([{ buildId, ops: PRICE, baseCommit: builder.commit }]);
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

  it("builds on the pending change and supersedes it", async () => {
    const { ctx } = await siteAccount();
    const first = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    const second = await tools.proposeChange(ctx, { summary: "Closed Monday", ops: ANNOUNCE });
    const old = await prisma.changeSet.findUniqueOrThrow({ where: { id: first.changeSetId } });
    const cur = await prisma.changeSet.findUniqueOrThrow({ where: { id: second.changeSetId } });
    expect(old.status).toBe("DISCARDED");
    expect(cur.ops).toEqual([...PRICE, ...ANNOUNCE]);
    expect(cur.summary).toBe("Haircut to $90; Closed Monday");
  });

  it("does not build on a pending change whose base commit is gone", async () => {
    const { ctx } = await siteAccount();
    const first = await tools.proposeChange(ctx, { summary: "Haircut to $90", ops: PRICE });
    builder.commit = "c".repeat(40);
    const second = await tools.proposeChange(ctx, { summary: "Closed Monday", ops: ANNOUNCE });
    expect((await prisma.changeSet.findUniqueOrThrow({ where: { id: first.changeSetId } })).status).toBe("FAILED");
    expect((await prisma.changeSet.findUniqueOrThrow({ where: { id: second.changeSetId } })).ops).toEqual(ANNOUNCE);
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

    builder.buildStatus = "failed";
    expect(await tools.refreshChange(ctx.accountId, changeSetId)).toMatchObject({ status: "FAILED" });
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

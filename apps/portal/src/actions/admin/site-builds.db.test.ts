import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createSite, resetDatabase } from "../../../test/db";
import { resetRequest, signInAs } from "../../../test/next-request";

vi.mock("next/headers", () => import("../../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.spyOn(console, "log").mockImplementation(() => {});

const calls = vi.hoisted(() => ({ reset: 0, publish: 0 }));
vi.mock("@/lib/builder-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/builder-client")>("@/lib/builder-client");
  return {
    ...actual,
    fetchContent: vi.fn(async () => ({ commit: "a".repeat(40), content: {}, contractVersion: "0.1.0" })),
    requestPreview: vi.fn(async (_s, id: string) => ({ id, status: "queued" })),
    fetchBuild: vi.fn(async (_s, id: string) => ({ id, status: "succeeded", log: "" })),
    requestPublish: vi.fn(async () => {
      calls.publish++;
      return { commit: null, log: "" };
    }),
    requestReset: vi.fn(async () => {
      calls.reset++;
      return { commit: "a".repeat(40) };
    }),
  };
});

const { publishSiteFromRepo, resetDemoSite, setSiteDemo } = await import("./site-builds");

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
  calls.reset = 0;
  calls.publish = 0;
});

async function demoSite(isDemo: boolean) {
  const { account } = await createAccount({ planCode: "SITES" });
  const site = await createSite(account.id, { slug: "demo" });
  return prisma.site.update({ where: { id: site.id }, data: { repoUrl: "https://github.com/example/demo", isDemo } });
}

describe("operator site builds", () => {
  it("are refused to anyone who isn't a Global Admin", async () => {
    const site = await demoSite(true);
    const { user } = await createAccount({ planCode: "SITES" });
    await signInAs(user.id);
    await expect(publishSiteFromRepo(site.id)).rejects.toThrow();
    await expect(resetDemoSite(site.id)).rejects.toThrow();
    await expect(setSiteDemo(site.id, false)).rejects.toThrow();
    expect(calls).toEqual({ reset: 0, publish: 0 });
    expect((await prisma.site.findUniqueOrThrow({ where: { id: site.id } })).isDemo).toBe(true);
  });

  it("publish what the repo holds and record the build and contract version", async () => {
    const site = await demoSite(false);
    const { user } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    await signInAs(user.id);
    expect(await publishSiteFromRepo(site.id)).toMatchObject({ success: true });
    expect(calls.publish).toBe(1);
    expect(await prisma.build.findFirstOrThrow({ where: { siteId: site.id } })).toMatchObject({ status: "SUCCEEDED" });
    expect((await prisma.site.findUniqueOrThrow({ where: { id: site.id } })).contractVersion).toBe("0.1.0");
  });

  it("reset only a demo site, clearing its change history and conversations", async () => {
    const { user } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    await signInAs(user.id);
    const client = await demoSite(false);
    expect(await resetDemoSite(client.id)).toEqual({ error: "Only a demo site can be reset." });
    expect(calls.reset).toBe(0);

    await prisma.site.update({ where: { id: client.id }, data: { isDemo: true } });
    const pending = await prisma.changeSet.create({
      data: { siteId: client.id, source: "QUICK_EDIT", summary: "x", ops: [], baseCommit: "a".repeat(40), status: "PREVIEWED" },
    });
    await prisma.conversation.create({ data: { siteId: client.id, model: "m" } });
    const { account: otherAccount } = await createAccount({ planCode: "SITES" });
    const otherSite = await createSite(otherAccount.id);
    const otherChange = await prisma.changeSet.create({
      data: { siteId: otherSite.id, source: "QUICK_EDIT", summary: "y", ops: [], baseCommit: "a".repeat(40), status: "PUBLISHED" },
    });
    expect(await resetDemoSite(client.id)).toMatchObject({ success: true });
    expect(calls).toEqual({ reset: 1, publish: 1 });
    expect(await prisma.changeSet.findUnique({ where: { id: pending.id } })).toBeNull();
    expect(await prisma.conversation.count({ where: { siteId: client.id } })).toBe(0);
    // Only the demo's history goes.
    expect(await prisma.changeSet.findUnique({ where: { id: otherChange.id } })).not.toBeNull();
  });
});

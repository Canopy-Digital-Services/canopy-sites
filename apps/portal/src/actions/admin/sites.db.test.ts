import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { DEFAULT_LOCKED_FIELDS, type SiteSettingsInput } from "@/lib/sites";
import { createAccount, createSite as insertSite, resetDatabase } from "../../../test/db";
import { resetRequest, signInAs } from "../../../test/next-request";

vi.mock("next/headers", () => import("../../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.spyOn(console, "log").mockImplementation(() => {});

const { createSite, updateSite, assignSite } = await import("./sites");

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
});

async function signInAsAdmin() {
  const { user } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
  await signInAs(user.id);
}

const settings: SiteSettingsInput = {
  name: "Renamed",
  repoUrl: "https://github.com/example-org/example-site",
  defaultBranch: "main",
  productionHostnames: ["Example.com", "www.example.com"],
  contractVersion: "0.1.0",
  umamiWebsiteId: "",
  runbookOverlay: "Voice: warm.",
  lockedFields: ["site.contact.phone"],
};

describe("createSite", () => {
  it("creates a site on a Sites account with the contact fields locked", async () => {
    await signInAsAdmin();
    const { account } = await createAccount({ planCode: "SITES" });

    const result = await createSite(account.id, { name: "Fern & Fig", slug: "fern-and-fig" });

    expect(result).toMatchObject({ success: true });
    expect(await prisma.site.findUnique({ where: { accountId: account.id } })).toMatchObject({
      name: "Fern & Fig",
      slug: "fern-and-fig",
      lockedFields: DEFAULT_LOCKED_FIELDS,
      defaultBranch: "main",
      maxBuildsRetained: 5,
    });
  });

  it("refuses anyone who is not a Global Admin", async () => {
    const { account, user } = await createAccount({ planCode: "SITES" });
    await signInAs(user.id);

    await expect(createSite(account.id, { name: "Mine", slug: "mine" })).rejects.toThrow();
    expect(await prisma.site.count()).toBe(0);
  });

  it.each(["FREE", "PAID", "UNLOCKED"])("refuses an account on %s, which has no Sites", async (planCode) => {
    await signInAsAdmin();
    const { account } = await createAccount({ planCode });

    const result = await createSite(account.id, { name: "Nope", slug: "nope" });

    expect(result).toHaveProperty("error");
    expect(await prisma.site.count()).toBe(0);
  });

  it("refuses a second site on one account", async () => {
    await signInAsAdmin();
    const { account } = await createAccount({ planCode: "SITES" });
    await insertSite(account.id);

    const result = await createSite(account.id, { name: "Second", slug: "second" });

    expect(result).toHaveProperty("error");
    expect(await prisma.site.count({ where: { accountId: account.id } })).toBe(1);
  });

  it("refuses a slug another site uses, and a malformed slug", async () => {
    await signInAsAdmin();
    const { account: other } = await createAccount({ planCode: "SITES" });
    await insertSite(other.id, { slug: "taken" });
    const { account } = await createAccount({ planCode: "SITES" });

    expect(await createSite(account.id, { name: "A", slug: "taken" })).toMatchObject({
      fieldErrors: { slug: "Another site uses this slug" },
    });
    expect(await createSite(account.id, { name: "A", slug: "../../etc" })).toHaveProperty("fieldErrors.slug");
    expect(await prisma.site.count({ where: { accountId: account.id } })).toBe(0);
  });
});

describe("updateSite", () => {
  it("saves normalized settings and leaves the slug and account alone", async () => {
    await signInAsAdmin();
    const { account } = await createAccount({ planCode: "SITES" });
    const site = await insertSite(account.id, { slug: "fixed" });

    expect(await updateSite(site.id, settings)).toEqual({ success: true, siteId: site.id });
    expect(await prisma.site.findUnique({ where: { id: site.id } })).toMatchObject({
      slug: "fixed",
      accountId: account.id,
      name: "Renamed",
      productionHostnames: ["example.com", "www.example.com"],
      runbookOverlay: "Voice: warm.",
      lockedFields: ["site.contact.phone"],
    });
  });

  it("refuses anyone who is not a Global Admin, including the site's own client", async () => {
    const { account, user } = await createAccount({ planCode: "SITES" });
    const site = await insertSite(account.id);
    await signInAs(user.id);

    await expect(updateSite(site.id, settings)).rejects.toThrow();
    expect(await prisma.site.findUnique({ where: { id: site.id } })).toMatchObject({ name: site.name });
  });

  it("refuses a hostname that belongs to another site", async () => {
    await signInAsAdmin();
    const { account: a } = await createAccount({ planCode: "SITES" });
    const { account: b } = await createAccount({ planCode: "SITES" });
    await insertSite(a.id, { productionHostnames: ["example.com"] });
    const siteB = await insertSite(b.id);

    const result = await updateSite(siteB.id, { ...settings, productionHostnames: ["www.example.net", "EXAMPLE.com"] });

    expect(result).toHaveProperty("fieldErrors.productionHostnames");
    expect(await prisma.site.findUnique({ where: { id: siteB.id } })).toMatchObject({ productionHostnames: [] });
  });
});

describe("assignSite", () => {
  it("moves a site to a Sites account without one", async () => {
    await signInAsAdmin();
    const { account: from } = await createAccount({ planCode: "SITES" });
    const { account: to } = await createAccount({ planCode: "SITES" });
    const site = await insertSite(from.id);

    expect(await assignSite(site.id, to.id)).toEqual({ success: true, siteId: site.id });
    expect(await prisma.site.findUnique({ where: { id: site.id } })).toMatchObject({ accountId: to.id });
  });

  it("refuses an account without Sites, and one that already has a site", async () => {
    await signInAsAdmin();
    const { account: from } = await createAccount({ planCode: "SITES" });
    const { account: forms } = await createAccount({ planCode: "UNLOCKED" });
    const { account: full } = await createAccount({ planCode: "SITES" });
    await insertSite(full.id);
    const site = await insertSite(from.id);

    expect(await assignSite(site.id, forms.id)).toHaveProperty("error");
    expect(await assignSite(site.id, full.id)).toHaveProperty("error");
    expect(await prisma.site.findUnique({ where: { id: site.id } })).toMatchObject({ accountId: from.id });
  });

  it("refuses anyone who is not a Global Admin", async () => {
    const { account: from } = await createAccount({ planCode: "SITES" });
    const { account: to, user } = await createAccount({ planCode: "SITES" });
    const site = await insertSite(from.id);
    await signInAs(user.id);

    await expect(assignSite(site.id, to.id)).rejects.toThrow();
    expect(await prisma.site.findUnique({ where: { id: site.id } })).toMatchObject({ accountId: from.id });
  });
});

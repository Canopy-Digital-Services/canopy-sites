import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { DEFAULT_LOCKED_FIELDS, type LinkSiteInput, type SiteSettingsInput } from "@/lib/sites";
import { createAccount, createSite as insertSite, resetDatabase } from "../../../test/db";
import { resetRequest, signInAs } from "../../../test/next-request";

vi.mock("next/headers", () => import("../../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.spyOn(console, "log").mockImplementation(() => {});

const { linkSite, updateSite, assignSite } = await import("./sites");

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
  umamiWebsiteId: "",
  lockedFields: ["site/contact/phone"],
  fixedLists: ["classes"],
};

const toroz: LinkSiteInput = {
  email: "Owner@Example.com",
  name: "Toro Z Muay Thai",
  repoUrl: "https://github.com/Canopy-Digital-Services/toroz.git",
  slug: "toroz",
  productionHostnames: ["torozmuaythai.com", "www.torozmuaythai.com"],
  umamiWebsiteId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
};

describe("linkSite (PRD D49)", () => {
  it("creates the client's Sites account, an owner with no password, and the site", async () => {
    await signInAsAdmin();

    const result = await linkSite(toroz);

    expect(result).toMatchObject({ success: true, attached: false });
    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: "owner@example.com" },
      include: { memberships: { include: { account: true } } },
    });
    expect(owner).toMatchObject({ password: null, roleCode: "USER" });
    expect(owner.memberships).toHaveLength(1);
    expect(owner.memberships[0]).toMatchObject({ role: "OWNER", account: { planCode: "SITES", status: "ACTIVE", timeZone: "America/Los_Angeles" } });
    expect(await prisma.site.findUniqueOrThrow({ where: { accountId: owner.memberships[0].accountId } })).toMatchObject({
      name: "Toro Z Muay Thai",
      slug: "toroz",
      repoUrl: "https://github.com/Canopy-Digital-Services/toroz",
      defaultBranch: "main",
      productionHostnames: ["torozmuaythai.com", "www.torozmuaythai.com"],
      umamiWebsiteId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      lockedFields: DEFAULT_LOCKED_FIELDS,
      isDemo: false,
    });
  });

  it("refuses anyone who is not a Global Admin and creates nothing", async () => {
    const { user } = await createAccount({ planCode: "SITES" });
    await signInAs(user.id);

    await expect(linkSite(toroz)).rejects.toThrow();
    expect(await prisma.site.count()).toBe(0);
    expect(await prisma.user.count({ where: { email: "owner@example.com" } })).toBe(0);
  });

  it("refuses an email that already has a Forms account, or an account with a site, and creates nothing", async () => {
    await signInAsAdmin();
    const { user: forms } = await createAccount({ planCode: "PAID" });
    const { account: withSite, user: siteOwner } = await createAccount({ planCode: "SITES" });
    await insertSite(withSite.id);

    expect(await linkSite({ ...toroz, email: forms.email })).toMatchObject({
      fieldErrors: { email: "That email already has an account on the Unlimited plan." },
    });
    expect(await linkSite({ ...toroz, email: siteOwner.email })).toHaveProperty("fieldErrors.email");
    expect(await prisma.site.count()).toBe(1);
    expect(await prisma.account.count()).toBe(3);
  });

  it("links to the email's Sites account with no site only when asked to", async () => {
    await signInAsAdmin();
    const { account, user } = await createAccount({ planCode: "SITES" });

    expect(await linkSite({ ...toroz, email: user.email })).toEqual({
      error: "That email has a Sites account with no site.",
      attachable: true,
    });
    expect(await prisma.site.count()).toBe(0);

    expect(await linkSite({ ...toroz, email: user.email }, { attach: true })).toMatchObject({
      success: true,
      accountId: account.id,
      attached: true,
    });
    expect(await prisma.site.findUniqueOrThrow({ where: { accountId: account.id } })).toMatchObject({ slug: "toroz" });
    expect(await prisma.user.count()).toBe(2); // the admin and the existing owner: nobody new
  });

  it("refuses a slug, hostname, or repository another site holds, and creates nothing", async () => {
    await signInAsAdmin();
    const { account: other } = await createAccount({ planCode: "SITES" });
    const held = await insertSite(other.id, { slug: "toroz", productionHostnames: ["www.torozmuaythai.com"] });
    await prisma.site.update({
      where: { id: held.id },
      data: { repoUrl: "https://github.com/canopy-digital-services/TOROZ/" },
    });

    expect(await linkSite(toroz)).toMatchObject({ fieldErrors: { slug: "Another site uses this slug" } });
    expect(await linkSite({ ...toroz, slug: "toroz-2" })).toMatchObject({
      fieldErrors: { productionHostnames: `www.torozmuaythai.com belongs to ${held.name}` },
    });
    expect(
      await linkSite({ ...toroz, slug: "toroz-2", productionHostnames: ["toroz.example.com"] })
    ).toMatchObject({ fieldErrors: { repoUrl: `${held.name} is linked to this repository` } });
    expect(await prisma.site.count()).toBe(1);
    expect(await prisma.user.count({ where: { email: "owner@example.com" } })).toBe(0);
  });

  it("refuses input in the wrong shape before touching the database", async () => {
    await signInAsAdmin();
    const result = await linkSite({ ...toroz, repoUrl: "https://gitlab.com/x/y", productionHostnames: [] });
    expect(result).toHaveProperty("fieldErrors.repoUrl");
    expect(result).toHaveProperty("fieldErrors.productionHostnames");
    expect(await prisma.user.count()).toBe(1);
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
      lockedFields: ["site/contact/phone"],
      fixedLists: ["classes"],
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
    const { account: forms } = await createAccount({ planCode: "PAID" });
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

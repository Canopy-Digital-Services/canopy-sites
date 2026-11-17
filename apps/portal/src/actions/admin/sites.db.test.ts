import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const client1: LinkSiteInput = {
  email: "Owner@Example.com",
  name: "Client 1",
  repoUrl: "https://github.com/Canopy-Digital-Services/client1.git",
  slug: "client1",
  productionHostnames: ["client1.example", "www.client1.example"],
  umamiWebsiteId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
};

describe("linkSite (PRD D49)", () => {
  it("creates the client's Sites account, an owner with no password, and the site", async () => {
    await signInAsAdmin();

    const result = await linkSite(client1);

    expect(result).toMatchObject({ success: true, attached: false });
    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: "owner@example.com" },
      include: { memberships: { include: { account: true } } },
    });
    expect(owner).toMatchObject({ password: null, roleCode: "USER" });
    expect(owner.memberships).toHaveLength(1);
    expect(owner.memberships[0]).toMatchObject({ role: "OWNER", account: { planCode: "SITES", status: "ACTIVE", timeZone: "America/Los_Angeles" } });
    expect(await prisma.site.findUniqueOrThrow({ where: { accountId: owner.memberships[0].accountId } })).toMatchObject({
      name: "Client 1",
      slug: "client1",
      repoUrl: "https://github.com/Canopy-Digital-Services/client1",
      defaultBranch: "main",
      productionHostnames: ["client1.example", "www.client1.example"],
      umamiWebsiteId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      lockedFields: DEFAULT_LOCKED_FIELDS,
      isDemo: false,
    });
  });

  it("refuses anyone who is not a Global Admin and creates nothing", async () => {
    const { user } = await createAccount({ planCode: "SITES" });
    await signInAs(user.id);

    await expect(linkSite(client1)).rejects.toThrow();
    expect(await prisma.site.count()).toBe(0);
    expect(await prisma.user.count({ where: { email: "owner@example.com" } })).toBe(0);
  });

  it("refuses an email that already has a Forms account, or an account with a site, and creates nothing", async () => {
    await signInAsAdmin();
    const { user: forms } = await createAccount({ planCode: "PAID" });
    const { account: withSite, user: siteOwner } = await createAccount({ planCode: "SITES" });
    await insertSite(withSite.id);

    expect(await linkSite({ ...client1, email: forms.email })).toMatchObject({
      fieldErrors: { email: "That email already has an account on the Unlimited plan." },
    });
    expect(await linkSite({ ...client1, email: siteOwner.email })).toHaveProperty("fieldErrors.email");
    expect(await prisma.site.count()).toBe(1);
    expect(await prisma.account.count()).toBe(3);
  });

  it("links to the email's Sites account with no site only when asked to", async () => {
    await signInAsAdmin();
    const { account, user } = await createAccount({ planCode: "SITES" });

    expect(await linkSite({ ...client1, email: user.email })).toEqual({
      error: "That email has a Sites account with no site.",
      attachable: true,
    });
    expect(await prisma.site.count()).toBe(0);

    expect(await linkSite({ ...client1, email: user.email }, { attach: true })).toMatchObject({
      success: true,
      accountId: account.id,
      attached: true,
    });
    expect(await prisma.site.findUniqueOrThrow({ where: { accountId: account.id } })).toMatchObject({ slug: "client1" });
    expect(await prisma.user.count()).toBe(2); // the admin and the existing owner: nobody new
  });

  it("refuses a slug, hostname, or repository another site holds, and creates nothing", async () => {
    await signInAsAdmin();
    const { account: other } = await createAccount({ planCode: "SITES" });
    const held = await insertSite(other.id, { slug: "client1", productionHostnames: ["www.client1.example"] });
    await prisma.site.update({
      where: { id: held.id },
      data: { repoUrl: "https://github.com/canopy-digital-services/client1/" },
    });

    expect(await linkSite(client1)).toMatchObject({ fieldErrors: { slug: "Another site uses this slug" } });
    expect(await linkSite({ ...client1, slug: "client1-2" })).toMatchObject({
      fieldErrors: { productionHostnames: `www.client1.example belongs to ${held.name}` },
    });
    expect(
      await linkSite({ ...client1, slug: "client1-2", productionHostnames: ["client1.example.com"] })
    ).toMatchObject({ fieldErrors: { repoUrl: `${held.name} is linked to this repository` } });
    expect(await prisma.site.count()).toBe(1);
    expect(await prisma.user.count({ where: { email: "owner@example.com" } })).toBe(0);
  });

  it("refuses input in the wrong shape before touching the database", async () => {
    await signInAsAdmin();
    const result = await linkSite({ ...client1, repoUrl: "https://gitlab.com/x/y", productionHostnames: [] });
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

describe("the Umami website a site reads (Epic 35, 4.7)", () => {
  const READABLE = client1.umamiWebsiteId;
  const OUTSIDE_TEAM = "9b2f6c1e-5a4d-4c3b-8e2f-0a1b2c3d4e5f";
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("UMAMI_URL", "https://analytics.example.com");
    vi.stubEnv("UMAMI_API_KEY", "umami_test_key");
    fetchMock.mockReset();
    // Umami 3.4: a website outside the key's team answers 401, like one that doesn't exist.
    fetchMock.mockImplementation(async (input) => {
      const path = new URL(String(input)).pathname;
      if (path.includes(OUTSIDE_TEAM)) return Response.json({ error: { status: 401 } }, { status: 401 });
      return Response.json(path.endsWith("/daterange") ? { startDate: null, endDate: null } : { name: "Client 1", domain: "client1.example" });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("Link a site refuses a website the portal's key can't read, and creates nothing", async () => {
    await signInAsAdmin();

    const result = await linkSite({ ...client1, umamiWebsiteId: OUTSIDE_TEAM });

    expect(result).toHaveProperty("fieldErrors.umamiWebsiteId", expect.stringMatching(/Canopy Sites team/));
    expect(await prisma.site.count()).toBe(0);
    expect(await prisma.user.count({ where: { email: "owner@example.com" } })).toBe(0);
  });

  it("Link a site takes a readable website, and one Umami gave no answer about", async () => {
    await signInAsAdmin();
    expect(await linkSite(client1)).toMatchObject({ success: true });

    fetchMock.mockImplementation(async () => Promise.reject(new TypeError("fetch failed")));
    const other = { ...client1, email: "other@example.com", repoUrl: "https://github.com/example-org/other", slug: "other", productionHostnames: ["other.example"] };
    expect(await linkSite(other)).toMatchObject({ success: true });
  });

  it("the settings refuse a new website the key can't read, and keep the one the site had", async () => {
    await signInAsAdmin();
    const { account } = await createAccount({ planCode: "SITES" });
    const site = await insertSite(account.id);
    await prisma.site.update({ where: { id: site.id }, data: { umamiWebsiteId: READABLE } });

    const result = await updateSite(site.id, { ...settings, umamiWebsiteId: OUTSIDE_TEAM });

    expect(result).toHaveProperty("fieldErrors.umamiWebsiteId");
    expect(await prisma.site.findUnique({ where: { id: site.id } })).toMatchObject({ name: site.name, umamiWebsiteId: READABLE });
  });

  it("the settings save the rest while the site's own website is unreadable, asking Umami nothing", async () => {
    await signInAsAdmin();
    const { account } = await createAccount({ planCode: "SITES" });
    const site = await insertSite(account.id);
    await prisma.site.update({ where: { id: site.id }, data: { umamiWebsiteId: OUTSIDE_TEAM } });

    expect(await updateSite(site.id, { ...settings, umamiWebsiteId: OUTSIDE_TEAM })).toMatchObject({ success: true });
    expect(await prisma.site.findUnique({ where: { id: site.id } })).toMatchObject({ name: "Renamed", umamiWebsiteId: OUTSIDE_TEAM });
    expect(fetchMock).not.toHaveBeenCalled();
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

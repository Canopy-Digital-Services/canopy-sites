import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createSite, resetDatabase } from "../../test/db";
import { jar, resetRequest, signInAs } from "../../test/next-request";
import { SESSION_COOKIE } from "@/lib/session";

vi.mock("next/headers", () => import("../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// The builder is another service; stand in for its content read. Prisma is real.
vi.mock("@/lib/builder-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/builder-client")>("@/lib/builder-client");
  return { ...actual, fetchContent: vi.fn(async () => ({ commit: "a".repeat(40), content: {}, guide: null, contractVersion: "0.4.0" })) };
});

const { deleteAccount, deleteSelfAccount, setAccountTimeZone } = await import("./accounts");
const { fetchContent } = await import("@/lib/builder-client");

beforeEach(async () => {
  resetRequest();
  vi.mocked(fetchContent).mockClear();
  vi.stubEnv("BUILDER_URL", "http://builder.test.invalid:4100");
  vi.stubEnv("BUILDER_TOKEN", "test-token");
  await resetDatabase();
});
afterEach(() => vi.unstubAllEnvs());

describe("deleteAccount (operator)", () => {
  it("deletes another account and its owner", async () => {
    const { user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { account, user } = await createAccount();
    await signInAs(admin.id);

    await deleteAccount(account.id);

    expect(await prisma.account.count({ where: { id: account.id } })).toBe(0);
    expect(await prisma.user.count({ where: { id: user.id } })).toBe(0);
  });

  it("refuses the operator's own account", async () => {
    const { account, user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    await signInAs(admin.id);

    await expect(deleteAccount(account.id)).rejects.toThrow("own account");
    expect(await prisma.account.count({ where: { id: account.id } })).toBe(1);
  });

  it("deletes another admin's account while one admin remains", async () => {
    const { user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { account } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    await signInAs(admin.id);

    await deleteAccount(account.id);
    expect(await prisma.user.count({ where: { roleCode: "GLOBAL_ADMIN" } })).toBe(1);
  });

  it("refuses an account that owns a site", async () => {
    const { user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { account, user } = await createAccount({ planCode: "SITES" });
    await createSite(account.id);
    await signInAs(admin.id);

    await expect(deleteAccount(account.id)).rejects.toThrow("Move the site to another account first");
    expect(await prisma.account.count({ where: { id: account.id } })).toBe(1);
    expect(await prisma.user.count({ where: { id: user.id } })).toBe(1);
    expect(await prisma.site.count({ where: { accountId: account.id } })).toBe(1);
  });
});

describe("deleteSelfAccount", () => {
  it("lets the owner delete their account", async () => {
    const { account, user } = await createAccount();
    await signInAs(user.id);

    await deleteSelfAccount();
    expect(await prisma.account.count({ where: { id: account.id } })).toBe(0);
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
    expect(jar.has(SESSION_COOKIE)).toBe(false);
  });

  it("refuses a member who is not the owner", async () => {
    const { account } = await createAccount();
    const member = await prisma.user.create({
      data: {
        email: "member@test.invalid",
        password: "x",
        memberships: { create: { accountId: account.id, role: "MEMBER" } },
      },
    });
    await signInAs(member.id);

    await expect(deleteSelfAccount()).rejects.toThrow("Only the account owner");
    expect(await prisma.account.count({ where: { id: account.id } })).toBe(1);
  });

  it("refuses an owner whose account has a site, and keeps them signed in", async () => {
    const { account, user } = await createAccount({ planCode: "SITES" });
    await createSite(account.id);
    await signInAs(user.id);

    expect(await deleteSelfAccount()).toEqual({
      error: "Your account includes a website. Contact support to close it.",
    });
    expect(await prisma.account.count({ where: { id: account.id } })).toBe(1);
    expect(await prisma.user.count({ where: { id: user.id } })).toBe(1);
    expect(jar.has(SESSION_COOKIE)).toBe(true);
  });
});

describe("setAccountTimeZone", () => {
  const zoneOf = async (accountId: string) => (await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).timeZone;

  it("sets the zone of the caller's own account and no other", async () => {
    const { account, user } = await createAccount();
    const { account: other } = await createAccount();
    await signInAs(user.id);

    expect(await setAccountTimeZone("America/New_York")).toEqual({ success: true });

    expect(await zoneOf(account.id)).toBe("America/New_York");
    expect(await zoneOf(other.id)).toBe("UTC");
  });

  it("stores the zone as the runtime spells it", async () => {
    const { account, user } = await createAccount();
    await signInAs(user.id);

    await setAccountTimeZone("america/chicago");

    expect(await zoneOf(account.id)).toBe("America/Chicago");
  });

  it("refuses what isn't a zone, whatever the client sent, and changes nothing", async () => {
    const { account, user } = await createAccount();
    await signInAs(user.id);

    for (const sent of ["Mars/Olympus_Mons", "", "A".repeat(5000), null, { timeZone: "UTC" }, ["America/New_York"]]) {
      expect(await setAccountTimeZone(sent as string)).toEqual({ error: "That isn't a time zone we know." });
    }
    expect(await zoneOf(account.id)).toBe("UTC");
  });

  it("is refused to a signed-out caller", async () => {
    const { account } = await createAccount();

    await expect(setAccountTimeZone("America/New_York")).rejects.toThrow();
    expect(await zoneOf(account.id)).toBe("UTC");
  });

  it("tells the builder the new zone when the account has a site", async () => {
    const { account, user } = await createAccount({ planCode: "SITES" });
    const site = await createSite(account.id);
    await prisma.site.update({ where: { id: site.id }, data: { repoUrl: "https://github.com/example/site" } });
    await signInAs(user.id);

    await setAccountTimeZone("America/Denver");

    expect(vi.mocked(fetchContent)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetchContent).mock.calls[0][0]).toMatchObject({ slug: site.slug, timeZone: "America/Denver" });
  });

  it("asks the builder nothing for an account with no site", async () => {
    const { user } = await createAccount();
    await signInAs(user.id);

    await setAccountTimeZone("America/Denver");

    expect(fetchContent).not.toHaveBeenCalled();
  });

  it("still saves when the builder can't be reached", async () => {
    const { account, user } = await createAccount({ planCode: "SITES" });
    const site = await createSite(account.id);
    await prisma.site.update({ where: { id: site.id }, data: { repoUrl: "https://github.com/example/site" } });
    await signInAs(user.id);
    vi.mocked(fetchContent).mockRejectedValueOnce(new Error("connect ECONNREFUSED"));
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await setAccountTimeZone("America/Denver")).toEqual({ success: true });

    expect(await zoneOf(account.id)).toBe("America/Denver");
    expect(logged).toHaveBeenCalledWith(expect.stringContaining("site_time_zone_not_sent"));
    logged.mockRestore();
  });
});

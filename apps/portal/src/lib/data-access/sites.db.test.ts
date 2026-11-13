import { beforeEach, describe, expect, it } from "vitest";
import { createAccount, createSite, resetDatabase } from "../../../test/db";
import { prisma } from "@/lib/db";
import { getAccountSite, getAccountTimeZone, listAccountsAvailableForSite } from "./sites";

beforeEach(resetDatabase);

describe("getAccountSite", () => {
  it("returns the account's own site, and only the fields a client may see", async () => {
    const { account } = await createAccount({ planCode: "SITES" });
    const site = await createSite(account.id);

    expect(await getAccountSite(account.id)).toEqual({ id: site.id, name: site.name, slug: site.slug, isDemo: false, productionHostnames: [] });
  });

  it("never returns another account's site", async () => {
    const { account: a } = await createAccount({ planCode: "SITES" });
    const { account: b } = await createAccount({ planCode: "SITES" });
    const siteB = await createSite(b.id);

    expect(await getAccountSite(a.id)).toBeNull();
    expect((await getAccountSite(b.id))?.id).toBe(siteB.id);
  });
});

describe("getAccountTimeZone", () => {
  it("returns the zone of the account's own site", async () => {
    const { account: a } = await createAccount({ planCode: "SITES" });
    const { account: b } = await createAccount({ planCode: "SITES" });
    await createSite(a.id);
    const siteB = await createSite(b.id);
    await prisma.site.update({ where: { id: siteB.id }, data: { timeZone: "America/New_York" } });

    expect(await getAccountTimeZone(a.id)).toBe("America/Los_Angeles");
    expect(await getAccountTimeZone(b.id)).toBe("America/New_York");
  });

  it("returns null for an account with no site", async () => {
    const { account } = await createAccount({ planCode: "FREE" });
    await createSite((await createAccount({ planCode: "SITES" })).account.id);

    expect(await getAccountTimeZone(account.id)).toBeNull();
  });
});

describe("listAccountsAvailableForSite", () => {
  it("lists Sites accounts without a site, and nothing else", async () => {
    const { account: free } = await createAccount({ planCode: "FREE" });
    const { account: unlimited } = await createAccount({ planCode: "PAID" });
    const { account: taken } = await createAccount({ planCode: "SITES" });
    await createSite(taken.id);
    const { account: open } = await createAccount({ planCode: "SITES" });

    const ids = (await listAccountsAvailableForSite()).map((a) => a.id);
    expect(ids).toEqual([open.id]);
    expect(ids).not.toContain(free.id);
    expect(ids).not.toContain(unlimited.id);
  });
});

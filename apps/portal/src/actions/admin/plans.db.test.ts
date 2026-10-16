import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createSite, resetDatabase } from "../../../test/db";
import { resetRequest, signInAs } from "../../../test/next-request";

vi.mock("next/headers", () => import("../../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.spyOn(console, "log").mockImplementation(() => {});

const { setAccountPlan } = await import("./plans");

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
});

async function planOf(accountId: string) {
  return (await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).planCode;
}

describe("setAccountPlan and sites", () => {
  it.each(["FREE", "PAID"])("refuses to move an account that owns a site to %s", async (planCode) => {
    const { user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { account } = await createAccount({ planCode: "SITES" });
    await createSite(account.id);
    await signInAs(admin.id);

    await expect(setAccountPlan(account.id, planCode)).rejects.toThrow("Move the site to another account first");
    expect(await planOf(account.id)).toBe("SITES");
  });

  it("moves a Sites account without a site off Sites", async () => {
    const { user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { account } = await createAccount({ planCode: "SITES" });
    await signInAs(admin.id);

    await setAccountPlan(account.id, "PAID");
    expect(await planOf(account.id)).toBe("PAID");
  });

  it("moves a Forms account onto SITES", async () => {
    const { user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { account } = await createAccount({ planCode: "FREE" });
    await signInAs(admin.id);

    await setAccountPlan(account.id, "SITES");
    expect(await planOf(account.id)).toBe("SITES");
  });
});

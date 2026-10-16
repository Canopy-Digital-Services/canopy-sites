import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, resetDatabase } from "../../../test/db";
import { resetRequest, signInAs } from "../../../test/next-request";

vi.mock("next/headers", () => import("../../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.spyOn(console, "log").mockImplementation(() => {});

const { setUserRole } = await import("./roles");

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
});

async function planOf(accountId: string) {
  return (await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).planCode;
}

describe("setUserRole promotion to Global Admin", () => {
  it("moves an account on a capped plan to UNLOCKED", async () => {
    const { user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { account, user } = await createAccount({ planCode: "FREE" });
    await signInAs(admin.id);

    expect(await setUserRole(user.id, "GLOBAL_ADMIN")).toEqual({ success: true, planAutoUpgraded: true });
    expect(await planOf(account.id)).toBe("UNLOCKED");
  });

  it("leaves a Sites account on SITES, so promotion never takes Sites away", async () => {
    const { user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { account, user } = await createAccount({ planCode: "SITES" });
    await signInAs(admin.id);

    expect(await setUserRole(user.id, "GLOBAL_ADMIN")).toEqual({ success: true, planAutoUpgraded: false });
    expect(await planOf(account.id)).toBe("SITES");
  });
});

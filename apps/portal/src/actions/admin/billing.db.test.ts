import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, resetDatabase } from "../../../test/db";
import { resetRequest, signInAs } from "../../../test/next-request";

vi.mock("next/headers", () => import("../../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.spyOn(console, "log").mockImplementation(() => {});

const { setAccountBilling } = await import("./billing");

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
});

describe("setAccountBilling", () => {
  it("lets a Global Admin set status and reference", async () => {
    const { user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { account } = await createAccount();
    await signInAs(admin.id);

    await setAccountBilling(account.id, "PAST_DUE", " FB-1042 ");

    expect(await prisma.account.findUnique({ where: { id: account.id } })).toMatchObject({
      status: "PAST_DUE",
      billingRef: "FB-1042",
    });
  });

  it("refuses anyone who is not a Global Admin", async () => {
    const { account, user } = await createAccount();
    await signInAs(user.id);

    await expect(setAccountBilling(account.id, "CANCELLED", "")).rejects.toThrow();
    expect(await prisma.account.findUnique({ where: { id: account.id } })).toMatchObject({ status: "ACTIVE" });
  });

  it("rejects an unknown status without writing", async () => {
    const { user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { account } = await createAccount();
    await signInAs(admin.id);

    await expect(setAccountBilling(account.id, "SUSPENDED", "x")).rejects.toThrow("Unknown account status");
    expect(await prisma.account.findUnique({ where: { id: account.id } })).toMatchObject({ status: "ACTIVE", billingRef: null });
  });
});

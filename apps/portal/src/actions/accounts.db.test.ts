import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, resetDatabase } from "../../test/db";

const session = vi.hoisted(() => ({ current: null as null | { user: { id: string; email: string; role: string } } }));
vi.mock("@/lib/auth", () => ({ auth: async () => session.current }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { deleteAccount, deleteSelfAccount } = await import("./accounts");

function signInAs(user: { id: string; email: string; roleCode: string }) {
  session.current = { user: { id: user.id, email: user.email, role: user.roleCode } };
}

beforeEach(async () => {
  session.current = null;
  await resetDatabase();
});

describe("deleteAccount (operator)", () => {
  it("deletes another account and its owner", async () => {
    const { user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { account, user } = await createAccount();
    signInAs(admin);

    await deleteAccount(account.id);

    expect(await prisma.account.count({ where: { id: account.id } })).toBe(0);
    expect(await prisma.user.count({ where: { id: user.id } })).toBe(0);
  });

  it("refuses the operator's own account", async () => {
    const { account, user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    signInAs(admin);

    await expect(deleteAccount(account.id)).rejects.toThrow("own account");
    expect(await prisma.account.count({ where: { id: account.id } })).toBe(1);
  });

  it("deletes another admin's account while one admin remains", async () => {
    const { user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { account } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    signInAs(admin);

    await deleteAccount(account.id);
    expect(await prisma.user.count({ where: { roleCode: "GLOBAL_ADMIN" } })).toBe(1);
  });
});

describe("deleteSelfAccount", () => {
  it("lets the owner delete their account", async () => {
    const { account, user } = await createAccount();
    signInAs(user);

    await deleteSelfAccount();
    expect(await prisma.account.count({ where: { id: account.id } })).toBe(0);
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
    signInAs(member);

    await expect(deleteSelfAccount()).rejects.toThrow("Only the account owner");
    expect(await prisma.account.count({ where: { id: account.id } })).toBe(1);
  });
});

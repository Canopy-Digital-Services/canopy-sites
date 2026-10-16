import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, resetDatabase } from "../../test/db";
import { jar, resetRequest, signInAs } from "../../test/next-request";
import { SESSION_COOKIE } from "@/lib/session";

vi.mock("next/headers", () => import("../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { deleteAccount, deleteSelfAccount } = await import("./accounts");

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
});

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
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createAccount, resetDatabase } from "../../../test/db";
import { resetRequest, signInAs } from "../../../test/next-request";

vi.mock("next/headers", () => import("../../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.spyOn(console, "log").mockImplementation(() => {});

const { addAccountMember } = await import("./members");
const { getCurrentAccountId } = await import("@/lib/auth-utils");
const { deleteSelfAccount } = await import("../accounts");

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
});

async function signInAsAdmin() {
  const { user } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
  await signInAs(user.id);
}

describe("addAccountMember", () => {
  it("creates a MEMBER on the account whose session resolves to that account", async () => {
    const { account } = await createAccount({ planCode: "SITES" });
    await signInAsAdmin();

    expect(await addAccountMember(account.id, " Partner@Example.com ")).toEqual({ success: true, email: "partner@example.com" });

    const member = await prisma.user.findUniqueOrThrow({ where: { email: "partner@example.com" }, include: { memberships: true } });
    expect(member.memberships).toMatchObject([{ accountId: account.id, role: "MEMBER" }]);
    expect(member.roleCode).toBe("USER");
    // No usable password until they set one through "Forgot password".
    expect(await verifyPassword("", member.password)).toBe(false);

    resetRequest();
    await signInAs(member.id);
    expect(await getCurrentAccountId()).toBe(account.id);
  });

  it("refuses anyone who is not a Global Admin", async () => {
    const { account, user } = await createAccount({ planCode: "SITES" });
    await signInAs(user.id);
    await expect(addAccountMember(account.id, "partner@example.com")).rejects.toThrow();
    expect(await prisma.user.count({ where: { email: "partner@example.com" } })).toBe(0);
  });

  it("refuses an email that already has a user, so nobody gets a second membership", async () => {
    const { account } = await createAccount({ planCode: "SITES" });
    const { user: other } = await createAccount();
    await signInAsAdmin();
    expect(await addAccountMember(account.id, other.email)).toEqual({ error: expect.stringContaining("already has its own account") });
    expect(await prisma.membership.count({ where: { userId: other.id } })).toBe(1);
  });

  it("refuses a bad email and an unknown account", async () => {
    await signInAsAdmin();
    expect(await addAccountMember("nope", "partner@example.com")).toEqual({ error: "That account doesn't exist." });
    const { account } = await createAccount();
    expect(await addAccountMember(account.id, "not-an-email")).toEqual({ error: "Enter a valid email address." });
  });

  it("never lets a member delete the account", async () => {
    const { account } = await createAccount({ planCode: "SITES" });
    await signInAsAdmin();
    await addAccountMember(account.id, "partner@example.com");
    const member = await prisma.user.findUniqueOrThrow({ where: { email: "partner@example.com" } });
    resetRequest();
    await signInAs(member.id);
    await expect(deleteSelfAccount()).rejects.toThrow(/Only the account owner/);
    expect(await prisma.account.count({ where: { id: account.id } })).toBe(1);
  });
});

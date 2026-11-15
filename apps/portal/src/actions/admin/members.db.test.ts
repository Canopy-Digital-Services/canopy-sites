import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import { createAccount, createMember, createSite, resetDatabase } from "../../../test/db";
import { resetRequest, signInAs } from "../../../test/next-request";

vi.mock("next/headers", () => import("../../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.spyOn(console, "log").mockImplementation(() => {});

const { addAccountMember, removeAccountMember, setPersonName } = await import("./members");
const { getCurrentAccountId } = await import("@/lib/auth-utils");
const { deleteSelfAccount } = await import("../accounts");

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
});

async function signInAsAdmin() {
  const { user } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
  await signInAs(user.id);
  return user;
}

describe("addAccountMember", () => {
  it("creates a MEMBER on the account whose session resolves to that account", async () => {
    const { account } = await createAccount({ planCode: "SITES" });
    await signInAsAdmin();

    expect(await addAccountMember(account.id, " Partner@Example.com ")).toMatchObject({
      success: true,
      email: "partner@example.com",
      claimUrl: expect.stringMatching(/\/claim\?token=[a-f0-9]{64}$/),
    });

    const member = await prisma.user.findUniqueOrThrow({ where: { email: "partner@example.com" }, include: { memberships: true } });
    expect(member.memberships).toMatchObject([{ accountId: account.id, role: "MEMBER" }]);
    expect(member.roleCode).toBe("USER");
    // No password until they claim, with the link or through Forgot password (PRD D49).
    expect(member.password).toBeNull();

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

describe("setPersonName (PRD D63)", () => {
  it("names a person on the account, one line, and a blank name goes back to none", async () => {
    const { account, user: owner } = await createAccount({ planCode: "SITES" });
    await signInAsAdmin();
    expect(await setPersonName(account.id, owner.id, "  Jane \n  Doe ")).toEqual({ success: true });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).name).toBe("Jane Doe");
    expect(await setPersonName(account.id, owner.id, "x".repeat(81))).toEqual({ error: expect.stringContaining("80 characters") });
    expect(await setPersonName(account.id, owner.id, "  ")).toEqual({ success: true });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).name).toBeNull();
  });

  it("refuses a person named from another account, and anyone who is not a Global Admin", async () => {
    const { account, user: owner } = await createAccount({ planCode: "SITES" });
    const { user: stranger } = await createAccount();
    await signInAsAdmin();
    expect(await setPersonName(account.id, stranger.id, "Mallory")).toEqual({ error: "That person isn't on this account." });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: stranger.id } })).name).toBeNull();

    resetRequest();
    await signInAs(owner.id);
    await expect(setPersonName(account.id, owner.id, "Jane")).rejects.toThrow();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).name).toBeNull();
  });
});

describe("removeAccountMember (PRD D63)", () => {
  it("takes a member off the account, deletes their login, and ends their sessions", async () => {
    const { account, user: owner } = await createAccount({ planCode: "SITES" });
    const site = await createSite(account.id);
    const member = await createMember(account.id);
    await createSession(member.id, true);
    const change = await prisma.changeSet.create({
      data: { siteId: site.id, source: "EDITOR", createdByUserId: member.id, summary: "Their edit", ops: [], baseCommit: "a".repeat(40), status: "PUBLISHED" },
    });
    await signInAsAdmin();

    expect(await removeAccountMember(account.id, member.id)).toEqual({ success: true });

    expect(await prisma.user.count({ where: { id: member.id } })).toBe(0);
    expect(await prisma.session.count({ where: { userId: member.id } })).toBe(0);
    expect(await prisma.membership.findMany({ where: { accountId: account.id }, select: { userId: true } })).toEqual([{ userId: owner.id }]);
    // What they published keeps its record, without their name.
    expect(await prisma.changeSet.findUniqueOrThrow({ where: { id: change.id } })).toMatchObject({ createdByUserId: null, status: "PUBLISHED" });
  });

  it("never removes the owner, the operator themselves, or another operator", async () => {
    const { account, user: owner } = await createAccount({ planCode: "SITES" });
    const admin = await signInAsAdmin();
    expect(await removeAccountMember(account.id, owner.id)).toEqual({ error: "The owner can't be removed." });

    const self = await prisma.membership.create({ data: { userId: admin.id, accountId: account.id, role: "MEMBER" } });
    expect(await removeAccountMember(account.id, admin.id)).toEqual({ error: "You can't remove yourself." });
    await prisma.membership.delete({ where: { id: self.id } });

    const colleague = await createMember(account.id, "MEMBER", { roleCode: "GLOBAL_ADMIN" });
    expect(await removeAccountMember(account.id, colleague.id)).toEqual({ error: expect.stringContaining("Canopy operator") });
    expect(await prisma.user.count({ where: { id: { in: [owner.id, admin.id, colleague.id] } } })).toBe(3);
  });

  it("refuses a person named from another account, and anyone who is not a Global Admin", async () => {
    const { account, user: owner } = await createAccount({ planCode: "SITES" });
    const member = await createMember(account.id);
    const { account: other } = await createAccount({ planCode: "SITES" });
    const theirs = await createMember(other.id);
    await signInAsAdmin();
    // The account and the person have to belong together: neither id alone decides.
    expect(await removeAccountMember(account.id, theirs.id)).toEqual({ error: "That person isn't on this account." });
    expect(await removeAccountMember(other.id, member.id)).toEqual({ error: "That person isn't on this account." });

    resetRequest();
    await signInAs(owner.id);
    await expect(removeAccountMember(account.id, member.id)).rejects.toThrow();
    expect(await prisma.user.count({ where: { id: { in: [member.id, theirs.id] } } })).toBe(2);
  });
});

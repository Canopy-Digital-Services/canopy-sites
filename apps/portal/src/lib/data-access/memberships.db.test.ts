import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createForm, createMember, createSite, resetDatabase } from "../../../test/db";
import {
  AccountHasSiteError,
  deleteAccountAndSoleMembers,
  getSoleMembership,
  listAccountMemberEmails,
  MultipleMembershipsError,
} from "./memberships";

beforeEach(resetDatabase);

describe("getSoleMembership", () => {
  it("returns the one membership", async () => {
    const { account, user } = await createAccount();
    expect(await getSoleMembership(user.id)).toEqual({ accountId: account.id, role: "OWNER" });
  });

  it("returns null for a user with no membership", async () => {
    const { user } = await createAccount();
    await prisma.membership.deleteMany({ where: { userId: user.id } });
    expect(await getSoleMembership(user.id)).toBeNull();
  });

  it("throws rather than pick one when a user has two", async () => {
    const { user } = await createAccount();
    const other = await prisma.account.create({ data: {} });
    await prisma.membership.create({ data: { userId: user.id, accountId: other.id, role: "MEMBER" } });
    await expect(getSoleMembership(user.id)).rejects.toBeInstanceOf(MultipleMembershipsError);
  });
});

describe("listAccountMemberEmails", () => {
  it("lists every member of the account and nobody else", async () => {
    const { account, user } = await createAccount();
    const member = await createMember(account.id);
    await createAccount();

    expect((await listAccountMemberEmails(account.id)).sort()).toEqual([user.email, member.email].sort());
  });
});

describe("deleteAccountAndSoleMembers", () => {
  it("refuses an account that owns a site and deletes nothing", async () => {
    const { account, user } = await createAccount({ planCode: "SITES" });
    await createForm(account.id, user.id);
    await createSite(account.id);

    await expect(deleteAccountAndSoleMembers(account.id)).rejects.toBeInstanceOf(AccountHasSiteError);
    expect(await prisma.account.count({ where: { id: account.id } })).toBe(1);
    expect(await prisma.user.count({ where: { id: user.id } })).toBe(1);
    expect(await prisma.form.count({ where: { accountId: account.id } })).toBe(1);
    expect(await prisma.site.count({ where: { accountId: account.id } })).toBe(1);
  });

  it("removes the account, its forms, and users who belonged only to it", async () => {
    const { account, user } = await createAccount();
    await createForm(account.id, user.id, { published: true });
    await prisma.passwordToken.create({
      data: { userId: user.id, tokenHash: "t", expiresAt: new Date(Date.now() + 60_000) },
    });

    await deleteAccountAndSoleMembers(account.id);

    expect(await prisma.account.count({ where: { id: account.id } })).toBe(0);
    expect(await prisma.user.count({ where: { id: user.id } })).toBe(0);
    expect(await prisma.form.count()).toBe(0);
    expect(await prisma.passwordToken.count()).toBe(0);
  });

  it("keeps a user who also belongs to another account, and that account", async () => {
    const { account } = await createAccount();
    const { account: other, user: shared } = await createAccount();
    await prisma.membership.create({ data: { userId: shared.id, accountId: account.id, role: "MEMBER" } });

    await deleteAccountAndSoleMembers(account.id);

    expect(await prisma.user.count({ where: { id: shared.id } })).toBe(1);
    expect(await getSoleMembership(shared.id)).toEqual({ accountId: other.id, role: "OWNER" });
  });

  it("keeps the account's forms when the member who created them is deleted", async () => {
    const { account } = await createAccount();
    const member = await createMember(account.id);
    const form = await createForm(account.id, member.id);

    await prisma.user.delete({ where: { id: member.id } });

    expect(await prisma.form.findUnique({ where: { id: form.id } })).toMatchObject({
      accountId: account.id,
      createdByUserId: null,
    });
  });

  it("leaves other accounts untouched", async () => {
    const { account } = await createAccount();
    const { account: bystander, user: bystanderUser } = await createAccount();
    await createForm(bystander.id, bystanderUser.id);

    await deleteAccountAndSoleMembers(account.id);

    expect(await prisma.account.count({ where: { id: bystander.id } })).toBe(1);
    expect(await prisma.form.count({ where: { accountId: bystander.id } })).toBe(1);
  });

  it("removes the record of an operator acting as the account, and the operator's session stays their own", async () => {
    const { account } = await createAccount();
    const { user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const actAs = await prisma.actAs.create({ data: { operatorUserId: operator.id, accountId: account.id } });
    const session = await prisma.session.create({
      data: {
        id: "operator-session",
        userId: operator.id,
        rememberMe: false,
        expiresAt: new Date(Date.now() + 60_000),
        absoluteExpiresAt: new Date(Date.now() + 60_000),
        actAsId: actAs.id,
      },
    });

    await deleteAccountAndSoleMembers(account.id);

    expect(await prisma.actAs.count()).toBe(0);
    expect(await prisma.session.findUnique({ where: { id: session.id } })).toMatchObject({ actAsId: null });
    expect(await prisma.user.count({ where: { id: operator.id } })).toBe(1);
  });
});

describe("act-as records (PRD D49)", () => {
  it("keep who was in which account when the operator's user is deleted", async () => {
    const { account } = await createAccount();
    const { user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const actAs = await prisma.actAs.create({ data: { operatorUserId: operator.id, accountId: account.id } });

    await prisma.user.delete({ where: { id: operator.id } });

    expect(await prisma.actAs.findUnique({ where: { id: actAs.id } })).toMatchObject({
      accountId: account.id,
      operatorUserId: null,
    });
  });
});

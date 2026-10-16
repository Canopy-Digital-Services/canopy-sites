import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { hashSessionToken, SESSION_COOKIE } from "@/lib/session";
import { hashPassword } from "@/lib/auth-utils";
import { createAccount, resetDatabase } from "../../test/db";
import { jar, resetRequest, signInAs } from "../../test/next-request";

vi.mock("next/headers", () => import("../../test/next-request"));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => true) }));

const { changePassword, resetPassword, signInAction, signOutAction, signUp } = await import("./auth");

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

/** An account whose owner has a real password. */
async function accountWithPassword(password = "correct horse battery") {
  const { account, user } = await createAccount();
  await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(password) } });
  return { account, user, password };
}

function cookieSession() {
  const token = jar.get(SESSION_COOKIE)?.value;
  return token ? prisma.session.findUnique({ where: { id: hashSessionToken(token) } }) : null;
}

async function expectRedirect(promise: Promise<unknown>, to: string) {
  const err = await promise.then(() => null, (e) => e);
  expect(String(err?.digest)).toContain(`NEXT_REDIRECT;replace;${to};`);
}

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
});

describe("signUp", () => {
  it("creates the user, a FREE account, and an OWNER membership, and signs in", async () => {
    const result = await signUp(form({ email: "New@Example.com ", password: "long-enough-pw" }));
    expect(result).toEqual({ success: true });

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "new@example.com" },
      include: { memberships: { include: { account: true } } },
    });
    expect(user.memberships).toHaveLength(1);
    expect(user.memberships[0]).toMatchObject({ role: "OWNER", account: { planCode: "FREE" } });
    expect(user.password).not.toBe("long-enough-pw");
    expect(await cookieSession()).toMatchObject({ userId: user.id, rememberMe: false });
  });

  it("rejects a registered email without creating anything", async () => {
    await signUp(form({ email: "taken@example.com", password: "long-enough-pw" }));
    const result = await signUp(form({ email: "taken@example.com", password: "another-pw-1" }));

    expect(result).toEqual({ error: "Email already registered" });
    expect(await prisma.account.count()).toBe(1);
  });
});

describe("signInAction", () => {
  it("signs in with the right password and sets a session cookie", async () => {
    const { user, password } = await accountWithPassword();
    const result = await signInAction({ email: user.email.toUpperCase(), password, rememberMe: true });

    expect(result).toEqual({ success: true });
    expect(await cookieSession()).toMatchObject({ userId: user.id, rememberMe: true });
    expect(await prisma.user.findUnique({ where: { id: user.id } })).toMatchObject({ failedLoginCount: 0 });
  });

  it("gives a wrong password and an unknown email the same answer, and no session", async () => {
    const { user } = await accountWithPassword();

    const wrong = await signInAction({ email: user.email, password: "nope", rememberMe: false });
    const unknown = await signInAction({ email: "nobody@example.com", password: "nope", rememberMe: false });

    expect(wrong).toEqual({ error: "Invalid email or password" });
    expect(unknown).toEqual(wrong);
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    expect(await prisma.session.count()).toBe(0);
    expect(await prisma.user.findUnique({ where: { id: user.id } })).toMatchObject({ failedLoginCount: 1 });
  });

  it("refuses a user with no account membership", async () => {
    const { user, password } = await accountWithPassword();
    await prisma.membership.deleteMany({ where: { userId: user.id } });

    expect(await signInAction({ email: user.email, password, rememberMe: false })).toEqual({
      error: "Invalid email or password",
    });
  });
});

describe("signOutAction", () => {
  it("deletes this browser's session and cookie, then goes to /login", async () => {
    const { user } = await createAccount();
    const { session } = await signInAs(user.id);

    await expectRedirect(signOutAction(), "/login");

    expect(await prisma.session.count({ where: { id: session.id } })).toBe(0);
    expect(jar.has(SESSION_COOKIE)).toBe(false);
  });
});

describe("changePassword", () => {
  it("keeps this browser signed in and ends every other session", async () => {
    const { user, password } = await accountWithPassword();
    const elsewhere = await signInAs(user.id); // another device
    const here = await signInAs(user.id); // this browser holds the cookie now

    const result = await changePassword(form({ currentPassword: password, newPassword: "a new long password" }));

    expect(result).toEqual({ success: true });
    expect(await prisma.session.count({ where: { id: here.session.id } })).toBe(1);
    expect(await prisma.session.count({ where: { id: elsewhere.session.id } })).toBe(0);
  });

  it("changes nothing when the current password is wrong", async () => {
    const { user } = await accountWithPassword();
    const elsewhere = await signInAs(user.id);
    await signInAs(user.id);

    const result = await changePassword(form({ currentPassword: "wrong", newPassword: "a new long password" }));

    expect(result).toEqual({ error: "Current password is incorrect" });
    expect(await prisma.session.count({ where: { id: elsewhere.session.id } })).toBe(1);
  });
});

describe("resetPassword", () => {
  it("ends every session the user has", async () => {
    const { user } = await accountWithPassword();
    await signInAs(user.id);
    await signInAs(user.id);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: "reset-token", expiresAt: new Date(Date.now() + 60_000) },
    });

    expect(await resetPassword(form({ token: "reset-token", password: "brand new password" }))).toEqual({ success: true });
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
  });
});

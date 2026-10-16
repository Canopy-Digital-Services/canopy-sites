import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { hashSessionToken, SESSION_COOKIE } from "@/lib/session";
import { hashToken } from "@/lib/auth-utils";
import { hashPassword } from "@/lib/password";
import { createAccount, resetDatabase } from "../../test/db";
import { jar, requestHeaders, resetRequest, signInAs } from "../../test/next-request";
import { resetRateLimits } from "@/lib/rate-limit";
import { AUTH_LIMITS, THROTTLED_MESSAGE } from "@/lib/auth-throttle";
import { sendEmail } from "@/lib/email";

vi.mock("next/headers", () => import("../../test/next-request"));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => true) }));

const { changePassword, requestPasswordReset, resetPassword, signInAction, signOutAction, signUp } = await import("./auth");

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
  resetRateLimits();
  vi.mocked(sendEmail).mockClear();
  requestHeaders.set("cf-connecting-ip", "203.0.113.10");
  await resetDatabase();
});

describe("throttling", () => {
  it("locks an email after five tries, even with the right password, whether or not it exists", async () => {
    const { user, password } = await accountWithPassword();
    for (let i = 0; i < AUTH_LIMITS.signInPerEmail.max; i++) {
      await signInAction({ email: user.email, password: "wrong", rememberMe: false });
      await signInAction({ email: "ghost@example.com", password: "wrong", rememberMe: false });
    }

    expect(await signInAction({ email: user.email, password, rememberMe: false })).toEqual({ error: THROTTLED_MESSAGE });
    expect(await signInAction({ email: "ghost@example.com", password: "x", rememberMe: false })).toEqual({
      error: THROTTLED_MESSAGE,
    });
    expect(await prisma.session.count()).toBe(0);
  });

  it("counts only failures toward the email limit: a success resets it", async () => {
    const { user, password } = await accountWithPassword();
    for (let i = 0; i < AUTH_LIMITS.signInPerEmail.max - 1; i++) {
      await signInAction({ email: user.email, password: "wrong", rememberMe: false });
    }
    expect(await signInAction({ email: user.email, password, rememberMe: false })).toEqual({ success: true });
    for (let i = 0; i < AUTH_LIMITS.signInPerEmail.max - 1; i++) {
      expect(await signInAction({ email: user.email, password: "wrong", rememberMe: false })).toEqual({
        error: "Invalid email or password",
      });
    }
  });

  it("limits one IP across many emails, and not other IPs", async () => {
    for (let i = 0; i < AUTH_LIMITS.signInPerIP.max; i++) {
      await signInAction({ email: `spray${i}@example.com`, password: "wrong", rememberMe: false });
    }
    expect(await signInAction({ email: "fresh@example.com", password: "x", rememberMe: false })).toEqual({
      error: THROTTLED_MESSAGE,
    });

    requestHeaders.set("cf-connecting-ip", "198.51.100.99");
    expect(await signInAction({ email: "fresh@example.com", password: "x", rememberMe: false })).toEqual({
      error: "Invalid email or password",
    });
  });

  it("ignores a forged X-Forwarded-For when Cloudflare's header is present", async () => {
    for (let i = 0; i < AUTH_LIMITS.signInPerIP.max; i++) {
      requestHeaders.set("x-forwarded-for", `10.0.0.${i}`);
      await signInAction({ email: `spray${i}@example.com`, password: "wrong", rememberMe: false });
    }
    requestHeaders.set("x-forwarded-for", "10.9.9.9");
    expect(await signInAction({ email: "fresh@example.com", password: "x", rememberMe: false })).toEqual({
      error: THROTTLED_MESSAGE,
    });
  });

  it("sends at most three reset emails an hour to one address, with the same answer every time", async () => {
    const { user } = await accountWithPassword();
    const answers = [];
    for (let i = 0; i < 5; i++) answers.push(await requestPasswordReset(form({ email: user.email })));

    expect(new Set(answers.map((a) => JSON.stringify(a))).size).toBe(1);
    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(AUTH_LIMITS.resetRequestPerEmail.max);
  });

  it("stops guessing the current password from a signed-in session", async () => {
    const { user } = await accountWithPassword();
    await signInAs(user.id);
    for (let i = 0; i < AUTH_LIMITS.passwordChangePerUser.max; i++) {
      await changePassword(form({ currentPassword: `guess-${i}`, newPassword: "a new long password" }));
    }
    expect(await changePassword(form({ currentPassword: "correct horse battery", newPassword: "a new long password" }))).toEqual({
      error: THROTTLED_MESSAGE,
    });
  });
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

  it("upgrades a pre-Epic 28 bcrypt hash on sign-in, and the password keeps working", async () => {
    const { user } = await createAccount();
    const bcrypt = await import("bcrypt");
    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash("old style pass", 10) } });

    expect(await signInAction({ email: user.email, password: "old style pass", rememberMe: false })).toEqual({ success: true });
    const stored = (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).password;
    expect(stored).toMatch(/^scrypt\$15\$8\$3\$/);
    expect(await signInAction({ email: user.email, password: "old style pass", rememberMe: false })).toEqual({ success: true });
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

/** Requests a reset for the email and returns the token from the emailed link. */
async function requestResetToken(email: string) {
  await requestPasswordReset(form({ email }));
  const text = vi.mocked(sendEmail).mock.calls.at(-1)?.[0].text ?? "";
  return text.match(/reset-password\?token=([a-f0-9]+)/)?.[1] ?? "";
}

describe("password reset", () => {
  it("stores only the token's hash", async () => {
    const { user } = await accountWithPassword();
    const token = await requestResetToken(user.email);

    expect(token).toMatch(/^[a-f0-9]{64}$/);
    const rows = await prisma.passwordResetToken.findMany({ where: { userId: user.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toBe(hashToken(token));
    expect(JSON.stringify(rows)).not.toContain(token);
  });

  it("resets the password and ends every session the user has", async () => {
    const { user } = await accountWithPassword();
    await signInAs(user.id);
    await signInAs(user.id);
    const token = await requestResetToken(user.email);

    expect(await resetPassword(form({ token, password: "brand new password" }))).toEqual({ success: true });
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
    expect(await signInAction({ email: user.email, password: "brand new password", rememberMe: false })).toEqual({
      success: true,
    });
  });

  it("retires an earlier link when a new one is sent", async () => {
    const { user } = await accountWithPassword();
    const first = await requestResetToken(user.email);
    const second = await requestResetToken(user.email);

    expect(await resetPassword(form({ token: first, password: "brand new password" }))).toHaveProperty("error");
    expect(await resetPassword(form({ token: second, password: "brand new password" }))).toEqual({ success: true });
  });

  it("works once, even when submitted twice at the same moment", async () => {
    const { user } = await accountWithPassword();
    const token = await requestResetToken(user.email);

    const results = await Promise.all([
      resetPassword(form({ token, password: "first new password" })),
      resetPassword(form({ token, password: "second new password" })),
    ]);
    expect(results.filter((r) => "success" in r)).toHaveLength(1);
    expect(await resetPassword(form({ token, password: "third new password" }))).toHaveProperty("error");
  });

  it("refuses an expired link", async () => {
    const { user } = await accountWithPassword();
    const token = await requestResetToken(user.email);
    await prisma.passwordResetToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    expect(await resetPassword(form({ token, password: "brand new password" }))).toHaveProperty("error");
  });
});

describe("home host (PRD D22)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_URL", "https://forms.example.com");
    vi.stubEnv("SITES_URL", "https://sites.example.com");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("tells a Forms account signing in on the Sites host where it signs in, without a session", async () => {
    const { user, password } = await accountWithPassword();
    requestHeaders.set("host", "sites.example.com");

    expect(await signInAction({ email: user.email, password, rememberMe: false })).toEqual({
      error: "This account signs in at forms.example.com.",
      homeUrl: "https://forms.example.com",
    });
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
  });

  it("gives a Sites account signing in on the Forms host a one-time pass to the Sites host, not a session", async () => {
    const { account, user, password } = await accountWithPassword();
    await prisma.account.update({ where: { id: account.id }, data: { planCode: "SITES" } });
    requestHeaders.set("host", "forms.example.com");

    const result = await signInAction({ email: user.email, password, rememberMe: true });

    expect(result).toMatchObject({ handoff: { action: "https://sites.example.com/auth/handoff" } });
    const token = "handoff" in result ? result.handoff.token : "";
    expect(await prisma.sessionHandoff.findUnique({ where: { id: hashSessionToken(token) } })).toMatchObject({
      userId: user.id,
      rememberMe: true,
      targetHost: "sites.example.com",
    });
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
  });

  it("gives no pass for a wrong password", async () => {
    const { account, user } = await accountWithPassword();
    await prisma.account.update({ where: { id: account.id }, data: { planCode: "SITES" } });
    requestHeaders.set("host", "forms.example.com");

    expect(await signInAction({ email: user.email, password: "wrong password!", rememberMe: false })).toEqual({
      error: "Invalid email or password",
    });
    expect(await prisma.sessionHandoff.count()).toBe(0);
  });

  it("signs an account in on its home host", async () => {
    const { user, password } = await accountWithPassword();
    requestHeaders.set("host", "forms.example.com");

    expect(await signInAction({ email: user.email, password, rememberMe: false })).toEqual({ success: true });
    expect(await cookieSession()).toMatchObject({ userId: user.id });
  });

  it("says nothing about the host until the password is right", async () => {
    const { user } = await accountWithPassword();
    requestHeaders.set("host", "sites.example.com");

    expect(await signInAction({ email: user.email, password: "wrong password!", rememberMe: false })).toEqual({
      error: "Invalid email or password",
    });
  });

  it("refuses signup on the Sites host and creates nothing", async () => {
    requestHeaders.set("host", "sites.example.com");

    expect(await signUp(form({ email: "new@test.invalid", password: "long enough pw" }))).toEqual({
      error: "Create an account at forms.example.com.",
    });
    expect(await prisma.user.count({ where: { email: "new@test.invalid" } })).toBe(0);
  });
});


import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth-utils";
import { hashSessionToken, SESSION_COOKIE } from "@/lib/session";
import { resetRateLimits } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { createAccount, createSite, resetDatabase } from "../../test/db";
import { jar, requestHeaders, resetRequest, signInAs } from "../../test/next-request";

vi.mock("next/headers", () => import("../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => true) }));
vi.spyOn(console, "log").mockImplementation(() => {});

const { claimAccount, resendClaimLink } = await import("./claim");
const { sendClaimLink } = await import("./admin/claims");
const { addAccountMember } = await import("./admin/members");
const { requestPasswordReset, resetPassword, signInAction } = await import("./auth");
const { claimPreview, readClaim } = await import("@/lib/claim");

const DAY = 24 * 60 * 60 * 1000;

beforeEach(async () => {
  resetRequest();
  resetRateLimits();
  vi.mocked(sendEmail).mockClear();
  requestHeaders.set("cf-connecting-ip", "203.0.113.20");
  vi.stubEnv("NEXTAUTH_URL", "https://forms.example.com");
  vi.stubEnv("SITES_URL", "https://sites.example.com");
  vi.stubEnv("SMTP_FROM_SITES", "Canopy Sites <sites@example.com>");
  await resetDatabase();
});
afterEach(() => vi.unstubAllEnvs());

/** A linked site whose owner hasn't claimed, and a Global Admin signed in. */
async function linkedSite() {
  const { account, user: owner } = await createAccount({ planCode: "SITES" });
  await prisma.user.update({ where: { id: owner.id }, data: { password: null } });
  const site = await createSite(account.id, { productionHostnames: ["toroz.example.com"] });
  const { user: operator } = await createAccount({ planCode: "SITES", roleCode: "GLOBAL_ADMIN" });
  await signInAs(operator.id);
  return { account, owner, site, operator };
}

function tokenOf(url: string): string {
  return new URL(url).searchParams.get("token") ?? "";
}

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("the operator's claim link (PRD D49)", () => {
  it("is a link on the account's home host that the operator copies; nothing is emailed", async () => {
    const { site, owner, operator } = await linkedSite();

    const result = await sendClaimLink(site.id, "copy");

    expect(result).toMatchObject({ success: true });
    const url = (result as { url: string }).url;
    expect(url).toMatch(/^https:\/\/sites\.example\.com\/claim\?token=[a-f0-9]{64}$/);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(await prisma.passwordToken.findFirstOrThrow({ where: { userId: owner.id } })).toMatchObject({
      purpose: "CLAIM",
      tokenHash: hashToken(tokenOf(url)),
      createdByUserId: operator.id,
      emailedAt: null,
      usedAt: null,
    });
  });

  it("emails from the Sites sender and records when", async () => {
    const { site, owner } = await linkedSite();

    expect(await sendClaimLink(site.id, "email")).toEqual({ success: true, message: `Sent to ${owner.email}.` });

    const mail = vi.mocked(sendEmail).mock.calls[0][0];
    expect(mail).toMatchObject({ to: owner.email, from: "Canopy Sites <sites@example.com>" });
    expect(mail.subject).toBe(`Your website account for ${site.name}`);
    expect(mail.text).toContain("update toroz.example.com");
    expect(mail.text).toMatch(/https:\/\/sites\.example\.com\/claim\?token=[a-f0-9]{64}/);
    expect((await prisma.passwordToken.findFirstOrThrow({ where: { userId: owner.id } })).emailedAt).not.toBeNull();
  });

  it("is refused to anyone who isn't a Global Admin, and for an owner who has claimed", async () => {
    const { site, owner } = await linkedSite();
    await signInAs(owner.id);
    await expect(sendClaimLink(site.id, "copy")).rejects.toThrow();
    expect(await prisma.passwordToken.count()).toBe(0);

    const { user: admin } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    await signInAs(admin.id);
    await prisma.user.update({ where: { id: owner.id }, data: { password: "set" } });
    expect(await sendClaimLink(site.id, "copy")).toEqual({ error: `${owner.email} has already claimed the account.` });
  });
});

describe("claiming (PRD D49)", () => {
  it("sets the password, signs the owner in to stay signed in, and the link works once", async () => {
    const { site, owner } = await linkedSite();
    const url = ((await sendClaimLink(site.id, "copy")) as { url: string }).url;
    resetRequest();

    expect(await readClaim(tokenOf(url))).toEqual({ state: "ready", email: owner.email, siteName: site.name });
    expect(await readClaim(tokenOf(url))).toMatchObject({ state: "ready" }); // reading consumes nothing

    expect(await claimAccount({ token: tokenOf(url), password: "my new password" })).toEqual({ success: true });
    const cookie = jar.get(SESSION_COOKIE)?.value ?? "";
    expect(await prisma.session.findUniqueOrThrow({ where: { id: hashSessionToken(cookie) } })).toMatchObject({
      userId: owner.id,
      rememberMe: true,
    });
    const claimed = await prisma.user.findUniqueOrThrow({ where: { id: owner.id } });
    expect(claimed.password).not.toBeNull();
    expect(claimed.lastLoginAt).not.toBeNull();

    expect(await readClaim(tokenOf(url))).toEqual({ state: "claimed" });
    expect(await claimAccount({ token: tokenOf(url), password: "another password" })).toHaveProperty("error");
    expect(await signInAction({ email: owner.email, password: "my new password", rememberMe: false })).toEqual({
      success: true,
    });
  });

  it("previews with the site's name, never the owner's email", async () => {
    const { site, owner } = await linkedSite();
    const url = ((await sendClaimLink(site.id, "copy")) as { url: string }).url;

    const preview = claimPreview(await readClaim(tokenOf(url)), "Canopy Sites");
    expect(preview.title).toBe(`Claim your ${site.name} website`);
    expect(JSON.stringify(preview)).not.toContain(owner.email);
    expect(claimPreview(await readClaim("not-a-token"), "Canopy Sites").title).toBe("Claim your Canopy Sites account");
  });

  it("refuses a link after a week, and one a newer link replaced", async () => {
    const { site } = await linkedSite();
    const first = tokenOf(((await sendClaimLink(site.id, "copy")) as { url: string }).url);
    const second = tokenOf(((await sendClaimLink(site.id, "copy")) as { url: string }).url);

    expect(await readClaim(first)).toEqual({ state: "expired" });
    expect(await claimAccount({ token: first, password: "my new password" })).toHaveProperty("error");

    await prisma.passwordToken.updateMany({ where: { tokenHash: hashToken(second) }, data: { expiresAt: new Date(Date.now() - DAY) } });
    expect(await readClaim(second)).toEqual({ state: "expired" });
    expect(await claimAccount({ token: second, password: "my new password" })).toHaveProperty("error");
  });

  it("claims once when the same link is submitted twice at once", async () => {
    const { site, owner } = await linkedSite();
    const token = tokenOf(((await sendClaimLink(site.id, "copy")) as { url: string }).url);

    const results = await Promise.all([
      claimAccount({ token, password: "first new password" }),
      claimAccount({ token, password: "second new password" }),
    ]);

    expect(results.filter((r) => "success" in r)).toHaveLength(1);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).password).not.toBeNull();
  });

  it("never claims with a reset link, and a claim link never resets", async () => {
    const { site, owner } = await linkedSite();
    const reset = "r".repeat(64);
    await prisma.passwordToken.create({
      data: { userId: owner.id, purpose: "RESET", tokenHash: hashToken(reset), expiresAt: new Date(Date.now() + DAY) },
    });
    expect(await readClaim(reset)).toEqual({ state: "invalid" });
    expect(await claimAccount({ token: reset, password: "my new password" })).toHaveProperty("error");

    const claim = tokenOf(((await sendClaimLink(site.id, "copy")) as { url: string }).url);
    expect(await resetPassword(form({ token: claim, password: "my new password" }))).toHaveProperty("error");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).password).toBeNull();
  });
});

describe("before claiming (PRD D49)", () => {
  it("Forgot password sends the claim email, not a reset, with the same answer", async () => {
    const { owner } = await linkedSite();
    resetRequest();
    requestHeaders.set("cf-connecting-ip", "203.0.113.21");

    const answer = await requestPasswordReset(form({ email: owner.email }));

    expect(answer).toEqual(await requestPasswordReset(form({ email: "nobody@example.com" })));
    expect(await prisma.passwordToken.findMany({ where: { userId: owner.id }, select: { purpose: true, createdByUserId: true } })).toEqual([
      { purpose: "CLAIM", createdByUserId: null },
    ]);
    const mail = vi.mocked(sendEmail).mock.calls[0][0];
    expect(mail.text).toMatch(/https:\/\/sites\.example\.com\/claim\?token=/);
    expect(mail.from).toBe("Canopy Sites <sites@example.com>");
  });

  it("a claimed owner's Forgot password is a reset again", async () => {
    const { owner } = await linkedSite();
    await prisma.user.update({ where: { id: owner.id }, data: { password: "set" } });

    await requestPasswordReset(form({ email: owner.email }));

    expect(await prisma.passwordToken.findFirstOrThrow({ where: { userId: owner.id } })).toMatchObject({ purpose: "RESET" });
    expect(vi.mocked(sendEmail).mock.calls[0][0].text).toMatch(/\/reset-password\?token=/);
  });

  it("an expired link sends a new one to the same address, and a used one doesn't", async () => {
    const { site, owner } = await linkedSite();
    const token = tokenOf(((await sendClaimLink(site.id, "copy")) as { url: string }).url);
    await prisma.passwordToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    resetRequest();

    expect(await resendClaimLink(token)).toEqual({ success: true, message: `A new link is on its way to ${owner.email}.` });
    expect(vi.mocked(sendEmail).mock.calls[0][0].to).toBe(owner.email);
    expect(await prisma.passwordToken.count({ where: { userId: owner.id, usedAt: null, expiresAt: { gt: new Date() } } })).toBe(1);

    await prisma.user.update({ where: { id: owner.id }, data: { password: "set" } });
    expect(await resendClaimLink(token)).toEqual({ error: "This account is already set up. Sign in instead." });
  });
});

describe("addAccountMember", () => {
  it("adds a member with no password and hands back a claim link", async () => {
    const { account } = await linkedSite();

    const result = await addAccountMember(account.id, "partner@example.com");

    expect(result).toMatchObject({ success: true, email: "partner@example.com" });
    expect((result as { claimUrl: string }).claimUrl).toMatch(/^https:\/\/sites\.example\.com\/claim\?token=/);
    expect(await prisma.user.findUniqueOrThrow({ where: { email: "partner@example.com" } })).toMatchObject({ password: null });
  });
});

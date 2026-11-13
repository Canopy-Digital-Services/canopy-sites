import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createAccount, createForm, createSite, resetDatabase } from "../../test/db";
import { resetRequest, signInAs } from "../../test/next-request";

vi.mock("next/headers", () => import("../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.spyOn(console, "log").mockImplementation(() => {});

// The builder is another service; stand in for it. Prisma is real.
vi.mock("@/lib/builder-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/builder-client")>("@/lib/builder-client");
  const content = {
    site: {
      name: "Toro Z",
      description: "A gym.",
      contact: { phone: "555-0100", email: "hi@example.com" },
      hours: { kind: "weekly", days: [{ day: "tuesday", opens: "12:00", closes: "17:00" }] },
      socials: [],
    },
  };
  return {
    ...actual,
    fetchContent: vi.fn(async () => ({ commit: "a".repeat(40), content: structuredClone(content), guide: null, contractVersion: "0.4.0" })),
    requestPreview: vi.fn(async (_site, buildId: string) => ({ id: buildId, status: "queued" })),
  };
});

const { validateSessionToken } = await import("@/lib/session");
const { getCurrentAccountId } = await import("@/lib/auth-utils");
const { actAsClient, stopActing } = await import("@/actions/admin/act-as");
const { changePassword, signOutAction } = await import("@/actions/auth");
const { deleteSelfAccount, setAccountTimeZone } = await import("@/actions/accounts");
const { saveCanvasEdits } = await import("@/actions/site-editor");
const { default: FormPage } = await import("@/app/(admin)/forms/[formId]/page");

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
});

async function expectRedirect(promise: Promise<unknown>, to: string) {
  const err = await promise.then(() => null, (e) => e);
  expect(String(err?.digest)).toContain(`NEXT_REDIRECT;replace;${to};`);
}

/** A client with a site, and a Global Admin signed in and acting as them. */
async function acting() {
  const { account: client, user: owner } = await createAccount({ planCode: "SITES" });
  const site = await createSite(client.id);
  await prisma.site.update({ where: { id: site.id }, data: { repoUrl: "https://github.com/example/toroz", productionHostnames: ["toroz.example.com"] } });
  const { account: own, user: operator } = await createAccount({ planCode: "SITES", roleCode: "GLOBAL_ADMIN" });
  const { token, session } = await signInAs(operator.id);
  await expectRedirect(actAsClient(site.id), "/");
  return { client, owner, site, own, operator, token, sessionId: session.id };
}

describe("acting as a client (PRD D49)", () => {
  it("records who is in which account and resolves every account lookup to the client's", async () => {
    const { client, operator, sessionId } = await acting();

    const record = await prisma.actAs.findFirstOrThrow();
    expect(record).toMatchObject({ operatorUserId: operator.id, accountId: client.id, endedAt: null });
    expect(await prisma.session.findUniqueOrThrow({ where: { id: sessionId } })).toMatchObject({ actAsId: record.id });
    expect(await getCurrentAccountId()).toBe(client.id);
  });

  it("is refused to anyone who isn't a Global Admin", async () => {
    const { account: client } = await createAccount({ planCode: "SITES" });
    const site = await createSite(client.id);
    const { user } = await createAccount({ planCode: "SITES" });
    await signInAs(user.id);

    await actAsClient(site.id).catch(() => null);

    expect(await prisma.actAs.count()).toBe(0);
  });

  it("never applies to a session whose user isn't a Global Admin, even with a record pointing at it", async () => {
    const { account: client } = await createAccount({ planCode: "SITES" });
    const { account: own, user } = await createAccount({ planCode: "SITES" });
    const { token, session } = await signInAs(user.id);
    const record = await prisma.actAs.create({ data: { operatorUserId: user.id, accountId: client.id } });
    await prisma.session.update({ where: { id: session.id }, data: { actAsId: record.id } });

    expect(await validateSessionToken(token)).toMatchObject({ actingAs: null });
    expect(await getCurrentAccountId()).toBe(own.id);
    expect(await prisma.session.findUniqueOrThrow({ where: { id: session.id } })).toMatchObject({ actAsId: null });
    expect((await prisma.actAs.findUniqueOrThrow({ where: { id: record.id } })).endedAt).not.toBeNull();
  });

  it("ends on the next request after the operator stops being a Global Admin", async () => {
    const { own, operator, token } = await acting();
    await prisma.user.update({ where: { id: operator.id }, data: { roleCode: "USER" } });

    expect(await validateSessionToken(token)).toMatchObject({ actingAs: null });
    expect(await getCurrentAccountId()).toBe(own.id);
    expect((await prisma.actAs.findFirstOrThrow()).endedAt).not.toBeNull();
  });

  it("ends with Stop, back on the site's operator page, and with sign-out", async () => {
    const { own, site } = await acting();
    await expectRedirect(stopActing(), `/operator/sites/${site.id}`);
    expect(await getCurrentAccountId()).toBe(own.id);
    expect((await prisma.actAs.findFirstOrThrow()).endedAt).not.toBeNull();

    await expectRedirect(actAsClient(site.id), "/");
    const second = await prisma.actAs.findFirstOrThrow({ where: { endedAt: null } });
    await expectRedirect(signOutAction(), "/login");
    expect((await prisma.actAs.findUniqueOrThrow({ where: { id: second.id } })).endedAt).not.toBeNull();
  });

  it("ends when the session expires", async () => {
    const { token, sessionId } = await acting();
    await prisma.session.update({ where: { id: sessionId }, data: { expiresAt: new Date(Date.now() - 1000) } });

    expect(await validateSessionToken(token)).toBeNull();
    expect((await prisma.actAs.findFirstOrThrow()).endedAt).not.toBeNull();
  });

  it("can't change a password or delete the client's account", async () => {
    const { client, owner, operator } = await acting();
    await prisma.user.update({ where: { id: owner.id }, data: { password: await hashPassword("owner's own pass") } });
    const before = await prisma.user.findUniqueOrThrow({ where: { id: owner.id } });
    const fd = new FormData();
    fd.set("currentPassword", "anything");
    fd.set("newPassword", "a new long password");

    expect(await changePassword(fd)).toEqual({ error: "Stop acting as the client to change a password." });
    expect(await deleteSelfAccount()).toEqual({ error: "Stop acting as the client first." });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).password).toBe(before.password);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: operator.id } })).passwordChangedAt).toBeNull();
    expect(await prisma.account.count({ where: { id: client.id } })).toBe(1);
  });

  it("sets the client's time zone, not the operator's own account's", async () => {
    const { client, own } = await acting();

    expect(await setAccountTimeZone("America/Denver")).toEqual({ success: true });

    expect((await prisma.account.findUniqueOrThrow({ where: { id: client.id } })).timeZone).toBe("America/Denver");
    expect((await prisma.account.findUniqueOrThrow({ where: { id: own.id } })).timeZone).toBe("UTC");
  });

  it("names the operator, not the owner, on an edit made in the client's site", async () => {
    const { site, operator } = await acting();

    const result = await saveCanvasEdits({ siteId: site.id, edits: [{ address: "site/description", value: "A gym in Oak Park." }] });

    expect(result).toMatchObject({ success: true });
    expect(await prisma.changeSet.findFirstOrThrow({ where: { siteId: site.id } })).toMatchObject({
      createdByUserId: operator.id,
      source: "EDITOR",
    });
  });

  it("offers the owner, not the operator, as a client's form's first notification recipient", async () => {
    const { client, owner, operator } = await acting();
    const form = await createForm(client.id, operator.id);

    const page = await FormPage({ params: Promise.resolve({ formId: form.id }), searchParams: Promise.resolve({}) });

    expect(page.props.ownerEmail).toBe(owner.email);
  });
});

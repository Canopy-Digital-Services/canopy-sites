import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetRateLimits } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { createAccount, createSite, resetDatabase } from "../../../test/db";

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => true) }));

const help = await import("./help-requests");
const { ToolError } = await import("./index");
const sent = vi.mocked(sendEmail);

const ASK = { message: "Can you add a kickboxing class on Thursdays at 7pm?", summary: "New kickboxing class", address: "classes" };

async function owner() {
  const { account, user } = await createAccount({ planCode: "SITES" });
  const site = await createSite(account.id);
  return { account, user, site, ctx: { accountId: account.id, userId: user.id, actAsId: null } };
}

beforeEach(async () => {
  await resetDatabase();
  resetRateLimits();
  sent.mockClear();
  process.env.SMTP_FROM_SITES = "Canopy Sites <sites@canopyds.com>";
});

describe("a request from Quick Edit (PRD D34)", () => {
  it("is a draft until the owner sends it, and only a sent one reaches Canopy, by email to every operator", async () => {
    const { ctx, user, site } = await owner();
    const { user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });

    const draft = await help.draftHelpRequest(ctx, ASK);
    expect(draft).toMatchObject({ status: "DRAFT", message: ASK.message, summary: ASK.summary, address: "classes" });
    expect(sent).not.toHaveBeenCalled();
    expect(await help.countOpenHelpRequests(site.id)).toBe(0);

    const open = await help.sendHelpRequest(ctx, draft.id);
    expect(open.status).toBe("OPEN");
    expect(await help.countOpenHelpRequests(site.id)).toBe(1);
    expect(sent).toHaveBeenCalledTimes(1);
    expect(sent.mock.calls[0][0]).toMatchObject({
      to: [operator.email],
      from: "Canopy Sites <sites@canopyds.com>",
      replyTo: user.email,
      subject: `${site.name}: ${ASK.summary}`,
    });
    expect(sent.mock.calls[0][0].text).toContain(ASK.message);

    // A second tap is the same send, not a second email.
    expect((await help.sendHelpRequest(ctx, draft.id)).status).toBe("OPEN");
    expect(sent).toHaveBeenCalledTimes(1);
  });

  it("sends text Quick Edit refused straight to Canopy, marked as refused", async () => {
    const { ctx, site } = await owner();
    await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const request = await help.fileHelpRequest(ctx, { message: "Put a slur in the hero", summary: "Refused hero text", refused: true });
    expect(request).toMatchObject({ status: "OPEN", refused: true });
    expect(sent.mock.calls[0][0].subject).toBe(`Refused: ${site.name}: Refused hero text`);
    expect(sent.mock.calls[0][0].text).toContain("Quick Edit refused to put this on");
  });

  it("files nothing on Not now", async () => {
    const { ctx, site } = await owner();
    const draft = await help.draftHelpRequest(ctx, ASK);
    expect((await help.dismissHelpRequest(ctx, draft.id)).status).toBe("DISMISSED");
    await expect(help.sendHelpRequest(ctx, draft.id)).rejects.toThrow("can't be sent now");
    expect(await help.countOpenHelpRequests(site.id)).toBe(0);
    expect(await help.listHelpRequestsForOperator()).toEqual([]);
    expect(sent).not.toHaveBeenCalled();
  });

  it("is the operator's, and emails nobody, when sent while acting as the client", async () => {
    const { account, site } = await owner();
    const { user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const actAs = await prisma.actAs.create({ data: { operatorUserId: operator.id, accountId: account.id } });
    const ctx = { accountId: account.id, userId: operator.id, actAsId: actAs.id };

    const request = await help.fileHelpRequest(ctx, ASK);
    expect(await prisma.helpRequest.findUniqueOrThrow({ where: { id: request.id } })).toMatchObject({
      status: "OPEN",
      createdByUserId: operator.id,
      actAsId: actAs.id,
    });
    expect(sent).not.toHaveBeenCalled();
    // Closing it with a note emails nobody either.
    expect(await help.closeHelpRequest({ userId: operator.id, email: operator.email }, request.id, { status: "DONE", note: "Test." })).toEqual({
      emailed: false,
    });
    expect(sent).not.toHaveBeenCalled();
    expect(await help.countOpenHelpRequests(site.id)).toBe(0);
  });

  it("is the account's own: another account can't send or dismiss it", async () => {
    const a = await owner();
    const b = await owner();
    const draft = await help.draftHelpRequest(a.ctx, ASK);
    await expect(help.sendHelpRequest(b.ctx, draft.id)).rejects.toThrow("No such request.");
    await expect(help.dismissHelpRequest(b.ctx, draft.id)).rejects.toThrow("No such request.");
  });

  it("needs the owner's words and a summary, and is rate limited", async () => {
    const { ctx } = await owner();
    await expect(help.draftHelpRequest(ctx, { ...ASK, message: "  " })).rejects.toBeInstanceOf(ToolError);
    await expect(help.draftHelpRequest(ctx, { ...ASK, summary: "" })).rejects.toThrow("summary");
    for (let i = 0; i < 20; i++) await help.draftHelpRequest(ctx, ASK);
    await expect(help.draftHelpRequest(ctx, ASK)).rejects.toThrow(/Too many requests/);
  });
});

describe("closing a request", () => {
  it("records who closed it, and emails the owner a note from the Sites sender", async () => {
    const { ctx, user } = await owner();
    const { user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const request = await help.fileHelpRequest(ctx, ASK);
    sent.mockClear();

    const note = "Added it. It's on the preview now.";
    expect(await help.closeHelpRequest({ userId: operator.id, email: operator.email }, request.id, { status: "DONE", note })).toEqual({
      emailed: true,
    });
    expect(sent.mock.calls[0][0]).toMatchObject({
      to: user.email,
      from: "Canopy Sites <sites@canopyds.com>",
      replyTo: operator.email,
      subject: `About your request: ${ASK.summary}`,
    });
    expect(sent.mock.calls[0][0].text).toContain(note);
    expect(await prisma.helpRequest.findUniqueOrThrow({ where: { id: request.id } })).toMatchObject({
      status: "DONE",
      note,
      closedByUserId: operator.id,
    });

    // Closed once; the owner sees it with the note.
    await expect(
      help.closeHelpRequest({ userId: operator.id, email: operator.email }, request.id, { status: "DECLINED" }),
    ).rejects.toThrow("isn't open");
    expect(await help.listOwnHelpRequests(ctx.accountId)).toMatchObject([{ id: request.id, status: "DONE", note }]);
  });

  it("emails nobody without a note", async () => {
    const { ctx } = await owner();
    const { user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const request = await help.fileHelpRequest(ctx, ASK);
    sent.mockClear();
    expect(await help.closeHelpRequest({ userId: operator.id, email: operator.email }, request.id, { status: "DECLINED", note: " " })).toEqual({
      emailed: false,
    });
    expect(sent).not.toHaveBeenCalled();
  });

  it("lists open requests first, then the newest", async () => {
    const { ctx } = await owner();
    const { user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const first = await help.fileHelpRequest(ctx, { ...ASK, summary: "First" });
    await help.closeHelpRequest({ userId: operator.id, email: operator.email }, first.id, { status: "DONE" });
    const second = await help.fileHelpRequest(ctx, { ...ASK, summary: "Second" });
    await help.draftHelpRequest(ctx, { ...ASK, summary: "Never sent" });
    expect((await help.listHelpRequestsForOperator()).map((r) => r.summary)).toEqual(["Second", "First"]);
    expect((await help.listOwnHelpRequests(ctx.accountId)).map((r) => r.id)).toEqual([second.id, first.id]);
  });
});

/**
 * Asking Canopy (PRD D34, Epic 40 4.3): whatever Quick Edit can't do goes to
 * a person, never a dead end. Quick Edit drafts a request in the owner's
 * words (`draftHelpRequest`); the owner sends it from a card showing exactly
 * what goes (`sendHelpRequest`), or dismisses it, and only a sent request
 * reaches Canopy. Canopy's operators are emailed and close it from the
 * operator console (`closeHelpRequest`), and a closing note is emailed to the
 * sender. A request sent while an operator acts as the client is recorded as
 * the operator's and emails nobody, so acceptance and eval runs stay out of
 * the inbox. Text Quick Edit won't put on the site (`refused`: swearing, hate
 * speech, nothing to do with the business) is drafted the same way: the owner
 * decides whether Michael sees it. `fileHelpRequest` drafts and sends in one
 * step, for MCP (E34), whose clients confirm with the owner first.
 *
 * Callers pass the session's account id; never an id from the client.
 */

import { fieldInfo } from "@canopy/site-contract";
import type { HelpRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { appUrlFor, senderFor } from "@/lib/product";
import { isRateLimited } from "@/lib/rate-limit";
import { HELP_DRAFTS_PER_HOUR, HELP_MESSAGE_MAX, HELP_NOTE_MAX, HELP_SENDS_PER_DAY, HELP_SUMMARY_MAX } from "./help-request-limits";
import { ToolError } from "./index";

export interface HelpContext {
  accountId: string;
  /** Who sends: the owner, or the operator acting as them. */
  userId: string | null;
  /** Set while an operator acts as the client (PRD D49). */
  actAsId: string | null;
}

export interface HelpRequestDraft {
  message: string;
  summary: string;
  /** The field it's about, when there is one (PRD D36). */
  address?: string | null;
  conversationId?: string | null;
  /** Text Quick Edit won't put on the site; still the owner's to send or not. */
  refused?: boolean;
}

export interface HelpRequestView {
  id: string;
  status: HelpRequestStatus;
  message: string;
  summary: string;
  address: string | null;
  refused: boolean;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const view = (r: HelpRequestView): HelpRequestView => ({
  id: r.id,
  status: r.status,
  message: r.message,
  summary: r.summary,
  address: r.address,
  refused: r.refused,
});

async function siteOf(accountId: string) {
  const site = await prisma.site.findUnique({ where: { accountId } });
  if (!site) throw new ToolError("This account has no site.");
  return site;
}

/** Drafts a request for the owner to send or dismiss. Nothing reaches Canopy yet. */
export async function draftHelpRequest(ctx: HelpContext, input: HelpRequestDraft): Promise<HelpRequestView> {
  const site = await siteOf(ctx.accountId);
  const message = String(input.message ?? "").trim();
  const summary = String(input.summary ?? "").trim().replace(/\s+/g, " ");
  if (!message) throw new ToolError("A request needs the owner's words.");
  if (!summary) throw new ToolError("A request needs a one-line summary.");
  if (isRateLimited(`help:draft:${ctx.accountId}`, HELP_DRAFTS_PER_HOUR, HOUR)) {
    throw new ToolError("Too many requests in the last hour. Try again later, or text Michael.");
  }
  const address = input.address ? String(input.address).trim().slice(0, 300) || null : null;
  const conversationId = input.conversationId
    ? ((await prisma.conversation.findFirst({ where: { id: input.conversationId, siteId: site.id }, select: { id: true } }))?.id ?? null)
    : null;
  const created = await prisma.helpRequest.create({
    data: {
      siteId: site.id,
      conversationId,
      createdByUserId: ctx.userId,
      actAsId: ctx.actAsId,
      message: message.slice(0, HELP_MESSAGE_MAX),
      summary: summary.slice(0, HELP_SUMMARY_MAX),
      address,
      refused: Boolean(input.refused),
    },
  });
  return view(created);
}

/** Sends a drafted request to Canopy: the owner's tap on the card. Sending twice is one send. */
export async function sendHelpRequest(ctx: HelpContext, id: string): Promise<HelpRequestView> {
  const request = await prisma.helpRequest.findFirst({ where: { id: String(id), site: { accountId: ctx.accountId } } });
  if (!request) throw new ToolError("No such request.");
  if (request.status === "OPEN") return view(request);
  if (request.status !== "DRAFT") throw new ToolError("That request can't be sent now.");
  if (isRateLimited(`help:send:${ctx.accountId}`, HELP_SENDS_PER_DAY, DAY)) {
    throw new ToolError("That's a lot of requests for one day. Text Michael instead.");
  }
  const sent = await prisma.helpRequest.updateMany({
    where: { id: request.id, status: "DRAFT" },
    data: { status: "OPEN", sentAt: new Date(), createdByUserId: ctx.userId, actAsId: ctx.actAsId },
  });
  const after = await prisma.helpRequest.findUniqueOrThrow({ where: { id: request.id } });
  // Another tap sent it first; that one emailed.
  if (sent.count === 0) return view(after);
  if (!ctx.actAsId) await notifyOperators(after.id);
  return view(after);
}

/** The owner's Not now: the draft never reaches Canopy. */
export async function dismissHelpRequest(ctx: HelpContext, id: string): Promise<HelpRequestView> {
  const request = await prisma.helpRequest.findFirst({ where: { id: String(id), site: { accountId: ctx.accountId } } });
  if (!request) throw new ToolError("No such request.");
  if (request.status !== "DRAFT") return view(request);
  return view(await prisma.helpRequest.update({ where: { id: request.id }, data: { status: "DISMISSED" } }));
}

/** Drafts and sends in one step, for a client that has already confirmed with the owner (MCP, E34). */
export async function fileHelpRequest(ctx: HelpContext, input: HelpRequestDraft): Promise<HelpRequestView> {
  return sendHelpRequest(ctx, (await draftHelpRequest(ctx, input)).id);
}

/** The account's requests that reached Canopy, newest first, for the owner's Quick Edit. */
export async function listOwnHelpRequests(accountId: string, take = 10) {
  return prisma.helpRequest.findMany({
    where: { site: { accountId }, status: { in: ["OPEN", "DONE", "DECLINED"] } },
    orderBy: { sentAt: "desc" },
    take,
    select: { id: true, summary: true, status: true, sentAt: true, closedAt: true, note: true },
  });
}

// ---------------------------------------------------------------------------
// The operator's side. Callers check requireGlobalAdmin first.

/** Sent requests, open first, then newest; one site's when siteId is given. */
export async function listHelpRequestsForOperator(options: { siteId?: string; take?: number } = {}) {
  const rows = await prisma.helpRequest.findMany({
    where: { status: { in: ["OPEN", "DONE", "DECLINED"] }, ...(options.siteId ? { siteId: options.siteId } : {}) },
    orderBy: { sentAt: "desc" },
    take: options.take ?? 100,
    include: {
      site: { select: { id: true, name: true, timeZone: true } },
      createdBy: { select: { email: true } },
      closedBy: { select: { email: true } },
    },
  });
  return [...rows.filter((r) => r.status === "OPEN"), ...rows.filter((r) => r.status !== "OPEN")];
}

export async function countOpenHelpRequests(siteId?: string): Promise<number> {
  return prisma.helpRequest.count({ where: { status: "OPEN", ...(siteId ? { siteId } : {}) } });
}

/** Closes an open request as done or declined; a note goes to the sender by email, unless the request was sent while acting. */
export async function closeHelpRequest(
  operator: { userId: string; email: string },
  id: string,
  input: { status: "DONE" | "DECLINED"; note?: string | null },
): Promise<{ emailed: boolean }> {
  if (input.status !== "DONE" && input.status !== "DECLINED") throw new ToolError("Close a request as done or declined.");
  const note = input.note ? String(input.note).trim().slice(0, HELP_NOTE_MAX) || null : null;
  const closed = await prisma.helpRequest.updateMany({
    where: { id: String(id), status: "OPEN" },
    data: { status: input.status, note, closedByUserId: operator.userId, closedAt: new Date() },
  });
  if (closed.count === 0) throw new ToolError("That request isn't open.");
  if (!note) return { emailed: false };
  const request = await prisma.helpRequest.findUniqueOrThrow({
    where: { id: String(id) },
    include: { site: { select: { name: true } }, createdBy: { select: { email: true } } },
  });
  if (request.actAsId || !request.createdBy) return { emailed: false };
  const emailed = await sendEmail({
    to: request.createdBy.email,
    from: senderFor({ sitesEnabled: true }),
    replyTo: operator.email,
    ...replyEmail({ siteName: request.site.name, message: request.message, summary: request.summary, note }),
  });
  return { emailed };
}

// ---------------------------------------------------------------------------
// Email

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const PRODUCT = "Canopy Sites";

function fieldLabel(address: string | null): string | null {
  if (!address) return null;
  try {
    return fieldInfo(address)?.label ?? null;
  } catch {
    return null;
  }
}

async function notifyOperators(requestId: string): Promise<void> {
  const request = await prisma.helpRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { site: { select: { name: true } }, createdBy: { select: { email: true } } },
  });
  const operators = await prisma.user.findMany({ where: { roleCode: "GLOBAL_ADMIN" }, select: { email: true } });
  if (!operators.length) return;
  const url = `${appUrlFor({ sitesEnabled: true })}/operator/requests`;
  const about = fieldLabel(request.address);
  const from = request.createdBy?.email ?? "the site's owner";
  const subject = `${request.refused ? "Refused: " : ""}${request.site.name}: ${request.summary}`;
  const lead = request.refused
    ? `Quick Edit refused to put this on ${request.site.name}'s site and sent it here.`
    : `${request.site.name} sent a request from Quick Edit.`;
  const text = [
    lead,
    "",
    request.message,
    "",
    ...(about ? [`About: ${about} (${request.address})`] : []),
    `From: ${from}`,
    "",
    `Open it: ${url}`,
    "",
    "---",
    PRODUCT,
  ].join("\n");
  const html = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <p>${escapeHtml(lead)}</p>
  <blockquote style="margin: 16px 0; padding: 8px 16px; border-left: 3px solid #005f6a; white-space: pre-wrap;">${escapeHtml(request.message)}</blockquote>
  ${about ? `<p style="color: #666; font-size: 14px;">About: ${escapeHtml(about)} (${escapeHtml(request.address ?? "")})</p>` : ""}
  <p style="color: #666; font-size: 14px;">From: ${escapeHtml(from)}</p>
  <p style="margin: 20px 0;">
    <a href="${url}" style="background: #005f6a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Open requests</a>
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">${PRODUCT}</p>
</body>
</html>`;
  await sendEmail({
    to: operators.map((o) => o.email),
    from: senderFor({ sitesEnabled: true }),
    replyTo: request.createdBy?.email,
    subject,
    text,
    html,
  });
}

function replyEmail(args: { siteName: string; message: string; summary: string; note: string }) {
  const subject = `About your request: ${args.summary}`;
  const text = [args.note, "", "You asked:", args.message, "", "---", `${PRODUCT}, for ${args.siteName}`].join("\n");
  const html = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <p style="white-space: pre-wrap;">${escapeHtml(args.note)}</p>
  <p style="color: #666; font-size: 14px; margin-top: 24px;">You asked:</p>
  <blockquote style="margin: 8px 0; padding: 8px 16px; border-left: 3px solid #ddd; color: #666; white-space: pre-wrap;">${escapeHtml(args.message)}</blockquote>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">${PRODUCT}, for ${escapeHtml(args.siteName)}</p>
</body>
</html>`;
  return { subject, text, html };
}

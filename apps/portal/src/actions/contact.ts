"use server";

import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { isRateLimited } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";

/**
 * Two outbound message kinds from the help bubble. They share validation,
 * throttling, and context capture, and differ only in recipient, subject tag,
 * and copy.
 */
export type ContactKind = "feedback" | "support";

export type ContactPayload = {
  kind: ContactKind;
  message: string;
  /**
   * Where the reply should go. Support lets the user edit this, so it may differ
   * from the account email. Defaults to the account email when absent.
   */
  replyToEmail?: string;
  pathname: string;
  search?: string;
  formId?: string;
  submissionId?: string;
};

export type ContactResult = { success: true } | { error: string };

const MAX_MESSAGE_LENGTH = 5000;

const KIND_META: Record<ContactKind, { subjectTag: string; noun: string }> = {
  feedback: { subjectTag: "[Canopy Forms feedback]", noun: "Feedback" },
  support: { subjectTag: "[Canopy Forms support]", noun: "Support" },
};

/**
 * Support falls back to the feedback recipient so existing deployments keep
 * working without adding SUPPORT_RECIPIENT_EMAIL.
 */
function recipientFor(kind: ContactKind): string | undefined {
  if (kind === "support") {
    return (
      process.env.SUPPORT_RECIPIENT_EMAIL || process.env.FEEDBACK_RECIPIENT_EMAIL
    );
  }
  return process.env.FEEDBACK_RECIPIENT_EMAIL;
}

export async function submitContactMessage(
  payload: ContactPayload
): Promise<ContactResult> {
  const session = await auth();
  const userEmail = session?.user?.email;
  const userId = session?.user?.id;
  if (!userEmail || !userId) {
    return { error: "You must be signed in to send a message." };
  }

  // `kind` crosses the client boundary, so don't trust it as an index.
  const kind: ContactKind = payload.kind === "support" ? "support" : "feedback";
  const meta = KIND_META[kind];

  const message = (payload.message ?? "").trim();
  if (message.length === 0) {
    return { error: "Please enter a message before sending." };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).` };
  }

  // This lands in a Reply-To header, so it must be re-validated here even though
  // the dialog checks it too. `isValidEmail` rejects CR/LF header injection.
  const requestedReplyTo = (payload.replyToEmail ?? "").trim();
  if (requestedReplyTo && !isValidEmail(requestedReplyTo)) {
    return { error: "Enter a valid email address for the reply." };
  }
  const replyTo = requestedReplyTo || userEmail;

  // One submission per user per minute, tracked per kind so sending feedback
  // doesn't block an urgent support request.
  if (isRateLimited(`contact:${kind}:${userId}`, 1, 60 * 1000)) {
    return {
      error: "You're sending messages too quickly. Please wait a moment and try again.",
    };
  }

  const recipient = recipientFor(kind);
  if (!recipient) {
    console.warn(
      `No recipient configured for ${kind} messages; nothing can be delivered`
    );
    return { error: `${meta.noun} is not configured on this server.` };
  }

  const appUrl = process.env.NEXTAUTH_URL || "";
  const fullUrl = appUrl
    ? `${appUrl}${payload.pathname}${payload.search ? `?${payload.search}` : ""}`
    : payload.pathname;

  const lines = [
    // Account email is the verified identity; the reply address is user-supplied,
    // so surface both whenever they diverge.
    `From: ${userEmail}`,
  ];
  if (replyTo !== userEmail) lines.push(`Reply to: ${replyTo}`);
  lines.push(`Page: ${fullUrl}`);
  if (payload.formId) lines.push(`Form ID: ${payload.formId}`);
  if (payload.submissionId) lines.push(`Submission ID: ${payload.submissionId}`);
  lines.push(`Submitted: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(message);

  const subjectPreview = message.slice(0, 60).replace(/\s+/g, " ").trim();
  const subject = subjectPreview
    ? `${meta.subjectTag} ${subjectPreview}`
    : meta.subjectTag;

  const sent = await sendEmail({
    to: recipient,
    subject,
    text: lines.join("\n"),
    // Reply goes straight back to the sender rather than the SMTP identity.
    replyTo,
  });

  if (!sent) {
    return { error: "Could not send your message. Please try again." };
  }

  return { success: true };
}

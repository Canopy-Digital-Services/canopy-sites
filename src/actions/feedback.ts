"use server";

import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { isRateLimited } from "@/lib/rate-limit";

export type FeedbackPayload = {
  message: string;
  pathname: string;
  search?: string;
  formId?: string;
  submissionId?: string;
};

export type FeedbackResult = { success: true } | { error: string };

const MAX_MESSAGE_LENGTH = 5000;

export async function submitFeedback(
  payload: FeedbackPayload
): Promise<FeedbackResult> {
  const session = await auth();
  const userEmail = session?.user?.email;
  const userId = session?.user?.id;
  if (!userEmail || !userId) {
    return { error: "You must be signed in to send feedback." };
  }

  const message = (payload.message ?? "").trim();
  if (message.length === 0) {
    return { error: "Please enter a message before sending." };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).` };
  }

  // One feedback submission per user per minute.
  if (isRateLimited(`feedback:${userId}`, 1, 60 * 1000)) {
    return { error: "You're sending feedback too quickly. Please wait a moment and try again." };
  }

  const recipient = process.env.FEEDBACK_RECIPIENT_EMAIL;
  if (!recipient) {
    console.warn("FEEDBACK_RECIPIENT_EMAIL is not configured; feedback cannot be delivered");
    return { error: "Feedback is not configured on this server." };
  }

  const appUrl = process.env.NEXTAUTH_URL || "";
  const fullUrl = appUrl
    ? `${appUrl}${payload.pathname}${payload.search ? `?${payload.search}` : ""}`
    : payload.pathname;

  const lines = [
    `From: ${userEmail}`,
    `Page: ${fullUrl}`,
  ];
  if (payload.formId) lines.push(`Form ID: ${payload.formId}`);
  if (payload.submissionId) lines.push(`Submission ID: ${payload.submissionId}`);
  lines.push(`Submitted: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(message);

  const subjectPreview = message.slice(0, 60).replace(/\s+/g, " ").trim();
  const subject = subjectPreview
    ? `[Canopy Forms feedback] ${subjectPreview}`
    : "[Canopy Forms feedback]";

  const sent = await sendEmail({
    to: recipient,
    subject,
    text: lines.join("\n"),
  });

  if (!sent) {
    return { error: "Could not send feedback. Please try again." };
  }

  return { success: true };
}

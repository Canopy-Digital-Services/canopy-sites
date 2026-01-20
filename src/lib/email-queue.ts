import { sendSubmissionNotification } from "./email";
import type { Submission, Form, Site } from "@prisma/client";

/**
 * Queue an email notification (fire-and-forget for MVP)
 * In production, consider using a proper job queue (Bull, BeeQueue, etc.)
 */
export function queueEmailNotification(
  submission: Submission,
  form: Form,
  site: Site
): void {
  // Fire and forget - don't await
  sendSubmissionNotification(submission, form, site).catch((error) => {
    console.error("Email queue error:", error);
  });
}

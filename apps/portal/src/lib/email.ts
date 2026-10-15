import nodemailer from "nodemailer";
import {
  renderNotificationEmail,
  type ResponseLine,
} from "@/lib/submission-email";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

/**
 * Create transporter on demand so we always use current env vars
 * (avoids module-level caching issues with Next.js hot reload)
 */
function createTransporter() {
  const port = parseInt(process.env.SMTP_PORT || "587");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // TLS for 465, STARTTLS for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Generic email sending function
 * Returns true on success, false on failure
 * Logs errors but does not throw
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Skip if SMTP not configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("SMTP not configured, cannot send email");
    return false;
  }

  try {
    const recipients = Array.isArray(options.to)
      ? options.to.join(", ")
      : options.to;

    // Log config for debugging
    const port = process.env.SMTP_PORT;
    console.log(`📧 Attempting to send email via ${process.env.SMTP_HOST}:${port} (secure: ${port === "465"})`);

    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipients,
      replyTo: options.replyTo,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`✅ Email sent successfully to ${recipients}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email:`, error);
    return false;
  }
}

/**
 * Send a new-submission notification to one recipient.
 * Body shape depends on whether `responses` is supplied — see
 * `src/lib/submission-email.ts`. Returns true on success, false on failure.
 */
export async function sendNewSubmissionNotification(options: {
  formId: string;
  formName: string;
  submittedAt: Date;
  recipient: string;
  responses?: ResponseLine[] | null;
  replyTo?: string | null;
  canUseDashboard?: boolean;
}): Promise<boolean> {
  const dashboardUrl = process.env.NEXTAUTH_URL || "http://localhost:3006";

  const { text, html } = renderNotificationEmail({
    formName: options.formName,
    submittedAt: options.submittedAt,
    submissionsUrl: options.canUseDashboard
      ? `${dashboardUrl}/forms/${options.formId}/submissions`
      : null,
    responses: options.responses,
  });

  return sendEmail({
    to: options.recipient,
    subject: `New submission: ${options.formName}`,
    text,
    html,
    replyTo: options.replyTo ?? undefined,
  });
}

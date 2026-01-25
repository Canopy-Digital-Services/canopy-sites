import nodemailer from "nodemailer";
import type { Submission, Form, Site } from "@prisma/client";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
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

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipients,
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
 * Send email notification for a new form submission
 * Failures are logged but don't throw - emails are best-effort
 */
export async function sendSubmissionNotification(
  submission: Submission,
  form: Form,
  site: Site
): Promise<void> {
  if (!form.notifyEmails || form.notifyEmails.length === 0) {
    return;
  }

  const dashboardUrl = process.env.NEXTAUTH_URL || "http://localhost:3006";
  const submissionUrl = `${dashboardUrl}/forms/${form.id}/submissions/${submission.id}`;

  const emailBody = `
New form submission received on ${site.name}

Form: ${form.name}
Date: ${submission.createdAt.toLocaleString()}

Submission Data:
${JSON.stringify(submission.data, null, 2)}

View in dashboard: ${submissionUrl}

---
This is an automated notification from Can-O-Forms.
  `.trim();

  const success = await sendEmail({
    to: form.notifyEmails,
    subject: `New submission: ${form.name} on ${site.name}`,
    text: emailBody,
  });

  if (success) {
    console.log(`✅ Email notification sent for submission ${submission.id}`);
  }
}

/**
 * Send minimal email notification to account owner for new submission (Epic 4)
 * Does NOT include submission field values - only form name, timestamp, and link
 * Returns true on success, false on failure
 */
export async function sendNewSubmissionNotification(
  formId: string,
  formName: string,
  submissionTimestamp: Date,
  accountEmail: string
): Promise<boolean> {
  const dashboardUrl = process.env.NEXTAUTH_URL || "http://localhost:3006";
  const submissionsUrl = `${dashboardUrl}/forms/${formId}/submissions`;

  const emailBody = `
New form submission received.

Form: ${formName}
Date: ${submissionTimestamp.toLocaleString()}

View submissions: ${submissionsUrl}

---
This is an automated notification from Can-O-Forms.
  `.trim();

  return sendEmail({
    to: accountEmail,
    subject: `New submission: ${formName}`,
    text: emailBody,
  });
}

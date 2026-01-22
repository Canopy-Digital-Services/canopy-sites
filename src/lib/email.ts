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

  // Skip if SMTP not configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("SMTP not configured, skipping email notification");
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

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: form.notifyEmails.join(", "),
      subject: `New submission: ${form.name} on ${site.name}`,
      text: emailBody,
    });

    console.log(`✅ Email notification sent for submission ${submission.id}`);
  } catch (error) {
    console.error(`❌ Failed to send email notification:`, error);
    // Don't throw - email failures shouldn't block the submission
  }
}

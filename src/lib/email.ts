import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
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
 * Send minimal email notification to account owner for new submission
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
This is an automated notification from Canopy Forms.
  `.trim();

  return sendEmail({
    to: accountEmail,
    subject: `New submission: ${formName}`,
    text: emailBody,
  });
}

#!/usr/bin/env tsx
/**
 * Email verification script
 * Usage: npx tsx scripts/test-email.ts recipient@example.com
 * 
 * Sends a test email to verify SMTP configuration works
 */

import { sendEmail } from "../src/lib/email";

async function main() {
  const recipient = process.argv[2];

  if (!recipient) {
    console.error("❌ Error: Please provide a recipient email address");
    console.log("\nUsage: npx tsx scripts/test-email.ts recipient@example.com");
    process.exit(1);
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipient)) {
    console.error(`❌ Error: "${recipient}" is not a valid email address`);
    process.exit(1);
  }

  console.log(`\n📧 Sending test email to ${recipient}...\n`);

  const success = await sendEmail({
    to: recipient,
    subject: "Canopy Forms Email Test",
    text: `This is a test email from Canopy Forms.

If you received this email, your SMTP configuration is working correctly.

Sent at: ${new Date().toISOString()}

---
Canopy Forms Email Infrastructure
`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Canopy Forms Email Test</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Canopy Forms Email Test</h2>
  <p>This is a test email from Canopy Forms.</p>
  <p>If you received this email, your SMTP configuration is working correctly.</p>
  <p style="color: #666; font-size: 14px;">Sent at: ${new Date().toISOString()}</p>
  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">Canopy Forms Email Infrastructure</p>
</body>
</html>`,
  });

  if (success) {
    console.log(`\n✅ Email sent successfully to ${recipient}`);
    console.log("📬 Check the inbox to confirm delivery\n");
    process.exit(0);
  } else {
    console.error(`\n❌ Failed to send email to ${recipient}`);
    console.error("Check SMTP configuration in environment variables:\n");
    console.error("  - SMTP_HOST");
    console.error("  - SMTP_PORT");
    console.error("  - SMTP_USER");
    console.error("  - SMTP_PASS");
    console.error("  - SMTP_FROM (optional)\n");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});

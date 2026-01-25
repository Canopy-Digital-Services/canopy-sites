# Epic 0: Email Infrastructure

**Version:** v2.1.0  
**Completion Date:** January 24, 2026  
**Status:** ✅ Complete

## Overview

Introduced basic outbound email capability to support core system functions. This epic establishes the email foundation required for future features including authentication recovery, submission notifications, and system emails.

## Objectives

- Provide a simple, reliable way for the platform to send emails
- Establish a single interface for all email-sending needs
- Support plain text and HTML email formats
- Centralize SMTP configuration
- Enable verification of email delivery

## Implementation Summary

### What Was Built

1. **Generic Email Function** (`src/lib/email.ts`)
   - Added `EmailOptions` interface with `to`, `subject`, `text`, and optional `html` fields
   - Implemented `sendEmail()` function that:
     - Validates SMTP configuration before attempting to send
     - Handles single or multiple recipients
     - Returns boolean success/failure status
     - Logs all operations without throwing exceptions
     - Uses existing Nodemailer transporter

2. **Refactored Submission Notifications** (`src/lib/email.ts`)
   - Updated `sendSubmissionNotification()` to use the new `sendEmail()` function
   - Maintained all existing behavior (no breaking changes)
   - Simplified code by using the generic email interface

3. **Email Verification Script** (`scripts/test-email.ts`)
   - Command-line tool for testing SMTP configuration
   - Usage: `npx tsx scripts/test-email.ts recipient@example.com`
   - Validates email address format
   - Sends both plain text and HTML test emails
   - Provides clear success/failure feedback with troubleshooting guidance

## Technical Decisions

### Why SMTP via Nodemailer?

**Chosen approach:**
- Already implemented and working in production (v2)
- No external service dependencies beyond SMTP server
- Nodemailer is battle-tested and well-documented
- Provider-agnostic: works with any SMTP server (Migadu, Mailgun, AWS SES, etc.)
- Zero code changes needed to switch providers—only environment variables

**Alternatives considered but rejected:**
- **Transactional email APIs** (Resend, Postmark, SendGrid): Adds vendor lock-in, unnecessary complexity for system emails
- **Multiple provider support**: Out of scope per Epic 0 requirements
- **Background job queue**: Deferred to future epic if needed (current fire-and-forget approach is sufficient)

### Design Principles Followed

- **Simplicity first**: Minimal abstraction, no premature optimization
- **Single interface**: All email sending goes through `sendEmail()`
- **Fail gracefully**: Email failures are logged but don't throw exceptions
- **Configuration via environment**: No hard-coded credentials or settings

## Files Changed

### Modified
- [`src/lib/email.ts`](../../src/lib/email.ts)
  - Added `EmailOptions` interface
  - Added `sendEmail()` function
  - Refactored `sendSubmissionNotification()` to use `sendEmail()`

### Created
- [`scripts/test-email.ts`](../../scripts/test-email.ts)
  - New verification script for testing SMTP configuration

### Documentation
- [`CHANGELOG.md`](../../CHANGELOG.md) - Added v2.1.0 entry
- [`docs/epics/README.md`](README.md) - Created epic index
- This document

## Configuration

No changes needed. Existing SMTP environment variables are used:

```bash
SMTP_HOST=smtp.migadu.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-smtp-password
SMTP_FROM=Can-O-Forms <noreply@yourdomain.com>
```

## Verification & Testing

### Manual Testing

Test email delivery with the verification script:

```bash
# From host machine (Docker)
docker exec canoforms npx tsx scripts/test-email.ts your@email.com

# Or locally
npx tsx scripts/test-email.ts your@email.com
```

Expected output:
```
📧 Sending test email to your@email.com...

✅ Email sent successfully to your@email.com
📬 Check the inbox to confirm delivery
```

### Regression Testing

Existing submission notifications continue to work:
1. Submit a form via embed or API
2. Verify email notification is received (if `notifyEmails` is configured)
3. Check logs for email sending confirmation

## Future Considerations

This epic intentionally provides minimal functionality. Future enhancements that were **not** implemented:

### Not In Scope (by design)
- Email templates system
- Marketing or bulk emails
- Multiple email providers with fallback
- Retry policies or delivery guarantees
- Email analytics or tracking
- Admin UI for email configuration
- User-facing email preferences

### May Be Needed Later
- Background job queue (if email volume increases)
- Email rate limiting (if needed for abuse prevention)
- Bounce handling (if required for deliverability)

## Integration Points

This email infrastructure will be used by:
- **Epic 1 (Authentication)**: Password reset emails
- **Epic 4 (Notifications)**: Enhanced submission notifications
- **Future system emails**: Account-related messages

All future email needs should use the `sendEmail()` function rather than directly accessing the Nodemailer transporter.

## Code Example

```typescript
import { sendEmail } from "@/lib/email";

// Send a simple text email
const success = await sendEmail({
  to: "user@example.com",
  subject: "Password Reset",
  text: "Click here to reset your password: https://..."
});

// Send with HTML
const success = await sendEmail({
  to: ["user1@example.com", "user2@example.com"],
  subject: "System Notification",
  text: "Plain text version",
  html: "<p>HTML version</p>"
});

// Handle result
if (success) {
  console.log("Email sent successfully");
} else {
  console.log("Email failed (check logs for details)");
}
```

## Definition of Done

All acceptance criteria met:

- ✅ The application can send an outbound email successfully
- ✅ Email sending is encapsulated behind a minimal interface (`sendEmail()`)
- ✅ No product features depend directly on provider-specific APIs
- ✅ No user-facing functionality introduced
- ✅ Verification mechanism exists and works
- ✅ Existing submission notifications continue working
- ✅ No linter errors introduced

## Lessons Learned

1. **Leverage existing infrastructure**: v2 already had Nodemailer configured, so extending it was straightforward
2. **Keep it simple**: Resisted the temptation to add templates, queues, or other "nice-to-haves"
3. **Verification matters**: The test script proved valuable for confirming SMTP configuration

## Related Documents

- [v3 Plan](../../v3%20plan.md) - Overall v3 product roadmap
- [CHANGELOG.md](../../CHANGELOG.md) - Version history
- [Epic Index](README.md) - All epic completion reports

---

**Next Epic:** [Epic 1: Account & Authentication](../v3%20plan.md#epic-1--account--authentication)

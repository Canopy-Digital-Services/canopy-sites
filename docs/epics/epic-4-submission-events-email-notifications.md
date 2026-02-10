# Epic 4: Submission Events & Email Notifications

**Version:** v2.5.0  
**Completed:** January 24, 2026  
**Status:** ✅ Complete

## Overview

Epic 4 introduces internal submission events and email notifications for form owners. When a form receives a new submission, the account owner can optionally receive an email notification with basic submission metadata (form name, timestamp, and dashboard link). This epic establishes a minimal, privacy-focused notification system without external webhooks or automation frameworks.

## Goals

- ✅ Add per-form email notification toggle
- ✅ Send minimal notification to account owner's email
- ✅ Fire event exactly once per successful submission
- ✅ Use existing email infrastructure from Epic 0
- ✅ Exclude submission field values from emails (privacy-focused)
- ✅ Handle spam submissions appropriately (no notifications)

## Implementation Summary

### 1. Data Model Changes

Added a new boolean field to the Form model:

```prisma
model Form {
  // ... existing fields ...
  emailNotificationsEnabled Boolean @default(false)  // Epic 4
  // ...
}
```

**Migration:** `20260124170000_epic_4_email_notifications/migration.sql`

```sql
ALTER TABLE "forms" ADD COLUMN "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false;
```

### 2. Email Infrastructure

**New Function:** `sendNewSubmissionNotification()` in `src/lib/email.ts`

```typescript
export async function sendNewSubmissionNotification(
  formId: string,
  formName: string,
  submissionTimestamp: Date,
  accountEmail: string
): Promise<boolean>
```

Key characteristics:
- **Privacy-focused**: Does NOT include submission field values
- **Minimal content**: Form name, timestamp, dashboard link only
- **Single recipient**: Account owner's email (looked up automatically)
- **Non-throwing**: Returns boolean success/failure

**Queue Function:** `queueNewSubmissionNotification()` in `src/lib/email-queue.ts`

```typescript
export function queueNewSubmissionNotification(
  formId: string,
  formName: string,
  submissionTimestamp: Date,
  accountId: string
): void
```

Implements fire-and-forget pattern:
- Looks up account email via `accountId`
- Logs warning if account not found
- Catches and logs errors without throwing

### 3. Submission Event Hook

**Location:** `src/lib/public-submit.ts` (lines 314-321)

```typescript
// Epic 4: Send notification to account owner if enabled
if (!isSpam && (form as any).emailNotificationsEnabled) {
  queueNewSubmissionNotification(
    form.id,
    form.name,
    submission.createdAt,
    form.accountId
  );
}
```

**Trigger conditions:**
- Submission successfully persisted to database
- NOT marked as spam (`!isSpam`)
- Form has notifications enabled (`emailNotificationsEnabled === true`)

**Pattern:** Direct function call immediately after `prisma.submission.create()` - no event bus, no background jobs, follows existing `queueEmailNotification()` pattern.

### 4. UI Changes

**Component:** `src/components/forms/behavior-section.tsx`

Added checkbox toggle in Behavior section:

```tsx
<div className="flex items-center justify-between py-2 border-t">
  <div className="space-y-0.5">
    <Label htmlFor="emailNotifications" className="cursor-pointer">
      Email me on new submission
    </Label>
    <p className="text-sm text-muted-foreground">
      Receive an email notification when someone submits this form
    </p>
  </div>
  <input
    type="checkbox"
    id="emailNotifications"
    checked={emailNotificationsEnabled}
    onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
  />
</div>
```

**Integration:** Toggle state saved via `updateFormBehavior()` server action along with success messages and redirect URLs.

### 5. Server Actions

**Updated:** `src/actions/forms.ts` - `updateFormBehavior()`

```typescript
export async function updateFormBehavior(
  formId: string,
  data: {
    successMessage?: string | null;
    redirectUrl?: string | null;
    emailNotificationsEnabled?: boolean;  // NEW
  }
)
```

Enforces ownership via `getCurrentAccountId()` before persisting changes.

## Files Changed

### Core Implementation
- `prisma/schema.prisma` - Added `emailNotificationsEnabled` field
- `prisma/migrations/20260124170000_epic_4_email_notifications/migration.sql` - Database migration
- `src/lib/email.ts` - Added `sendNewSubmissionNotification()` function
- `src/lib/email-queue.ts` - Added `queueNewSubmissionNotification()` wrapper
- `src/lib/public-submit.ts` - Added notification trigger in submission handler

### UI & Actions
- `src/components/forms/behavior-section.tsx` - Added toggle UI and state management
- `src/components/forms/form-editor.tsx` - Updated prop types
- `src/actions/forms.ts` - Extended `updateFormBehavior()` action
- `src/app/(admin)/forms/[formId]/edit/page.tsx` - Passes full form object (includes new field)

### Documentation
- `package.json` - Bumped version to 2.5.0
- `CHANGELOG.md` - Added v2.5.0 entry
- `docs/epics/epic-4-submission-events-email-notifications.md` - This document
- `docs/epics/README.md` - Marked Epic 4 as complete

## Technical Decisions

### 1. Boolean Field vs. Reusing `notifyEmails` Array

**Decision:** Add separate `emailNotificationsEnabled` boolean field

**Rationale:**
- Clean separation of concerns
- `notifyEmails` array is for custom recipients (future feature)
- Boolean is simpler for on/off toggle
- Easier to query and understand intent

### 2. Event/Hook Architecture

**Decision:** Direct function call after `prisma.submission.create()`

**Rationale:**
- Follows existing `queueEmailNotification()` pattern
- No complexity of event bus or pub/sub
- Executes exactly once per submission
- Local to submission handler (easy to trace)
- Consistent with project's minimalist approach

### 3. Email Content (No Submission Data)

**Decision:** Exclude all submission field values from email

**Rationale:**
- Privacy-focused design
- Reduces risk of sensitive data in email
- Keeps emails simple and scannable
- Forces users to view submissions in dashboard (where proper security exists)
- Aligns with Epic 4 scope: "Do not include submission field values in v3"

### 4. Single Recipient (Account Email)

**Decision:** Look up account owner's email automatically

**Rationale:**
- Simplifies UX (no email input required)
- One account = one user in v3
- Natural fit for self-service platform
- Existing `notifyEmails` array available for multiple recipients later

### 5. Fire-and-Forget Queue Pattern

**Decision:** Non-blocking email sending via async IIFE

**Rationale:**
- Submission success not dependent on email delivery
- Consistent with Epic 0's `queueEmailNotification()` pattern
- Errors logged but don't fail submission
- Acceptable for notification use case (not transactional)

## Testing & Verification

### Database Verification

```bash
docker exec canopy-forms-db psql -U user -d canopy-forms -c "\d forms"
```

**Result:** `emailNotificationsEnabled` column exists with `boolean` type and `false` default.

### Manual Testing Scenarios

#### 1. Toggle Persistence
- [x] Navigate to form edit page
- [x] Expand Behavior section
- [x] Toggle notification checkbox ON
- [x] Click "Save Behavior"
- [x] Refresh page → Toggle remains ON
- [x] Toggle OFF → Save → Refresh → Toggle remains OFF

#### 2. Submission Without Notifications
- [x] Form with notifications OFF
- [x] Submit via embed or direct POST
- [x] Submission appears in database
- [x] No email sent

#### 3. Submission With Notifications (requires SMTP)
- [x] Configure SMTP environment variables
- [x] Enable notifications on form
- [x] Submit form
- [x] Email sent to account owner's email
- [x] Email contains: form name, timestamp, submissions link
- [x] Email does NOT contain submission field values

#### 4. Spam Handling
- [x] Configure honeypot field
- [x] Enable notifications
- [x] Submit with honeypot filled
- [x] Submission marked as spam
- [x] No notification sent

#### 5. SMTP Not Configured
- [x] Remove SMTP variables
- [x] Submit form with notifications enabled
- [x] Submission succeeds (200 response)
- [x] Warning logged: "SMTP not configured"
- [x] No crash or user-facing error

## Future Considerations

### Enhancements for Later Epics

1. **Multiple Recipients** (Epic 5+)
   - Expose `notifyEmails` array in UI
   - Allow custom recipient list alongside account notification
   - Preserve separate toggle for account notifications

2. **Email Templates** (Epic 6+)
   - Customizable email subject/body
   - Include/exclude submission data toggle
   - HTML email templates

3. **Delivery Tracking** (Epic 7+)
   - Log email send attempts
   - Retry failed sends
   - Show delivery status in UI

4. **External Webhooks** (Future)
   - POST submission data to external URLs
   - Signature verification
   - Retry logic with exponential backoff

5. **Digest Emails** (Future)
   - Option for daily/weekly summary instead of per-submission
   - Aggregate multiple submissions

### Known Limitations

- **No retry logic**: Failed email sends are logged but not retried
- **No delivery confirmation**: No way to verify email was delivered
- **Single email format**: Plain text only (no HTML)
- **No rate limiting**: Could send many emails rapidly for high-traffic forms
- **No unsubscribe**: Account owner can't unsubscribe without disabling per-form

### Migration Notes

- Existing forms default to `emailNotificationsEnabled = false` (opt-in)
- No impact on existing `notifyEmails` functionality
- Both notification systems can run simultaneously

## Integration with Existing Features

### Relationship to Epic 0 (Email Infrastructure)

- Uses `sendEmail()` function from Epic 0
- Follows same SMTP configuration pattern
- Shares transporter and error handling

### Relationship to Epic 2 (Form Ownership)

- Leverages direct `accountId` relation on Form model
- Uses `accountId` to look up owner's email
- Ownership already enforced in `updateFormBehavior()` action

### Relationship to Epic 3 (Submission Ingestion)

- Hooks into existing `handlePublicSubmit()` function
- Respects spam detection (honeypot)
- No changes to submission API contract

## Rollback Procedure

If Epic 4 needs to be rolled back:

1. Remove notification toggle from UI (keeps DB column harmless)
2. Comment out hook in `public-submit.ts` (prevents emails)
3. Optional: Drop column via migration if reverting schema

**Safe to leave in place:** Column defaults to `false`, so no emails sent unless explicitly enabled.

## Success Metrics

- ✅ Zero breaking changes to existing functionality
- ✅ Notifications only sent when explicitly enabled
- ✅ Email content excludes sensitive submission data
- ✅ Graceful degradation when SMTP not configured
- ✅ UI toggle persists correctly across page loads
- ✅ Spam submissions correctly skip notifications

## Conclusion

Epic 4 successfully introduces a minimal, privacy-focused email notification system for form submissions. The implementation follows existing patterns, maintains backward compatibility, and provides a foundation for more advanced notification features in future epics. The direct function call approach keeps the codebase simple while establishing the "submission created" event concept that can be extended later.

---

**Next Epic:** [Epic 5: Submission Review & Export](epic-5-submission-review-export.md) (Planned for v2.6.0)

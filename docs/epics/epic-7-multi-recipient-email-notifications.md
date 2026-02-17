# Epic 7: Multi-Recipient Email Notifications

**Version:** v4.1.0
**Completed:** February 16, 2026
**Status:** ✅ Complete

## Overview

Epic 7 enables forms to send submission notifications to multiple email recipients (up to 5), supporting agency/client workflows where form owners need to notify additional stakeholders. The system sends individual emails per recipient for error isolation, validates emails inline with user-friendly error messages, and auto-populates the owner's email when notifications are first enabled.

## Goals

- ✅ Support multiple email recipients per form (up to 5)
- ✅ Send individual emails per recipient (not BCC) for error isolation
- ✅ Auto-populate owner email when toggle is first enabled with empty list
- ✅ Inline email validation (format, duplicates, max cap)
- ✅ Owner email is removable like any other entry
- ✅ Server-side validation and sanitization
- ✅ Auto-save email list changes with existing debounce pattern
- ✅ Backfill existing forms with notifications enabled

## Implementation Summary

### 1. Data Model Changes

**No schema migration needed** — the `notifyEmails` field already existed on the Form model (unused until now):

```prisma
model Form {
  // ... existing fields ...
  notifyEmails String[] @default([])  // Already existed, now wired up
  emailNotificationsEnabled Boolean @default(false)
  // ...
}
```

### 2. Email Queue Refactor

**Location:** `src/lib/email-queue.ts`

**Before (Epic 4):**
```typescript
export function queueNewSubmissionNotification(
  formId: string,
  formName: string,
  submissionTimestamp: Date,
  accountId: string  // DB lookup required
): void
```

**After (Epic 7):**
```typescript
export function queueNewSubmissionNotification(
  formId: string,
  formName: string,
  submissionTimestamp: Date,
  notifyEmails: string[]  // Direct email list
): void
```

Key changes:
- **Removed Prisma DB lookup** — accepts email array directly
- **Loops through recipients** — sends individual emails for error isolation
- **Early return if empty** — no emails sent when array is empty
- **Logs per-recipient** — separate console.log for each email sent

### 3. Server Actions

**Location:** `src/actions/forms.ts`

#### Moved `notifyEmails` to `updateAfterSubmission()`

Removed from `updateFormBasics()` (never called with it from UI) and added to `updateAfterSubmission()` with validation:

```typescript
export async function updateAfterSubmission(
  formId: string,
  data: {
    // ... existing fields ...
    notifyEmails?: string[];  // NEW
  }
)
```

**Server-side validation:**
- Trims and lowercases all emails
- Validates email format with regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Deduplicates (case-insensitive)
- Caps at 5 recipients (slices array)

```typescript
if (data.notifyEmails !== undefined) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  updateData.notifyEmails = [...new Set(
    data.notifyEmails
      .map(e => e.trim().toLowerCase())
      .filter(e => emailRegex.test(e))
  )].slice(0, 5);
}
```

### 4. Public Submit Hook

**Location:** `src/lib/public-submit.ts` (lines 543-551)

**Before:**
```typescript
if (!isSpam && (form as any).emailNotificationsEnabled) {
  queueNewSubmissionNotification(
    form.id,
    form.name,
    submission.createdAt,
    form.accountId  // DB lookup in queue
  );
}
```

**After:**
```typescript
if (!isSpam && form.emailNotificationsEnabled && form.notifyEmails.length > 0) {
  queueNewSubmissionNotification(
    form.id,
    form.name,
    submission.createdAt,
    form.notifyEmails  // Direct array
  );
}
```

Changes:
- Removed `as any` cast (type is correct now)
- Added guard: `form.notifyEmails.length > 0`
- Passes `form.notifyEmails` array directly

**Also updated:** `src/app/api/submit/[formId]/[fieldName]/route.ts` (single-field submit API) with same changes.

### 5. UI Changes

#### Form Editor Page

**Location:** `src/app/(admin)/forms/[formId]/edit/page.tsx`

Added `requireAuth()` call to extract `session.user.email`:

```typescript
const session = await requireAuth();
// ...
return <FormEditor apiUrl={apiUrl} form={form} ownerEmail={session.user.email || ""} />;
```

#### Form Editor Component

**Location:** `src/components/forms/form-editor.tsx`

Added `ownerEmail` to props and threaded to `AfterSubmissionSection`:

```typescript
type FormEditorProps = {
  apiUrl: string;
  ownerEmail: string;  // NEW
  form: { /* ... */ };
};

// Pass through:
<AfterSubmissionSection
  formId={form.id}
  // ... existing props ...
  notifyEmails={form.notifyEmails}  // NEW
  ownerEmail={ownerEmail}  // NEW
/>
```

#### After Submission Section (Multi-Recipient UI)

**Location:** `src/components/forms/after-submission-section.tsx`

**New Props:**
```typescript
type AfterSubmissionSectionProps = {
  // ... existing props ...
  notifyEmails: string[];  // NEW
  ownerEmail: string;  // NEW
};
```

**New State:**
```typescript
const [notifyEmails, setNotifyEmails] = useState<string[]>(initialNotifyEmails || []);
const [newEmailInput, setNewEmailInput] = useState("");
const [emailInputTouched, setEmailInputTouched] = useState(false);
```

**Validation (derived, not stored):**
```typescript
const trimmedNewEmail = newEmailInput.trim().toLowerCase();
const newEmailError = emailInputTouched && trimmedNewEmail
  ? !EMAIL_REGEX.test(trimmedNewEmail)
    ? "Enter a valid email address"
    : notifyEmails.map(e => e.toLowerCase()).includes(trimmedNewEmail)
      ? "This email is already in the list"
      : notifyEmails.length >= MAX_NOTIFY_EMAILS
        ? "Maximum 5 recipients allowed"
        : null
  : null;

const canAddEmail =
  trimmedNewEmail !== "" &&
  EMAIL_REGEX.test(trimmedNewEmail) &&
  !notifyEmails.map(e => e.toLowerCase()).includes(trimmedNewEmail) &&
  notifyEmails.length < MAX_NOTIFY_EMAILS;
```

**Toggle handler (auto-populate):**
```typescript
const handleToggleNotifications = (checked: boolean) => {
  setEmailNotificationsEnabled(checked);
  if (checked && notifyEmails.length === 0 && ownerEmail) {
    setNotifyEmails([ownerEmail]);  // Auto-populate on first enable
  }
};
```

**UI Structure (inside Notifications SettingsSection):**
```tsx
<div className="flex items-center justify-between py-2">
  <Label htmlFor="emailNotifications">Email notifications</Label>
  <input type="checkbox" /* ... */ />
</div>

{emailNotificationsEnabled && (
  <div className="space-y-3">
    {/* Email list with trash icons */}
    {notifyEmails.length > 0 && (
      <div className="space-y-2">
        {notifyEmails.map((email, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-sm flex-1 truncate">{email}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveEmail(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove recipient</TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    )}

    {/* Add email input */}
    {notifyEmails.length < MAX_NOTIFY_EMAILS && (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Input
            value={newEmailInput}
            onChange={(e) => setNewEmailInput(e.target.value)}
            onBlur={() => setEmailInputTouched(true)}
            onKeyDown={handleEmailInputKeyDown}  // Enter to add
            placeholder="recipient@example.com"
            type="email"
          />
          <Button onClick={handleAddEmail} disabled={!canAddEmail}>Add</Button>
        </div>
        {newEmailError && (
          <p className="text-sm text-destructive">{newEmailError}</p>
        )}
      </div>
    )}
  </div>
)}
```

**Auto-save integration:**
Added `notifyEmails` to the existing debounced auto-save effect (same pattern as `allowedOrigins`):

```typescript
useEffect(() => {
  const hasChanges =
    // ... existing checks ...
    JSON.stringify(notifyEmails) !== JSON.stringify(initialNotifyEmails) ||
    // ...

  if (!hasChanges) return;

  const timeoutId = setTimeout(() => {
    await updateAfterSubmission(formId, {
      // ... existing fields ...
      notifyEmails,  // NEW
    });
  }, 1000);

  return () => clearTimeout(timeoutId);
}, [/* ... */, notifyEmails, initialNotifyEmails, /* ... */]);
```

### 6. Data Migration

**Location:** `docs/epics/epic-7-backfill-notify-emails.sql`

One-time SQL to backfill `notifyEmails` for existing forms with notifications enabled:

```sql
UPDATE forms f
SET "notifyEmails" = ARRAY[(
  SELECT u.email FROM users u WHERE u."accountId" = f."accountId" LIMIT 1
)]
WHERE f."emailNotificationsEnabled" = true
AND (array_length(f."notifyEmails", 1) IS NULL OR array_length(f."notifyEmails", 1) = 0);
```

Apply via:
```bash
cat docs/epics/epic-7-backfill-notify-emails.sql | docker exec -i canopy-forms-db psql -U user -d canopy-forms
```

## Files Modified

| File | Changes |
|------|---------|
| `src/actions/forms.ts` | Moved `notifyEmails` to `updateAfterSubmission()` with validation |
| `src/lib/email-queue.ts` | Changed signature to accept `notifyEmails[]` instead of `accountId` |
| `src/lib/public-submit.ts` | Updated guard and pass `form.notifyEmails` |
| `src/app/api/submit/[formId]/[fieldName]/route.ts` | Same changes as public-submit |
| `src/app/(admin)/forms/[formId]/edit/page.tsx` | Extract `session.user.email`, pass as prop |
| `src/components/forms/form-editor.tsx` | Thread `ownerEmail` and `notifyEmails` props |
| `src/components/forms/after-submission-section.tsx` | Full multi-recipient UI with validation |

## Technical Details

### Design Decisions

1. **Single toggle gates all notifications** — `emailNotificationsEnabled` is the master switch. When OFF, no emails are sent regardless of `notifyEmails` contents.

2. **`notifyEmails[]` is the single source** — There's no special "owner email" field at runtime. The owner email is just another entry in the array (auto-populated on first toggle ON).

3. **Owner email is removable** — Owner can remove their own email from the list like any other recipient.

4. **Individual emails per recipient** — Not BCC. Each recipient receives a separate email for error isolation (if one fails, others still succeed).

5. **Max 5 recipients** — Enforced in UI (button disabled, Enter key disabled) and server (slices array to 5).

6. **Validation on blur** — Inline error messages only appear after user leaves the input field (`onBlur`), not while typing.

7. **Keyboard shortcut** — Press Enter to add email (disabled when input is invalid).

8. **Auto-save** — Email list changes trigger existing debounced auto-save (1 second delay), consistent with `allowedOrigins` pattern.

### UX Patterns Used

- ✅ **Inline validation with touched state** (show errors on blur, not while typing)
- ✅ **Tooltips on icon-only buttons** (trash icons)
- ✅ **Auto-save with debounce** (1 second delay)
- ✅ **Visual feedback** (email list with remove buttons)
- ✅ **Keyboard shortcuts** (Enter to add, disabled when invalid)
- ✅ **Clear error messages** (format, duplicates, max cap)
- ✅ **Semantic colors** (`text-destructive` for errors)

## Verification Steps

1. **Toggle on with empty list** → Owner email should auto-populate
2. **Add recipient** → Email added to list, input clears, auto-save fires
3. **Invalid email** → Blur input → Inline error shown
4. **Duplicate email** → Inline error: "This email is already in the list"
5. **Max 5 recipients** → Add button disabled, Enter key disabled, error shown
6. **Remove email** → Click trash icon → Email removed, auto-save fires
7. **Toggle off** → Email list hidden but preserved in state
8. **Toggle on again** → Email list reappears (still has same recipients)
9. **Submit form** → All recipients receive individual emails (check logs)
10. **Submit with honeypot** → No emails sent (spam submission)

## Future Considerations

### Out of Scope (Deferred)

- **Role-based permissions** — All recipients receive same notification (no per-recipient customization)
- **Custom email templates** — All recipients receive same email content
- **Slack/Webhook integrations** — Email-only for now
- **CC/BCC options** — Each recipient gets individual email (no CC/BCC)
- **Per-recipient notification preferences** — All-or-nothing toggle per form

### Potential Enhancements

1. **Email template customization** — Allow per-form email subject/body templates
2. **Conditional notifications** — Send to specific recipients based on submission data
3. **Slack integration** — Post notifications to Slack channels
4. **Webhook support** — POST submission data to external URLs
5. **Increase recipient limit** — Raise from 5 to 10 or higher (consider abuse potential)

## Migration Notes

For existing installations:

1. **No schema migration needed** — `notifyEmails` field already exists
2. **Run backfill SQL** — Populates `notifyEmails` for existing forms with notifications enabled
3. **No breaking changes** — Forms with notifications OFF are unaffected
4. **Backwards compatible** — Old behavior (single owner email) maintained for migrated forms

## Success Metrics

- ✅ TypeScript compiles without errors
- ✅ No Prisma DB lookup in email queue (performance improvement)
- ✅ Server-side validation prevents invalid emails
- ✅ UI validates inline with clear error messages
- ✅ Auto-save triggers on email list changes
- ✅ Multiple recipients receive individual emails on submission
- ✅ Spam submissions do not trigger emails

---

**Status:** ✅ Complete
**Version:** v4.1.0
**Date:** February 16, 2026

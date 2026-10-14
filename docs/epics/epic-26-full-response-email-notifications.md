# Epic 26: Full-Response Email Notifications

**Version:** v4.13.0
**Date:** 2026-07-24
**Status:** ✅ Complete

## Summary

Submission notifications can now carry the submitted values. Enabling **Include responses in the email** on a form sends recipients every field and answer, and sets `Reply-To` to the submitter's address so they can reply directly. The setting is per form and off by default.

This exists for form owners whose recipients never sign in to the dashboard: a client, a shop manager, an office inbox. Before this, their only actionable content was a dashboard link they had no account for.

## Why this reverses an earlier decision

Epic 4 deliberately excluded field values from notification emails and recorded that as a privacy decision. That default is unchanged and still applies to every existing form. What changed is that it's no longer the only option — owners who need responses in their inbox can choose it per form, and the choice is theirs to make about their own data rather than one the platform makes for them.

Anyone reading Epic 4 should read this alongside it.

## What shipped

### Schema

`Form.emailIncludeResponses Boolean @default(false)` — migration `20260724000000_add_email_include_responses`.

### Email content

New module `src/lib/submission-email.ts` owns notification content; `src/lib/email.ts` stays transport.

- `buildSubmissionEmailExtras()` returns the response list and the `Reply-To` candidate.
- `renderNotificationEmail()` returns `{ text, html? }`. Without responses it produces the Epic 4 plain-text body unchanged. With responses it also produces an HTML table, since a list of values is hard to read as plain text.
- Fields are listed in form order. Empty optional fields render as `(blank)` so an unanswered question is distinguishable from a missing one. The honeypot field is never shown.
- Values render through `formatFieldValue()` in `composite-format.ts`: booleans as Yes/No, multi-selects comma-joined, NAME/ADDRESS through their composite formatters.

### Reply-To

The first EMAIL field holding a valid address, in form order. Gated by the same toggle — turning it on is what discloses the submitter's identity, so it shouldn't happen behind an owner's back on a form they only enabled metadata emails for.

### Per-recipient dashboard link

`notifyEmails[]` can contain any address the owner types. Only recipients that match a `User` on the form's account get the "View in dashboard" link; everyone else gets the email without it, because the link would land them on a login screen for an account they don't have. The account's user emails are resolved inside the fire-and-forget queue, so the lookup stays off the submit path. If that query fails, no recipient gets a link.

## Security

Submitted values are attacker-controlled and now reach two new sinks.

- **SMTP headers.** `Reply-To` candidates are re-validated with `isValidEmail()` rather than trusted. This matters because `/api/submit/[formId]/[fieldName]` only checks that required fields are present, so an EMAIL value can reach the notification path having never passed a format check. `isValidEmail()` rejects CR/LF outright, which is what would otherwise let a submitter inject extra headers (`Bcc:` and friends).
- **Markup.** All labels and values are HTML-escaped in the HTML part.

## Consolidation

Three copies of "render a submitted value as text" existed (submission preview, submission detail page, CSV export, each slightly different). Rather than add a fourth, `formatFieldValue()` was extracted into `composite-format.ts`; `submission-preview.ts` now uses it. The detail page's inline version and the CSV export's column-expansion logic were left alone — the export intentionally splits composites into separate columns, which is a different job.

## Files touched

| File | Change |
|------|--------|
| `prisma/schema.prisma` + migration | `emailIncludeResponses` column |
| `src/lib/submission-email.ts` | New — response list, Reply-To selection, text/HTML rendering |
| `src/lib/email.ts` | `replyTo` support; delegates body building |
| `src/lib/email-queue.ts` | Resolves account emails; per-recipient dashboard link |
| `src/lib/validation.ts` | `isValidEmail()` with CR/LF rejection |
| `src/lib/composite-format.ts` | `formatFieldValue()` |
| `src/lib/submission-preview.ts` | Uses shared formatter |
| `src/lib/public-submit.ts` | Builds extras; uses shared email validator |
| `src/app/api/submit/[formId]/[fieldName]/route.ts` | Builds extras for the one submitted field |
| `src/actions/forms.ts` | Accepts the flag |
| `src/components/forms/form-context.tsx` | State + autosave |
| `src/components/forms/after-submission-section.tsx` | Nested checkbox |
| `src/lib/data-access/forms.ts` | Column added to `getUserForms` select |

## Verification

Typecheck and lint clean. Rendering was exercised directly (no test suite exists): composite/multi-select/boolean/blank formatting, honeypot exclusion, HTML escaping of a `<script>` payload, multi-line textarea handling, and Reply-To rejection of header injection, malformed addresses, empty values, and non-strings. The metadata-only body was confirmed byte-identical to Epic 4's.

Not verified locally: end-to-end delivery. The Docker engine was down during implementation, so no dev container or database was reachable. Needs a real submission against a form with the toggle on, checking inbox rendering and that Reply-To populates correctly.

## Follow-ups

- A metadata-only notification to a recipient without an account is now content-free (form name and timestamp, no values, no link). Correct per the rules above, but such a recipient is arguably always better served by the toggle being on. Worth revisiting whether the UI should point that out when non-account recipients are present.
- Timestamps still render with `toLocaleString()` on the server, so they reflect the container's timezone with no zone marker. Pre-existing, unchanged here.
- Per-field inclusion control, custom templates, and emailing the submitter remain out of scope. See `docs/future-features.md`.

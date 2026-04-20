# Epic 22: Notification Bell (MVP)

**Version:** v4.10.0
**Date:** 2026-04-20
**Status:** Complete

## Summary

Add a bell icon to the top nav (next to the user menu) that surfaces in-app notifications for events on the user's forms: new submissions (stacked per form) and submission-limit hits (max reached, deadline reached). Notifications are dismiss-on-interaction — clicking one navigates to the form's submissions page and deletes the notification forever. No retention, no history, no read/unread state.

## Scope

**In:**
- Bell icon + unread count badge in top nav.
- Dropdown panel listing active notifications, newest first.
- Notification types:
  - `NEW_SUBMISSION` — one stacked row per form, count increments per submission.
  - `LIMIT_MAX_REACHED` — one-time per form, fires when a submission pushes count to max.
  - `LIMIT_DEADLINE_REACHED` — one-time per form, fires on first submission attempt after deadline.
- Click-through: navigates to `/forms/[formId]/submissions` and deletes that notification.
- "Clear all" action in the dropdown footer.
- 60s polling while tab is visible; immediate refetch on route change.

**Out (explicitly deferred):**
- Per-user read state (accounts are single-user today).
- Realtime push (SSE/websocket).
- Email-preference coupling — bell fires regardless of `notifyEmails`.
- Spam differentiation — all submissions count.
- Notification history or archive.
- Additional event types (publish, export-ready, account, ops).
- Browser push / OS notifications.

## Schema

```prisma
enum NotificationType {
  NEW_SUBMISSION
  LIMIT_MAX_REACHED
  LIMIT_DEADLINE_REACHED
}

model Notification {
  id        String           @id @default(cuid())
  accountId String
  formId    String
  type      NotificationType
  count     Int              @default(1)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  form    Form    @relation(fields: [formId], references: [id], onDelete: Cascade)

  @@unique([accountId, formId, type])
  @@index([accountId, updatedAt])
}
```

One active row per `(account, form, type)` — upsert-and-increment is the write pattern. No tombstones; dismissal is a hard `DELETE`. Account/form cascade cleans up on deletion.

## Server actions & data access

- `upsertSubmissionNotification(accountId, formId)` — called from the submission ingestion path after a successful save; increments `count` or creates.
- `fireLimitReachedNotification(accountId, formId, type)` — called from the submit handler when a limit is first hit.
- `listNotifications(accountId)` — returns active rows joined with form name/slug for display. Ordered by `updatedAt DESC`.
- `dismissNotification(id)` — ownership check, `DELETE`.
- `dismissAllNotifications(accountId)` — `DELETE` all rows for the account.

## Firing points

- `src/lib/public-submit.ts`: after a submission is persisted, call `upsertSubmissionNotification`. When the same path decides "this submission hits the max" or "this attempt is past the deadline," call `fireLimitReachedNotification`.
- Limit-hit notifications use `upsert` keyed on `(account, form, type)` so repeated triggers don't create duplicates.

## UI

- `src/components/notification-bell.tsx` — client component, mounted in the admin top nav beside the user menu.
- Dropdown built on the existing shadcn primitive used for the user menu.
- Each row: icon (submission vs limit), primary line ("3 new submissions" / "Deadline reached" / "Max responses reached"), form name as secondary line, relative timestamp.
- Empty state: "You're all caught up."
- Footer: "Clear all" (disabled when empty).
- Clicking a row calls `dismissNotification` and `router.push` to the form's submissions page — optimistic UI.

## Freshness

- Client polls `listNotifications` every 60s using `setInterval` gated on `document.visibilityState === "visible"`.
- Refetch on Next.js route change.
- No realtime push in MVP.

## Design decisions

- **Dismiss-on-interaction, no retention.** Matches the phone-notification mental model. Prevents stale "10 new" + fresh "5 new" confusion — there's only ever one row per form, and it reflects what's currently unseen.
- **Independent of email preferences.** Bell is low-friction; email carries the higher bar. They're separate channels by design.
- **Stacked per form, not per submission.** A row means "there's action on this form," not "here's a log of every event."
- **Polling over push.** 60s latency is imperceptible for this use case; complexity isn't justified at MVP scale.
- **Hard delete over soft delete.** No future feature needs dismissed notifications; rows would only bloat the table.

## Verification

- Submit to a form → bell shows "1 new submission." Submit again → count becomes 2.
- Click the notification → lands on submissions page; bell empties.
- Configure a max-responses limit, submit past it → one `LIMIT_MAX_REACHED` row appears and doesn't duplicate on further attempts.
- Delete the form → notifications for it disappear (cascade).
- Open two tabs; submit in one; bell in the other updates within 60s.
- Log out / log in as a different account → bell is scoped correctly.

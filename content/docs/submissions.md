---
title: Submissions
description: Viewing, filtering, status, spam, export, and email notifications.
icon: Inbox
---

Every filled-in form entry lands on the **Submissions** tab of the form workspace. This page covers viewing, filtering, status, spam, export, and email notifications.

## Viewing submissions

1. Open the form and click the **Submissions** tab.
2. Each row shows the date, status badge, and a preview of the first couple of fields.
3. Click **View** to open a submission's full detail page.

The detail page shows every submitted field (with the field's label), plus the metadata collected at submit time: timestamp, origin, referrer, user agent, and a hashed IP address.

## Filters

A single filter row sits at the top of the list:

- **All**: every active submission for the form.
- **New**: submissions you haven't reviewed yet.
- **Read**: submissions you've already looked at.
- **Archived**: older entries moved out of the active view.
- **Spam**: submissions flagged as spam.

The first four filters hide spam; **Spam** shows only spam. **All** also hides archived. Use the **Archived** filter when you want to see them. Filters are URL-addressable, so you can bookmark or share a filtered view.

## Status

Every submission has one of three statuses. Status is independent of the spam flag.

- **NEW**: the default when a submission arrives. Used to find things you haven't reviewed yet.
- **READ**: anything you've reviewed or dealt with.
- **ARCHIVED**: older entries you want out of the default view.

Change the status from the submission's detail page. Submissions move between statuses with a single click and the change is immediate.

When any NEW submissions are visible, a **Mark all as read** button appears next to Export. It flips every NEW submission on the form to READ in one click.

## Spam

A submission is flagged as spam automatically if a configured honeypot field has a value in the payload. Spam submissions are saved (so you can review them) but never trigger email notifications.

From the detail page, you can toggle the spam flag manually to correct a false positive or a false negative.

The spam flag does not delete anything. It's a filter, not a trash can.

## Exporting

Both export formats include **every submission** for the form, not just what your current filters show.

1. On the Submissions tab, click **Export**.
2. Choose **Export CSV** or **Export JSON**.
3. The file downloads as `<form-slug>-submissions-<date>.csv` or `.json`.

### CSV

One row per submission with these columns: `ID`, `Date` (ISO 8601), `Status`, `Is Spam`, one column per form field (using the internal key), `IP Hash`, `User Agent`, `Referrer`, `Origin`.

### JSON

An array of objects, each with:

```json
{
  "id": "...",
  "createdAt": "2026-04-18T14:30:00.000Z",
  "status": "NEW",
  "isSpam": false,
  "data": { "name": "...", "email": "..." },
  "meta": {
    "ipHash": "...",
    "userAgent": "...",
    "referrer": "...",
    "origin": "..."
  }
}
```

## Email notifications

Email notifications are configured per form under **Edit → Submission Settings → Email notifications**.

- Check **Email notifications** to turn them on. Your account email is added as the first recipient automatically.
- Add up to **5 recipients** total. Press Enter or click **Add** to add each one. Addresses are validated and de-duplicated.
- Remove a recipient with the trash icon next to it.

### What the email contains

Each notification email includes:

- The form name
- A timestamp
- The submitted field values so recipients can triage without logging in
- A direct link to the submission in the dashboard

Notifications go out asynchronously after a successful submit. They're fire-and-forget: if email delivery fails, the submission is still saved and the form submitter sees a normal success response.

### When notifications aren't sent

- The submission is marked as spam.
- Email isn't enabled in the form's settings.
- The platform SMTP configuration is missing (contact the platform operator if you expect emails and aren't getting them).

## Privacy and metadata

- IP addresses are never stored in plain text. They are hashed (SHA-256) before storage, so you can still identify repeated senders for abuse detection without retaining the raw IP.
- Referrer and user-agent come straight from the request headers and may be blank if the browser doesn't send them.
- Origin is the domain the submission came from. For hosted-page submissions, origin is `forms.canopyds.com`.

## Storage limits

The submit endpoints enforce a 64KB payload cap and rate limits (10 submissions per minute per IP on submit, 60 form-definition fetches per minute per IP on the embed). These apply before a submission is stored, so rejected requests never appear in the submissions list.

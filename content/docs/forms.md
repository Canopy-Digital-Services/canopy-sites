---
title: Forms
description: Creating forms, field types, and the editor workspace.
icon: Layers
---

A form is the central object in Canopy Forms. Each form has its own fields, theme, allowed origins, submission settings, and collected submissions.

## Creating a form

1. From the **Forms** page, click **Create Form**.
2. Enter a name (for example, "Contact" or "Newsletter signup").
3. Pick a **form type**:
   - **Hosted** — a standalone page at a shareable URL (`/f/{formId}`). Good when you don't have a website to embed into, or when the form is the destination.
   - **Embedded** — lives inside your own website via a `<script>` snippet. Good when you want the form to sit alongside other content on a page you control.
4. Click **Create form**. You'll land in the form workspace. The form exists in **Draft** state until you publish it.

The type is locked once the form is created — it shapes which appearance and publish controls you'll see. If you change your mind, create a new form of the other type.

A URL-friendly slug is generated automatically from the name and shown below it. The slug is kept even if you rename the form later, so bookmarks and share links stay stable.

## The form workspace

Every form opens to a three-tab workspace:

- **Edit**: the builder, with accordion sections for Header, Fields, Appearance, and Submission Settings. On desktop, a live preview sits to the right. The preview is locked to the form's type — hosted forms preview as the standalone page, embedded forms preview as they'd appear inside another site.
- **Publish**: publish status and the controls that apply to your form type — the hosted form link for hosted forms, allowed origins and embed snippet for embedded ones. See [Publishing](./publishing.md).
- **Submissions**: every entry the form has received, with filters and export. See [Submissions](./submissions.md).

The form name in the header is editable by clicking the pencil icon. Everything you change in the Edit tab autosaves; watch for the "Saved" badge on each accordion section.

## Header

The **Header** section is the first accordion in the Edit tab. Both fields are optional.

- **Title**: shown above the form (max 120 characters). Leave blank if the surrounding page already provides one.
- **Description**: a short paragraph shown under the title (max 400 characters).

Both are rendered on the hosted page and by the embed. If your container already has its own heading, you'll usually leave these blank for the embed and rely on them for the hosted page.

## Fields

Open the **Fields** accordion to add and arrange inputs. Use **Add field**, then pick a type in the modal.

### Field types

| Type | Label | Notes |
|---|---|---|
| Text | Single line of text | General-purpose input |
| Email | Email address | Validates format automatically |
| Paragraph | Multi-line text | For longer responses |
| Phone | Phone number | Lenient or strict format |
| Date | Date picker | Optional min / max, no-future, no-past rules |
| Name | Name with parts | Choose which parts (first, last, middle, prefix, suffix) |
| Dropdown | Single select | Configure value/label options |
| Yes / No | Single checkbox | For consent-style prompts |
| Checkboxes | Multi-select checkboxes | Configure options; submitted value is an array |
| Number | Numeric input | Min/max bounds |
| Address | Mailing address | Street, city, region, postal code, country |

### Configuring a field

Every field type has the same core options, plus type-specific ones.

**Core options:**

- **Label** (required): what the user sees. An internal key is derived from the label on first save; that key is what appears in submissions and in the embed payload, and it stays stable even if you rename the label later.
- **Placeholder**: optional hint text inside the empty input.
- **Required**: toggles whether the field must be filled before the form can submit.
- **Help text**: optional muted text shown below the field to guide the user.

**Type-specific options** (validation and configuration) appear automatically in the editor. Examples:

- Text, Paragraph, Email, Phone: format rules (letters only, numbers only, URL, postal codes, etc.), min and max length, custom error messages.
- Date: min date, max date, "no future", "no past".
- Dropdown, Checkboxes: the list of options (value/label pairs). Values must be unique.
- Name: which name parts to include.
- Address: which address components to include.
- Number: min, max.

### Internal key behavior

When a field's label is saved, an internal key is generated (for example, `Email Address` becomes `email_address`). Submissions store values under this key, not the label.

- Renaming a field's label does **not** change the key. Existing submissions keep their data under the original key.
- Deleting a field and re-adding one with the same label gives it the same key. New submissions will land under that key; the ones collected while the field was missing simply won't have that key; older submissions from before the deletion are untouched.

### Reordering

Each field row has Up and Down buttons. The order here is the order fields render in the embed, the hosted page, and submissions.

## Submission Settings

Open the **Submission Settings** accordion to control what happens after someone submits, whether you get notified, and whether to cap submissions. Everything here autosaves.

### After submission

Pick one:

- **Show a message**: a short confirmation replaces the form inline (default: "Thank you for your submission!"). Keep this when you want the user to stay on your page.
- **Redirect to a URL**: send them to a thank-you page, confirmation flow, or anywhere else after a successful submit.

Switching between options clears the inactive field, so you won't end up with stale redirect URLs sitting around.

### Email notifications

Check **Email notifications** to receive an email each time the form gets a non-spam submission.

- When first enabled, your account email is added as the first recipient.
- Add up to **5 recipients** total. Each recipient gets the same email.
- By default the notification includes the form name, timestamp, and a link back to the submission in the dashboard. It does not include what the visitor typed.
- Check **Include responses in the email** to send the submitted values too. See [Submissions](./submissions.md#what-the-email-contains) for what changes.
- Spam submissions (honeypot caught) never trigger a notification.
- Email delivery depends on the platform's SMTP config. If email isn't configured, submissions still save; they just don't trigger a notification.

### Submission limits

Both limits are optional and can be combined.

- **Stop accepting submissions after**: a datetime. When that time has passed, the form shows "This form is no longer accepting submissions" and the API rejects new submissions.
- **Maximum number of submissions**: a total count. When reached, the form shows "This form has reached its maximum number of submissions". Spam submissions do not count toward this limit.

Leave both blank for no limit.

## Honeypot (spam protection)

A honeypot field is an invisible field that most bots will fill in automatically, but humans won't see. When the honeypot field is non-empty in a submission, the submission is saved but marked as spam and will not trigger an email notification.

If you embed using the snippet, the honeypot is handled for you once configured. If you use the manual HTML approach, you need to add the hidden field yourself; see [Publishing](./publishing.md) for the snippet.

## Renaming and deleting

Rename a form by clicking the pencil icon beside its name in the workspace header. Changes save when you press Enter or click the confirm icon. The slug does not change when you rename.

Delete a form from the Forms list page by clicking the trash icon.

> [!CAUTION]
> Deleting a form permanently removes its fields, its submissions, and any associated data. There is no undo.

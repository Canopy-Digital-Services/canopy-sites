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

- **Edit**: the builder, which walks through Header, Fields, and Submission Settings one section at a time. The buttons under the card are named for the section they take you to, and the dots above it show where you are. On desktop, a live preview sits to the right, with **Change styling** above it for the form's look (see [Styling](./appearance.md)). The preview is locked to the form's type — hosted forms preview as the standalone page, embedded forms preview as they'd appear inside another site.
- **Publish**: publish status and the controls that apply to your form type — the hosted form link for hosted forms, allowed origins and embed snippet for embedded ones. See [Publishing](./publishing.md).
- **Submissions**: every entry the form has received, with filters and export. See [Submissions](./submissions.md).

The form name in the header is editable by clicking the pencil icon. Everything you change in the Edit tab autosaves; watch for the "Saved" badge on each section, so you can move between sections without a save step.

## Header

The **Header** section is the first step in the Edit tab. Both fields are optional.

- **Title**: shown above the form (max 120 characters). Leave blank if the surrounding page already provides one.
- **Description**: a short paragraph shown under the title (max 400 characters).

Both are rendered on the hosted page and by the embed. If your container already has its own heading, you'll usually leave these blank for the embed and rely on them for the hosted page.

Until you type, the preview shows faded sample text where the title and description go. It isn't saved: leave both blank and the form has no header.

## Fields

The **Fields** section is where you add and arrange inputs. Click **Add field** at the bottom of the list and pick a type. The new field opens in the list with its settings, and the field you're editing is outlined in the preview, which scrolls to show it. Click any field to open its settings; opening one closes the other. To close them, click the field's name, click the arrow at the bottom of the settings, or press Escape. A field's type can't be changed; to use another type, add a new field and delete the old one. Changes save as you go. A form needs at least one field, so the button on to Submission Settings waits for your first.

### Field types

| Type | Label | Notes |
|---|---|---|
| Text | Single line of text | General-purpose input |
| Email | Email address | Can take work addresses only |
| Paragraph | Multi-line text | For longer responses, with an optional character limit |
| Phone | Phone number | A US or Canadian number with its area code, or another country's starting with +; saved in one format; can ask for an extension |
| Website | Web address | Visitors can leave off https://; it's added when saved |
| Date | Date picker | Past dates only, future dates only, or any date |
| Date of birth | Month, day, and year boxes | Must be in the past; saved as a date |
| Name | Person's name | One box, or separate first, middle, and last parts |
| Dropdown | Single select | Configure options; can offer "Other" |
| Yes / No | Single checkbox | For consent-style prompts |
| Checkboxes | Multi-select checkboxes | Configure options; can offer "Other"; submitted value is an array |
| Number | Numeric input | Whole number or decimal, with an optional minimum and maximum |
| Address | US mailing address | Street, apartment, city, state, ZIP; collect only the parts you need |

On your live form, visitors' browsers and password managers can fill in Name, Email, Phone, Website, Address, and Date of birth from their saved details. Phones show a number pad for Phone, Number, ZIP, and Date of birth, a keyboard with @ for Email, and one with / and .com for Website. The preview in the editor doesn't offer to fill anything in, so your own details stay out of it.

### Configuring a field

Every field type has the same core options, plus type-specific ones.

**Core options:**

- **Label**: what the user sees, shown at the top of the field's settings. A new field starts with its type as the label (an Email field is labeled "Email"), ready to type over: the label is selected as the field opens, so just type the question, or click elsewhere to keep it. To rename a field later, click the pencil beside its label. Clear it to go back to the default. An internal key is derived from the label when the field is created; that key is what appears in submissions and in the embed payload, and it stays stable even if you rename the label later.
- **Required**: toggles whether the field must be filled before the form can submit. Name and Address are required part by part instead, with a Required column beside their parts.
- **Help text**: optional text shown under the field's label, before the box, to guide the user, such as an example answer ("For example, kitchen remodel, about 200 sq ft"). It stays visible while people type, and screen readers read it with the field.

**Type-specific options** (validation and configuration) appear automatically in the editor. Examples:

- Paragraph: an optional **Character limit**. Visitors see how many characters they have left under the box, and can type past it to edit down, but the form won't submit until they're within it. Text has no settings of its own: for a number use Number, for a web address Website, and for a ZIP code an Address with only ZIP.
- Phone: tick **Extension** to add a short box for one beside the number, labeled "Ext." (rename it with the pencil). The number and the extension are saved, and exported, separately.
- Email: **Work emails only** refuses personal addresses from Gmail, Yahoo, Outlook, iCloud, internet providers and the like. Leave it off to collect anyone's address.
- Date: **Past Date** (today or earlier, for something that already happened), **Future Date** (today or later, for an appointment or event), or **Any Date**.
- Dropdown, Checkboxes: the options, one box each. Click **Add option** or press Enter for a new option below, or paste a list to add one option per line. Two options can't have the same text. Tick **Include "Other"** to let visitors type their own answer, which is saved in place of "Other". A Dropdown can also start on a **Default choice**.
- Name: **Full name** (one box) or **Separate parts**, then which parts to collect: First, Middle (a full middle name or an initial), and Last. The form shows the field's label over the parts, so a Name relabeled "Emergency contact" reads Emergency contact over First and Last. Tick a part in the Required column to require it; a new Name requires First and Last. Rename a part with the pencil beside it.
- Address: which parts to collect: Street (with an optional Apt, suite), City, State, ZIP. Collect only what you need, for example ZIP alone for a service-area question. Tick a part in the Required column to require it, for example only ZIP; a new Address requires every part but Apt, suite. Rename a part with the pencil beside it. Addresses are US only: State is a list of US states and ZIP must be 5 or 9 digits.
- Number: **Whole Number** (the default) or **Decimal**, and an optional **Minimum** and **Maximum**. Visitors can type 1,250 with its comma.

### Internal key behavior

When a field is created, an internal key is generated from its label (for example, `Email` becomes `email`). Submissions store values under this key, not the label.

- Renaming a field's label does **not** change the key. Existing submissions keep their data under the original key.
- Deleting a field and re-adding one with the same label gives it the same key. New submissions will land under that key; the ones collected while the field was missing simply won't have that key; older submissions from before the deletion are untouched.

### Reordering

Drag a field by its grip to move it. The order here is the order fields render in the embed, the hosted page, and submissions.

## Submission Settings

The **Submission Settings** section is the last step. It controls what happens after someone submits, whether you get notified, and whether to cap submissions. Everything here autosaves. **Publish** under it takes you to the Publish tab.

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

The honeypot is for the manual HTML approach: add the hidden field to your own form; see [Publishing](./publishing.md) for the snippet. The embed snippet and hosted page don't include one.

## Renaming and deleting

Rename a form by clicking the pencil icon beside its name in the workspace header. Changes save when you press Enter or click the confirm icon. The slug does not change when you rename.

Delete a form from the Forms list page by clicking the trash icon.

> [!CAUTION]
> Deleting a form permanently removes its fields, its submissions, and any associated data. There is no undo.

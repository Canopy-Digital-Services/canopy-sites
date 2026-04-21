---
title: Welcome to Canopy Forms
description: A forms platform for static sites — build in the dashboard, embed or share, watch submissions flow back.
icon: Home
---

Canopy Forms is a forms platform for static sites. Build a form in the dashboard, drop a two-line embed snippet into your page (or share a hosted link), and submissions flow back to your dashboard.

> [!NOTE]
> Canopy Forms is currently in **Beta**. Core features are stable; if you run into anything unexpected, see [Troubleshooting](./troubleshooting.md).

## What's included

- **Form builder** with 11 field types, validation, and help text
- **Theming** for colors, fonts, spacing, and hosted-page layout
- **Embed snippet** for any static site, or a **hosted form page** at `forms.canopyds.com/f/<form-id>`
- **Allowed origins** per form to control where submissions can come from
- **Email notifications** to up to 5 recipients per form, with spam filtering
- **Submissions dashboard** with status, spam filters, CSV / JSON export
- **Submission limits** by deadline or total count

## Quick start

1. Sign up at `forms.canopyds.com`, then log in.
2. Click **Create Form**, name it, and you'll land in the form workspace.
3. On the **Edit** tab, open the **Fields** section and add the fields you need.
4. Open **Appearance** to match your site's brand.
5. Open **Submission Settings** to choose what happens after submission and turn on email notifications.
6. Switch to the **Publish** tab:
   - Add your site's domain under **Allowed Origins** (you can also rely on the hosted page and skip this).
   - Click **Publish**.
   - Copy the embed snippet (or the hosted-form link).
7. Paste the embed snippet into your site, or share the hosted link directly.
8. Submit a test entry, then check the **Submissions** tab to confirm it arrived.

## Key concepts

**Form.** A single form you can embed or host. It holds its own fields, theme, allowed origins, submission settings, and submissions.

**Field.** One input on a form. Each field has a type (Text, Email, Dropdown, etc.), a label, and optional validation. An internal key is auto-generated from the label; that key stays stable even if you rename the field later.

**Submission.** One filled-in form entry. Submissions carry the field values plus metadata (timestamp, origin, referrer, hashed IP) and a status (New, Read, or Archived).

**Allowed Origin.** A domain that's authorized to submit to this form. Configured on the Publish tab. Localhost is always allowed for development.

**Published vs. Draft.** Only published forms accept submissions and serve a hosted page. A draft form still renders in your dashboard preview so you can iterate before going live.

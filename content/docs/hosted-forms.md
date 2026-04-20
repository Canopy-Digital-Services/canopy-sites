---
title: Hosted Forms
description: Share a form without touching your site's HTML.
icon: Globe
---

Every form in Canopy Forms has a hosted page you can share without touching your own site. Once you publish, the page is live at:

```
https://forms.canopyds.com/f/YOUR_FORM_ID
```

## When to use a hosted form

- You don't have a website, or you don't want to edit its HTML.
- You want to share a link in an email, a social post, a QR code, or a DM.
- You want full control over the page background, width, and card treatment (the hosted page exposes more layout controls than the embed).
- You're collecting signups during an event or campaign that doesn't have a landing page.

You can use the hosted page and the embed at the same time; both submit to the same form.

## Getting the link

1. Open your form's **Publish** tab.
2. If the form is still a Draft, click **Publish**. The status will change to Live.
3. Copy the URL shown under **Share Link**, or click **Open** to preview it in a new tab.

The URL uses the form's ID, which stays the same for the life of the form. Renaming the form doesn't break the link.

## Customizing the hosted page

The hosted page uses the same theme as the embed, plus a few extra controls that only affect the page surface. All of these live under **Appearance → Page** on the Edit tab:

- **Page Background Color**: the background behind the form card.
- **Wrap form in a card**: toggle the surrounding card.
- **Card Shadow**: None, Light, Medium, or Heavy.
- **Content Width**: Narrow, Medium, or Wide.
- **Vertical Alignment**: Top or Center.

Every other theme setting (colors, typography, density, button style) applies to both the embed and the hosted page. See [Appearance](./appearance.md) for the full list.

The hosted page also shows the form's **Title** and **Description** (set under **Edit → Header**), along with an SEO-friendly document title and OpenGraph tags.

## Previewing before you share

Switch the preview in the Edit tab to **Page** mode to see exactly how the hosted page will look. The Page-level Appearance controls only affect this preview mode.

## Allowed Origins don't apply

Allowed Origins are checked on embed and manual-HTML submissions. They are not checked on the hosted page, since submissions there come from `forms.canopyds.com` directly. If the hosted page is the only integration you plan to use, you can skip configuring Allowed Origins entirely.

## When a form is unpublished

If you unpublish, the hosted link returns a "Form Not Available" page with a friendly message. Visitors who try the link aren't shown the form content and can't submit. The form's submissions and configuration are untouched, so you can publish again later to restore access.

## After-submission behavior

What happens after a successful submit on the hosted page is controlled by **Submission Settings → After submission** in the Edit tab:

- **Show a message**: the confirmation replaces the form in place.
- **Redirect to a URL**: the visitor is sent to the URL you configured.

## Limits apply

Submission limits (deadline and maximum count) apply to the hosted page the same way they apply to embeds. When a limit is hit, the page shows the appropriate "no longer accepting" or "reached maximum" message.

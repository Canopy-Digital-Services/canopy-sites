---
title: Hosted Forms
description: Share a form without touching your site's HTML.
icon: Globe
---

A **hosted form** lives at its own URL on Canopy Forms — share the link and visitors fill it out without touching your own site. Once you publish, the page is live at:

```
https://forms.canopyds.com/f/YOUR_FORM_ID
```

## When to choose Hosted at form creation

Pick **Hosted** on the create-form screen when:

- You don't have a website, or you don't want to edit its HTML.
- You want to share a link in an email, a social post, a QR code, or a DM.
- You want full control over the page background, width, and card treatment.
- You're collecting signups during an event or campaign that doesn't have a landing page.

Form type is locked once the form is created. A hosted form is reachable only at its `/f/{formId}` URL — it can't be embedded with the script snippet. To embed instead, create a separate Embedded form.

## Getting the link

1. Open your form's **Publish** tab.
2. If the form is still a Draft, click **Publish**. The status will change to Live.
3. Copy the URL shown under **Share Link**, or click **Open** to preview it in a new tab.

The URL uses the form's ID, which stays the same for the life of the form. Renaming the form doesn't break the link.

## Customizing the hosted page

The hosted page uses the form's theme plus a few extra controls that only show for hosted forms. All of these live under **Appearance → Page** on the Edit tab:

- **Page Background Color**: the background behind the form card.
- **Wrap form in a card**: toggle the surrounding card.
- **Card Shadow**: None, Light, Medium, or Heavy.
- **Content Width**: Narrow, Medium, or Wide.
- **Vertical Alignment**: Top or Center.

Every other theme setting (colors, typography, density, button style) is shared by both form types. See [Appearance](./appearance.md) for the full list.

The hosted page also shows the form's **Title** and **Description** (set under **Edit → Header**), along with an SEO-friendly document title and OpenGraph tags.

## Previewing before you share

The preview in the Edit tab is locked to page mode for hosted forms — what you see is exactly how the hosted page will look.

## No allowed origins, no embed snippet

The Publish tab for a hosted form only shows the publish status and the Share Link card. There are no allowed origins to configure and no embed snippet to copy — those apply to embedded forms only.

## When a form is unpublished

If you unpublish, the hosted link returns a "Form Not Available" page with a friendly message. Visitors who try the link aren't shown the form content and can't submit. The form's submissions and configuration are untouched, so you can publish again later to restore access.

## After-submission behavior

What happens after a successful submit on the hosted page is controlled by **Submission Settings → After submission** in the Edit tab:

- **Show a message**: the confirmation replaces the form in place.
- **Redirect to a URL**: the visitor is sent to the URL you configured.

## Limits apply

Submission limits (deadline and maximum count) work the same way for hosted forms. When a limit is hit, the page shows the appropriate "no longer accepting" or "reached maximum" message.

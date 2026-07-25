---
title: Troubleshooting
description: Quick fixes for the most common problems.
icon: LifeBuoy
---

Quick fixes for the most common problems. If none of these match, check the browser console (for front-end issues) or the Submissions tab (to confirm whether a submission made it through).

## The form isn't showing up on my page

- Open the browser DevTools Console. A missing or mistyped `data-canopy-form` attribute logs a clear error there.
- Make sure **both** the `<div>` container and the `<script src="…/embed.js">` are on the page. Either alone is not enough.
- Include the `<script>` tag only **once** per page, even if you have multiple forms.
- The embed renders inside the `<div>`. Any HTML you put inside the `<div>` is replaced when the form loads. If the `<div>` is hidden by CSS (for example, `display: none`), the form won't appear.
- If you're on a platform like WordPress or Figma Sites, make sure the block is set to **Custom HTML / HTML mode**, not a rich-text or URL block.

## I get "Origin not allowed" when submitting

- On the **Publish** tab, check **Allowed Origins**. Your domain must be listed.
- Enter domains without a protocol or trailing slash: `example.com`, not `https://example.com/`.
- Subdomains and `www` variants of a domain you've added are matched automatically. If you only need `www.example.com` to work, adding `example.com` is enough.
- Localhost is always allowed, so local dev won't hit this error.
- The hosted page is never subject to this check, so if your embed keeps getting blocked but the hosted link works, Allowed Origins is the cause.

## Submissions aren't appearing in the dashboard

- Confirm the form ID in your embed snippet matches the one on the Publish tab.
- Check the **Submissions** tab with filters reset to **All** / **All**. A submission may be sitting under Archived or under Spam.
- Look at the browser Network tab when you submit. A successful submit returns `200` with `{ "success": true, "id": "…" }`. A `400` response with a `fields` object means validation failed; a `403` means origin or (for hosted pages) unpublished; a `413` means the payload exceeded 64KB; a `429` means the IP is being rate-limited.

## The form says "This form is no longer accepting submissions"

- Open **Edit → Submission Settings → Stop accepting submissions after**. Clear the datetime to accept again.
- Alternatively, "This form has reached its maximum number of submissions" means the **Maximum number of submissions** limit was hit. Raise or clear it, or leave the limit in place if the intent was to cap the form.

## The hosted link shows "Form Not Available"

- The form is unpublished. Open the **Publish** tab and click **Publish**.
- If the form was deleted, the link returns a 404 instead.

## I'm not receiving email notifications

- Open **Edit → Submission Settings** and confirm **Email notifications** is checked.
- Check that your address is in the recipients list (your account email is added automatically on first enable).
- Check your spam/junk folder. First-time deliveries from a new sender often land there.
- Spam submissions never trigger notifications. If you expect an email after a test, make sure the honeypot field (if you configured one) is **empty**.
- If email never arrives for any form, the platform SMTP configuration may not be set up. Contact the platform operator.

## The notification doesn't show what the visitor entered

- Open **Edit → Submission Settings** and check **Include responses in the email**. Notifications leave submitted values out by default.
- Recipients without an account on this workspace don't get the dashboard link, so this setting is what they need in order to see responses at all.

## Styling clashes with my site

- The embed uses scoped CSS (`.canopy-*` classes) to avoid touching your site's styles. If something looks off, check your own stylesheet for broad selectors (for example, `input { … }`, `button { … }`) that might be overriding embed styles.
- Use **Appearance** on the Edit tab to change embed styling. For one-off overrides, add a `data-theme` attribute to the embed container (see [Appearance](./appearance.md)).

## The form submits, but values look wrong in the dashboard

- Submissions are keyed by the field's **internal key**, not its label. Click a field to edit it and you'll see the internal key at the top; that key is what shows up in submission data and CSV/JSON exports.
- Renaming a label does not rename the internal key; the key stays stable across renames. If you deleted and re-added a field with the same label, new submissions land under the same key again (older submissions are preserved as-is).

## Rate-limit errors during testing

- The submit endpoint is capped at 10 POSTs per minute per IP. If you're stress-testing, space requests out or wait a minute before continuing.
- The embed's form-definition fetch is capped at 60 per minute per IP. Refreshing the page rapidly can hit this; it resets after a minute.

## Validation errors I didn't expect

- Text-type fields have default character limits that apply when you don't set one explicitly: Text 200, Email 254, Paragraph 2000. Hard maximums are 500, 320, and 10000 respectively, enforced server-side.
- Dropdown and Checkboxes fields reject values that aren't in the configured options list. If you renamed an option, older embeds cached in browsers may still submit the old value until they re-fetch the definition.

## I changed my password and got signed out

That's expected. A password change signs you out of all sessions for security. Sign back in with the new password.

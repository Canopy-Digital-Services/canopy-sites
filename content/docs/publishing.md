---
title: Publishing
description: Allowed origins, the embed snippet, and platform-specific integration guides.
icon: Rocket
---

Publishing makes a form live. Once published, it accepts submissions according to the form's type. Everything you need to publish is on the **Publish** tab inside the form workspace.

## What you'll see on the Publish tab

The controls on the Publish tab depend on the form type you chose at creation:

- **Hosted forms** see the publish status and a **Share link** card with the public `/f/{formId}` URL.
- **Embedded forms** see the publish status, **Allowed origins**, and the **Embed snippet**.

Hosted forms do not show allowed origins or the embed snippet — they aren't reachable through the embed API. Embedded forms do not show a share link — `/f/{formId}` returns "Form Not Available" for embed-type forms.

## Publishing a form

1. Open your form and switch to the **Publish** tab.
2. Click **Publish**. The status changes to Live.
3. You can **Unpublish** at any time. Once unpublished, hosted forms show a "Form Not Available" page; embed snippets show the same message.

## Allowed origins (embedded forms only)

Allowed origins are the domains that are permitted to submit to this form. They're configured on the Publish tab and save automatically.

- Enter each domain without the protocol or trailing slash, for example `example.com`.
- Add as many as you need (staging, marketing, subdomains, etc.).
- **Localhost is always allowed** for development, so you don't need to add it.
- Subdomains and `www` variants of a domain you add are matched automatically.

If a submission comes from a domain that isn't on the list, the API returns `403 Origin not allowed`. The hosted form page is not subject to this check, since it's served from `forms.canopyds.com` directly.

## Embed snippet (embedded forms only)

On the Publish tab, copy the **Embed on Your Website** snippet. It looks like this:

```html
<div
  data-canopy-form="YOUR_FORM_ID"
  data-base-url="https://forms.canopyds.com"
></div>
<script src="https://forms.canopyds.com/embed.js" defer></script>
```

`YOUR_FORM_ID` is filled in for you on the Publish tab. Paste both elements into the page where you want the form to appear. The `<div>` is where the form renders; the `<script>` can go anywhere on the page.

**One script per page.** If you embed several forms on the same page, include the `<script>` tag once, not per form.

## Platform-specific examples

### Plain HTML

Paste the snippet into your HTML wherever you want the form to appear.

```html
<!DOCTYPE html>
<html>
  <body>
    <h1>Contact us</h1>

    <div
      data-canopy-form="YOUR_FORM_ID"
      data-base-url="https://forms.canopyds.com"
    ></div>
    <script src="https://forms.canopyds.com/embed.js" defer></script>
  </body>
</html>
```

### Next.js / React

Render the container and use `next/script` (or a plain `<script defer>`) to load the embed.

```tsx
import Script from "next/script";

export default function ContactPage() {
  return (
    <>
      <h1>Contact us</h1>
      <div
        data-canopy-form="YOUR_FORM_ID"
        data-base-url="https://forms.canopyds.com"
      />
      <Script src="https://forms.canopyds.com/embed.js" />
    </>
  );
}
```

### Astro

```astro
<h1>Contact us</h1>
<div
  data-canopy-form="YOUR_FORM_ID"
  data-base-url="https://forms.canopyds.com"
/>
<script src="https://forms.canopyds.com/embed.js" defer is:inline></script>
```

### WordPress

1. Edit the page or post.
2. Add a **Custom HTML** block.
3. Paste the embed snippet.
4. Publish.

### Figma Sites

1. Add an **Embed** component to your page.
2. Set it to **HTML** mode (not URL).
3. Paste the embed snippet.
4. Publish the site.

### Squarespace, Wix, Webflow

Look for a **Custom HTML**, **Code**, or **Embed** block and paste the snippet in.

## Manual HTML (advanced)

If you want to control the HTML yourself (for example, to blend the form into a custom layout without the embed's styling), submit directly to the API.

**Endpoint:**

```
POST https://forms.canopyds.com/api/submit/YOUR_FORM_ID
Content-Type: application/json
Origin: https://your-site.com
```

The Publish tab shows this endpoint for your form. Below is a complete example you can copy, using field names that match your form.

```html
<form id="contact-form">
  <input type="text" name="name" placeholder="Your name" required>
  <input type="email" name="email" placeholder="Your email" required>
  <textarea name="message" placeholder="Your message" required></textarea>
  <button type="submit">Send</button>
</form>

<script>
  document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());

    const res = await fetch('https://forms.canopyds.com/api/submit/YOUR_FORM_ID', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const payload = await res.json();
    if (res.ok) {
      e.target.reset();
      alert('Submitted');
    } else if (payload?.fields) {
      console.warn('Field errors:', payload.fields);
    } else {
      alert(payload?.error || 'Submit failed');
    }
  });
</script>
```

**Honeypot.** If the form has a honeypot field configured, include it as a hidden input in your HTML. Legitimate users won't fill it; bots that do get marked as spam.

```html
<input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off">
```

**Response shape.**

- `200 OK`: `{ "success": true, "id": "<submission-id>" }`
- `400 Bad Request` with validation errors: `{ "error": "Validation failed", "fields": { "email": "Email must be valid" } }`
- `403 Forbidden`: `{ "error": "Origin not allowed" }`
- `413 Payload Too Large`: payload exceeds 64KB
- `429 Too Many Requests`: rate limit hit

**Rate limits.** 10 submissions per minute per IP on `/api/submit`, 60 form-definition fetches per minute per IP on `/api/embed`.

## Single-field URLs

Single-field URLs let you capture one field at a time from external tools that can only POST a plain string or a minimal JSON body (automation platforms, webhook helpers, etc.). Each field has its own dedicated endpoint.

**Endpoint shape:**

```
POST https://forms.canopyds.com/api/submit/YOUR_FORM_ID/<field-name>
```

`<field-name>` is the internal key auto-generated from the field's label, shown when you edit the field.

**Payload:** either JSON `{ "value": "..." }` or a plain-text body. A submission is created with only that field populated. The same origin, rate-limit, and size rules as the full submit endpoint apply.

## What happens on submit

1. The origin is validated against Allowed Origins (localhost is always allowed).
2. Each field is validated server-side against its configuration (required, format, length).
3. If a honeypot is configured and filled, the submission is marked as spam.
4. The submission is stored with NEW status and timestamped.
5. If email notifications are on (and the submission isn't spam), an email is sent to each recipient.
6. The hosted page (or embed) shows the configured success message, or redirects to the URL you set.

## Unpublishing

Unpublishing swaps the hosted page for a "Form Not Available" message. Submissions already collected are kept and remain visible on the Submissions tab. To fully take a form offline, unpublish it and remove the embed snippet from your site.

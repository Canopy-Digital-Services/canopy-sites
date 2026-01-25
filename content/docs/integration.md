# Integrating Forms with Your Site

This guide shows you exactly how to add Can-O-Forms to your website. Choose the method that works best for your setup.

## Prerequisites

Before you start, make sure you have:

1. **Created a Site** in Can-O-Forms admin
2. **Created a Form** with fields configured
3. **Your Site API Key** (found in site settings)
4. **Your Form Slug** (the URL-friendly name, e.g., "contact")
5. **Your Can-O-Forms Domain** (e.g., `https://canoforms.canopyds.com`)

## Embed Script (Recommended)

The embed script is the easiest way to add forms. Just paste two lines of code and you're done!

### Step 1: Get Your Embed Code

1. Log into Can-O-Forms admin
2. Navigate to your site → your form
3. Click **Integrate** button
4. Copy the embed code (it looks like this):

```html
<div 
  data-can-o-form="contact"
  data-site-key="abc123-def456-ghi789"
  data-base-url="https://canoforms.canopyds.com"
></div>
<script src="https://canoforms.canopyds.com/embed.js" defer></script>
```

### Step 2: Add to Your Website

The exact steps depend on your website platform:

#### Static HTML Website

**Where to add it:** In your HTML file where you want the form to appear.

**Example - Contact Page (`contact.html`):**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Contact Us</title>
</head>
<body>
  <h1>Get in Touch</h1>
  <p>Fill out the form below and we'll get back to you.</p>
  
  <!-- Paste your embed code here -->
  <div 
    data-can-o-form="contact"
    data-site-key="abc123-def456-ghi789"
    data-base-url="https://canoforms.canopyds.com"
  ></div>
  <script src="https://canoforms.canopyds.com/embed.js" defer></script>
  
  <!-- Rest of your page -->
</body>
</html>
```

**Important:** 
- The `<div>` is where the form will appear
- The `<script>` tag can go anywhere on the page (before closing `</body>` is recommended)
- Both tags must be on the same page

#### React / Next.js

**Where to add it:** In your React component or Next.js page.

**Example - Contact Page Component:**

```jsx
// pages/contact.js (Next.js) or components/Contact.jsx (React)

export default function ContactPage() {
  return (
    <div>
      <h1>Contact Us</h1>
      <p>Fill out the form below.</p>
      
      {/* The div where the form will render */}
      <div 
        data-can-o-form="contact"
        data-site-key="abc123-def456-ghi789"
        data-base-url="https://canoforms.canopyds.com"
      />
      
      {/* Load the embed script */}
      <script src="https://canoforms.canopyds.com/embed.js" defer />
    </div>
  );
}
```

**For Next.js specifically**, use the `next/script` component:

```jsx
import Script from 'next/script';

export default function ContactPage() {
  return (
    <div>
      <h1>Contact Us</h1>
      
      <div 
        data-can-o-form="contact"
        data-site-key="abc123-def456-ghi789"
        data-base-url="https://canoforms.canopyds.com"
      />
      
      <Script src="https://canoforms.canopyds.com/embed.js" />
    </div>
  );
}
```

#### Astro

**Where to add it:** In your `.astro` component file.

**Example - Contact Page (`src/pages/contact.astro`):**

```astro
---
// Frontmatter (optional)
const title = "Contact Us";
---

<html>
<head>
  <title>{title}</title>
</head>
<body>
  <h1>{title}</h1>
  
  <!-- The form container -->
  <div 
    data-can-o-form="contact"
    data-site-key="abc123-def456-ghi789"
    data-base-url="https://canoforms.canopyds.com"
  />
  
  <!-- Load the embed script -->
  <script src="https://canoforms.canopyds.com/embed.js" defer />
</body>
</html>
```

#### WordPress

**Where to add it:** In a page or post using the HTML block or a custom HTML widget.

1. Edit your page/post
2. Add a **Custom HTML** block
3. Paste your embed code:

```html
<div 
  data-can-o-form="contact"
  data-site-key="abc123-def456-ghi789"
  data-base-url="https://canoforms.canopyds.com"
></div>
<script src="https://canoforms.canopyds.com/embed.js" defer></script>
```

#### Figma Sites

**Where to add it:** In an Embed component.

1. In Figma Sites, add an **Embed** component to your page
2. Click the embed component
3. Switch to **HTML** mode (not URL mode)
4. Paste your embed code:

```html
<div data-can-o-form="contact" data-site-key="abc123-def456-ghi789" data-base-url="https://canoforms.canopyds.com"></div>
<script src="https://canoforms.canopyds.com/embed.js" defer></script>
```

5. The form will render automatically when you publish

#### Other Platforms (Squarespace, Wix, Webflow, etc.)

Most website builders support custom HTML/JavaScript:

1. Find the **Custom HTML** or **Code Block** feature
2. Paste your embed code
3. Save and publish

**Note:** Some platforms may require you to add the script in a separate location (like a footer code section). Check your platform's documentation for adding custom JavaScript.

### Step 3: Test Your Form

1. Visit your website page
2. You should see your form rendered automatically
3. Fill it out and submit
4. Check the Can-O-Forms admin dashboard to see the submission

### Customizing the Appearance

You can customize colors, fonts, and spacing using the `data-theme` attribute:

```html
<div 
  data-can-o-form="contact"
  data-site-key="abc123-def456-ghi789"
  data-base-url="https://canoforms.canopyds.com"
  data-theme='{"primary":"#005F6A","radius":12,"density":"comfortable"}'
></div>
<script src="https://canoforms.canopyds.com/embed.js" defer></script>
```

**Available theme properties:**

*Typography:*
- `fontFamily` - CSS font-family (e.g., `"Inter, sans-serif"`)
- `fontSize` - Base font size in pixels (number, e.g., `14`)
- `fontUrl` - URL to font stylesheet (e.g., Google Fonts)

*Colors & Layout:*
- `text` - Text color (hex, e.g., `"#18181b"`)
- `background` - Form background (hex, e.g., `"#ffffff"`)
- `primary` - Accent color for buttons (hex, e.g., `"#0ea5e9"`)
- `border` - Input border color (hex, e.g., `"#e4e4e7"`)
- `radius` - Border radius in pixels (number, e.g., `8`)
- `density` - Spacing: `"compact"`, `"normal"`, or `"comfortable"`

*Submit Button:*
- `buttonWidth` - `"full"` (100% width) or `"auto"` (fits content)
- `buttonAlign` - `"left"`, `"center"`, or `"right"` (when width is auto)
- `buttonText` - Custom submit button text (string, e.g., `"Send Message"`)

**Example with full theme:**

```html
<div 
  data-can-o-form="contact"
  data-site-key="abc123-def456-ghi789"
  data-base-url="https://canoforms.canopyds.com"
  data-theme='{
    "fontFamily": "Inter, sans-serif",
    "fontSize": 16,
    "fontUrl": "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap",
    "primary": "#005F6A",
    "background": "#f9fafb",
    "border": "#d1d5db",
    "radius": 12,
    "density": "comfortable",
    "buttonWidth": "auto",
    "buttonAlign": "center",
    "buttonText": "Send Message"
  }'
></div>
<script src="https://canoforms.canopyds.com/embed.js" defer></script>
```

See [Form Appearance & Behavior](./form-customization.md) for detailed theme documentation.

### Multiple Forms on One Page

You can add multiple forms to the same page:

```html
<!-- Contact Form -->
<div 
  data-can-o-form="contact"
  data-site-key="abc123-def456-ghi789"
  data-theme='{"primary":"#0ea5e9"}'
></div>

<!-- Newsletter Signup -->
<div 
  data-can-o-form="newsletter"
  data-site-key="abc123-def456-ghi789"
  data-theme='{"primary":"#10b981"}'
></div>

<!-- Only load the script once -->
<script src="https://canoforms.canopyds.com/embed.js" defer></script>
```

**Important:** Only include the `<script>` tag once per page, even if you have multiple forms.

### Where the Form Appears

The form will render **inside** the `<div>` element. The `<div>` acts as a container:

```html
<!-- The form will appear here, replacing any content in this div -->
<div data-can-o-form="contact" data-site-key="YOUR_KEY">
  <!-- This text will be replaced when the form loads -->
</div>
```

You can style the container div with CSS:

```html
<style>
  .form-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }
</style>

<div 
  class="form-container"
  data-can-o-form="contact"
  data-site-key="abc123-def456-ghi789"
  data-base-url="https://canoforms.canopyds.com"
></div>
<script src="https://canoforms.canopyds.com/embed.js" defer></script>
```

## Manual Submit API (Manual HTML Forms)

If you need full control over your form HTML and styling, use the direct API approach.

### Step 1: Get Your API Endpoint

Your API endpoint format is:
```
https://your-canoforms-domain.com/api/submit/{siteApiKey}/{formSlug}
```

**Example:**
```
https://canoforms.canopyds.com/api/submit/abc123-def456-ghi789/contact
```

### Step 2: Create Your HTML Form

Create a standard HTML form with your fields:

```html
<form id="contactForm">
  <div>
    <label for="name">Your Name</label>
    <input type="text" id="name" name="name" required />
  </div>
  
  <div>
    <label for="email">Email Address</label>
    <input type="email" id="email" name="email" required />
  </div>
  
  <div>
    <label for="message">Message</label>
    <textarea id="message" name="message" required></textarea>
  </div>
  
  <!-- Honeypot field (hidden from users) -->
  <input type="text" name="website" style="display: none;" />
  
  <button type="submit">Send Message</button>
</form>

<div id="formStatus"></div>
```

### Step 3: Add JavaScript to Handle Submission

Add this JavaScript to submit the form via AJAX:

```html
<script>
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent page reload
  
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  const statusDiv = document.getElementById('formStatus');
  statusDiv.textContent = 'Sending...';
  statusDiv.style.color = 'blue';
  
  try {
    const response = await fetch(
      'https://canoforms.canopyds.com/api/submit/abc123-def456-ghi789/contact',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    
    if (response.ok) {
      statusDiv.textContent = 'Thank you! Your message has been sent.';
      statusDiv.style.color = 'green';
      form.reset();
    } else {
      const error = await response.json();
      statusDiv.textContent = `Error: ${error.error || 'Submission failed'}`;
      statusDiv.style.color = 'red';
    }
  } catch (error) {
    statusDiv.textContent = 'Network error. Please try again.';
    statusDiv.style.color = 'red';
  }
});
</script>
```

### Complete Example (Manual Submit API)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Contact Us</title>
  <style>
    form {
      max-width: 600px;
      margin: 0 auto;
    }
    label {
      display: block;
      margin-top: 1rem;
    }
    input, textarea {
      width: 100%;
      padding: 0.5rem;
      margin-top: 0.25rem;
    }
    button {
      margin-top: 1rem;
      padding: 0.75rem 2rem;
      background: #0ea5e9;
      color: white;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Contact Us</h1>
  
  <form id="contactForm">
    <div>
      <label for="name">Your Name</label>
      <input type="text" id="name" name="name" required />
    </div>
    
    <div>
      <label for="email">Email Address</label>
      <input type="email" id="email" name="email" required />
    </div>
    
    <div>
      <label for="message">Message</label>
      <textarea id="message" name="message" rows="5" required></textarea>
    </div>
    
    <input type="text" name="website" style="display: none;" />
    
    <button type="submit">Send Message</button>
  </form>
  
  <div id="formStatus"></div>
  
  <script>
    document.getElementById('contactForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const form = e.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      const statusDiv = document.getElementById('formStatus');
      statusDiv.textContent = 'Sending...';
      
      try {
        const response = await fetch(
          'https://canoforms.canopyds.com/api/submit/abc123-def456-ghi789/contact',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }
        );
        
        if (response.ok) {
          statusDiv.textContent = 'Thank you! Your message has been sent.';
          statusDiv.style.color = 'green';
          form.reset();
        } else {
          const error = await response.json();
          statusDiv.textContent = `Error: ${error.error || 'Submission failed'}`;
          statusDiv.style.color = 'red';
        }
      } catch (error) {
        statusDiv.textContent = 'Network error. Please try again.';
        statusDiv.style.color = 'red';
      }
    });
  </script>
</body>
</html>
```

## Data Attributes Reference

### Container Attributes

**`data-can-o-form`** (required)
- The form slug (e.g., `"contact"`)
- Must match the slug configured in your form

**`data-site-key`** or **`data-api-key`** (required)
- Your site's API key
- Can be on the container or the script tag
- Both attributes work the same way

**`data-base-url`** (optional)
- Base URL for the Can-O-Forms API
- Defaults to relative URLs if not set
- Useful for custom domains or local development

**`data-theme`** (optional)
- JSON object with theme overrides
- Merges with form's default theme
- See [Form Appearance & Behavior](./form-customization.md) for details

### Script Tag Attributes

You can also put some attributes on the script tag:

```html
<script 
  src="https://canoforms.canopyds.com/embed.js" 
  data-site-key="abc123-def456-ghi789"
  data-base-url="https://canoforms.canopyds.com"
  defer
></script>
```

This is useful when you have multiple forms on one page and want to share the API key.

## Important Configuration

### Domain Setup

Make sure your site's domain in Can-O-Forms matches your actual website domain:

1. Go to Can-O-Forms admin → Sites
2. Click on your site
3. Click **Edit Site**
4. Set **Domain** to your website's domain (e.g., `example.com`)
   - Don't include `http://` or `https://`
   - Don't include trailing slashes
   - Include subdomain if needed (e.g., `blog.example.com`)

### Success Behavior

Configure what happens after submission:

1. Go to your form in Can-O-Forms admin
2. Click **Edit Form**
3. Scroll to **Success Behavior** section
4. Choose one:
   - **Success Message** - Text shown after submission
   - **Redirect URL** - Page to redirect to (overrides message)

## Troubleshooting

### Form Not Appearing

**Check:**
- Is the `<script>` tag included?
- Is the script URL correct?
- Are there JavaScript errors in the browser console?
- Does your form have fields configured in the admin?

**Solution:**
- Open browser developer tools (F12)
- Check the Console tab for errors
- Verify the embed script URL loads correctly
- Make sure the form has at least one field

### "Origin not allowed" Error

**Check:**
- Does your site's domain in Can-O-Forms match your actual domain?
- Is the domain set correctly (no `http://`, no trailing slashes)?

**Solution:**
- Update the domain in site settings to match exactly
- For local testing, temporarily set domain to `localhost`
- Check that subdomains are configured correctly

### Form Not Submitting

**Check:**
- Are there validation errors?
- Is the API key correct?
- Is the form slug correct?
- Is the endpoint URL correct?

**Solution:**
- Check browser console for errors
- Verify API key and form slug in the embed code
- Test with a simple form first
- Verify the endpoint URL is correct

### Styling Issues

**Check:**
- Is the form container styled correctly?
- Are there CSS conflicts?
- Is the theme JSON valid?

**Solution:**
- Use `data-theme` to customize appearance
- Check that your CSS isn't overriding embed styles
- The embed uses scoped CSS (`.cof-*` classes) to avoid conflicts
- Validate JSON in `data-theme` attribute

### Script Loading Issues

**Check:**
- Is the script URL accessible?
- Are there network errors?
- Is the script loading before DOM is ready?

**Solution:**
- Use `defer` attribute on script tag (recommended)
- Or load script in `<head>` with `defer`
- Check network tab for failed requests
- Verify script URL is correct

## Next Steps

1. **Test your form** - Submit a test entry
2. **Check submissions** - View it in the Can-O-Forms admin dashboard
3. **Set up email notifications** - Configure notification emails in form settings
4. **Customize appearance** - Use theme options to match your brand

## Related Documentation

- [API Reference](./api.md) - Technical details about the API
- [Form Management](./forms.md) - Creating and configuring forms
- [Form Appearance & Behavior](./form-customization.md) - Theme customization
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

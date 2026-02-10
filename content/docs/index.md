# Getting Started with Canopy Forms

Welcome to Canopy Forms v3, a complete SaaS forms management platform designed for static websites. Canopy Forms provides a full solution for creating, managing, and collecting form submissions without requiring server-side code on your static site.

## What is Canopy Forms?

Canopy Forms is a forms management platform with:

- **Form Builder UI** - Create and edit forms with field management, validation rules, and theming
- **Admin Interface** - Web application for managing forms, fields, and submissions
- **Operator Console** - Platform operator interface for account management with privacy-first design (v3.0.0+)
- **Script-Based Embeds** - Single `<script>` tag form rendering, no manual HTML needed
- **Submission Management** - View, organize, and export form submissions (CSV and JSON)
- **Email Notifications** - Automatic alerts for new submissions with per-form toggles (v2.5.0+)
- **Account Management** - Self-service signup, login, and password reset (v2.2.0+)
- **Theme System** - Customize colors, fonts, and styling per form
- **Spam Protection** - Honeypot fields and IP-based rate limiting
- **Origin Validation** - Domain-based security to prevent unauthorized submissions

**Platform URL**: https://forms.canopyds.com

**Status**: v3.0.0 - Production-ready platform with all planned features implemented

## Key Concepts

### Account

An **Account** is an internal construct that represents a user's workspace. Each account:
- Is created automatically when you sign up
- Contains all your forms and submissions
- Is not directly exposed in the UI (it's a behind-the-scenes organizational unit)
- In v3, exactly one user per account

### User

A **User** is your authenticated identity:
- Authenticated via email + password
- Owns exactly one account
- Can create multiple forms
- Has login telemetry tracked for security (last login, failed attempts)

### Forms

A **Form** is a specific form that can be embedded on your website. Each form has:
- A unique slug (URL-friendly identifier, auto-generated from the form name)
- A unique form ID used in the API endpoints
- Field definitions (added via the field builder)
- Success behavior (inline message or redirect URL)
- Theme customization (colors, fonts, spacing)
- Allowed origins for security (configure which domains can submit to this form)
- Optional email notification settings
- Optional honeypot field for spam protection
- Multiple submissions

### Submissions

A **Submission** is a single form submission containing:
- The form data as JSON
- Metadata (IP hash, user agent, referrer, origin)
- Status (NEW, READ, ARCHIVED)
- Spam flag

## Quick Start

1. **Sign Up** - Create your account at the platform URL
2. **Create a Form** - Enter a form name and create your first form
3. **Add Fields** - Use the field builder to configure form fields, validation, and styling
4. **Configure Success Behavior** - Set up success messages or redirect URLs
5. **Configure Allowed Origins** - Add the domains that can submit to this form (or leave empty to allow all origins during development)
6. **Get Embed Code** - Copy the script embed code (or manual submit endpoint)
7. **Add to Your Website** - Paste the embed script or integrate your HTML form
8. **Test & View** - Submit a test form and view it in the admin dashboard

## Integration Options

**Embed Script (Recommended)**
- Single `<script>` tag - no HTML form writing required
- Automatic rendering, validation, and submission
- Built-in styling with theme customization
- Perfect for Figma Sites and static pages

**Manual Submit API (Advanced)**
- Manual HTML forms with JavaScript
- Direct POST to `/api/submit/{formId}`
- Full control over form HTML and styling

## Next Steps

- Learn about [Authentication & Account Management](./authentication.md)
- [Create and manage Forms](./forms.md)
- [Integrate forms with your site](./integration.md)
- [View and export Submissions](./submissions.md)
- [Configure email notifications](./email-notifications.md)

Ready to get started? Check out the detailed guides in the documentation cards below.

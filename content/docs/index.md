# Getting Started with Can-O-Forms

Welcome to Can-O-Forms v3, a complete SaaS forms management platform designed for static websites. Can-O-Forms provides a full solution for creating, managing, and collecting form submissions without requiring server-side code on your static site.

## What is Can-O-Forms?

Can-O-Forms is a forms management platform with:

- **Form Builder UI** - Create and edit forms with field management, validation rules, and theming
- **Admin Interface** - Web application for managing sites, forms, fields, and submissions
- **Operator Console** - Platform operator interface for account management with privacy-first design (v3.0.0+)
- **Script-Based Embeds** - Single `<script>` tag form rendering, no manual HTML needed
- **Submission Management** - View, organize, and export form submissions (CSV and JSON)
- **Email Notifications** - Automatic alerts for new submissions with per-form toggles (v2.5.0+)
- **Multi-Site Support** - Manage forms for multiple websites from one account
- **Account Management** - Self-service signup, login, and password reset (v2.2.0+)
- **Theme System** - Customize colors, fonts, and styling per form
- **Spam Protection** - Honeypot fields and IP-based rate limiting
- **Origin Validation** - Domain-based security to prevent unauthorized submissions

**Platform URL**: https://canoforms.canopyds.com

**Status**: v3.0.0 - Production-ready platform with all planned features implemented

## Key Concepts

### Account

An **Account** is an internal construct that represents a user's workspace. Each account:
- Is created automatically when you sign up
- Contains all your sites, forms, and submissions
- Is not directly exposed in the UI (it's a behind-the-scenes organizational unit)
- In v3, exactly one user per account

### User

A **User** is your authenticated identity:
- Authenticated via email + password
- Owns exactly one account
- Can create multiple sites and forms
- Has login telemetry tracked for security (last login, failed attempts)

### Sites

A **Site** represents a website or domain that will send form submissions. Each site has:
- A unique API key for authentication
- A domain for origin validation
- Multiple forms
- Complete isolation from other sites

### Forms

A **Form** is a specific form on your site. Each form has:
- A unique slug (URL-friendly identifier)
- Field definitions (added via the field builder)
- Success behavior (inline message or redirect URL)
- Theme customization (colors, fonts, spacing)
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
2. **Create a Site** - Add your website domain and get an API key
3. **Create a Form** - Define a form with a unique slug
4. **Add Fields** - Use the field builder to configure form fields, validation, and styling
5. **Configure Success Behavior** - Set up success messages or redirect URLs
6. **Get Embed Code** - Copy the script embed code (or manual submit endpoint)
7. **Add to Your Site** - Paste the embed script or integrate your HTML form
8. **Test & View** - Submit a test form and view it in the admin dashboard

## Integration Options

**Embed Script (Recommended)**
- Single `<script>` tag - no HTML form writing required
- Automatic rendering, validation, and submission
- Built-in styling with theme customization
- Perfect for Figma Sites and static pages

**Manual Submit API (Advanced)**
- Manual HTML forms with JavaScript
- Direct POST to `/api/submit/{siteApiKey}/{formSlug}`
- Full control over form HTML and styling

## Next Steps

- Learn about [Authentication & Account Management](./authentication.md)
- Set up your first [Site](./sites.md)
- [Create and manage Forms](./forms.md)
- [Integrate forms with your site](./integration.md)
- [View and export Submissions](./submissions.md)

Ready to get started? Check out the detailed guides in the documentation cards below.

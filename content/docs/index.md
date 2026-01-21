# Getting Started with Can-O-Forms

Welcome to Can-O-Forms, a self-hosted form backend service designed for static websites. Can-O-Forms provides a simple script-based embed system and API to collect form submissions without requiring server-side code on your static site.

## What is Can-O-Forms?

Can-O-Forms is a lightweight form backend that:

- **Script-Based Embeds** (v2) - Single `<script>` tag form rendering, no manual HTML needed
- **Form Builder** - Visual field editor with validation rules
- **RESTful API** - Accept form submissions via API endpoints
- **PostgreSQL Database** - Secure, structured data storage
- **Email Notifications** - Automatic alerts when forms are submitted
- **Admin UI** - Manage sites, forms, fields, and submissions
- **Spam Protection** - Honeypot fields and IP-based rate limiting
- **Origin Validation** - Domain-based security to prevent unauthorized submissions
- **Theme System** - Customize colors, fonts, and styling per form

## Key Concepts

### Sites

A **Site** represents a website or domain that will send form submissions. Each site has:
- A unique API key for authentication
- A domain for origin validation
- Multiple forms

### Forms

A **Form** is a specific form on your site. Each form has:
- A unique slug (URL-friendly identifier)
- Field definitions (added via the field builder)
- Success behavior (inline message or redirect URL)
- Theme customization (colors, fonts, spacing)
- Optional email notification recipients
- Optional honeypot field for spam protection
- Multiple submissions

### Submissions

A **Submission** is a single form submission containing:
- The form data as JSON
- Metadata (IP hash, user agent, referrer)
- Status (NEW, READ, ARCHIVED)
- Spam flag

## Quick Start

1. **Create a Site** - Add your website domain and get an API key
2. **Create a Form** - Define a form with a unique slug
3. **Add Fields** - Use the field builder to configure form fields, validation, and styling
4. **Configure Success Behavior** - Set up success messages or redirect URLs
5. **Get Embed Code** - Copy the script embed code (v2) or API integration code (v1)
6. **Add to Your Site** - Paste the embed script or integration code
7. **Test & View** - Submit a test form and view it in the admin dashboard

## Two Integration Methods

**v2 Embed Script (Recommended)**
- Single `<script>` tag - no HTML form writing required
- Automatic rendering, validation, and submission
- Built-in styling with theme customization
- Perfect for Figma Sites and static pages

**v1 API Integration**
- Manual HTML forms with JavaScript
- Direct API calls
- Full control over form HTML and styling
- Backwards compatible

Ready to get started? Check out the detailed guides in the navigation above.

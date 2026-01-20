# Getting Started with Can-O-Forms

Welcome to Can-O-Forms, a self-hosted form backend service designed for static websites. Can-O-Forms provides a simple API to collect form submissions without requiring server-side code on your static site.

## What is Can-O-Forms?

Can-O-Forms is a lightweight form backend that:

- Accepts form submissions via a RESTful API
- Stores submissions in a PostgreSQL database
- Sends email notifications when forms are submitted
- Provides an admin UI to manage sites, forms, and submissions
- Includes spam protection with honeypot fields and rate limiting
- Validates origin domains to prevent unauthorized submissions

## Key Concepts

### Sites

A **Site** represents a website or domain that will send form submissions. Each site has:
- A unique API key for authentication
- A domain for origin validation
- Multiple forms

### Forms

A **Form** is a specific form on your site. Each form has:
- A unique slug (URL-friendly identifier)
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
3. **Get Integration Code** - Copy the HTML or JavaScript integration code
4. **Add to Your Site** - Paste the code into your static website
5. **Test & View** - Submit a test form and view it in the admin dashboard

Ready to get started? Check out the detailed guides in the navigation above.

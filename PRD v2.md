# Can-O-Forms v2 – Script Embed Forms

## Goal

Build Can-O-Forms v2 as a self-hosted, multi-tenant forms backend that supports script-based embeds for use in Figma Sites and other static sites, with minimal HTML, basic theming, and a white-label-friendly default.

v2 explicitly does NOT attempt to integrate with native Figma components or per-field POST URLs. All form rendering and submission logic lives inside the embed.

## Core Concept

Can-O-Forms v2 introduces a clear multi-tenant hierarchy and rendering model:

User → Site → Form → Submission

* A User owns one or more Sites
* A Site represents a single website/domain and owns one or more Forms
* A Form defines fields, behavior, and embed configuration
* Submissions belong to a Form

A single script embed:
A single script embed that:

* Renders a form into a target DOM element
* Handles validation, submission, success/error states
* Posts submissions to the existing Can-O-Forms backend
* Supports lightweight, token-based theming (no full theme editor)

Example usage:

```
<div
  data-can-o-form="contact"
  data-theme='{"fontFamily":"Inter, system-ui","primary":"#005F6A","radius":10,"density":"normal"}'
></div>
<script src="https://forms.canopyds.co/embed.js"></script>
```

This must work when pasted into Figma Sites Embed → HTML, which runs inside an iframe.

## What v2 Adds (Compared to v1)

1. Script-based embed renderer (embed.js)
2. Hosted embed rendering endpoint support (if needed for iframe fallback)
3. Minimal theming support
4. **Basic form builder UI (field definitions + order)**
5. Form-level success behavior configuration
6. Public embed-safe API surface (separate from admin UI)

## Embed Behavior Requirements

* The embed script loads once per page and initializes all matching form containers
* Multiple forms on the same page must be supported
* Each form instance maintains isolated state (validation, submission, success)
* Failure in one form must not affect other embeds on the page
* Font resources must be deduplicated across embeds
* Duplicate form IDs on the same page should log a warning and skip re-initialization

The embed runtime must never throw unhandled exceptions that break the host page.

Must be safe to load multiple forms on the same page.

## Theming MVP (v2)

Theming is intentionally minimal and token-based.

### Theme Precedence

Theme values resolve in the following order:

1. Per-embed overrides via data-theme attribute (highest priority)
2. Form-level default theme stored in the database
3. Hard-coded embed defaults (lowest priority)

Supported theme properties:

* fontFamily: CSS font-family string. Optional.
* fontUrl: Optional URL to a font stylesheet (e.g. Google Fonts). Loaded once per page.
* text: Text color.
* background: Form background color.
* primary: Primary accent color (submit button, focus ring).
* border: Input border color.
* radius: Border radius in px.
* density: One of compact, normal, comfortable.

Defaults must be sane and neutral.

### Form Builder UI: Font Handling

The form builder must include a minimal Embed Appearance section to handle fonts reliably across embed contexts.

Font mode:

* Inherit from site (default)
* Use custom font

If Use custom font is selected:

* Font family (free text input)
* Font CSS URL (optional)

Embed behavior:

* Default to font-family: inherit
* If a Font CSS URL is provided, load it once per page in the embed runtime
* Allow per-embed overrides via data-theme to override builder defaults

No per-field theming in v2.

## Explicit Non-Goals for v2

* No visual theme editor UI
* No per-field styling
* No layout builder
* No dark mode toggles
* No native Figma component wiring
* No form logic outside the embed

Those are v3+ concerns.

## Form Builder Scope (v2)

v2 introduces a minimal, non-visual form builder required to support embed rendering.

Supported capabilities:

* Create and edit forms
* Add, edit, delete fields
* Reorder fields
* Mark fields as required
* Configure success behavior (inline message or redirect URL)

Supported field types (v2):

* Text
* Email
* Textarea
* Select
* Checkbox
* Hidden (for metadata)

Explicitly out of scope:

* Drag-and-drop layout
* Visual editor or live preview
* Per-field styling
* Conditional logic

The embed renderer is the preview.

## Public Embed API Contract

The embed runtime fetches a public, embed-safe form definition.

Example response shape:

* formId
* fields: ordered list of field definitions (id, name, type, label, required, options)
* successMessage or redirectUrl
* defaultTheme

This endpoint must:

* Never return notifyEmails, owner identifiers, or admin-only data
* Be cacheable for short durations
* Be rate limited
* Allow cross-origin access

## Backend Changes Required

### Multi-Tenant Structure

* Introduce an explicit Site entity
* Site owns:

  * Domain (used for origin validation)
  * API key or signed token (used by embed runtime)
* Forms belong to a Site
* Submissions belong to a Form

This structure is required for:

* Clean CORS enforcement
* Embed security
* Future billing and isolation (out of scope for v2)

### Public Embed API

* Public endpoint to fetch embed-safe form definition by form ID or slug
* Public submission endpoint used by embed runtime
* Embed authentication via header or signed token (not URL path secrets)

### Submission Storage

* Submission payload stored as JSON
* Submission metadata stored separately (hashed IP, user agent, origin, timestamp)
* Spam flag supported (default false)

Auth:

* Embed endpoints are authenticated via form API key or signed token
* No admin auth exposed to embed runtime

## Security + Abuse Considerations

* Validate Origin header against Site domain
* Rate limit embed submissions by IP + form
* Accept and silently mark honeypot-triggered submissions as spam
* Skip notifications for spam submissions
* Hash IP addresses before storage
* Do not expose admin-only data to embed API

## Validation Rules

Client-side validation:

* Required fields
* Email format
* Min and max length
* Optional regex patterns

Server-side validation:

* Validate submission against stored field schema
* Return structured field-level errors

Explicitly out of scope for v2:

* Cross-field validation
* Conditional logic
* Async validation

## Error Handling Rules

* Form definition fetch failure shows a generic load error and logs to console
* Submission failure shows inline error, preserves user input, and re-enables submit
* Invalid field configuration is skipped with a console warning
* Missing form ID logs an error and does not break other embeds

The embed runtime must never crash or interfere with the host page.

## CSS Isolation Requirements

* All embed styles must be scoped to the form container
* No global selectors
* Use prefixed class names
* Use CSS custom properties for theme tokens

## Accessibility Requirements

* All inputs must have associated labels
* Required fields must be indicated programmatically
* Errors must be associated with fields
* Visible focus indicators are required
* Form container must have appropriate ARIA labeling

## Performance and Compatibility Requirements

* embed.js should target a small payload size and remain dependency-free
* Target modern evergreen browsers (last two versions)
* Mobile Safari must be supported
* Legacy browsers are explicitly unsupported

## Compatibility Requirements

* Must work in:

  * Figma Sites Embed (HTML mode)
  * Astro / static sites
* No reliance on global JS frameworks
* Plain JS, no React required in embed runtime

## Success Criteria for v2

* A Figma Site can include a fully working contact form by pasting:

  * one div
  * one script
* Typeface and basic brand colors can be matched
* No custom HTML form writing required by the site author
* Admin can view, search, and export submissions as in v1

## Mental Model

v2 is headless forms plus a dumb but reliable renderer, not a design system and not a Figma plugin.

Build the boring thing that works everywhere.

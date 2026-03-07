# Future Features

## Separate Label/Value for Select Options

**Current behavior (v3.2):** Users enter the option name once, and it's used as both the label (what users see) and value (what gets stored).

**Future enhancement:** Add ability to specify different submission values from labels. For example:
- Label: "United States" → Value: `US` (for CRM/API integration)
- Label: "Pro Plan - $29/month" → Value: `plan_pro` (for billing system compatibility)

**Use case:** Enables advanced integrations with CRMs, payment gateways, and other systems that require specific data formats or codes.

## Conditional Fields (Show/Hide Based on Parent Option)

**Future enhancement:** Ability to show or hide fields based on the value selected in a parent field (e.g. select, radio).

**Feature details:**
- In the form editor, configure a field to be "conditional": it is only visible (or only required) when a chosen parent field has a specific option selected.
- Parent field is typically a select or radio group; option can be single value or "any of" a set.
- Supports chaining: conditional fields can themselves be parents for further conditional fields.
- Use cases: "If you selected 'Other', show a text field for details"; "If plan is 'Enterprise', show company size and contact fields"; multi-step-like flows within a single form.

**Technical considerations:**
- Form schema needs a way to store conditional rules (parent field id, trigger value(s), show vs. require).
- Embed (and preview) must evaluate conditions in real time as the respondent changes the parent field.
- Submission payload can either omit hidden fields or include them with a sentinel (e.g. not applicable); analytics and exports should handle both.

## Pre-built Templates

**Future enhancement:** Offer a library of pre-built form templates that users can start from instead of a blank form.

**Feature details:**
- Templates cover common use cases (contact, feedback, registration, event sign-up, job application, NPS survey, etc.).
- Each template includes field structure, labels, and optional default theme/appearance.
- User chooses a template when creating a new form (or from a "Start from template" action); the new form is created as a copy so the template itself stays unchanged.
- Optionally: allow saving the current form as a custom template (per workspace or org).

**Use case:** Speeds up form creation, reduces blank-canvas friction, and demonstrates best practices (e.g. good field types and layout for a given purpose).

**Technical considerations:**
- Template definitions (schema + optional theme) need a storage/versioning approach (e.g. seed data, bundled JSON, or DB rows).
- "Create from template" is a variant of "create new form" that pre-populates fields and optionally theme from the chosen template.

## Hosting

**Future enhancement:** Stand-alone front end. Canopy Forms-branded for use by individuals

## Email Field Auto-Send Configuration

**Future enhancement:** Allow email field types to automatically send emails to the submitted email address.

**Feature details:**
- Configure auto-send behavior per email field in the form editor
- Define email template (subject, body) in the dashboard
- Support for merge tags to include submitted form data in the email
- Use cases: confirmation emails, thank you messages, download links, next steps

**Technical considerations:**
- Requires email template editor in admin UI
- Template variables/merge tags for dynamic content
- Integration with existing SMTP configuration
- May want to combine with broader "Email to Submitter" feature

## Email to Submitter

**Future enhancement:** The ability to configure a form to send an email to the person who submitted it. Would require an email editor which is a lot of extra work. May need to wait until a major level bump which would also include some customization of the hosted solution.

## Email Change

**Future enhancement:** Allow authenticated users to update their email address from within the app.

**Feature details:**
- User initiates email change from account settings
- Verification email sent to the new address
- Old address receives a notification of the change
- Change is only confirmed after the new address is verified
- Re-authentication (password prompt) required before initiating the change

**Technical considerations:**
- Requires email verification flow (token-based)
- Should invalidate any existing sessions or prompt re-login after confirmed change
- Guard against email enumeration during the verification step

## Preview Halo (Inspect-Style Highlight)

**Future enhancement:** When the user focuses or hovers an appearance control (e.g. "Field Background", "Border Radius"), highlight the corresponding element(s) in the live preview—similar to browser DevTools "inspect element" highlighting.

**Use case:** Makes it obvious which part of the form each setting affects, especially for colors and typography.

**Technical considerations:**
- Preview and editor are same document; no iframe, so we can query the preview container DOM from the admin app.
- Option A (admin-only): Maintain a theme-key → CSS selector map in the admin (e.g. `fieldBackground` → `.canopy-input, .canopy-textarea, .canopy-select`). On focus/hover, set context (e.g. `previewHighlight`), then in the preview panel use an effect to `querySelectorAll` inside the container and add a halo class; inject admin-side styles for the halo (outline/box-shadow). Keep selector map in sync with embed classes.
- Option B (embed-assisted): Embed adds `data-canopy-theme="fieldBackground"` (or similar) to elements when rendering; admin or embed exposes e.g. `highlightThemeKey(key)` to toggle a halo class. Single source of truth; survives embed DOM changes.
- Clear halo on blur/mouseLeave. Consider debounce so rapid hover across controls doesn’t flicker.

**Future enhancement:** Multiple titled sections on the form
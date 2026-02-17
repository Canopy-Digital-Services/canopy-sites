# Changelog

All notable changes to Canopy Forms will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Usage Pattern for Future Epics

For each completed epic:
1. Add new version entry to this CHANGELOG.md
2. Create detailed report at `docs/epics/epic-N-name.md`
3. Update `docs/epics/README.md` to mark epic as complete
4. Bump version in `package.json` (v2.2.0, v2.3.0, etc.)

---

## [4.1.0] - 2026-02-16

### Added

- **Multi-recipient email notifications**: Forms can now notify multiple recipients on submission
  - `notifyEmails` array field on Form model stores up to 5 email addresses
  - New email management UI in After Submission → Notifications section
  - Toggle auto-populates owner email when first enabled with empty list
  - Add/remove emails inline with validation (format, duplicates, max 5)
  - Press Enter to add email, inline error messages on blur
  - Individual emails sent per recipient for error isolation (not BCC)
  - Owner email is removable like any other entry (no special treatment at runtime)
- **Data migration SQL**: One-time script to backfill `notifyEmails` with owner email for existing forms that have notifications enabled

### Changed

- **Email queue refactor**: `queueNewSubmissionNotification()` now accepts `notifyEmails: string[]` instead of `accountId: string`
  - Removed Prisma DB lookup from email queue (faster, fewer dependencies)
  - Loops through recipient list and sends individual emails
  - Early return if array is empty
- **Server-side validation**: `updateAfterSubmission()` now validates email list
  - Deduplicates emails (case-insensitive)
  - Validates email format with regex
  - Caps at 5 recipients (server-enforced)
  - Lowercases and trims all entries
- **Notification toggle behavior**: Checkbox label changed from "Notify me on new submission" to "Email notifications"
  - Toggle ON with empty list auto-populates owner email
  - Toggle OFF hides email list but preserves it in state
  - Consistent with allowedOrigins pattern (list persists when hidden)

### Removed

- **Removed** `notifyEmails` from `updateFormBasics()` (never called with it from UI)
  - Moved to `updateAfterSubmission()` where it logically belongs

### Technical Details

- Updated components: `after-submission-section.tsx` (multi-recipient UI), `form-editor.tsx` (threads ownerEmail prop), form editor page (extracts session.user.email)
- Updated server actions: `src/actions/forms.ts` - `updateAfterSubmission()` with email validation
- Updated email queue: `src/lib/email-queue.ts` - loops through `notifyEmails[]`
- Updated public submit: `src/lib/public-submit.ts` and `src/app/api/submit/[formId]/[fieldName]/route.ts` - pass `form.notifyEmails`
- Migration: `docs/epics/epic-7-backfill-notify-emails.sql` for existing forms
- No schema migration needed - `notifyEmails` field already existed (unused until now)

### UI/UX Details

- **Validation on blur**: Inline error messages only appear after user leaves input
- **Keyboard shortcut**: Enter key to add email (disabled when input is invalid)
- **Visual feedback**: Email list with trash icons, tooltips on remove buttons
- **Auto-save**: Email list changes trigger existing debounced auto-save (1 second delay)
- **Max cap**: "Add" button and Enter key disabled when at 5 recipients
- **Error messages**:
  - "Enter a valid email address" (format error)
  - "This email is already in the list" (duplicate)
  - "Maximum 5 recipients allowed" (cap reached)

---

## [3.9.0] - 2026-02-06

### Changed

- **Phone field validation simplification**: Cleaned up phone field configuration UI before beta
  - Removed unused length limit controls (min/max length) - phone lengths are dictated by standards, not user config
  - Removed unused country selector (was not wired to validation)
  - Replaced technical "Format" dropdown with clear two-tier validation:
    - **Lenient**: Accepts any format with 7+ characters (digits, spaces, dashes, parentheses, dots, plus signs) - no normalization
    - **Strict US format**: Validates 10-digit US phone numbers and normalizes to E.164 format (+1XXXXXXXXXX) for storage
  - Updated helper text to dynamically explain each validation mode
  - Accepts flexible input formats in strict mode: `555-123-4567`, `(555) 123-4567`, `+1 555 123 4567`, `1-555-123-4567`, etc.
  - International validation deferred to future work (TODO comments added in validation files)

### Removed

- **Phone validation**: `PhoneValidation` type no longer extends `BaseValidation` (removed `minLength`/`maxLength` support)
- **Phone validation**: Removed `defaultCountry` field from all type definitions (was not used in validation logic)
- **Data cleanup**: Removed stale `minLength`, `maxLength`, and `defaultCountry` keys from existing PHONE field validation JSON in database

### Technical

- Phone validation now skips generic length checks (early return/continue after phone-specific validation)
- Server-side normalization: Strict US phone numbers are normalized to E.164 format before storage
- Client-side validation prevents invalid submissions before they reach the server
- Embed script rebuilt with updated validation logic

---

## [3.8.0] - 2026-02-06

### Added

- **Submission limits**: Forms can now restrict submissions by date/time or total count
  - `stopAt` (DateTime): Stop accepting submissions after a specific date and time
  - `maxSubmissions` (Int): Limit the maximum number of submissions (excludes spam)
  - Limits enforced at submission time with user-friendly error messages
  - Optional fields - leave empty for unlimited submissions
- **After Submission section**: New unified section for post-submission configuration
  - Radio button interface for explicit choice: "Show confirmation message" or "Redirect to URL"
  - Autosave functionality with debounced saves (1 second delay)
  - Real-time save status indicator: "Saving..." / "Saved"
  - Organized into subsections: Security, After Submission, Notifications, and Limits
- **Radio group UI component**: Added `@radix-ui/react-radio-group` for better form controls

### Changed

- **Section reordering**: After Submission section now appears below Appearance section
  - New order: Fields → Appearance → After Submission
  - Improves logical flow (appearance before behavior)
- **Explicit post-submission behavior**: Radio buttons replace implicit precedence
  - Previously: redirect URL would silently override success message
  - Now: User explicitly chooses message or redirect via radio selection
  - Switching options clears the non-selected field automatically
- **Removed manual save button**: After Submission section now autosaves changes
  - Debounced autosave (1 second delay)
  - Visual feedback with save status indicator
  - Consistent with form name autosave pattern

### Renamed

- **Component**: `BehaviorSection` → `AfterSubmissionSection`
- **Server action**: `updateFormBehavior` → `updateAfterSubmission`
  - Legacy alias maintained for backwards compatibility

### Technical Details

- Database migration: `20260206174251_add_submission_limits`
- Added fields to `Form` model: `stopAt`, `maxSubmissions`
- Updated components: `after-submission-section.tsx` (new), `form-editor.tsx`
- Updated server action: `src/actions/forms.ts` - `updateAfterSubmission()`
- Updated submission validation: `src/lib/public-submit.ts` - enforces limits before field validation
- New UI component: `src/components/ui/radio-group.tsx`

---

## [3.7.2] - 2026-02-06

### Added

- **Help text field**: Added optional `helpText` field to all field types in the form builder
  - Appears in the "Add Field" / "Edit Field" modal under the "Input Rules" section
  - Persisted in database as `helpText` column on `Field` model
  - Rendered on embedded forms as muted inline text below the input field
  - Styled with `.canopy-help-text` class (smaller font, muted color)
  - Available for all field types (TEXT, EMAIL, TEXTAREA, SELECT, CHECKBOX, PHONE, DATE, NAME, HIDDEN)

### Removed

- **Custom validation message**: Removed "Custom validation message (optional)" field from field configuration
  - Previously allowed overriding default error messages for validation failures
  - Replaced with help text which serves as guidance rather than error messaging
  - Validation now always uses default error messages (consistent UX)
  - Removed from TEXT, EMAIL, TEXTAREA, PHONE, and DATE field config components
  - Removed `message` property from validation type definitions

### Changed

- Field configuration now focuses on validation rules only; guidance is provided separately via help text
- Embed validation errors use standardized messages without custom overrides

### Technical Details

- Database migration: `20260206162224_add_field_help_text`
- Updated field types: `BaseValidation`, `EmailValidation`, `DateValidation`, `PhoneValidation`
- Updated components: `field-editor-modal.tsx`, all field config components
- Updated embed: `embed/src/form.ts`, `embed/src/styles.ts`, `embed/src/validation.ts`

---

## [3.7.1] - 2026-02-02

### Added

- **Responsive sidebar layout**: Admin and operator consoles now have mobile-friendly navigation
  - Desktop (md+): Fixed sidebar remains on the left as before
  - Mobile (<md): Sidebar collapses into a hamburger menu that opens a left-sliding drawer
  - Added `ResponsiveSidebarLayout` component at `src/components/patterns/responsive-sidebar-layout.tsx`
  - Hamburger menu includes accessibility features: `aria-label` and tooltip
  - Drawer includes backdrop overlay and escape key support via Radix UI Sheet primitive

### Changed

- Refactored `src/app/(admin)/layout.tsx` to use `ResponsiveSidebarLayout`
- Refactored `src/app/operator/layout.tsx` to use `ResponsiveSidebarLayout`
- Main content padding is now responsive: `p-4` on mobile, `p-8` on desktop

### Documentation

- Added **Responsive Sidebar Layout** section to `docs/UX_PATTERNS.md` with usage examples and behavior documentation

---

## [3.7.0] - 2026-02-02

### Changed

- **Brand color system implementation**: Applied official Canopy Forms brand colors across the entire application
  - **Main Teal** (#005F6A): Primary buttons, links, headings, focus states, and brand emphasis
  - **Highlight Green** (#5FD48C): Success states, positive feedback, and CTAs
  - **Pop Coral** (#FF6B5A): Destructive actions, error states, warnings, and critical alerts
  - Updated CSS variables in `src/app/globals.css` using oklch color space for better color manipulation
  - Added new `--success` semantic color token with foreground variant
  - Updated all semantic token foregrounds (secondary, accent) to use brand colors
  - Updated embed script default colors in `embed/src/theme.ts` (primary now Main Teal)
  - Updated embed status colors in `embed/src/styles.ts` (success → Highlight Green, error → Pop Coral)
  - All color combinations meet WCAG AA accessibility standards

### Documentation

- Added comprehensive **Color System** section to `docs/UX_PATTERNS.md` with:
  - Brand color definitions and semantic usage guidelines
  - CSS variable documentation with oklch format examples
  - Semantic token reference table for Tailwind utilities
  - Component variant color mapping
  - Embed theme color documentation
  - Dark mode status and accessibility notes
- Updated `docs/AGENT_CONTEXT.md` UI/UX patterns section to reference color system
- Updated embed workflow documentation to mention color defaults and rebuild requirements

### Technical Details

- Light mode only: Dark mode CSS variables exist but have not been updated with brand colors
- Components automatically use new colors through semantic tokens (`bg-primary`, `text-destructive`, `bg-success`)
- No breaking changes to component APIs or class names
- Embed script rebuilt with new color defaults

---

## [3.6.1] - 2026-02-03

### Changed

- **Typography system refresh**: Switched from Geist Sans to Inter for body text and introduced Urbanist for headings/titles, improving brand consistency and readability across the admin interface.
  - Inter (body text, UI elements, descriptions) via `font-sans` Tailwind utility
  - Urbanist (headings, page titles, section labels) via new `font-heading` utility
  - Geist Mono retained for code blocks via `font-mono`
  - All fonts loaded via `next/font/google` with optimized self-hosting
  - Embed script typography unchanged (continues to use `inherit` for host site consistency)

### Documentation

- Added comprehensive Typography section to `docs/UX_PATTERNS.md` with guidelines on when to use `font-heading` vs default body font
- Updated `docs/AGENT_CONTEXT.md` UI/UX patterns to include typography rules
- Updated `docs/tools/tailwindcss-v4.md` with current typeface choices in project-specific notes

---

## [3.6.0] - 2026-02-02

### Changed

- **Official rebrand to Canopy Forms**: refreshed all UI copy, auth flows, transactional emails, docs, and marketing references to replace the legacy "Can-O-Forms" name.
- **Embed API naming**: the public script now exposes `window.CanopyForms`, expects `data-canopy-form`, and ships CSS classes/variables prefixed with `canopy-` so third-party embeds stay consistent with the new brand.
- **Admin integration panels**: code examples, previews, and dataset guards now emit the new attribute + domain, reducing copy/paste mistakes for newly issued forms.

### Infrastructure

- **Primary domain migration**: production traffic now flows through `forms.canopyds.com → canopy-forms:3000`; Docker Compose service names, Caddy routing, and Cloudflare Tunnel entries were updated in lockstep.
- **Developer ergonomics**: added a comprehensive `.dockerignore` plus `Dockerfile.dev`, shrinking build context from >1 GB to a few MB and restoring reliable `docker compose build`/hot reload workflows.

### Fixed

- Removed the last references to the deleted `Site` model (`queueEmailNotification`, `getOwnedSite`, `form.site`) that were breaking TypeScript builds after the form-first architecture change.
- Tightened field editor typings so `FieldDraft.validation` lines up with runtime data, unblocking production builds of the embed/editor bundle.

---

## [3.5.0] - 2026-02-01

### Changed - Form-First Architecture

**Major architectural refactor**: Removed the `Site` model in favor of a simpler, form-first approach.

#### Breaking Changes

- **API Routes**: Public endpoints changed from `/api/embed/[siteApiKey]/[formSlug]` to `/api/embed/[formId]`
  - Embed endpoint: `/api/embed/{formId}` (GET for schema, POST for submission)
  - Submit endpoint: `/api/submit/{formId}` (POST only)
  - Single-field endpoint: `/api/submit/{formId}/{fieldName}` (POST only)
- **Embed Script**: `data-canopy-form` attribute now expects `formId` instead of `slug`
  - **Before**: `<div data-canopy-form="contact" data-site-key="abc123">`
  - **After**: `<div data-canopy-form="cmkoh11z300010l1riqmz051xw">`
  - Removed `data-site-key` and `data-api-key` attributes (no longer needed)
- **Database Schema**:
  - Removed `Site` table entirely
  - Added `allowedOrigins` (string array) to `Form` model
  - Changed slug uniqueness from `[siteId, slug]` to `[accountId, slug]`
  - Existing site domains automatically migrated to form `allowedOrigins`

#### Added

- **Per-Form Origin Management**: Each form now has its own `allowedOrigins` array
  - Configure in Behavior section of form editor
  - Add/remove multiple allowed domains per form
  - Localhost automatically allowed for development
  - Dashboard origin automatically allowed for preview
- **Simplified Form Creation**: No need to select a site when creating forms
- **Direct Form URLs**: Forms are now accessed by stable `formId` instead of site+slug combination

#### Removed

- Site management UI (Settings > Sites page)
- Site selector in form editor
- Site column in forms list
- `moveFormToSite` action
- All site-related data access functions
- `proxy.ts` (no longer needed)

#### Technical Changes

- Updated `validateOrigin()` to accept `string[]` instead of single domain
- Updated `handlePublicSubmit()` to lookup by `formId` and validate against `allowedOrigins`
- Simplified data access layer (`src/lib/data-access/forms.ts`)
- Removed site parameter from email notification functions
- Updated form actions: removed `moveFormToSite`, updated `createForm`
- Regenerated Prisma client with new schema
- Updated all integration snippets to use `formId`

#### Migration

All existing forms were automatically migrated during schema update:
- Site domains copied to form `allowedOrigins`
- Form slugs preserved (now unique per account instead of per site)
- No data loss - all submissions and fields preserved

### Benefits

- **Simpler mental model**: Forms are self-contained units
- **Less cognitive overhead**: No need to manage Sites separately
- **More flexible**: Each form can have multiple allowed origins
- **Cleaner URLs**: Form IDs are stable and unambiguous
- **Better UX**: Configure everything about a form in one place

---

## [3.1.0] - 2026-01-28

### Changed

- **Simplified Field Creation UX**: Field editor now uses Google Forms-style approach
  - Users only enter the field **Label** (e.g., "Email Address")
  - System automatically generates stable internal key (e.g., `email_address`)
  - Internal keys remain immutable after creation for API/submission stability
  - Edit mode displays the internal key as read-only reference
  - Automatic uniqueness handling with numeric suffixes when needed (email, email_2, etc.)
  - Reduces user confusion by eliminating dual "Field Name" and "Label" inputs

- **HTML5 Native Validation**: Embed script validation UI migrated to use native browser popups
  - All validation errors displayed via `setCustomValidity()` and `reportValidity()` APIs
  - Shows one error at a time with automatic focus on invalid field
  - Validation state clears automatically when user starts typing
  - Consistent visual appearance across all validation types (required, email, custom rules)
  - Inline error text hidden visually but preserved for screen readers (accessibility)
  - Updated default email validation message: "Please enter a valid email address"
  - Special handling for composite NAME fields to show popups on visible inputs

### Technical Changes

- Added `slugify()` utility function in `src/lib/utils.ts`
- Updated `FieldInput` and `FieldDraft` types to make `name` optional
- Modified `createField()` to auto-generate unique names from labels
- Modified `updateField()` to never update the `name` field (immutable after creation)
- Simplified field editor modal UI in `src/components/field-editor-modal.tsx`
- No database schema changes required (existing `Field.name` column reused)
- Updated `showErrors()` method in `embed/src/form.ts` to use HTML5 Constraint Validation API
- Added input event listeners to clear validation state on all input types
- Modified `.canopy-error` CSS to screen-reader-only (positioned absolutely, clipped)
- Updated status message to show error count: "Please fix N field(s) to continue."

---

## [3.0.0] - 2026-01-24

🎉 **v3.0.0 Release - Complete Platform** 🎉

All v3 epics successfully implemented. Canopy Forms is now a complete, production-ready SaaS forms platform.

### Added

- **Admin Console (Epic 6)**: Operator-only interface for account management with privacy-first design
  - New `(operator)` route group at `/operator/accounts` for platform operator console
  - List all accounts with metadata only (email, created_at, last_login_at, forms_count, submissions_count)
  - Hybrid delete for accounts: purges all content, clears password, marks tombstone with `deletedAt` timestamp
  - `requireOperator()` auth helper checks session email against `ADMIN_EMAIL` env var
  - Self-deletion prevention (operator cannot delete own account)
  - Account metadata query layer in `src/lib/data-access/accounts.ts` with explicit privacy safeguards
  - Delete account server action in `src/actions/accounts.ts` with operator verification

### Database Changes

- Added `deletedAt` timestamp field to `accounts` table for tombstone records
- Migration: `20260124175411_epic_6_admin_console`

### Privacy & Security

- Operator console uses metadata-only queries with explicit `select` statements
- No form content, submission data, or field definitions ever exposed in operator interface
- Counts computed via Prisma aggregation (`_count`, `groupBy`) without loading content
- Operator access enforced at layout level and in server actions
- Non-operators redirected to `/forms` when attempting to access operator routes

### Technical Details

- Operator identification via `ADMIN_EMAIL` environment variable (no schema changes for roles)
- Reuses existing UI patterns: `PageHeader`, `DataTable`, `ConfirmDialog`
- Client component for delete action uses `useTransition` for loading states
- Toast notifications for operation feedback
- Account scoping maintained across all operator operations
- See [docs/epics/epic-6-admin-console.md](docs/epics/epic-6-admin-console.md) for full implementation details

### Completion

🎉 **v3.0.0 Release!** All 7 epics (Epic 0 through Epic 6) have been successfully implemented. The v3 platform is complete and production-ready.

---

## [2.6.0] - 2026-01-24

### Added

- **Submission Review & Export (Epic 5)**: JSON export support for submissions
  - Added JSON export format option to submissions export route
  - Export route now accepts `?format=json` query parameter (defaults to `csv`)
  - JSON exports include stable structure: id, createdAt (ISO 8601), status, isSpam, data, and meta
  - Updated submissions page UI with export format dropdown menu (CSV and JSON options)
  - Both export formats maintain identical account-scoped security

### Changed

- Replaced single "Export CSV" button with dropdown menu for format selection
- Export filenames now include date string for both CSV and JSON formats
- Export route refactored to handle multiple formats with shared authentication flow

### Technical Details

- No breaking changes to existing CSV export functionality
- Account scoping enforced via `getCurrentAccountId()` and `getOwnedForm()` for both formats
- Export data structure remains consistent with database schema
- See [docs/epics/epic-5-submission-review-export.md](docs/epics/epic-5-submission-review-export.md) for full implementation details

---

## [2.5.0] - 2026-01-24

### Added

- **Submission Events & Email Notifications (Epic 4)**: Per-form email notification toggle for account owners
  - Added `emailNotificationsEnabled` boolean field to Form model (defaults to false)
  - New `sendNewSubmissionNotification()` function sends minimal emails (form name, timestamp, dashboard link only)
  - Account owner's email automatically looked up and used as recipient
  - Notifications fire after successful submission persistence (event hook pattern)
  - No submission field values included in emails (privacy-focused)
  - Spam submissions do not trigger notifications
  - Graceful handling when SMTP not configured

### Changed

- Updated Behavior section UI with checkbox toggle for "Email me on new submission"
- Extended `updateFormBehavior()` server action to accept `emailNotificationsEnabled`
- Submission hook now triggers two notification paths: legacy `notifyEmails` array and new account owner notification

### Technical Details

- No breaking changes to existing functionality
- Existing `notifyEmails` array remains unchanged (for future custom recipient feature)
- Email sending uses fire-and-forget queue pattern (non-blocking)
- Direct function call for event trigger (no event bus, no background jobs)
- See [docs/epics/epic-4-submission-events-email-notifications.md](docs/epics/epic-4-submission-events-email-notifications.md) for full implementation details

---

## [2.4.0] - 2026-01-24

### Added

- **Submission Ingestion (Epic 3)**: Enhanced white-box submission support with payload size limits
  - Added 64KB maximum payload size limit for submission requests
  - Two-tier validation: Content-Length header check + actual payload verification
  - 413 status code for oversized submissions with clear error message
  - Protection applies to both `/api/submit` and `/api/embed` POST endpoints

### Technical Details

- No breaking changes to existing functionality
- Existing embed and manual submit endpoints continue working unchanged
- Payload limit enforced in shared `handlePublicSubmit()` function
- Fast rejection via Content-Length header before reading body
- See [docs/epics/epic-3-submission-ingestion.md](docs/epics/epic-3-submission-ingestion.md) for full implementation details

---

## [2.3.0] - 2026-01-24

### Added

- **Form Ownership & Metadata (Epic 2)**: Direct account-based ownership for forms and sites
  - Added `accountId` to `Form` and `Site` models (direct Account ownership)
  - Added `createdByUserId` to `Form` model (tracks form creator)
  - New `getCurrentAccountId()` helper in auth-utils for account-scoped operations
  - All form access now enforced via direct `accountId` checks (simplified from Site → User → Account chain)
  - Forms list, edit, submissions, and export all scoped to authenticated account
  - Site management scoped to authenticated account

### Changed

- Updated all data access helpers to use `accountId` instead of `site.userId` traversal
- Updated all form/site server actions to use `getCurrentAccountId()`
- Updated `/api/user/sites` to filter by `accountId`
- Form creation now automatically sets `accountId` and `createdByUserId`
- Site creation now automatically sets `accountId`

### Technical Details

- No breaking changes to existing functionality
- Public submission endpoints continue to work via `apiKey` (unchanged)
- Migration applied via manual SQL (hybrid Prisma 7 state)
- Existing forms and sites migrated to have `accountId` populated
- See [docs/epics/epic-2-form-ownership.md](docs/epics/epic-2-form-ownership.md) for full implementation details

---

## [2.2.0] - 2026-01-24

### Added

- **Account & Authentication (Epic 1)**: Self-service signup and password management
  - Self-service user signup via `/signup` page with automatic account creation
  - Password reset flow using email infrastructure (`/forgot-password` and `/reset-password`)
  - Login telemetry tracking (`lastLoginAt`, `failedLoginCount`, `lastFailedLoginAt`)
  - Internal `Account` model (one-to-one with `User` in v3)
  - Secure password reset tokens with 1-hour expiration and single-use enforcement
  - Enhanced login page with "Forgot password?" and "Create account" links
  - Generic error messages to prevent email enumeration attacks

### Changed

- Extended `User` model with `accountId` and auth telemetry fields
- Modified NextAuth `authorize()` callback to track login attempts and successes
- Updated seed script to create `Account` for admin user

### Technical Details

- No breaking changes to existing functionality
- All passwords remain bcrypt hashed with 10 rounds
- Password reset tokens are cryptographically secure (32 bytes random, hex encoded)
- See [docs/epics/epic-1-account-and-authentication.md](docs/epics/epic-1-account-and-authentication.md) for full implementation details

---

## [2.1.0] - 2026-01-24

### Added

- **Email Infrastructure (Epic 0)**: Core outbound email capability using SMTP via Nodemailer
  - Generic `sendEmail()` function for all system emails
  - `EmailOptions` interface for consistent email sending across the platform
  - Email verification script (`scripts/test-email.ts`) for testing SMTP configuration
  - Refactored submission notification system to use the new generic email function
  - Support for plain text and HTML email formats
  - Centralized SMTP configuration via environment variables

### Changed

- Refactored `sendSubmissionNotification()` to use the new generic `sendEmail()` function
- Consolidated email sending logic into a single code path

### Technical Details

- No breaking changes to existing functionality
- Submission notifications continue to work as before
- See [docs/epics/epic-0-email-infrastructure.md](docs/epics/epic-0-email-infrastructure.md) for full implementation details

---

## [2.0.0] - Prior Release

Previous v2 functionality (multi-tenant forms platform with embed support).

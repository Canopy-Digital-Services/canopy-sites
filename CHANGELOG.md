# Changelog

All notable changes to the Canopy portal (Canopy Forms, and from 5.0.0 the Canopy Sites portal) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.5.1] - 2026-10-18

### Fixed

- A change made through Quick Edit from a field in the Editor shows on the page as soon as its preview is ready, with the panel still open and the page where it was, instead of reloading from the top once the panel closed
- After Discard, the Editor and the demo preview show the published site instead of the discarded changes

## [5.5.0] - 2026-10-18

### Added

- The Editor is a working visual editor for the demo site (Epic 33, in progress): marked text, paragraphs, and prices edit in place on the site with a character count; other marked fields open Quick Edit scoped to that field; back, forward, a page picker, and desktop and phone views
- Unpublished changes, Discard, and Publish in the Canopy Sites top bar, whichever tab made the changes
- Site content contract v0.2.0: ids on every list entry, field addresses that survive reordering, field kinds and labels, site guide limits, and a migration from v0.1
- The site builder rebuilds each published site at its local midnight, so dated announcements appear and expire on time

### Changed

- Every edit, from the Editor or Quick Edit, goes into one draft per site: the last change to a field wins, undoing every change drops the draft, and a template change from Canopy carries the draft over instead of failing it
- Site builds use the site's time zone, so what's current on the build date follows the site's calendar
- The builder answers content reads from its own copy of the site, without fetching from GitHub each time

## [5.4.5] - 2026-10-17

### Changed

- Fonts for the admin UI and the curated font picker lists are self-hosted, so builds no longer depend on reaching Google Fonts
- Embedded and hosted forms load catalog fonts from Canopy instead of Google; fonts outside the catalog still load from Google

## [5.4.4] - 2026-10-17

### Fixed

- Sites-only pages (Stats, Editor, Quick Edit) show the Canopy Sites title and icon in the browser tab instead of Canopy Forms

## [5.4.3] - 2026-10-17

### Changed

- Site content contract v0.1.1: link fields accept only the characters a link needs
- The site builder installs a site's dependencies without running their install scripts, and no longer supports deploy keys (the repo-scoped token is the only way in)

### Fixed

- The demo's "not published yet" notice carries the same sandbox as every other `/demo` response

## [5.4.2] - 2026-10-16

### Changed

- Canopy Boy stands in the left margin beside Quick Edit on wide screens, and beside the title where there's no room

## [5.4.1] - 2026-10-16

### Changed

- **Editor and Quick Edit open faster**: the page appears at once, and the parts that wait on the site's content (page list, inspector) fill in behind placeholders
- Canopy Boy moves to the top of Quick Edit, beside the title

## [5.4.0] - 2026-10-16

### Changed

- **Quick Edit has its own tab** and is where Canopy Sites customers land after signing in

### Added

- **Editor**: a preview of the coming visual editor, showing the demo site with the content you'll be able to change in place outlined, a price mid-edit, and the details Canopy keeps locked. It doesn't save anything yet

## [5.3.1] - 2026-10-16

### Changed

- **Reset demo starts the demo over**: it also clears the demo site's change history and quick edit conversations, so the Editor no longer lists changes the reset removed

## [5.3.0] - 2026-10-16

Canopy Sites can edit a real site: quick edit, preview, publish, and Stats, first for the sales demo (Epic 30).

### Added

- **Quick edit**: Canopy Sites customers describe a change in plain language on the Editor ("Raise the haircut price to $90") and get a private preview. Nothing goes live until they click Publish. Locked fields (contact details) and anything that would break the site are refused with a reason
- **Editor**: the site's pages, the change waiting for review with Preview, Publish, and Discard, and recently published changes
- **Stats**: visitors, pageviews, top pages, and referrers for the last 7, 30, or 90 days. The demo site shows labeled sample data; other sites show their stats once they are live
- **The demo site** at sites.canopyds.com/demo, on its own account, for sales calls and partners. Operators can build and publish a site from its repository, reset the demo to its starting point, and add a member to an account

## [5.2.1] - 2026-10-16

### Changed

- **Three plans: Free, Unlimited, and Sites.** Unlimited is the former Paid plan. The Hosting and Unlocked plans are retired and their accounts moved to Unlimited, which keeps every limit they had. Promoting a user to Global Admin now moves a plan with a form limit to Unlimited. Comped and sandbox accounts are marked with their billing status and reference, not a plan

## [5.2.0] - 2026-10-16

Canopy Sites accounts get a real site, and each product gets its own address (Epic 29).

### Added

- **Sites**: operators create a site for an account on the new Sites plan from a Sites page in the operator console, and record its repository, branch, contract version, production hostnames, locked fields, quick-edit overlay, and Umami website. One site per account. Creating a site makes no repository, DNS record, or Umami website
- **Sites plan**: Canopy Sites plus unlimited published forms, assigned by operators only
- The **Editor** shows the account's site
- **Go to Canopy Sites**: a Canopy Sites customer who signs in at forms.canopyds.com gets a button that signs them in to their Sites dashboard, without entering the password again

### Changed

- **Each account lives at its own product's address**: Canopy Forms customers at forms.canopyds.com, Canopy Sites customers at sites.canopyds.com. A Forms customer signing in at the Sites address is told where to sign in, signup is at the Forms address, and a signed-in page at the other address moves you to yours
- **Unlocked no longer includes Canopy Sites**; it means no Forms limits. Promoting a user to Global Admin, in the console or through `ADMIN_EMAIL` at startup, moves their account to Unlocked only from a plan with a form limit
- An account that has a website cannot be deleted from Account settings (contact support) or by an operator until its site moves to another account, and cannot move to a plan without Sites

## [5.1.0] - 2026-10-16

Accounts and sign-in rebuilt for Canopy Sites (Epic 28). **Everyone is signed out once by this release** and signs in again as usual.

### Added

- **Memberships**: users reach their account through a membership (owner or member), so an account can later have more than one person. Every existing user became their account's owner
- **Account billing status** (Active, Past due, Cancelled) and a billing reference, set by operators with a new Billing action on the accounts page
- **Sign-in protection**: after five failed sign-ins for an email address, sign-in for it pauses for 15 minutes; signup, password reset requests, and password changes are limited the same way
- Security headers: HSTS, no MIME sniffing, a strict referrer policy, and no framing of the sign-in, admin, and operator pages (hosted forms and the embed are unaffected)

### Changed

- **Sessions are stored server-side** instead of in a self-contained cookie, replacing NextAuth. Signing out, changing or resetting a password, and deleting an account end sessions immediately everywhere; an active session now stays signed in instead of ending 4 hours after sign-in (7 days with "Keep me signed in")
- **Changing your password keeps you signed in** on the browser you changed it in, and signs you out everywhere else
- **Passwords are hashed with scrypt**; existing passwords upgrade on the next sign-in. Passwords are 8 to 128 characters
- **Password reset links**: only the newest link works, each works once, and a reset signs you out on every device
- Role changes take effect on the user's next page load instead of their next sign-in
- `NEXTAUTH_SECRET` and `AUTH_TRUST_HOST` are no longer used

### Fixed

- An expired session can no longer leave the login page bouncing between `/login` and `/forms`
- Rate limits used a client-supplied header for the client IP, so they could be bypassed; they now use the address Cloudflare reports
- Rate limit windows longer than five minutes were silently cut to five
- Deleting a user no longer deletes the forms they created; the forms stay with the account
- The operator accounts page no longer runs one query per account

## [5.0.0] - 2026-10-15

One codebase now serves Canopy Forms and the Canopy Sites client portal (Epic 27). Forms-only accounts see no change on either hostname.

### Added

- **Canopy Sites chrome**: accounts with Canopy Sites get the Canopy Sites wordmark and an Editor · Forms · Stats nav on any hostname, with `/editor` as home. Editor and Stats are placeholders until later epics fill them
- **`sites.canopyds.com`**: same app as `forms.canopyds.com`; login, signup, and password reset pages show Canopy Sites branding there
- **Live field preview** in the field editor for Name fields, rendered through the embed with the form's live theme
- Embed `fieldsOnly` render option (fields without header, Submit button, or watermark)

### Changed

- **Repository restructured** into npm workspaces with the app in `apps/portal/`; the GitHub repo is now `Canopy-Digital-Services/canopy-sites`. Docker builds use the repo root as context and `apps/portal/Dockerfile`
- Local dev containers renamed to `canopy-portal` and `canopy-portal-db` (port 3006 unchanged)
- `docker-compose.yml` requires `NEXTAUTH_SECRET` from the environment instead of a committed value

### Fixed

- **Emails to Canopy Sites accounts**: password-reset links open on the Sites host and the email says Canopy Sites; submission notification "View in dashboard" links open on the Sites host, where the client is already signed in. New optional `SITES_URL` setting
- **Email matching**: login, signup, and password reset now trim and lowercase the email, so a capitalized or autofilled address no longer fails login or silently skips the reset email
- Signing out or deleting an account from a non-Forms hostname no longer lands on the Forms host's login page
- An expired session no longer counts as signed in on `/` and the auth pages

## [4.14.1] - 2026-10-14

### Fixed

- **Low-resolution form thumbnails**: thumbnails captured before 4.14.0 stayed low resolution because they only refreshed after an edit. The editor now recaptures once when a form is opened
- **Stale thumbnails on the forms list**: the thumbnail route served a cached image for up to six minutes after a recapture. It now revalidates with an ETag, so a new capture shows immediately

## [4.14.0] - 2026-10-14

### Added

- **Step-by-step editor**: the Edit tab shows one section at a time (Header, Fields, Appearance, Submission Settings) with progress dots and Back/Continue, ending on a card that links to Publish. Autosave means moving between steps needs no save action
- **Help menu split into docs, support, and feedback**: "Help with this page", "Browse documentation", "Contact support", and "Give feedback". Support messages carry an editable Reply-To prefilled from the session
  - New optional `SUPPORT_RECIPIENT_EMAIL`, falling back to `FEEDBACK_RECIPIENT_EMAIL`
  - Rate limiting is keyed per message kind, so feedback can't lock out a support request
- **Submission filters**: status and spam filters merged into one row, plus a **Mark all as read** bulk action
- **Embed watermark**: "Powered by Canopy Forms" footer with a prefilled "Report an issue" link
- **ZIP validation** on Address fields (5 digits or ZIP+4)
- Dropdowns accept a new options shape (`{ options, allowOther }`) alongside the legacy array; membership is not enforced when `allowOther` is set

### Changed

- **Design system unification**: one 2px radius token, consolidated neutrals, a 4-level shadow scale, tinted-pill badges, and a single type scale (page titles 30, card and dialog titles 22). Hardcoded palette colors replaced with semantic tokens
- **Brand teal corrected**: `--primary` and related tokens now reference the `#005F6A` hex directly. The previous oklch approximation rendered as `#004e4e`
- **Motion**: shared flow-motion tokens drive dialog and editor transitions; dialogs now rise from below instead of zooming. Shortened rather than removed under `prefers-reduced-motion`
- Form card thumbnails are captured at higher resolution
- Removed descriptions that only restated their titles

### Accessibility

- Auth forms link errors to inputs with `aria-describedby`, announce errors and success via `role=alert`/`role=status`, and set `autocomplete` so password managers update saved credentials
- Embed: errors announced immediately, `aria-required` on required inputs, Name and Address grouped with `role=group`, decorative asterisks hidden from screen readers
- Admin: labelled icon-only buttons, linked field-type label, no nested link/button elements

### Removed

- Unused `noFuture`, `noPast`, `normalize`, and `message` validation keys from public submit and the embed runtime

### Security

- Support Reply-To addresses are re-validated server-side and CR/LF is rejected, preventing SMTP header injection

## [4.13.0] - 2026-07-24

### Added

- **Full-Response Email Notifications (Epic 26)**: notification emails can now carry the submitted values, for recipients who never sign in to the dashboard
  - New `Form.emailIncludeResponses` flag with an **Include responses in the email** checkbox under Edit → Submission Settings → Email notifications. Per form, off by default
  - When on, the email lists every field in form order with what the visitor entered, as plain text and as an HTML table. Empty optional fields show as `(blank)`; the honeypot field is never shown
  - When on, `Reply-To` is set to the submitter's address (first EMAIL field with a valid value), so recipients can reply to the visitor directly from the notification
  - New `src/lib/submission-email.ts` owns notification content; `src/lib/email.ts` remains transport

### Changed

- **Dashboard link is now per recipient**: only recipients who are users on the form's account get the "View in dashboard" link. Other addresses in `notifyEmails[]` have no account to sign in to, so the link was a dead end for them
- **Default notification is unchanged**: with the new flag off, the email is byte-identical to the metadata-only body from Epic 4. Existing forms keep that behavior
- Value formatting shared between the submissions preview and the new email renderer via `formatFieldValue()` in `src/lib/composite-format.ts`; email validation shared via `isValidEmail()` in `src/lib/validation.ts`

### Security

- `Reply-To` candidates are re-validated instead of trusted, and CR/LF is rejected, so a submitted value can't inject additional SMTP headers. This matters for `/api/submit/[formId]/[fieldName]`, which only validates that required fields are present
- Labels and values are HTML-escaped in the HTML part of the email

## [4.12.0] - 2026-04-29

### Added

- **Form Type Selection (Epic 25)**: Forms now declare their delivery surface up front and the editor tailors itself to the choice
  - New `FormType` enum (`HOSTED` | `EMBEDDED`) on the `Form` model. Locked at form creation; not user-editable after
  - `/forms/new` adds a two-card type chooser between the name input and Create button. Create is disabled until both name and type are set. Globe icon for hosted, AppWindow for embedded
  - Migration backfill: existing forms with `published=true` and empty `allowedOrigins` become HOSTED; everything else becomes EMBEDDED
  - Editor preview is locked to type — no more Embed/Page tab toggle. Hosted forms preview as the page; embedded forms preview as the embed
  - Appearance → Page subsection only renders for hosted forms (page background, card wrapper, content width, vertical alignment)
  - Font picker hides "Inherit from host page" for hosted forms (no host page to inherit from); shown for embedded forms as before
  - Publish tab branches by type: hosted forms see only the Share Link card, embedded forms see Allowed Origins and the Embed snippet
  - Form list cards show a "Hosted" or "Embedded" badge alongside Published/Draft

### Changed

- **Embed API and submit API gate on type**: `GET/POST /api/embed/[formId]` and `POST /api/submit/[formId]` reject HOSTED forms with `403 { code: "FORM_HOSTED_ONLY" }`. The embed script renders a dedicated "Form is only available at its hosted URL" message for this code, mirroring the existing `FORM_INACTIVE` flow
- **Hosted page gates on type**: `/f/[formId]` returns the existing "Form Not Available" page (200) for EMBEDDED-type forms, matching the unpublished-form behavior

## [4.11.0] - 2026-04-21

### Added

- **Account Plans & Entitlements (Epic 23)**: Licensing foundation with a plan catalog and a `maxPublishedForms` entitlement per plan
  - New `Plan` table seeded with `FREE` (1), `HOSTING` (10), `PAID` (unlimited), and `UNLOCKED` (unlimited, operator-granted only; non-public). `HOSTING` and `PAID` are placeholders until billing ships
  - `Account.planCode` FK defaulted to `FREE`; `Account.requiresPlanResolution` flag drives the blocking dialog
  - `getAccountEntitlements` is the single source of truth for every plan check; publishing, admin UI, and operator console all funnel through it
  - Publishing a form is gated: `toggleFormPublished` throws `PlanLimitError` when at cap, `PlanResolutionRequiredError` when mid-resolution. Unpublishing is never gated
  - Operator console gains a Plan column and a Change-Plan modal (`ChangePlanButton`) with a destructive warning when a downgrade would exceed the account's current published-form count
  - When a plan change drops the cap below the live count, `setAccountPlan` unpublishes all of the account's forms in a transaction and flips `requiresPlanResolution = true`
  - Admin layout intercepts every route with `PlanResolutionDialog` when resolution is pending. User picks up to the new cap or chooses "Keep everything as draft"; `resolvePlan` republishes the selection and clears the flag atomically
  - Account dashboard shows the current plan and a "Published forms: N of M" usage line
  - Backfill grandfathers any existing account running more than 1 published form to `UNLOCKED` so the migration never retroactively locks anyone out
  - Signup continues to create accounts on `FREE`; freshly seeded admin accounts default to `UNLOCKED`

### Fixed

- **Ingestion gate (Epic 23 prereq)**: `Form.published` now gates `/api/embed/[formId]` GET/POST and `/api/submit/[formId]` POST (previously only the hosted `/f/[formId]` page respected it). Unpublished forms return 403 with `{ error, code: "FORM_INACTIVE" }`; the embed script detects the code and renders a dedicated "Form Not Available" block matching the hosted page copy

---

## [4.10.0] - 2026-04-20

### Added

- **Notification Bell (Epic 22)**: Top-nav bell icon surfaces in-app notifications for events on the user's forms
  - New submissions stack per form (count increments on each non-spam submission); click-through navigates to the form's submissions page
  - Submission-limit hits fire once per form+type and dedupe via upsert (`LIMIT_MAX_REACHED`, `LIMIT_DEADLINE_REACHED`)
  - Dismiss-on-interaction model: clicking a row (or "Clear all") deletes the notification permanently — no read/unread state, no history
  - Badge count caps at "9+"; dropdown polls every 60s while the tab is visible and refetches on route change
  - Bell fires independently of email notification settings (separate systems)
  - New `Notification` table keyed on `@@unique([accountId, formId, type])`; cascades on Account or Form delete

---

## [4.9.0] - 2026-03-04

### Added

- **Appearance Editor Refactor (Epic 19)**: Restructured appearance editor from two-level collapse into 4 always-visible collapsed groups (Page, Colors, Layout, Text) with summary chips
  - New `pageBackground` theme token for hosted form page background color
  - Hosted pages at `/f/[formId]` respect `pageBackground` with fallback to default gray
  - Title Color moved to Colors group; Button Width/Alignment moved to Layout group
  - Title, Labels, and Button Text consolidated under Text group with separator sub-areas
  - `ThemeTokens` type split into `ThemeDefaults` + `ThemeOverrides` for easier token management

---

## [4.8.0] - 2026-03-04

### Added

- **Hosted Forms (Epic 18)**: Public form pages at `/f/[formId]` — shareable links that render forms directly on the Canopy domain without embedding
  - Forms must be explicitly published via the editor's Publish button
  - Published forms get OpenGraph metadata for rich link previews
  - Unpublished forms show a branded "Form Not Available" page
  - "Powered by Canopy Forms" footer branding on hosted pages
  - Hosted URL shown in Integrate panel when published
- **Publish/Unpublish toggle** in the form editor header bar
- `published` field on Form model (defaults to `false`)

### Fixed

- Embed script `handleSubmit` and `fetchDefinition` now fall back to `formDefinition.formId` when `options.formId` is undefined, fixing submissions from admin preview and hosted pages

---

## [4.7.1] - 2026-02-28

### Removed

- **HIDDEN field type**: Removed from the field type picker, schema, embed renderer, and all type definitions to simplify the MVP. Any existing HIDDEN fields in the database are migrated to TEXT.

### Fixed

- Removed several unused imports and variable bindings flagged by ESLint (`redirect` in `auth.ts`, `getOwnedForm` in `forms.ts`, `getCurrentUserId` in multiple pages, `Input` in reset-password page, unused `err` catch bindings)
- Escaped unescaped apostrophes in JSX text in `forgot-password/page.tsx` and `login/page.tsx`
- Added `eslint-disable` comment on brand SVG `<img>` in login page (not a candidate for Next.js image optimization)
- Replaced `any` types in submissions pages/routes with `SubmissionStatus`, `Record<string, unknown>`, and specific meta types
- Refactored `docs/[slug]/page.tsx` and `docs/page.tsx` to avoid returning JSX from inside `try/catch` blocks (`react-hooks/error-boundaries` rule)

---

## [4.7.0] - 2026-02-27

### Added

- **Checkboxes Multi-Select Field Type (Epic 15)**: New `CHECKBOXES` field type for selecting one or more options from a list
  - Config panel with add/edit/reorder/delete options (mirrors Dropdown pattern, uses `SortableList` drag-and-drop)
  - Embed renders vertical list of checkboxes with clickable labels
  - Submission data stored as `string[]` of selected option values
  - Client-side validation: requires at least one selection when marked required
  - Server-side validation: rejects values not in the field's option list
  - Submission viewer displays selected options as comma-separated labels
- **Yes / No rename**: Existing boolean `CHECKBOX` field type relabeled from "Checkbox" to "Yes / No" in the builder field picker for clarity
  - Internal `CHECKBOX` enum value unchanged — no migration needed for existing forms
  - Submission viewer now displays "Yes" / "No" instead of raw `true` / `false`

### Changed

- **SELECT → DROPDOWN rename**: `FieldType.SELECT` renamed to `DROPDOWN` across schema, codebase, and embed
  - Prisma migration renames the enum value in-place
  - `select-config.tsx` renamed to `dropdown-config.tsx`
  - All type references, labels, and validation logic updated
  - Existing forms with SELECT fields automatically handled by migration
- **Email field config**: Fixed domain allow/block list textarea and improved UX
- **Date field config**: Rewritten with cleaner UI and validation

### Technical Details

- Database migrations: `20250224000000_rename_select_to_dropdown` and `20260227212114_add_checkboxes_field_type`
- New component: `src/components/field-config/checkboxes-config.tsx`
- Updated: `src/lib/field-types.ts` (CHECKBOXES + Yes/No labels), `embed/src/form.ts`, `embed/src/validation.ts`, `embed/src/styles.ts`, `src/lib/public-submit.ts`
- Embed rebuilt with new field type support
- No changes to existing CHECKBOX (Yes/No) behavior or data shape

---

## [4.6.0] - 2026-02-20

### Added

- **Self-Serve Account Deletion (Epic 14)**: Users can permanently delete their own account from the dashboard
  - `deleteSelfAccount()` server action using `prisma.account.delete()` with full cascade
  - Confirmation dialog with destructive styling and clear warning text
  - Post-deletion sign-out with redirect to `/login?deleted=1`
  - Login page displays "Your account has been deleted." banner after deletion
- **Account Operations documentation** (`docs/ACCOUNT_OPERATIONS.md`): comprehensive reference for account lifecycle, auth flows, JWT session management, deletion strategy, and future billing considerations

### Changed

- **Account deletion strategy: soft-delete → hard-delete** for both self-service and operator flows
  - `prisma.account.delete()` replaces the three-step hybrid-delete (purge forms, blank password, set tombstone)
  - Database `onDelete: Cascade` handles all related records: User, Forms, Fields, Submissions, PasswordResetTokens
  - Eliminates re-registration blocking, password-reset resurrection, and tombstoned-account login gaps
  - Operator `deleteAccount()` simplified to the same single-operation pattern

### Removed

- `deletedAt` column from Account model — tombstone no longer needed
- `deletedAt: null` filter from operator console account queries

### Technical Details

- Database migration: `20260220000000_drop_account_deleted_at`
- No new UI components — uses existing `ConfirmDialog` and `Button`
- `useTransition` for loading state during deletion
- Client-side `signOut()` from `next-auth/react` (not server-side) to avoid `NEXT_REDIRECT` issues in server actions

---

## [4.5.0] - 2026-02-20

### Added

- **Account Dashboard Scaffold (Epic 13)**: User account management surface
  - Interactive account popup menu on sidebar footer with "Manage Account" and "Sign Out"
  - `/account` dashboard page with email display, password change form, and placeholder delete section
  - `signOutAction()` server action for client component sign-out
  - `changePassword()` server action with current password verification and `passwordChangedAt` session invalidation
  - "Reward early, punish late" validation pattern on password change form

### Changed

- `UserAccountFooter` converted from static display to interactive `DropdownMenu` trigger with hover state and chevron indicator
- Removed standalone `SignOutButton` from admin and operator sidebar nav (replaced by account popup menu)

### Technical Details

- No schema changes — leverages Epic 12's `passwordChangedAt` mechanism
- `UserAccountFooter` is now a client component (`"use client"`)
- New files: `src/app/(admin)/account/page.tsx`, `src/components/account/account-dashboard.tsx`

---

## [4.4.0] - 2026-02-19

### Added

- **Session Management (Epic 12)**: Dual-timeout session policy with optional extended sessions
  - Default sessions: 4 hours idle / 7 days absolute
  - "Keep me signed in" sessions: 7 days idle / 30 days absolute
  - "Keep me signed in for 30 days" checkbox on login page (unchecked by default)
  - Password change invalidates all prior sessions within 5 minutes via `passwordChangedAt` DB check
  - `Checkbox` UI component added (`src/components/ui/checkbox.tsx`)
  - `passwordChangedAt DateTime?` field added to User model

### Technical Details

- JWT callbacks enforce `expiresAt` (rolling idle) and `absoluteExpiresAt` (fixed ceiling)
- `session.maxAge` = 30 days (cookie ceiling); `session.updateAge` = 5 minutes (re-sign frequency)
- Every 5 minutes, JWT callback queries DB to compare `passwordChangedAt` vs `sessionIssuedAt`
- Expired tokens have identity claims stripped; `requireAuth()` checks `!session.user.id`
- JWT strategy retained — no switch to database sessions

---

## [4.3.0] - 2026-02-18

### Added

- **Enhanced Appearance Controls (Epic 11)**: Granular title and label styling with collapsible subsections
  - **Title Style subsection**: Size (S/M/L/XL), Weight (Regular/Semibold/Bold), Color (hex + color picker)
  - **Labels subsection**: Weight (Normal/Medium/Semibold), Transform (Normal/Uppercase)
  - **Collapsible subsections**: Typography · Title Style · Labels · Submit Button — collapsed by default, with summary chips showing non-default values
  - **Always-visible globals**: Colors grid + Border Radius/Density row remain at top of the card
  - New CSS variables: `--canopy-title-size`, `--canopy-title-weight`, `--canopy-title-color`, `--canopy-label-weight`, `--canopy-label-transform`

### Changed

- **Appearance section layout**: Flat list replaced with organized collapsible subsections
  - Global controls (colors, radius, density) stay always-visible at top
  - Typography, Title Style, Labels, and Submit Button each collapse independently
  - Collapsed headers show summary chips for non-default values (e.g. font name, "UPPERCASE", size preset)
- **Embed styles** (`embed/src/styles.ts`): `.canopy-title` and `.canopy-label` updated to use new CSS variables with unchanged defaults

### Technical Details

- No schema migration — `defaultTheme` remains `Json?`; new fields are backward compatible (embed uses defaults when absent)
- `embed/src/theme.ts`: added 5 new `ThemeTokens` fields; `applyTheme()` sets 5 new CSS variables
- `src/components/forms/appearance-section.tsx`: added `SubSection` and `Chip` helper components defined locally

---

## [4.2.0] - 2026-02-18

### Added

- **Typography refactor (Epic 10)**: Body and Heading font selection with full Google Fonts support
  - Two independent font pickers in Appearance section: **Body Font** and **Heading Font**
  - Searchable combobox with 22 curated fonts shown by default; typing searches all 1,918 Google Fonts
  - **"Inherit from host page"** as a first-class option — no font CSS injected, form inherits from the embedding site
  - `src/lib/google-fonts.ts`: static font catalogue committed to repo (generated from Google Fonts API, sorted by popularity)
  - `scripts/fetch-google-fonts.ts`: regeneration script (`GOOGLE_FONTS_API_KEY=xxx tsx scripts/fetch-google-fonts.ts`)
  - `src/components/ui/font-picker.tsx`: reusable searchable font picker component (Radix Popover)

### Changed

- **Appearance section**: Font Family field replaced by Body Font + Heading Font pickers under a "Typography" subsection
  - Removed "Custom" font option and all manual font URL / font family text inputs
  - Saves `bodyFont` and `headingFont` as plain family name strings (e.g. `"Urbanist"`) — no URL stored
- **Embed font loading** (`embed/src/theme.ts`): rewrote font loading to be family-name-driven
  - `ensureFontsLoaded(families[])` replaces `ensureFontLoaded(url)` — builds one combined Google Fonts request for all selected families, deduplicated
  - `applyTheme()` now sets both `--canopy-font` (body) and `--canopy-heading-font` (heading) CSS variables
  - Legacy `fontFamily`/`fontUrl` keys still read as fallback for existing forms (backward compatible)
- **Embed styles** (`embed/src/styles.ts`): `--canopy-heading-font` variable added; applied to `.canopy-title`

### Technical Details

- New dependency: `@radix-ui/react-popover` (used by FontPicker)
- No schema migration — `defaultTheme` remains `Json?`; theme shape change is backward compatible
- Existing forms using old font format continue rendering correctly in embed until admin re-saves Appearance
- Font URL derivation: embed constructs Google Fonts URL from family names at runtime with `wght@400;500;600;700&display=swap`

---

## [4.1.6] - 2026-02-17

### Added

- **Form Title & Description (Epic 9)**: Optional header content rendered above form fields in the embed
  - New `title` (max 120 chars) and `description` (max 400 chars) nullable fields on the `Form` model
  - New **Header** section in the form editor above Fields — always expanded, no collapse
  - Debounced autosave with saving/saved status indicator (title and description save independently)
  - Embed renders `<h2 class="canopy-title">` and `<p class="canopy-description">` above fields when set
  - Empty strings treated as null — no blank space rendered when fields are unset
  - New `updateFormHeader()` server action with ownership check and server-side length enforcement
  - Fully backward compatible — existing forms without values render unchanged

### Technical Details

- Database migration: `20260217000000_add_form_title_description`
- New component: `src/components/forms/header-section.tsx`
- Updated: `src/actions/forms.ts` (`updateFormHeader`), embed API GET response, `embed/src/form.ts`, `embed/src/styles.ts`

---

## [4.1.5] - 2026-02-17

### Changed

- **Submission Settings reorganization (Epic 8)**: Renamed "After Submission" → "Submission Settings" and restructured into three clear subsections
  - **After Submission**: Message / Redirect toggle now uses a Tabs component (replaces radio buttons)
  - **Notifications**: Email notification toggle and recipient list (unchanged functionality)
  - **Access & Limits**: Allowed Origins and submission limits (stopAt, maxSubmissions) consolidated here
  - Section description: "Control responses, notifications, and access"
  - Allowed Origins moved from a standalone section into Submission Settings → Access & Limits

### Technical Details

- No database migration — purely a UI reorganization
- Updated component: `src/components/forms/after-submission-section.tsx`
- Radio group replaced with `Tabs` for the message/redirect choice (uses existing `@radix-ui/react-tabs`)

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

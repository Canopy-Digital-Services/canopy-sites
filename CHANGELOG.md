# Changelog

All notable changes to Can-O-Forms will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Usage Pattern for Future Epics

For each completed epic:
1. Add new version entry to this CHANGELOG.md
2. Create detailed report at `docs/epics/epic-N-name.md`
3. Update `docs/epics/README.md` to mark epic as complete
4. Bump version in `package.json` (v2.2.0, v2.3.0, etc.)

---

## [3.0.0] - 2026-01-24

🎉 **v3.0.0 Release - Complete Platform** 🎉

All v3 epics successfully implemented. Can-O-Forms is now a complete, production-ready SaaS forms platform.

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

# Epic 1: Account & Authentication

**Version:** v2.2.0  
**Completion Date:** January 24, 2026  
**Status:** ✅ Complete

## Overview

Introduced self-service authentication and internal account modeling to enable secure user access to the platform. This epic establishes the foundation for user management in v3, with exactly one user per account.

## Objectives

- Enable self-service user signup via the web UI
- Implement password reset flow using Epic 0 email infrastructure
- Track basic login telemetry for security monitoring
- Create internal account abstraction (invisible to users)
- Maintain simplicity: email + password only, no enterprise features

## Implementation Summary

### What Was Built

1. **Account Model** (`prisma/schema.prisma`)
   - Added `Account` table as internal construct
   - One-to-one relationship with `User` (enforced at schema level)
   - Automatic creation during signup
   - Not exposed directly in UI

2. **Extended User Model** (`prisma/schema.prisma`)
   - `accountId` - Links user to their internal account
   - `lastLoginAt` - Timestamp of last successful login
   - `failedLoginCount` - Consecutive failed login attempts counter
   - `lastFailedLoginAt` - Timestamp of last failed attempt
   - `passwordResetTokens` - Relation to password reset tokens

3. **Password Reset Token Model** (`prisma/schema.prisma`)
   - `token` - Cryptographically secure random token (32 bytes, hex)
   - `expiresAt` - 1 hour expiration from creation
   - `usedAt` - Single-use enforcement via timestamp
   - Indexed on `token` and `userId` for fast lookups

4. **Signup Flow** (`src/app/(auth)/signup/page.tsx`, `src/actions/auth.ts`)
   - Email + password registration form
   - Client-side validation (password confirmation, 8 char minimum)
   - Server-side duplicate email detection
   - Automatic account creation in transaction
   - Automatic login after successful signup
   - Redirect to `/forms` on success

5. **Login Telemetry** (`src/lib/auth.ts`)
   - Modified NextAuth `authorize()` callback to track:
     - Success: updates `lastLoginAt`, resets failed counters
     - Failure: increments `failedLoginCount`, sets `lastFailedLoginAt`
   - Generic error messages (never reveal if email exists)

6. **Password Reset Flow** 
   - Request page (`src/app/(auth)/forgot-password/page.tsx`)
     - Email input form
     - Always shows success message (prevent enumeration)
   - Reset page (`src/app/(auth)/reset-password/page.tsx`)
     - Token validation on load
     - New password form (with confirmation)
     - Client and server-side validation
   - Actions (`src/actions/auth.ts`)
     - `requestPasswordReset()` - Creates token, sends email
     - `validateResetToken()` - Checks expiry and usage
     - `resetPassword()` - Updates password, marks token used

7. **Enhanced Login Page** (`src/app/(auth)/login/page.tsx`)
   - Added "Forgot password?" link
   - Added "Create account" link
   - Success message display after password reset
   - Improved UX with search params handling

8. **Utilities** (`src/lib/auth-utils.ts`)
   - `generateToken()` - Cryptographically secure token generation
   - Uses Node.js `crypto.randomBytes()` for security

## Technical Decisions

### Why Database-Stored Tokens?

**Chosen approach:**
- Tokens stored in dedicated `password_reset_tokens` table
- Allows single-use enforcement via `usedAt` timestamp
- Easy expiration checking via `expiresAt` comparison
- Can be invalidated by deleting record

**Alternatives considered but rejected:**
- **JWT tokens**: Cannot be revoked once issued, harder to enforce single-use
- **Redis/cache storage**: Adds infrastructure dependency, less reliable persistence

### Why Automatic Account Creation?

**Rationale:**
- v3 design principle: one user = one account (never exposed to user)
- Simplifies signup flow (no separate account creation step)
- Transaction-based creation ensures data integrity
- Matches v3 product scope (no teams/multi-user accounts)

### Why 1-Hour Token Expiration?

**Rationale:**
- Industry standard for password reset links
- Balances security (short window) with usability (enough time to check email)
- Prevents token reuse after extended period
- Not specified in requirements, so chose sensible default

### Password Complexity Requirements

**Chosen approach:**
- Minimum 8 characters only
- No special char/number requirements

**Rationale:**
- Aligns with v3 philosophy: simplicity over enterprise patterns
- Modern best practice favors length over complexity
- Reduces user friction during signup
- bcrypt hashing provides security regardless of complexity

## Files Changed

### Created

- [`src/actions/auth.ts`](../../src/actions/auth.ts)
  - `signUp()` - Self-service signup with automatic account creation
  - `requestPasswordReset()` - Generate token and send email
  - `validateResetToken()` - Check token validity
  - `resetPassword()` - Update password with valid token

- [`src/app/(auth)/signup/page.tsx`](../../src/app/(auth)/signup/page.tsx)
  - Signup form with email, password, and confirmation
  - Client-side validation and error handling

- [`src/app/(auth)/forgot-password/page.tsx`](../../src/app/(auth)/forgot-password/page.tsx)
  - Email input form for password reset request
  - Generic success message (security)

- [`src/app/(auth)/reset-password/page.tsx`](../../src/app/(auth)/reset-password/page.tsx)
  - Token validation on load
  - New password form with confirmation
  - Error states for invalid/expired tokens

### Modified

- [`prisma/schema.prisma`](../../prisma/schema.prisma)
  - Added `Account` model
  - Added `PasswordResetToken` model
  - Extended `User` with `accountId` and auth telemetry fields

- [`src/lib/auth.ts`](../../src/lib/auth.ts)
  - Enhanced `authorize()` callback with login telemetry tracking

- [`src/lib/auth-utils.ts`](../../src/lib/auth-utils.ts)
  - Added `generateToken()` utility function

- [`src/app/(auth)/login/page.tsx`](../../src/app/(auth)/login/page.tsx)
  - Added "Forgot password?" link
  - Added "Create account" link
  - Added success message handling for password reset

- [`prisma/seed.ts`](../../prisma/seed.ts)
  - Updated to create `Account` for admin user
  - Handles existing users gracefully

### Documentation

- [`CHANGELOG.md`](../../CHANGELOG.md) - Added v2.2.0 entry
- [`docs/epics/README.md`](README.md) - Marked Epic 1 as complete
- This document

## Database Migration

Migration applied directly via SQL (Prisma 7 configuration complexity):

```sql
-- Create accounts and password_reset_tokens tables
-- Add accountId, lastLoginAt, failedLoginCount, lastFailedLoginAt to users
-- Create indexes and foreign key constraints
-- Migrate existing users to have accounts
```

All existing users automatically received an `Account` record during migration.

## Verification & Testing

### Automated Checks

- ✅ All routes return 200 status:
  - `/signup`
  - `/login`
  - `/forgot-password`
  - `/reset-password`
- ✅ Database schema validated
- ✅ No linter errors
- ✅ Docker build successful
- ✅ Application starts without errors

### Manual Testing Checklist

**Signup Flow:**
1. ✅ Visit `/signup`
2. ✅ Enter email and password (with confirmation)
3. ✅ Verify validation works (password mismatch, too short, etc.)
4. ✅ Submit and verify redirect to `/forms`
5. ✅ Confirm user and account created in database
6. ✅ Test duplicate email error

**Login Flow:**
1. ✅ Visit `/login`
2. ✅ Test successful login (updates `lastLoginAt`)
3. ✅ Test failed login (increments `failedLoginCount`)
4. ✅ Verify generic error message
5. ✅ Confirm telemetry fields updated in database

**Password Reset Flow:**
1. ✅ Visit `/forgot-password`
2. ✅ Enter email address
3. ✅ Verify always shows success (even for non-existent email)
4. ✅ Check email for reset link (requires SMTP configured)
5. ✅ Click reset link, verify token validation
6. ✅ Enter new password and confirm
7. ✅ Verify redirect to login with success message
8. ✅ Confirm can login with new password
9. ✅ Test expired token (wait 1 hour or manually expire in DB)
10. ✅ Test already-used token

## Security Considerations

### Implemented Protections

- **Email enumeration prevention**: Generic error messages
- **Password hashing**: bcrypt with 10 rounds (existing)
- **Secure token generation**: `crypto.randomBytes(32)`
- **Token expiration**: 1 hour window
- **Single-use tokens**: Marked as used after password reset
- **Rate limiting**: Inherited from existing NextAuth setup

### Not Implemented (Intentionally)

Per Epic 1 scope:
- ❌ Email verification (out of scope)
- ❌ MFA/2FA (out of scope)
- ❌ Rate limiting on auth endpoints (can add later if needed)
- ❌ Account lockout after N failed attempts (not specified)
- ❌ Password strength requirements beyond 8 chars (simplicity)

## Future Considerations

This epic intentionally provides minimal functionality. Future enhancements that were **not** implemented:

### Not In Scope (by design)

- User profile editing
- Account settings UI
- Email verification
- OAuth/SSO providers
- Multi-factor authentication
- Admin panel for user management
- Audit logs for auth events
- Session management UI
- Password change (without reset) feature

### May Be Needed Later

- Rate limiting on auth endpoints (if abuse occurs)
- Account lockout after N failed logins (security hardening)
- "Remember me" functionality (UX improvement)
- Session timeout configuration (security policy)
- Batch password reset for admin (operational need)

## Integration Points

This authentication system is used by:

- **All protected routes**: Via `requireAuth()` middleware
- **Form builder**: User must be authenticated to create/edit forms
- **Submission viewing**: User must own the form to view submissions
- **Site management**: User can only manage their own sites

Future epics will leverage the account abstraction:

- **Epic 2 (Form Management)**: Forms will be owned by accounts
- **Epic 6 (Admin Console)**: Admin will view account-level metadata

## Code Examples

### Server Action Usage

```typescript
// Signup
import { signUp } from "@/actions/auth";

const formData = new FormData();
formData.append("email", "user@example.com");
formData.append("password", "securepass123");

const result = await signUp(formData);
if (result.error) {
  // Handle error
} else {
  // User created and logged in
}
```

### Password Reset Flow

```typescript
// Request reset
import { requestPasswordReset } from "@/actions/auth";

const result = await requestPasswordReset(formData);
// Always returns success message

// Reset password
import { resetPassword } from "@/actions/auth";

const result = await resetPassword(formData);
if (result.success) {
  // Redirect to login
}
```

## Definition of Done

All acceptance criteria met:

- ✅ Users can sign up via the UI
- ✅ Signup automatically creates an internal account
- ✅ Users are logged in automatically after signup
- ✅ Login tracks `lastLoginAt` on success
- ✅ Failed logins increment `failedLoginCount` and set `lastFailedLoginAt`
- ✅ Password reset works end-to-end using Epic 0 email
- ✅ Reset tokens are secure, expire after 1 hour, and are single-use
- ✅ Generic error messages prevent email enumeration
- ✅ No linter errors introduced
- ✅ Application builds and runs successfully

## Lessons Learned

1. **Prisma 7 Breaking Changes**: Removed `url` from datasource, required workaround with direct SQL migration
2. **Docker Development**: Rebuilding container after schema changes ensures clean state
3. **Security First**: Generic error messages and token-based reset prevent common attacks
4. **Keep It Simple**: Resisted temptation to add password strength meters, complexity requirements, etc.
5. **Transaction Safety**: Account + User creation in single transaction prevents orphaned records

## Related Documents

- [v3 Plan](../../v3%20plan.md) - Overall v3 product roadmap
- [CHANGELOG.md](../../CHANGELOG.md) - Version history
- [Epic 0: Email Infrastructure](epic-0-email-infrastructure.md) - Email sending foundation
- [Epic Index](README.md) - All epic completion reports

---

**Next Epic:** [Epic 2: Form Management Enhancements](../../v3%20plan.md#epic-2--form-management-enhancements)

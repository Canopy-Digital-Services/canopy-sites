# Account Operations & Session Management

How accounts, authentication, and sessions work in this project. **Read this before modifying any auth flow, account lifecycle code, or session behavior.**

---

## Table of Contents

1. [Account Model](#account-model)
2. [Account Creation (Signup)](#account-creation-signup)
3. [Authentication (Sign-in)](#authentication-sign-in)
4. [Session Management](#session-management)
5. [Password Change](#password-change)
6. [Password Reset](#password-reset)
7. [Account Deletion](#account-deletion)
8. [Operator Account Management](#operator-account-management)
9. [Billing](#billing)

---

## Account Model

The Account is the tenant boundary: forms, submissions, and fields belong to it. Users reach an account through a **Membership** (`OWNER` or `MEMBER`, Epic 28). v1 gives every user exactly one membership, as `OWNER`; `getSoleMembership` in `src/lib/data-access/memberships.ts` throws for more than one, and `getCurrentAccountId()` resolves through it.

```
Account (id, createdAt, planCode, ...)
  ├── Memberships[] (role) ──→ User (email, password?, roleCode, ...)
  │                               └── PasswordTokens[] (reset or claim)
  └── Forms[]
        ├── Fields[]
        └── Submissions[]
```

Deleting an Account cascades to its Memberships and Forms (and their Fields, Submissions, Notifications). It does **not** cascade to Users, so deletion goes through `deleteAccountAndSoleMembers`, which also deletes the users whose only membership it was.

### Key files

| File | Purpose |
|------|---------|
| `src/lib/session.ts` | Sessions: token generation, database validation and rolling, revocation, the cookie |
| `src/lib/auth-utils.ts` | `requireAuth()`, `getCurrentAccountId()`, `requireGlobalAdmin()`, password hashing |
| `src/actions/auth.ts` | Server actions: signup, sign-in, password change/reset, sign-out |
| `src/actions/accounts.ts` | Server actions: account deletion (self-service and operator) |
| `src/lib/data-access/memberships.ts` | Account resolution and account deletion |
| `src/lib/data-access/accounts.ts` | Operator console queries (metadata only) |

There is no auth library. Epic 28 replaced NextAuth with `src/lib/session.ts`; the reasons and the security assessment are in `docs/epics/epic-28-account-audit-membership.md`.

---

## Account Creation (Signup)

**Route:** `/signup`
**Action:** `signUp()` in `src/actions/auth.ts`

Flow:
1. Validate email format and password length (`passwordProblem` in `src/lib/password-policy.ts`: 8 to 128 characters)
2. Refuse if throttled; check for an existing user with the same email and reject if found
3. Hash the password (see Password storage)
4. Create User, Account, and an `OWNER` Membership in one write
5. Create a session and set the cookie

### Operator link (PRD D49)

A Sites client's account is made by the operator, not by signup: Operator → Sites → Link a site (`linkSite` in `src/actions/admin/sites.ts`, over `createLinkedSite` in `src/lib/site-link.ts`, which has no session of its own). One transaction creates the User with no password, an Account on `SITES`, its `OWNER` Membership, and the Site; the first Build and publish follows outside it, so a failed build leaves the account. An email that already has a user is refused, unless its account is on `SITES` with no site, which the form offers to link to instead. The owner sets a first password by claiming the account (below).

### Claim (PRD D49)

**Route:** `/claim?token=...` on the account's home host
**Code:** `src/lib/claim.ts`; actions `claimAccount()` and `resendClaimLink()` in `src/actions/claim.ts`, and the operator's `sendClaimLink()` in `src/actions/admin/claims.ts`

An owner with no password gets in through a claim link: a 32-byte token stored only as its SHA-256 in `password_reset_tokens` with `purpose = CLAIM`, good once for 7 days. The operator copies one from the site's Owner card to text it, or has the portal email it (`emailedAt`); Forgot password for an unclaimed owner emails one too (no `createdByUserId`). The link's host is `appUrlFor` on the account, never the request's. Any new link of either purpose retires the user's earlier unused ones by moving their expiry to now, so `usedAt` on a claim token always means the owner claimed with it.

Opening the page reads the token and consumes nothing, so a messaging app's link preview can't use it up. Setting the password consumes it with one conditional update (a claim token, unused, unexpired) and sets the password only where it is still null, in one transaction; then a "keep me signed in" session starts and `lastLoginAt` is set. An expired link offers to email a new one to the same address (`resendClaimLink`, under the reset throttle); a used one points to sign-in.

### Password storage

`src/lib/password.ts`. New hashes are scrypt, N=2^15, r=8, p=3 (OWASP's 32 MiB option, about 140 ms), stored as `scrypt$15$8$3$<salt>$<key>` so the parameters can be raised later. Hashes from before Epic 28 are bcrypt; they still verify, and a successful sign-in re-hashes them (`needsRehash`). scrypt does not truncate, unlike bcrypt's 72 bytes. Client components import the length limits from `password-policy.ts`, never `password.ts` (Node-only).

---

## Authentication (Sign-in)

**Route:** `/login`
**Action:** `signInAction()` in `src/actions/auth.ts`, called from the login page

Flow:
1. Refuse if throttled (below), before any lookup or password check
2. Look up the User by normalized email
3. Verify the password. An unknown email, and an owner who hasn't claimed their account (`password` null, PRD D49), are verified against a dummy hash so the response takes as long as for a real account
4. On failure (wrong password, unknown email, an unclaimed owner, or a user with no membership): increment `failedLoginCount`, set `lastFailedLoginAt`, return one generic error
5. On success: reset the failed count and the email's throttle, set `lastLoginAt`, create a new session, set the cookie
6. The client navigates to `/`, which resolves the account's home

### Throttling

`src/lib/auth-throttle.ts`, in memory (one container per environment; counts reset on deploy). Keys are the hashed client IP (`clientIPFromHeaders`: Cloudflare's `CF-Connecting-IP` first) and the normalized email or user id. The per-email limit applies to unregistered emails too, so it reveals nothing.

| Endpoint | Limit | When over |
|----------|-------|-----------|
| Sign-in | 5 failures per email, 20 attempts per IP, per 15 min | "Too many attempts" error, no password check |
| Signup | 5 per IP per hour | Same error |
| Reset request | 3 per email, 10 per IP, per hour | The usual generic success, and no email sent |
| Password change | 5 per user per 15 min | Same error |
| Claim (setting a first password) | 10 per IP per 15 min | Same error |

A throttle lets anyone lock an email out of sign-in for 15 minutes; that is the accepted cost of stopping password guessing.

Sign-in and sign-out are our own server actions with relative redirects. Sign-in on the host that is not the account's home (PRD D22; `docs/AGENT_CONTEXT.md` section 2) creates no session there. A Forms account gets `homeUrl`, which the login page links to. A Sites account gets a handoff: a random token whose SHA-256 is stored in `session_handoffs` with the target host, good once for two minutes. The login page's modal posts it (a native form POST, so the browser sends the Forms origin) to `/auth/handoff` on the Sites host, which refuses any other origin (no login CSRF), consumes the token with a conditional delete, and starts the session. Password change and reset drop pending handoffs along with sessions. Next rejects a server action whose `Origin` does not match the host, which is the CSRF defence for both.

---

## Session Management

Sessions are rows in the `sessions` table (`Session` model). The cookie holds a random 32-byte token; the row's id is the token's SHA-256, so the database never holds a usable token and there is no signing secret. The cookie is `HttpOnly`, `SameSite=Lax`, and on HTTPS `Secure` with the `__Host-` prefix (`__Host-canopy_session`; `canopy_session` on plain-HTTP local dev).

### Timeout policy

| Scenario | Idle timeout | Absolute timeout | Cookie |
|----------|-------------|-----------------|--------|
| Default session | 4 hours | 7 days | Ends when the browser closes |
| "Keep me signed in" | 7 days | 30 days | Expires at the absolute timeout |

- **Idle timeout** lives in the row (`expiresAt`) and rolls forward on each request, written at most once a minute and never past `absoluteExpiresAt`
- **Absolute timeout** (`absoluteExpiresAt`) never moves
- An expired row is deleted the next time its token is presented

### Per-request validation

`getSession()` (memoized per request with React `cache`) reads the cookie and runs one query: the session row with its user's id, email, current `roleCode`, and memberships. No row, or an expired one, means signed out. `requireAuth()`, `getCurrentAccountId()`, and `requireGlobalAdmin()` all read from it, so role changes and account changes apply on the next request.

### Revocation

Deleting rows is how sessions end, immediately and everywhere:

| Event | Sessions ended |
|-------|----------------|
| Sign-out | This browser's (and its acting as a client) |
| Password change | Every other session; this browser stays signed in |
| Password reset | All of the user's |
| User or account deletion | All, by cascade |

---

## Password Change

**Route:** `/account`
**Action:** `changePassword()` in `src/actions/auth.ts`

Flow:
1. Verify the current password. A user with none (an unclaimed owner, PRD D49) is refused: a first password comes from the claim
2. Hash and store the new one (`passwordChangedAt = now`)
3. Delete every other session of the user; this one stays
4. The client shows a success toast and clears the form

---

## Password Reset

**Route:** `/forgot-password` → `/reset-password?token=...`
**Actions:** `requestPasswordReset()`, `validateResetToken()`, `resetPassword()` in `src/actions/auth.ts`

Flow:
1. User submits email on `/forgot-password`
2. Server looks up User by email — always returns generic success message (prevents email enumeration)
3. Unless throttled, if the user exists: an owner who hasn't claimed (no password) gets the claim email instead (Claim, above). Otherwise generate a 32-byte token, store only its SHA-256 (`tokenHash`) with a 1-hour expiry, and retire the user's earlier unused tokens by moving their expiry to now, so only the newest link works (`issuePasswordToken` in `src/lib/claim.ts`)
4. Send reset email with link to `/reset-password?token=...`, from the account's sender (`senderFor`)
5. User sets new password → server consumes the token with one conditional update (a reset token, unused and unexpired; a claim link, PRD D49, is refused here), so a link works once even if submitted twice; then sets the password and deletes all of the user's sessions, in the same transaction
6. Redirect to `/login?reset=success`

### Important: no account-level guard

The password reset flow checks the User record but does NOT check Account state. With hard-delete this is fine — deleted users have no User record, so `findUnique` returns null and no email is sent.

---

## Account Deletion

**Self-service:** `deleteSelfAccount()` in `src/actions/accounts.ts`
**Operator:** `deleteAccount()` in `src/actions/accounts.ts`

### Strategy: hard delete

Both paths call `deleteAccountAndSoleMembers(accountId)` (`src/lib/data-access/memberships.ts`), one transaction:

```
prisma.account.delete()
  → Memberships, Forms → Fields, Submissions, Notifications, ActAs records (cascade)
prisma.user.deleteMany()   // users whose only membership was this account
  → PasswordTokens (cascade)
```

A user who also belongs to another account keeps their login. No tombstones.

### Why hard delete (not soft delete)

**Previous approach (Epic 6):** Hybrid soft-delete — delete forms, blank password, set `deletedAt` tombstone on Account. This caused:
- Blocked re-registration (email still existed in User table)
- Password reset could "resurrect" a deleted account
- Login flow needed to check `deletedAt` on every auth attempt
- Operator console filtered out tombstoned accounts anyway (no audit value)

**Current approach (Epic 14):** Hard delete via cascade. This:
- Allows re-registration with the same email immediately
- No zombie records in auth flows
- No guards needed in signup, login, or password reset
- One transaction (atomic)

### Self-service flow

1. User clicks "Delete Account" on `/account` dashboard
2. `ConfirmDialog` shows destructive warning
3. `deleteSelfAccount()` server action: `requireAuth()` → the user's membership, which must be `OWNER` → `deleteAccountAndSoleMembers()`
   The user's sessions go with the user (cascade); the action also clears this browser's cookie
4. Client navigates to the relative `/login?deleted=1`, so it stays on the current host
5. Login page shows "Your account has been deleted." banner

### Operator flow

1. Operator clicks delete on account in `/operator/accounts`
2. `ConfirmDialog` with account email in the warning
3. `deleteAccount(accountId)` server action: `requireGlobalAdmin()` → refuses the operator's own account and any deletion that would remove the last Global Admin → `deleteAccountAndSoleMembers()`
4. `revalidatePath("/operator/accounts")` refreshes the list

The operator cannot delete their own account (guard in server action).

---

## Operator Account Management

**Route:** `/operator/accounts`
**Guard:** `requireGlobalAdmin()` checks `session.user.role === "GLOBAL_ADMIN"`

The operator console shows metadata only:
- Owner email, created date, last login, form count, submission count, plan, billing status and reference, role
- No form content, submission data, or field definitions are ever exposed

Non-admins are silently redirected to their home (`/forms` or `/editor`).

### Acting as a client (PRD D49)

A Global Admin opens a Sites client's account from the site's Owner card (Act as client), for acceptance, support, or building a form, never with the client's password. `startActAs` (`src/lib/act-as.ts`) records an `ActAs` row (operator, account, start) and points the operator's own session at it (`Session.actAsId`). On every request `validateSessionToken` puts it on the session as `actingAs`, only while the row is open and the user is still a Global Admin; otherwise it ends the row and clears the pointer. Account lookups then answer with the client's account: `soleMembership` in `src/lib/auth-utils.ts` (as a `MEMBER`, so owner-only actions stay the owner's), and `sessionAccountId` and `sessionCanUseAccount` in `src/lib/data-access/memberships.ts`.

A banner on every page (the admin chrome, the operator console, the preview page) names the client and has Stop, which ends the row and returns to the site's operator page. Sign-out and the session's expiry end it too. While acting, changing a password and deleting the account are refused (`isActing`), the account page shows the owner's email without either section, and nothing sets the owner's `lastLoginAt`. Writes made meanwhile name the operator wherever a row names its author: a ChangeSet's `createdByUserId`, a form's creator, a published commit's author. The `ActAs` row is the record for the rest.

### Role system

User roles live in the `roles` catalog table (Epic 24). `User.roleCode` is a
FK to `Role.code`. Two roles ship today:

| code           | purpose |
|----------------|---------|
| `USER`         | Default for every signup. No operator access. |
| `GLOBAL_ADMIN` | Full operator-console access. Promotion moves an account on a capped plan to `PAID` (Unlimited); an uncapped plan (`PAID`, `SITES`) stays. |

Role changes are made via the operator console (`Change Role` action). The
acting admin cannot change their own role, and the system refuses to demote
or delete the last remaining Global Admin.

A role change takes effect on the affected user's **next request**: the
session lookup reads `roleCode` from the database every time.

### `ADMIN_EMAIL` is bootstrap-only

`ADMIN_EMAIL` is no longer consulted at auth-check time. It is used in two
places:

1. `prisma/seed.ts` — the seed script creates the initial admin user with
   `roleCode = "GLOBAL_ADMIN"` and `planCode = "PAID"`.
2. `scripts/backfill-global-admin.mjs` — runs on every container boot after
   `prisma migrate deploy`. Idempotently promotes the user matching
   `ADMIN_EMAIL` (if one exists) to `GLOBAL_ADMIN`, by the same plan rule as
   promotion in the console, so an admin's `SITES` account survives every boot.
   If `ADMIN_EMAIL` is unset or no user matches, logs a notice and exits
   cleanly.

Once at least one Global Admin exists in the database, `ADMIN_EMAIL` can be
removed from the deployment env with no functional impact. It stays
documented as optional.

---

## Billing

Billing happens outside the portal, by hand (PRD D12). The account stores `status` (`ACTIVE | PAST_DUE | CANCELLED`, default `ACTIVE`) and a free-text `billingRef` pointing at the billing system. An operator sets both with **Billing** on `/operator/accounts` (`setAccountBilling` in `src/actions/admin/billing.ts`, validated by `parseBillingInput` in `src/lib/billing.ts` and logged as a `setAccountBilling` JSON event). Status gates nothing yet.

Hard delete stays compatible: the billing system is the audit trail, so deleting an account loses no billing history. If in-app billing records are ever needed, soft delete is a migration away (a `deletedAt` column plus guards in the auth flows).

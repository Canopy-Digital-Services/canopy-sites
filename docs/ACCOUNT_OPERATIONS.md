# Account Operations & Session Management

How accounts, authentication, and sessions work in this project. **Read this before modifying any auth flow, account lifecycle code, or session behavior.**

---

## Table of Contents

1. [Account Model](#account-model)
2. [Account Creation (Signup)](#account-creation-signup)
3. [Authentication (Login)](#authentication-login)
4. [Session Management (JWT)](#session-management-jwt)
5. [Password Change](#password-change)
6. [Password Reset](#password-reset)
7. [Account Deletion](#account-deletion)
8. [Operator Account Management](#operator-account-management)
9. [Future: Billing Integration](#future-billing-integration)

---

## Account Model

The Account is the tenant boundary: forms, submissions, and fields belong to it. Users reach an account through a **Membership** (`OWNER` or `MEMBER`, Epic 28). v1 gives every user exactly one membership, as `OWNER`; `getSoleMembership` in `src/lib/data-access/memberships.ts` throws for more than one, and `getCurrentAccountId()` resolves through it.

```
Account (id, createdAt, planCode, ...)
  ├── Memberships[] (role) ──→ User (email, password, roleCode, ...)
  │                               └── PasswordResetTokens[]
  └── Forms[]
        ├── Fields[]
        └── Submissions[]
```

Deleting an Account cascades to its Memberships and Forms (and their Fields, Submissions, Notifications). It does **not** cascade to Users, so deletion goes through `deleteAccountAndSoleMembers`, which also deletes the users whose only membership it was.

### Key files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth config: providers, JWT callbacks, session policy |
| `src/lib/auth-utils.ts` | `requireAuth()`, `getCurrentAccountId()`, `requireGlobalAdmin()` |
| `src/actions/auth.ts` | Server actions: signup, login, password change/reset, signout |
| `src/actions/accounts.ts` | Server actions: account deletion (self-service and operator) |
| `src/lib/data-access/accounts.ts` | Operator console queries (metadata only) |

---

## Account Creation (Signup)

**Route:** `/signup`
**Action:** `signUp()` in `src/actions/auth.ts`

Flow:
1. Validate email format and password length (min 8 chars)
2. Check for existing user with same email — reject if found
3. Hash password with bcrypt (10 rounds)
4. Create Account with nested User in a single Prisma operation
5. Auto sign-in via `signIn("credentials", ...)`

Signup calls `prisma.account.create()` directly. There is no Auth.js adapter: with credentials and JWT sessions it would never be called, and Auth.js's own `Account` model would collide with the tenant `Account`.

---

## Authentication (Login)

**Route:** `/login`
**Provider:** Credentials (email + password)
**Strategy:** JWT (no database sessions)

Flow:
1. Look up User by email
2. `bcrypt.compare()` against stored hash
3. On failure: increment `failedLoginCount`, set `lastFailedLoginAt`, return null
4. On success: reset failed count, set `lastLoginAt`, return user object
5. JWT callback encodes `id`, `email`, `rememberMe`, timeout claims into token
6. Session callback maps token claims to `session.user`

The `authorize()` callback in `src/lib/auth.ts` is the only authentication entry point.

### Important: no account-level login guard

The `authorize()` callback checks the User record only — it does not check whether the Account exists or has any flags. This is intentional: with hard-delete (see [Account Deletion](#account-deletion)), deleted users don't have User records to find.

---

## Session Management (JWT)

Sessions use JWT tokens (not database sessions). The cookie holds the full session state.

### Timeout policy

| Scenario | Idle timeout | Absolute timeout |
|----------|-------------|-----------------|
| Default session | 4 hours | 7 days |
| "Keep me signed in" | 7 days | 30 days |

- **Idle timeout** rolls forward on each request
- **Absolute timeout** is a hard ceiling — never rolls
- Cookie `maxAge` is 30 days (ceiling for "remember me" sessions)
- JWT is re-signed every 5 minutes (`updateAge`)

### Periodic validation

Every 5 minutes, the JWT callback queries the database:
1. If the User record no longer exists → expire the token
2. If `passwordChangedAt` is after `sessionIssuedAt` → expire the token
3. On DB error → skip validation (don't expire on transient failures)

This means: after account deletion or password change, existing sessions expire within 5 minutes.

### Token expiration

When a token expires, `expireToken()` strips all identity claims (`id`, `email`, etc.). The session callback then sets `session.user.id = ""`. The `requireAuth()` guard checks `!session.user.id` and redirects to `/login`.

### Key invariant

**The JWT is the source of truth for the current session.** There are no database session records. Signing out clears the JWT cookie. There is no server-side session to invalidate — expiration relies on token claims and the periodic validation check.

---

## Password Change

**Route:** `/account`
**Action:** `changePassword()` in `src/actions/auth.ts`

Flow:
1. Verify current password via `bcrypt.compare()`
2. Hash new password
3. Update User record: new password hash + `passwordChangedAt = new Date()`
4. Client shows success toast, then calls `signOutAction()` after 1.5s delay

Setting `passwordChangedAt` causes the periodic JWT validation to expire all prior sessions within 5 minutes.

---

## Password Reset

**Route:** `/forgot-password` → `/reset-password?token=...`
**Actions:** `requestPasswordReset()`, `validateResetToken()`, `resetPassword()` in `src/actions/auth.ts`

Flow:
1. User submits email on `/forgot-password`
2. Server looks up User by email — always returns generic success message (prevents email enumeration)
3. If user found: generate secure token (32 bytes hex), store in `PasswordResetToken` table with 1-hour expiry
4. Send reset email with link to `/reset-password?token=...`
5. User sets new password → server validates token, hashes password, updates User, marks token used
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
  → Memberships, Forms → Fields, Submissions, Notifications (cascade)
prisma.user.deleteMany()   // users whose only membership was this account
  → PasswordResetTokens (cascade)
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
4. Client calls `signOut({ redirect: false })` from `next-auth/react`, then `window.location.assign("/login?deleted=1")` so it stays on the current host
5. Login page shows "Your account has been deleted." banner

### Post-deletion session behavior

After hard delete, the User record is gone. The JWT session is still active in the browser until:
- The client calls `signOut()` (clears the cookie immediately), OR
- The periodic JWT validation fires (within 5 minutes) and finds no User record → expires the token

For self-service deletion, the client calls `signOut()` immediately after the server action returns.

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
- Email, created date, last login, form count, submission count, plan, role
- No form content, submission data, or field definitions are ever exposed

Non-admins are silently redirected to `/forms`.

### Role system

User roles live in the `roles` catalog table (Epic 24). `User.roleCode` is a
FK to `Role.code`. Two roles ship today:

| code           | purpose |
|----------------|---------|
| `USER`         | Default for every signup. No operator access. |
| `GLOBAL_ADMIN` | Full operator-console access. Grants `UNLOCKED` plan automatically at promotion. |

Role changes are made via the operator console (`Change Role` action). The
acting admin cannot change their own role, and the system refuses to demote
or delete the last remaining Global Admin.

A role change takes effect on the affected user's **next login**. The
session JWT carries the `role` claim and is not re-read from the database
on every request.

### `ADMIN_EMAIL` is bootstrap-only

`ADMIN_EMAIL` is no longer consulted at auth-check time. It is used in two
places:

1. `prisma/seed.ts` — the seed script creates the initial admin user with
   `roleCode = "GLOBAL_ADMIN"` and `planCode = "UNLOCKED"`.
2. `scripts/backfill-global-admin.mjs` — runs on every container boot after
   `prisma migrate deploy`. Idempotently promotes the user matching
   `ADMIN_EMAIL` (if one exists) to `GLOBAL_ADMIN` on the `UNLOCKED` plan.
   If `ADMIN_EMAIL` is unset or no user matches, logs a notice and exits
   cleanly.

Once at least one Global Admin exists in the database, `ADMIN_EMAIL` can be
removed from the deployment env with no functional impact. It stays
documented as optional.

---

## Future: Billing Integration

When billing is added (e.g., Stripe):

- **Stripe is the billing audit trail.** Customer objects, subscriptions, invoices, and payment history live in Stripe's systems. The app doesn't need to preserve deleted account records for billing purposes.
- **App-side integration** would likely add a `stripeCustomerId` field to Account and/or a `subscriptions` table.
- **On account deletion:** cancel the Stripe subscription, then hard-delete locally. Stripe retains the billing history on their side.
- **If in-app billing records are needed later:** adding soft-delete at that point is a simple migration (add `deletedAt` column, change `delete` to `update`, add auth flow guards). This is easier to add with full billing context than to pre-build without it.

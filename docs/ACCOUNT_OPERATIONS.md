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
9. [PrismaAdapter Note](#prismaadapter-note)
10. [Future: Billing Integration](#future-billing-integration)

---

## Account Model

Every user has a 1:1 relationship with an Account. The Account is the tenant boundary — all forms, submissions, and fields belong to the Account.

```
Account (id, createdAt)
  ├── User (email, password, accountId, passwordChangedAt?, lastLoginAt?, ...)
  │     └── PasswordResetTokens[]
  └── Forms[]
        ├── Fields[]
        └── Submissions[]
```

All relationships use `onDelete: Cascade`. Deleting an Account cascades through the entire tree — User, Forms, Fields, Submissions, and PasswordResetTokens are all removed by the database.

### Key files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth config: providers, JWT callbacks, session policy |
| `src/lib/auth-utils.ts` | `requireAuth()`, `getCurrentAccountId()`, `requireOperator()` |
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

The signup does NOT use the PrismaAdapter. It calls `prisma.account.create()` directly.

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

The `authorize()` callback in `src/lib/auth.ts` is the only authentication entry point. It bypasses the PrismaAdapter entirely.

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

Account deletion uses `prisma.account.delete()`. The database cascades handle everything:

```
prisma.account.delete({ where: { id: accountId } })
  → User deleted (cascade)
    → PasswordResetTokens deleted (cascade)
  → Forms deleted (cascade)
    → Fields deleted (cascade)
    → Submissions deleted (cascade)
```

One operation. No multi-step process. No tombstones.

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
- Single database operation (atomic)

### Self-service flow

1. User clicks "Delete Account" on `/account` dashboard
2. `ConfirmDialog` shows destructive warning
3. `deleteSelfAccount()` server action: `requireAuth()` → `getCurrentAccountId()` → `prisma.account.delete()`
4. Client calls `signOut({ callbackUrl: "/login?deleted=1" })` from `next-auth/react`
5. Login page shows "Your account has been deleted." banner

### Post-deletion session behavior

After hard delete, the User record is gone. The JWT session is still active in the browser until:
- The client calls `signOut()` (clears the cookie immediately), OR
- The periodic JWT validation fires (within 5 minutes) and finds no User record → expires the token

For self-service deletion, the client calls `signOut()` immediately after the server action returns.

### Operator flow

1. Operator clicks delete on account in `/operator/accounts`
2. `ConfirmDialog` with account email in the warning
3. `deleteAccount(accountId)` server action: `requireOperator()` → self-deletion guard → `prisma.account.delete()`
4. `revalidatePath("/operator/accounts")` refreshes the list

The operator cannot delete their own account (guard in server action).

---

## Operator Account Management

**Route:** `/operator/accounts`
**Guard:** `requireOperator()` checks `session.user.email` against `ADMIN_EMAIL` env var

The operator console shows metadata only:
- Email, created date, last login, form count, submission count
- No form content, submission data, or field definitions are ever exposed

Non-operators are silently redirected to `/forms`.

---

## PrismaAdapter Note

`src/lib/auth.ts` configures `PrismaAdapter(prisma)`. **This adapter is dormant.** With credentials-only auth and JWT sessions, none of the adapter's methods are ever called:
- No OAuth → no `linkAccount()`, `getUserByAccount()`
- No database sessions → no `createSession()`, `deleteSession()`
- Signup is custom → no `createUser()`

The adapter is present but inert. If OAuth providers are added in the future, the adapter would need the standard Auth.js Account model (with `provider`, `providerAccountId`, etc.), which is a different model from the app's internal Account. This would require schema redesign.

---

## Future: Billing Integration

When billing is added (e.g., Stripe):

- **Stripe is the billing audit trail.** Customer objects, subscriptions, invoices, and payment history live in Stripe's systems. The app doesn't need to preserve deleted account records for billing purposes.
- **App-side integration** would likely add a `stripeCustomerId` field to Account and/or a `subscriptions` table.
- **On account deletion:** cancel the Stripe subscription, then hard-delete locally. Stripe retains the billing history on their side.
- **If in-app billing records are needed later:** adding soft-delete at that point is a simple migration (add `deletedAt` column, change `delete` to `update`, add auth flow guards). This is easier to add with full billing context than to pre-build without it.

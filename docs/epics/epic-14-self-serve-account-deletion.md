# Epic 14: Self-Serve Account Deletion

**Status**: ✅ Complete
**Version**: v4.6.0
**Date**: 2026-02-20

---

## Summary

Users can permanently delete their own account from the `/account` dashboard. Also converted the entire deletion strategy from soft-delete (tombstone) to hard-delete (cascade), fixing re-registration and auth flow gaps.

---

## What Was Built

### `deleteSelfAccount()` server action (`src/actions/accounts.ts`)

Self-service deletion using `prisma.account.delete()`:

1. Authenticates via `requireAuth()`
2. Resolves `accountId` via `getCurrentAccountId()`
3. Deletes the Account — database cascades handle User, Forms, Fields, Submissions, and PasswordResetTokens
4. Client-side `signOut({ callbackUrl: "/login?deleted=1" })` ends the session

### Wired `DeleteAccountSection` in `account-dashboard.tsx`

- `ConfirmDialog` with `destructive={true}` and clear warning text
- `useTransition` for loading state ("Deleting..." button text while pending)
- Error handling via `toast.error()` on failure
- Client-side `signOut` from `next-auth/react` after successful deletion

### Login page `?deleted=1` banner

- Added condition in existing `useEffect` to detect `?deleted=1` query param
- Displays "Your account has been deleted." in the existing success message slot

### Hard-delete migration

- Converted operator `deleteAccount()` to use `prisma.account.delete()` (same cascade approach)
- Removed `deletedAt` column from Account model
- Migration: `20260220000000_drop_account_deleted_at`
- Removed `deletedAt: null` filter from operator console queries

### Account Operations documentation

- Created `docs/ACCOUNT_OPERATIONS.md` — comprehensive reference for account lifecycle, auth flows, session management, deletion strategy, and future billing considerations
- Added reference in `docs/AGENT_CONTEXT.md`

---

## Why Hard Delete

The original Epic 6 hybrid-delete (blank password + tombstone) caused three auth flow gaps:

1. **Re-registration blocked** — User record still existed, signup rejected "email already registered"
2. **Password reset resurrection** — reset flow didn't check tombstone, allowing a deleted account to be revived
3. **Login on tombstoned account** — `authorize()` only checked password, not `deletedAt`

Hard delete via `prisma.account.delete()` with `onDelete: Cascade` eliminates all three issues with a single database operation. No guards needed in signup, login, or password reset flows.

See `docs/ACCOUNT_OPERATIONS.md` for full rationale and future billing considerations.

---

## Files Modified

| File | Change |
|------|--------|
| `src/actions/accounts.ts` | Rewrote both `deleteAccount()` and `deleteSelfAccount()` to use hard delete |
| `src/components/account/account-dashboard.tsx` | Wired `DeleteAccountSection` with `ConfirmDialog` + `useTransition` + client-side `signOut` |
| `src/app/(auth)/login/page.tsx` | Added `?deleted=1` branch in existing `useEffect` |
| `prisma/schema.prisma` | Removed `deletedAt` from Account model |
| `prisma/migrations/20260220000000_drop_account_deleted_at/` | Drop column migration |
| `src/lib/data-access/accounts.ts` | Removed `deletedAt: null` filter |
| `docs/ACCOUNT_OPERATIONS.md` | New: account lifecycle and auth flow reference |
| `docs/AGENT_CONTEXT.md` | Updated data model appendix, added doc reference |

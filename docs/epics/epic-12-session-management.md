# Epic 12: Session Management — Completion Report

**Version**: v4.4.0
**Date**: 2026-02-19
**Status**: ✅ Complete

---

## Summary

Replaced unbounded JWT sessions with a dual-timeout policy (rolling idle + fixed absolute), added a "Keep me signed in" login option, and added password-change session invalidation. JWT strategy was retained (no switch to database sessions).

---

## What Was Implemented

### Dual-timeout session policy

Two timeouts enforced via custom JWT claims:

| | Idle timeout (rolling) | Absolute timeout (fixed) |
|---|---|---|
| **Default** | 4 hours | 7 days |
| **"Keep me signed in"** | 7 days | 30 days |

- `expiresAt` — rolls forward on each active request (idle window)
- `absoluteExpiresAt` — set once at login, never changes (hard ceiling)
- `session.maxAge` = 30 days (cookie ceiling); `session.updateAge` = 5 minutes (JWT re-sign frequency)

### "Keep me signed in" checkbox

Added to the login page. Unchecked by default. Threads through `signIn()` → `authorize()` → JWT claims.

### Password change invalidation

- `passwordChangedAt DateTime?` added to the `User` model
- `sessionIssuedAt` stored in the JWT at login
- Every 5 minutes (tracked via `lastValidatedAt`), the JWT callback queries `passwordChangedAt` from the DB
- If `passwordChangedAt > sessionIssuedAt`, the session is expired
- `resetPassword` action now sets `passwordChangedAt = new Date()` on success

### Token expiry mechanism

When a session expires (any condition), identity claims are stripped from the JWT (`id`, `email`, session timestamps). `requireAuth()` checks `!session.user.id` and redirects to `/login`.

---

## Architecture Decision: Stay on JWT

Switching to database sessions requires workarounds with NextAuth's Credentials provider (which doesn't auto-create DB sessions) and adds a DB query on every request. JWT with custom claims gives us idle timeout, absolute timeout, and password-change invalidation — sufficient for launch. If instant revocation or operator force-logout is needed later, a `sessionVersion` field or migration to DB sessions can be added as a follow-up.

---

## Files Changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `passwordChangedAt DateTime?` to User |
| `prisma/migrations/20260219000000_add_password_changed_at/migration.sql` | Migration |
| `src/lib/auth.ts` | Session config, `rememberMe` credential, jwt + session callbacks, `expireToken` helper |
| `src/types/next-auth.d.ts` | Extended JWT type with custom claims; User type with `rememberMe` |
| `src/lib/auth-utils.ts` | Added `!session.user.id` check to `requireAuth()` |
| `src/app/(auth)/login/page.tsx` | Added "Keep me signed in for 30 days" checkbox |
| `src/actions/auth.ts` | Set `passwordChangedAt` in `resetPassword` |
| `src/components/ui/checkbox.tsx` | New shadcn Checkbox component (using `@radix-ui/react-checkbox`) |

---

## Non-Goals (not implemented)

- No switch from JWT to database sessions
- No re-auth gates (no billing, webhooks, or email-change UI exist yet)
- No device management UI or "log out all sessions" UI
- No refresh-token rotation

---

## Acceptance Criteria

- [x] Default sessions expire after 4 hours idle or 7 days absolute
- [x] "Keep me signed in" sessions expire after 7 days idle or 30 days absolute
- [x] Active sessions refresh the idle window every 5 minutes
- [x] Password change invalidates all prior sessions within 5 minutes
- [x] Auth cookie has `HttpOnly`, `Secure`, `SameSite=Lax` flags (NextAuth default, served over HTTPS)
- [x] No new tracking/fingerprinting data
- [x] Login page has "Keep me signed in for 30 days" checkbox (unchecked by default)

---

## Verification Steps

1. Log in without checkbox → decode JWT → verify `expiresAt` ~4h, `absoluteExpiresAt` ~7d
2. Log in with checkbox → verify `expiresAt` ~7d, `absoluteExpiresAt` ~30d
3. Temporarily lower idle to 1 minute → verify session expires after inactivity
4. Reset password → verify prior session invalidated within 5 minutes
5. Inspect cookie in dev tools → confirm `HttpOnly`, `Secure`, `SameSite=Lax`

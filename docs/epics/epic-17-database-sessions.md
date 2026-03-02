# Epic 17: Switch from JWT to Database Sessions

**Status**: 🔬 Research Required
**Version**: TBD
**Date**: TBD

---

## Motivation

JWT sessions have caused stale-session bugs in practice:
- **Redirect loops** when the database is reset but JWT cookies persist
- **Phantom auth** after DB resets — the JWT is self-contained, so `auth()` returns a valid session even when the user no longer exists in the database
- **Non-revocable sessions** — signing out clears the cookie, but if it's somehow preserved (copied, replayed), there's no server-side record to invalidate
- **5-minute validation lag** — the periodic DB check in the JWT callback runs every 5 minutes, leaving a window where deleted/password-changed users still appear authenticated

Database sessions fix all of these: `auth()` hits the DB on every request, so stale cookies immediately fail.

---

## Blocker: Auth.js v5 Does Not Support Credentials + Database Sessions

**This is the critical finding.** Auth.js v5 (NextAuth v5 beta) has a known, unresolved limitation: the Credentials provider does not create database session records. When `strategy: "database"` is set:

1. `authorize()` succeeds and returns a user object
2. Auth.js **fails to call** `adapter.createSession()` for credentials-based logins
3. A session token cookie is set, but no corresponding row exists in the `sessions` table
4. `auth()` returns `null` on subsequent requests — the user appears unauthenticated

This is confirmed in multiple GitHub discussions:
- [Discussion #12848](https://github.com/nextauthjs/next-auth/discussions/12848) — "systemic issue with how the credentials provider handles database sessions"
- [Discussion #4394](https://github.com/nextauthjs/next-auth/discussions/4394) — community workarounds documented

### Workaround Approaches

Community workarounds exist but are fragile:

1. **Manual session creation in JWT callback** — override `encode`/`decode` to intercept credentials flows and manually call `adapter.createSession()`. This essentially re-implements session management on top of the JWT hooks.
2. **Custom signIn callback** — detect credentials flow, generate session token, create DB record, set cookie manually. Requires handling cookie names (`__Secure-` prefix in production) and expiry.

Both approaches are **unofficial workarounds** that could break on any NextAuth beta update. For a production app, this is high-risk.

---

## Recommendation

### Option A: Implement with workaround (higher risk, solves the problem now)

Accept the workaround cost. Manually create sessions in the JWT callback for credentials logins. This gives us true database sessions but couples us to internal Auth.js behavior that could change.

### Option B: Wait for Auth.js stable release (lower risk, deferred)

Auth.js v5 is still in beta. The credentials + database sessions gap may be resolved in the stable release. In the meantime, the current JWT approach works — the stale-session bugs are real but low-frequency and can be mitigated (see Option C).

### Option C: Harden the JWT approach (lowest risk, incremental)

Keep JWT strategy but address the specific pain points:
- **Reduce validation interval** from 5 minutes to 30-60 seconds (more DB queries, but small user base)
- **Add middleware-level session validation** for immediate rejection of sessions with deleted users
- **Clear cookies on DB reset** (operational procedure, not code)

This doesn't achieve true revocability, but it narrows the stale-session window to near-zero for practical purposes.

---

## Issues in the Original Plan

For reference, the original plan at `docs/epics/switch_to_database_sessions_2c2deb34.plan.md` had several issues beyond the credentials+database blocker:

### 1. Session model missing `id` field
The PrismaAdapter requires an `id` field on the Session model:
```prisma
model Session {
  id           String   @id @default(cuid())  // Required by PrismaAdapter
  sessionToken String   @unique
  userId       String
  expires      DateTime
  ...
}
```

### 2. "Revert band-aid" step is a no-op
The plan says to revert `redirect("/login")` back to `throw new Error("User not found")` in `getCurrentAccountId()`. But looking at the current code (`src/lib/auth-utils.ts:63`), it already uses `throw new Error("User not found")`. There's nothing to revert.

### 3. Session timeout policy would be lost
The current JWT callback implements a rich timeout policy:
- **Idle timeout** (4h default / 7d remember-me) — rolls forward on each request
- **Absolute timeout** (7d default / 30d remember-me) — hard ceiling
- **"Keep me signed in" toggle** — different timeout tiers
- **Periodic password-change validation** — expires sessions after password change

With `strategy: "database"`, all of this disappears. Database sessions use a single `expires` field with a fixed `maxAge`. There's no idle vs. absolute distinction, no remember-me tiers, and no automatic password-change invalidation.

Reimplementing this would require:
- Custom session management logic (middleware or callback-based)
- A way to update `expires` on each request for idle timeout behavior
- Storing additional metadata (remember-me flag, issued-at timestamp) on the Session model
- A mechanism to invalidate sessions when `passwordChangedAt` changes

This is a significant amount of work that the original plan did not account for.

### 4. TypeScript declarations would need updating
The `src/types/next-auth.d.ts` file declares JWT-specific fields (`sessionIssuedAt`, `expiresAt`, `absoluteExpiresAt`, `lastValidatedAt`, `rememberMe`). These would need to be cleaned up or moved to the Session model.

### 5. Account operations doc would need updating
`docs/ACCOUNT_OPERATIONS.md` has an entire section on JWT session management (section 4) and references JWT behavior in the deletion and password-change sections. All of this would need rewriting.

---

## If We Proceed (Option A): Revised Task Breakdown

> **Before starting, read `docs/AGENT_CONTEXT.md`, `docs/tools/nextauth-v5.md`, and `docs/ACCOUNT_OPERATIONS.md`.**

### Phase 1: Schema + Migration
1. Add `Session` model to `prisma/schema.prisma` (with `id` field, `@@map("sessions")`, cascade delete from User)
2. Add `sessions Session[]` relation on User model
3. Run `prisma migrate dev --name add_sessions_table`
4. Verify generated SQL

### Phase 2: Auth Config Rewrite
1. Research and implement the manual session creation workaround for credentials provider
2. Switch `strategy` to `"database"`
3. Replace JWT callback with workaround logic (manual `createSession` on credentials login)
4. Rewrite session callback for database strategy (`{ session, user }` signature)
5. Decide on session timeout approach:
   - **Simple**: single `maxAge` for all sessions, drop remember-me tiers
   - **Full parity**: store remember-me flag and issued-at on Session model, implement custom expiry logic
6. Decide on password-change invalidation:
   - **Simple**: delete all sessions for user on password change (`prisma.session.deleteMany({ where: { userId } })`)
   - This is actually *better* than the JWT approach (immediate, not 5-minute lag)

### Phase 3: Cleanup
1. Update `src/types/next-auth.d.ts` — remove JWT-specific fields
2. Update `docs/ACCOUNT_OPERATIONS.md` — rewrite session management section
3. Update `docs/tools/nextauth-v5.md` — document the workaround and project-specific notes
4. Update password change action to delete all sessions on password change

### Phase 4: Verify
1. Local: signup, login, session persistence, logout, password change invalidation
2. Deploy to dev and verify
3. Confirm existing users are forced to re-login (expected)

---

## Files Affected (if implemented)

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add Session model, User relation |
| `prisma/migrations/...` | New migration |
| `src/lib/auth.ts` | Rewrite: strategy, callbacks, manual session workaround |
| `src/types/next-auth.d.ts` | Remove JWT fields, add any Session-specific types |
| `src/actions/auth.ts` | Password change: delete sessions. Possibly signup flow changes. |
| `docs/ACCOUNT_OPERATIONS.md` | Rewrite session management section |
| `docs/tools/nextauth-v5.md` | Document workaround, update project notes |

---

## Decision Needed

Choose between Option A (implement with workaround), Option B (wait for stable Auth.js), or Option C (harden JWT approach). My recommendation is **Option C** unless the stale-session bugs are causing frequent user-facing problems — it's the lowest risk and can be done incrementally.

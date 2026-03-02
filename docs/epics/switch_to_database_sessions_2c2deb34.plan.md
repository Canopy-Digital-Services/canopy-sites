---
name: Switch to database sessions
overview: Replace JWT session strategy with database sessions in Auth.js to eliminate stale-session bugs (redirect loops, phantom auth after DB resets, non-revocable sessions).
todos:
  - id: add-session-model
    content: Add Auth.js-compatible Session model to Prisma schema and create migration
    status: in_progress
  - id: update-auth-config
    content: Switch session strategy to database, remove JWT callback, simplify session callback in auth.ts
    status: pending
  - id: revert-bandaid
    content: Revert the redirect('/login') band-aid in getCurrentAccountId back to throw
    status: pending
  - id: verify-deploy
    content: Verify the change works on the dev instance after deploy
    status: pending
isProject: false
---

# Switch from JWT to Database Sessions

## What changes

### 1. Add `Session` model to Prisma schema

Add the Auth.js-compatible Session model to `[prisma/schema.prisma](prisma/schema.prisma)`:

```prisma
model Session {
  sessionToken String   @unique
  userId       String
  expires      DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

And add the reverse relation on the `User` model:

```prisma
sessions            Session[]
```

Create a migration to add the `sessions` table.

### 2. Switch session strategy in auth config

In `[src/lib/auth.ts](src/lib/auth.ts)`:

- Change `session.strategy` from `"jwt"` to `"database"`
- **Remove** the `jwt` callback entirely (not needed with database sessions)
- **Simplify** the `session` callback: with database sessions, it receives `user` (from DB) instead of `token`

The callback becomes:

```typescript
callbacks: {
  async session({ session, user }) {
    session.user.id = user.id;
    session.user.email = user.email!;
    return session;
  },
},
```

### 3. Revert band-aid fixes in auth-utils

In `[src/lib/auth-utils.ts](src/lib/auth-utils.ts)`:

- `getCurrentAccountId()`: change `redirect("/login")` back to `throw new Error("User not found")` -- with database sessions, this code path is unreachable (session lookup fails first, `auth()` returns null, `requireAuth()` redirects). Keeping the throw as a defensive assertion is correct.
- No other changes needed in auth-utils -- `requireAuth()` and `getCurrentUserId()` work as-is.

### 4. No changes to layouts or pages

All existing auth guards (`requireAuth()`, `auth()` checks in layouts) work identically. The `auth()` function returns the same session shape. The only difference is that it's resolved from the database instead of decoded from a JWT.

## What does NOT change

- Login/signup/password-reset flows (unchanged)
- Client-side `signIn()` call (unchanged)
- `signOut()` behavior (now also deletes DB row -- strictly better)
- `requireAuth()`, `getCurrentUserId()`, `getCurrentAccountId()` signatures
- The `(auth)/layout.tsx` and `(admin)/layout.tsx` guard logic
- The custom `Account` model (business account, not Auth.js Account)

## Migration

A single SQL migration creates the `sessions` table. Existing users will need to log in again after deployment (their JWT cookies will be ignored under the new strategy). This is acceptable for a dev environment and a small user base.
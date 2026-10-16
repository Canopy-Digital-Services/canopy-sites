# Epic 28: Account Audit and Membership Model

**Status:** In progress (Membership, status, billing done; session layer awaiting Michael's go)
**Version:** TBD
**Started:** 2026-10-15
**Phase:** 0, Portal foundation (`docs/canopy-sites/ROADMAP.md`)
**Predecessor:** Epic 27 (Restructure in place; product-based chrome)
**Successor:** E29 (Plan extension, Site model, operator Sites)

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/ACCOUNT_OPERATIONS.md`, `docs/tools/nextauth-v5.md`, `docs/tools/prisma-7.md`, `docs/canopy-sites/PRD.md` (D11, D12, Q7, Q8), and `docs/canopy-sites/ROADMAP.md`.

---

## 1. Goal

Pull the inherited Forms account and auth code forward with the improvements the audit below justifies, settle the auth library (PRD Q7) and the test runner (Q8), and replace the 1:1 `User.accountId` with a `Membership` table so an Account can have several users. Add `Account.status` and `Account.billingRef` for operator-set billing state (PRD D12).

## 2. Scope

### In

- Audit of `src/lib/auth.ts`, `auth-utils.ts`, `actions/auth.ts`, `actions/accounts.ts`, `data-access/accounts.ts`, `(auth)/*`, `components/account/*`, and every reader of `User.accountId` (section 4).
- Q7 decision, then the session and login fixes it implies.
- Vitest (Q8), with tests for the session decisions and Membership resolution.
- `Membership { userId, accountId, role OWNER|MEMBER }`, two migrations (expand, then contract in a later deploy).
- `Account.status`, `Account.billingRef`, editable in the operator console.
- `Form.createdByUserId` stops cascading (F11).

### Out

| Not here | Why / where |
|---|---|
| Invite flow, member list, role UI | PRD scope: model supports it, UI shows one owner |
| Account switcher, many-membership path | v1 asserts exactly one membership; the stub throws |
| Anything `Account.status` gates | Informational in E28 (D6) |
| Site-scoped API keys | E34 |
| Signup offered on the Sites host (E27 follow-up) | Product question, not account plumbing |

## 3. Gating decisions

### Q7. Auth library: recommendation is stay on NextAuth v5 for now (awaiting Michael)

Facts checked 2026-10-15 (npm registry, GitHub advisory API, library source in `node_modules`, and a spike against the dev stack):

- **NextAuth.** v5 never left beta. `5.0.0-beta.31` (2026-04-14) and `beta.32` (2026-07-20) were security releases; we run `beta.30`, which is inside the range of GHSA-8fpg-xm3f-6cx3 / CVE-2026-73421 (config errors make existence-based auth checks fail open; GitHub rates it critical, fixed in `beta.32`). Our checks read `session.user.id`, not existence, but the bump was due regardless: done in `1c65921`. The Better Auth team maintains it for security fixes only (announcement 2025-09-22; Better Auth joined Vercel 2026-07); no end-of-support date. Peer range covers Next 16.
- **What NextAuth does for us.** Credentials `authorize`, JWT encryption, cookies, sign-in CSRF, `auth()`. Signup, reset, change password, failed-login tracking, timeouts, and DB validation are already ours. The `PrismaAdapter` is configured and never called.
- **Better Auth** (`1.7.10`, 2026-10-15; peers Next 14 to 16, Prisma 5 to 7) would give database sessions and maintained email/password flows, but against our requirements:
  - **Organization plugin** wants to own the tenant: `organization.name` and a unique `slug` are NOT NULL, the `invitation` table is always created, roles are lowercase strings, `allowUserToCreateOrganization` defaults to true, and `activeOrganizationId` goes on the session. Our `Account` carries plan, resolution state, status, billing, forms, and soon sites. E28 needs one join table and a resolver.
  - **API key plugin** (`@better-auth/api-key`) owns keys by user or organization only. E34 keys are scoped to one site, so the scope check would be our code either way (PRD D9 puts guardrails in our tool layer).
  - **Sessions** have no absolute cap (feature request #10405 open); `rememberMe: false` is a fixed one-day row. Our 4h/7d idle with 7d/30d absolute policy would be custom code again. Server components cannot refresh its cookie either.
  - **Rate limiting** is per IP, in memory, and needs `trustedProxies` for our Cloudflare to Traefik chain; no per-account lockout (#10724). `revokeSessionsOnPasswordReset` defaults to false, with an open race (#11648).
  - **Risk now.** Open #11737 (2026-10-13): an adapter `delete()` with an empty `where` wipes the whole table on Prisma. 27 advisories published in 2026, mostly SSO, SCIM, and the OAuth provider, three in core. Migration needs a `user.name` column, a credential row per user, `session` and `verification` tables renamed off our `accounts`, a `$2` branch in `verify` (no rehash-on-login, #10289), a rewrite of about 15 files, new env vars on both Coolify apps, and one forced sign-out of everyone.
- **The findings in section 4 are cheap to fix in place**, and both mechanisms were verified: a `proxy.ts` that re-exports `auth` re-issues the cookie on every navigation with `expiresAt` advanced and `sessionIssuedAt` and `absoluteExpiresAt` unchanged (F1); `@auth/core` returns no session and clears the cookie when the `jwt` callback returns `null` (F2).

**Recommendation.** Stay on NextAuth v5, bumped to `beta.32`. Build Membership by hand; it does not depend on the library. Keep `next-auth` imports confined to `src/lib/auth.ts`, `src/lib/auth-utils.ts`, the `(auth)` pages, `src/actions/auth.ts`, and the account deletion client call, so a later swap touches only those. **Revisit at E34**, where Better Auth's `@better-auth/oauth-provider` and `@better-auth/mcp` would cover the PRD's "OAuth later" for the MCP endpoint, or sooner if: an advisory hits the credentials or JWT path and goes unpatched for 30 days, or a Next.js major we need falls outside `next-auth`'s peer range.

### Q7, second pass: own the session layer (proposed, awaiting Michael)

Michael's answer to the recommendation above: stay on NextAuth unless the comparison was too narrow, a 1:1 swap instead of a rethink. It was. Against our code, NextAuth now supplies only the encrypted JWT cookie, the sign-in CSRF check, and three endpoints; everything else is ours, and three problems came from working around it (credentials cannot use database sessions, the Epic 17 dead end; `NEXTAUTH_URL` redirect rewriting, E27; server components dropping the refreshed cookie, F1). We already query the database on every request, so we pay for database sessions without their benefits: signing out deletes only the browser's cookie, and a copied cookie stays valid until it expires.

**Proposal: remove NextAuth and own a small database-session layer** (the opaque-token pattern). A random token in an `httpOnly`, `SameSite=Lax` cookie; a `sessions` row keyed by the token's SHA-256; one `cache()`d lookup per request joining session, user, and membership. The idle expiry lives in the row, so it rolls without writing the cookie (F1, no `proxy.ts`); a missing or expired row is simply signed out (F2); one query per request (F3) with the current role (F4). Sign-out, password change and reset, and account deletion delete the rows, so revocation is immediate everywhere. Sign-in and sign-out become our own server actions, which Next already rejects when `Origin` does not match the host (checked in `next/dist/server/app-render/action-handler.js`), and redirect relatively, so the E27 cross-host workarounds go away. Cost: roughly 150 lines of security code we own, covered by database tests; one forced sign-out at the switch (no real users yet); `next-auth`, `/api/auth/*`, and `NEXTAUTH_SECRET` go away, while `NEXTAUTH_URL` stays as the app URL so Coolify needs no change. Passwordless sign-in (magic links, passkeys) would sit on top later.

### Q8. Test runner: Vitest (done, `2cbc4d7`)

Vitest in `apps/portal`, run inside the dev container like the build. Two kinds of test:

- **Unit** (`*.test.ts` beside the code): pure decisions with no I/O. The session-token evaluation is extracted from the `jwt` callback for this.
- **Database** (`*.db.test.ts`): against a separate `canopy_test` database on the dev Postgres, migrated with `prisma migrate deploy` before the run and truncated between files. Prisma is never mocked: the bugs worth catching here live in queries and cascades.

`npm test` joins `build` and `lint` as a must-pass check. Vitest is on 4.1.x because the containers run Node 20 and 5.x needs 22.12+. The cross-project rules (what must have tests, real dependencies over mocks, CI) live on the Engineering collective's Quality Assurance page, created 2026-10-15; the portal has no CI yet, which that page lists as an open gap.

## 4. Audit findings (2026-10-15)

Evidence is from the dev stack on `localhost:3006` with a throwaway `FREE` account, unless the row says otherwise.

| # | Finding | Evidence | Resolution |
|---|---|---|---|
| F1 | **The idle timeout never rolls.** Every session ends 4h after sign-in (7d with "Keep me signed in") however active the user is, and the absolute caps are never reached. | An authenticated `GET /forms` returns 200 with no `Set-Cookie`. In server components `auth()` returns `r.json()` and drops the refreshed cookie (`next-auth/lib/index.js`); there is no proxy or `SessionProvider` to write it. | `src/proxy.ts` re-exporting `auth`, matcher limited to pages. Spiked: cookie re-issued, `expiresAt` advances. |
| F2 | **An expired token is a non-null session.** `expireToken()` strips claims and returns the token; the session callback fills `id: ""`. Before v5.0.0, `/` and the auth layout tested `session?.user`, so `/login` sent an expired session to `/forms`, which sent it back: a redirect loop until the cookie was cleared. This is the reported "can't see the login page on a later visit", and F1 made every default session hit it 4h after sign-in. | Pre-E27 code (`dab5989^`); `@auth/core/lib/actions/session.js`. Five crafted cookies (valid, idle-expired, deleted user, empty claims, wrong secret) against today's code all reach `/login` correctly. | E27 fixed the two call sites. Return `null` from `jwt` so no caller can repeat the mistake. |
| F3 | **Five auth queries per page.** `auth()` is not memoized per request, and `getCurrentAccountId` calls `requireAuth` again. | Prisma query log for one `GET /forms`: 3 `passwordChangedAt` lookups, 2 `accountId` lookups. | One `cache()`d request context: user, platform role, membership. |
| F4 | **Role comes from the JWT.** A demoted Global Admin keeps the operator console until re-login, although each request already reads the user row. | `requireGlobalAdmin` reads `session.user.role`. | Read `roleCode` in the request context. Role changes apply on the next request. |
| F5 | **No throttle on sign-in, sign-up, or reset request.** `failedLoginCount` is written and never read. Reset requests can mail any registered address without limit. | `isRateLimited` is used only by the embed, submit, and contact paths. | Per-email and per-IP throttles; the per-email one returns the same generic error, so it reveals nothing. |
| F6 | **Rate-limit keys trust the client.** `getClientIP` takes the first `X-Forwarded-For` entry, which the client writes; Cloudflare appends. Rotating a fake header bypasses every existing limit. | `src/lib/validation.ts` `getClientIP`. | Prefer `CF-Connecting-IP`. Verify the header reaches the container on dev before relying on it. |
| F7 | **Reset tokens are stored in plaintext**, earlier tokens stay valid when a new one is issued, and validate-then-consume is not atomic. A database read yields working reset links for an hour. | `PasswordResetToken.token`; `resetPassword`. | Store a SHA-256 of the token, invalidate a user's open tokens on issue, consume with a conditional update. |
| F8 | **bcrypt cost 10 and silent 72-byte truncation.** Cost 10 is the OWASP floor (about 60ms here; 12 is about 250ms). Two passwords sharing a 72-byte prefix both verify. No maximum length anywhere. | Run in the container with the app's `bcrypt` 6.0.0. | Cost 12 for new hashes, rehash on successful sign-in; reject passwords over 72 bytes. |
| F9 | **Dormant `PrismaAdapter`.** Never called with credentials and JWT. | `docs/ACCOUNT_OPERATIONS.md` already says so. | Done (`1c65921`), which also left a single `@auth/core`. |
| F10 | **Dynamic imports with no purpose.** `getCurrentAccountId` does `await import("@/lib/db")` though `auth-utils` imports `@/lib/auth`, which imports `db` statically; four pages do `(await import("@/lib/auth-utils"))`. | `grep 'import("@/lib'` | `getCurrentAccountId`'s is gone (`2dc35b2`); the four pages go with the session work. |
| F11 | **Deleting a user deletes the forms they created.** `Form.createdByUser` is `onDelete: Cascade`. Harmless while user equals account; data loss once a member can be removed. | `prisma/schema.prisma` | Done (`4de566e`): `createdByUserId` nullable, `onDelete: SetNull`. |
| F12 | **Account deletion relies on the `User.accountId` cascade.** After the contract migration, `prisma.account.delete()` would leave the owner's `User` row: a login with no account. | Schema. | Done (`2dc35b2`): `deleteAccountAndSoleMembers`. |
| F13 | **`User.accountId` readers outside the helper.** The thumbnail route resolves the account itself; `email-queue`, `deleteAccount`, `setUserRole`, `setAccountPlan`, `listAccountsMetadata`, the seed, and `backfill-global-admin.mjs` read `User.accountId` or `Account.user`. | `grep -rn accountId` | Done (`2dc35b2`): all go through `src/lib/data-access/memberships.ts`. |
| F14 | **`deleteAccount` finds the operator by email**, and `listAccountsMetadata` runs one `form.findMany` per account. | `src/actions/accounts.ts`, `src/lib/data-access/accounts.ts`. | Session user id; one grouped query. |

Confirmed acceptable: password-change invalidation (per-request `passwordChangedAt` check), enumeration-safe reset request copy, the hard-delete model, the ownership helpers in `data-access/forms.ts`. Signup says "Email already registered", so sign-in timing (bcrypt only runs for known emails) leaks nothing signup does not.

**Design constraint from F2:** the login page and `/` must never depend on account resolution succeeding. With Membership's exactly-one assertion, a user with zero memberships would otherwise turn `/login` into an error page, the same symptom by another route.

## 5. Membership

```prisma
enum MembershipRole { OWNER MEMBER }

model Membership {
  id        String         @id @default(cuid())
  userId    String
  accountId String
  role      MembershipRole
  createdAt DateTime       @default(now())
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  account   Account        @relation(fields: [accountId], references: [id], onDelete: Cascade)
  @@unique([userId, accountId])
  @@index([accountId])
  @@map("memberships")
}
```

- `User.roleCode` (platform role, `GLOBAL_ADMIN`) and `Membership.role` (tenant role) are different things and stay separate.
- `getCurrentAccountId()` resolves through Membership and throws unless there is exactly one. The many-membership path is that throw.
- Signup creates Account, User, and an `OWNER` Membership in one write. Self-serve deletion requires `OWNER`.

**Two migrations** (done, `2dc35b2` and `95f04ad`). Coolify starts the new container, which runs `migrate deploy`, while the old one still serves.

1. **Expand** (`add_memberships`): create the enum and table, backfill one `OWNER` row per user with deterministic ids (`'mbr_' || user id`), drop `NOT NULL` on `users.accountId` (FK and cascade stay). Shipped with the code that stopped reading and writing the column.
2. **Contract** (`drop_user_account_id`): re-run the backfill for users that lack a membership (a signup the old container served mid-deploy), then drop the FK, unique index, and column. Verified in a scratch database migrated through step 1 with a user inserted the old way.

Both may ship in one release (D5).

## 6. Decisions

**D1. Auth library.** Michael: stay on NextAuth unless a rethink beats it. Proposal on the table: own the session layer (section 3, second pass), awaiting his go.

**D2. Real database in tests.** See Q8.

**D3. The request context is the session boundary.** One memoized loader returns user id, email, platform role, and account id. Pages, actions, and routes call it (through `requireAuth`, `getCurrentAccountId`, `requireGlobalAdmin`), never `auth()` directly.

**D4. Membership by hand, not the organization plugin.** Section 3.

**D5. Both Membership migrations may ship in one release.** The brief's two migrations stay, so each step is independently safe, but holding the contract step for a later production release only protected real users from a minute of errors on the old container during the deploy, and there are none yet (Michael, 2026-10-15). The contract migration's re-backfill covers any signup in that window anyway.

**D6. `Account.status` gates nothing yet.** `ACTIVE | PAST_DUE | CANCELLED`, default `ACTIVE`, plus free-text `billingRef`, set from the operator console and logged like `setAccountPlan`. What a status should block (publishing, Sites builds, sign-in) gets decided when there is something to gate. Confirmed by Michael 2026-10-15; done in `f7e271b` and `ecbe328`.

**D7. No CI in E28.** Michael, 2026-10-15: not in scope, and not a prerequisite for the MVP. `npm test` runs in the dev container as part of the pre-commit gate. Revisit when E31's guardrails land or a second person commits to the repo; the Engineering QA page lists it as an open gap.

## 7. Acceptance

- [ ] Q7 decided with Michael; Q8 in place and `npm test` passing in the container
- [ ] F1 to F14 resolved or explicitly deferred here
- [ ] Signup, login, reset, change password, delete account, operator account list, role and plan changes work unchanged on both hosts
- [x] Every account lookup goes through `src/lib/data-access/memberships.ts`; `User.accountId` is dropped
- [x] Both migrations read and verified per `docs/AGENT_CONTEXT.md` §5
- [x] Operator can set `Account.status` and `billingRef`
- [ ] `npm run build`, `npm run lint`, `npm test` pass

## 8. Progress log

- 2026-10-15: Brief read; audit run against the dev stack (section 4); Q7 researched and recommendation written; Michael reported the login-page cookie problem, traced to F1 plus F2.
- 2026-10-15: Vitest in place (Q8). `next-auth` bumped to `beta.32` and the adapter removed. Engineering collective QA page created. Waiting on Michael for Q7 before the session and sign-in fixes.
- 2026-10-15: Michael: stay on NextAuth unless a rethink beats it; no real users, so ship the Membership migrations together; status gates nothing; no CI now. Proposed owning the session layer. Built Membership (expand and contract), the form-creator fix, and account status and billing with operator UI; 29 tests.
- Build note: `next build` in the dev container intermittently fails fetching Google Fonts (`TLS-related` error from Turbopack); a rerun passes unchanged, as in E27. Self-hosting the fonts with `next/font/local` would make builds independent of the network. Follow-up, not E28.

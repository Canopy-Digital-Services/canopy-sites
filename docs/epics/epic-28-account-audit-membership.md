# Epic 28: Account Audit and Membership Model

**Status:** In progress (audit recorded; Q7 awaiting Michael)
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

- **NextAuth.** v5 never left beta. `5.0.0-beta.31` (2026-04-14) and `beta.32` (2026-07-20) were security releases; we run `beta.30`, which is inside the range of GHSA-8fpg-xm3f-6cx3 / CVE-2026-73421 (config errors make existence-based auth checks fail open; GitHub rates it critical, fixed in `beta.32`). Our checks read `session.user.id`, not existence, but the bump is due regardless. The Better Auth team maintains it for security fixes only (announcement 2025-09-22; Better Auth joined Vercel 2026-07); no end-of-support date. Peer range covers Next 16.
- **What NextAuth does for us.** Credentials `authorize`, JWT encryption, cookies, sign-in CSRF, `auth()`. Signup, reset, change password, failed-login tracking, timeouts, and DB validation are already ours. The `PrismaAdapter` is configured and never called.
- **Better Auth** (`1.7.10`, 2026-10-15; peers Next 14 to 16, Prisma 5 to 7) would give database sessions and maintained email/password flows, but against our requirements:
  - **Organization plugin** wants to own the tenant: `organization.name` and a unique `slug` are NOT NULL, the `invitation` table is always created, roles are lowercase strings, `allowUserToCreateOrganization` defaults to true, and `activeOrganizationId` goes on the session. Our `Account` carries plan, resolution state, status, billing, forms, and soon sites. E28 needs one join table and a resolver.
  - **API key plugin** (`@better-auth/api-key`) owns keys by user or organization only. E34 keys are scoped to one site, so the scope check would be our code either way (PRD D9 puts guardrails in our tool layer).
  - **Sessions** have no absolute cap (feature request #10405 open); `rememberMe: false` is a fixed one-day row. Our 4h/7d idle with 7d/30d absolute policy would be custom code again. Server components cannot refresh its cookie either.
  - **Rate limiting** is per IP, in memory, and needs `trustedProxies` for our Cloudflare to Traefik chain; no per-account lockout (#10724). `revokeSessionsOnPasswordReset` defaults to false, with an open race (#11648).
  - **Risk now.** Open #11737 (2026-10-13): an adapter `delete()` with an empty `where` wipes the whole table on Prisma. 27 advisories published in 2026, mostly SSO, SCIM, and the OAuth provider, three in core. Migration needs a `user.name` column, a credential row per user, `session` and `verification` tables renamed off our `accounts`, a `$2` branch in `verify` (no rehash-on-login, #10289), a rewrite of about 15 files, new env vars on both Coolify apps, and one forced sign-out of everyone.
- **The findings in section 4 are cheap to fix in place**, and both mechanisms were verified: a `proxy.ts` that re-exports `auth` re-issues the cookie on every navigation with `expiresAt` advanced and `sessionIssuedAt` and `absoluteExpiresAt` unchanged (F1); `@auth/core` returns no session and clears the cookie when the `jwt` callback returns `null` (F2).

**Recommendation.** Stay on NextAuth v5, bumped to `beta.32`. Build Membership by hand; it does not depend on the library. Keep `next-auth` imports confined to `src/lib/auth.ts`, `src/lib/auth-utils.ts`, the `(auth)` pages, `src/actions/auth.ts`, and the account deletion client call, so a later swap touches only those. **Revisit at E34**, where Better Auth's `@better-auth/oauth-provider` and `@better-auth/mcp` would cover the PRD's "OAuth later" for the MCP endpoint, or sooner if: an advisory hits the credentials or JWT path and goes unpatched for 30 days, or a Next.js major we need falls outside `next-auth`'s peer range.

### Q8. Test runner: Vitest (decided in the brief)

Vitest in `apps/portal`, run inside the dev container like the build. Two kinds of test:

- **Unit** (`*.test.ts` beside the code): pure decisions with no I/O. The session-token evaluation is extracted from the `jwt` callback for this.
- **Database** (`*.db.test.ts`): against a separate `canopy_test` database on the dev Postgres, migrated with `prisma migrate deploy` before the run and truncated between files. Prisma is never mocked: the bugs worth catching here live in queries and cascades.

`npm test` joins `build` and `lint` as a must-pass check. The cross-project policy (what must have tests, how CI runs them) lives on the Engineering collective's QA page, not here.

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
| F9 | **Dormant `PrismaAdapter`.** Never called with credentials and JWT. | `docs/ACCOUNT_OPERATIONS.md` already says so. | Remove it and `@auth/prisma-adapter`. |
| F10 | **Dynamic imports with no purpose.** `getCurrentAccountId` does `await import("@/lib/db")` though `auth-utils` imports `@/lib/auth`, which imports `db` statically; four pages do `(await import("@/lib/auth-utils"))`. | `grep 'import("@/lib'` | Static imports. |
| F11 | **Deleting a user deletes the forms they created.** `Form.createdByUser` is `onDelete: Cascade`. Harmless while user equals account; data loss once a member can be removed. | `prisma/schema.prisma` | `createdByUserId` nullable, `onDelete: SetNull`. |
| F12 | **Account deletion relies on the `User.accountId` cascade.** After the contract migration, `prisma.account.delete()` would leave the owner's `User` row: a login with no account. | Schema. | Delete the account and every user whose only membership it was, in one transaction. |
| F13 | **`User.accountId` readers outside the helper.** The thumbnail route resolves the account itself; `email-queue`, `deleteAccount`, `setUserRole`, `setAccountPlan`, `listAccountsMetadata`, the seed, and `backfill-global-admin.mjs` read `User.accountId` or `Account.user`. | `grep -rn accountId` | The Membership change's touch list. All session-side lookups go through `getCurrentAccountId`. |
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

**Two migrations, two deploys.** Coolify starts the new container, which runs `migrate deploy`, while the old one still serves. So:

1. **Expand** (`add_memberships`): create the enum and table, backfill one `OWNER` row per user, drop `NOT NULL` on `users.accountId` (FK and cascade stay). Ships with the code that stops reading and writing the column.
2. **Contract** (`drop_user_account_id`): re-run the backfill for users that lack a membership (signups served by the old container during the switchover), then drop the column. **Ships in a later deploy, to dev and to prod, only after the expand release is live in production.** It waits on a branch until then, so no dev to main release can carry both.

## 6. Decisions

**D1. Stay on NextAuth for E28** (pending Michael; section 3).

**D2. Real database in tests.** See Q8.

**D3. The request context is the session boundary.** One memoized loader returns user id, email, platform role, and account id. Pages, actions, and routes call it (through `requireAuth`, `getCurrentAccountId`, `requireGlobalAdmin`), never `auth()` directly.

**D4. Membership by hand, not the organization plugin.** Section 3.

**D5. Contract migration in its own release.** Section 5.

**D6. `Account.status` gates nothing yet.** `ACTIVE | PAST_DUE | CANCELLED`, default `ACTIVE`, plus free-text `billingRef`, set from the operator console and logged like `setAccountPlan`. What a status should block (publishing, Sites builds, sign-in) gets decided when there is something to gate.

## 7. Acceptance

- [ ] Q7 decided with Michael; Q8 in place and `npm test` passing in the container
- [ ] F1 to F14 resolved or explicitly deferred here
- [ ] Signup, login, reset, change password, delete account, operator account list, role and plan changes work unchanged on both hosts
- [ ] Every session-side `accountId` lookup goes through `getCurrentAccountId`; nothing reads `User.accountId`
- [ ] Both migrations read and verified per `docs/AGENT_CONTEXT.md` §5; the contract migration deployed separately
- [ ] Operator can set `Account.status` and `billingRef`
- [ ] `npm run build`, `npm run lint`, `npm test` pass

## 8. Progress log

- 2026-10-15: Brief read; audit run against the dev stack (section 4); Q7 researched and recommendation written; Michael reported the login-page cookie problem, traced to F1 plus F2.

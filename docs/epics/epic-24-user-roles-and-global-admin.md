# Epic 24: User Roles & Global Admin

**Version:** v4.12.0
**Date:** TBD
**Status:** Draft

## Summary

Replace the env-var-gated operator console with a first-class role system. Introduce a `Role` catalog keyed by code, assign one role per user, and shift operator gating from `ADMIN_EMAIL` equality to `user.role.code === "GLOBAL_ADMIN"`. Any Global Admin can grant or revoke the role via the operator console, and newly promoted Global Admins are automatically moved to the `UNLOCKED` plan so they are never subject to their own published-form cap. A new "Operator Console" link appears in the profile dropdown for users with the role; for everyone else the dropdown is unchanged. The `Role` shape mirrors `Plan` so additional roles (support, account-scoped admin, billing-only, future multi-tenant) land as data and typed-column migrations, not a model refactor.

Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work.

## Scope

**In:**
- `Role` catalog model, seeded with `USER` and `GLOBAL_ADMIN`.
- `User.roleCode` FK to `Role`, defaulted to `"USER"`.
- `requireGlobalAdmin` helper that replaces `requireOperator`. `ADMIN_EMAIL` is no longer consulted at auth-check time; it is a bootstrap-only hint used by `prisma/seed.ts` and the backfill migration to mint the first Global Admin.
- Operator console gets a `Role` column on the accounts table and a `Change Role` action that opens a modal preselected to the user's current role.
- Promoting a user to `GLOBAL_ADMIN` sets that user's account `planCode` to `UNLOCKED` automatically, wrapped in the same transaction as the role change. Demotion does not revert the plan.
- Admin profile dropdown shows a new **Operator Console** link above "Manage Account" when the signed-in user has `GLOBAL_ADMIN`. Hidden otherwise.
- Session exposes `role` so client components and server helpers can read it without a per-request DB lookup. Role is read from the JWT; a deploy or re-login is required for a role change to take effect for the affected user (see Design decisions).
- Backfill migration: users whose email matches `ADMIN_EMAIL` at migration time become `GLOBAL_ADMIN` and their accounts are moved to `UNLOCKED`. If no match exists, the migration logs a warning but does not fail.
- Safety guards:
  - A Global Admin cannot demote themselves.
  - The system must keep at least one `GLOBAL_ADMIN`; the last one cannot be demoted or have their account deleted.
- `docs/ACCOUNT_OPERATIONS.md` updated: the "Operator Account Management" section now reads from roles, not env.

**Out (explicitly deferred):**
- Account-scoped roles (e.g., account admin, account member). Today's single-user-per-account model does not need them, and shipping them before multi-tenant would be dead weight.
- Fine-grained capability flags (`canChangePlans`, `canViewBilling`, etc.). `GLOBAL_ADMIN` is monolithic for now. Capabilities become typed columns on `Role` or a separate `Capability` catalog when a second non-basic role lands.
- Self-serve role management by users. All role changes are Global-Admin-only.
- Audit log persistence. Role changes are logged to stdout like plan changes; a persisted audit trail remains a follow-up.
- Email notification on role change.
- Multi-tenant user-account join (`UserAccount` / `Membership`). Covered by a future epic; this epic is deliberately shaped to preempt the refactor without performing it.
- OAuth/SSO-driven role provisioning.
- UI for creating or editing roles at runtime. The catalog is seed-only, same as plans.

## Why a role catalog, not an enum

Two shapes were considered:

1. `enum UserRole { USER, GLOBAL_ADMIN }` on `User`.
2. `Role` catalog table with `User.roleCode` as FK.

The catalog wins for three reasons, all of which matter only if a third role is likely to ever ship:

- **Symmetry with `Plan`.** The codebase already has one catalog-style lookup (`Plan`). A second one follows the same pattern, which keeps call sites predictable (`user.role.displayName`, `account.plan.displayName`).
- **Additive extension.** New roles arrive as seed rows, not migrations; metadata like display name, description, and (future) capability flags ride on the catalog instead of scattering across code.
- **No enum churn.** Every new Prisma enum member is a migration and a regenerate. One migration per role is not expensive, but it is needless ceremony once a second role is in view.

Today's role set is small enough that either shape works. The catalog is chosen because it is cheaper to add the second role with this shape than to convert from an enum later.

## Why Global Admin, not Superuser

"Global Admin" reads clearly to non-technical users, is consistent with the "Manage Account" language already in the profile menu, and scales naturally when multi-tenant lands ("Global Admin" vs "Account Admin"). "Superuser" carries Unix and database-administration connotations that do not match the audience or the product voice.

## Schema

```prisma
// Role catalog. Seeded via migration; not user-editable at runtime.
// User.roleCode references Role.code. Future capability flags land as
// typed columns, not JSON, so each new permission is an explicit migration.
model Role {
  code        String  @id               // "USER" | "GLOBAL_ADMIN"
  displayName String
  description String?
  isPublic    Boolean @default(true)    // false reserves roles for internal use
  sortOrder   Int     @default(0)

  users User[]

  @@map("roles")
}

model User {
  // ...existing fields unchanged...
  roleCode String @default("USER")

  role Role @relation(fields: [roleCode], references: [code])

  @@index([roleCode])
}
```

Seed data:

| code           | displayName    | isPublic | sortOrder | Notes |
|----------------|----------------|----------|-----------|-------|
| `USER`         | User           | true     | 10        | Default for new signups |
| `GLOBAL_ADMIN` | Global Admin   | false    | 90        | Operator console access; UNLOCKED plan auto-granted |

Shape notes:

- `Role.code` as a string primary key keeps the role legible in queries, logs, and session payloads. Matches `Plan.code`.
- `isPublic` is a placeholder for any future role discoverability UI (unlikely). It defaults to `true` so new operational roles can be marked internal without a default scramble.
- `roleCode` lives on `User`, not `Account`. When multi-tenant arrives, the global role stays on `User` (it is still a property of the person) and account-scoped roles land on a new `Membership` join. A Global Admin with a `Membership` inherits org-level capabilities by virtue of the global role; this is an additive change to the helpers, not a schema rewrite.
- No changes to `Account` in this epic. Plan-change side effects of a promotion run through the existing `setAccountPlan` path so there is one way to change a plan.

## Data access & helpers

- `src/lib/data-access/roles.ts` (new)
  - `listRoles()` returns all roles ordered by `sortOrder`.
  - `getRole(code)` returns one or throws.
- `src/lib/auth-utils.ts`
  - `requireGlobalAdmin()` replaces `requireOperator()`. Reads the role from the session; on mismatch, redirects to `/forms` exactly as today.
  - `requireOperator()` remains as a thin alias that delegates to `requireGlobalAdmin()` for a single commit before call sites are renamed. Remove in the same epic once every call site is migrated. No long-lived shim.
  - `getCurrentUserRole()`: server-side helper that returns `{ code, displayName }` from session (no DB lookup).
- `src/lib/data-access/accounts.ts`
  - `AccountMetadata` extends with `roleCode` and `roleDisplayName`.
  - Single query joins `user.role` alongside the existing plan join.

## Session shape

`next-auth` JWT and session gain a `role` claim so server components and the profile dropdown can check it without hitting the database on every render.

- `authorize()` in `src/lib/auth.ts` returns `role: user.roleCode` alongside existing fields.
- JWT callback encodes `token.role`.
- Session callback maps `token.role` onto `session.user.role`.
- `src/types/next-auth.d.ts` adds `role: string` to `Session["user"]`, `User`, and `JWT`.

A role change takes effect for the affected user only on their next login or token refresh. This is explicit in the UI copy of the operator modal ("the user will see the new role on next login") and matches how plan changes already behave.

## Server actions

- `src/actions/admin/roles.ts` (new, Global-Admin-gated via `requireGlobalAdmin`)
  - `setUserRole(userId, roleCode)`:
    1. Validate `roleCode` against the catalog.
    2. Load the target user with their account.
    3. Reject if actor is trying to change their own role (self-demotion guard).
    4. If the target is currently `GLOBAL_ADMIN` and the new role is not, reject when this would drop the total `GLOBAL_ADMIN` count to zero (last-admin guard).
    5. In a single transaction:
       - Update `user.roleCode`.
       - If promoting to `GLOBAL_ADMIN` and the account's `planCode !== "UNLOCKED"`, update `planCode = "UNLOCKED"` on the account. The plan's normal downgrade-resolution flow does not apply here because `UNLOCKED` is unlimited (cap cannot be exceeded).
    6. Log `{ actorEmail, actorUserId, targetUserId, targetEmail, fromRole, toRole, planAutoUpgraded, at }` to stdout.
    7. `revalidatePath("/operator/accounts")`.
- `src/actions/accounts.ts`
  - `deleteAccount(accountId)` gains the last-Global-Admin guard: if the target account's user is the only `GLOBAL_ADMIN`, reject with a clear error. The existing "cannot delete your own account" guard is unchanged.

Promotion does not run through `setAccountPlan`; it writes the plan inline in the same transaction. This is deliberate: `setAccountPlan` carries the downgrade-resolution machinery, which is never needed for an upgrade to `UNLOCKED`, and threading the promotion through it would invoke that machinery for a case where it cannot fire. The plan change is still logged by `setUserRole` so there is a single auditable event for the promotion.

## Enforcement points

- **Operator console (`/operator/*`)**: guard moves from `ADMIN_EMAIL` comparison to `requireGlobalAdmin()`.
- **`setAccountPlan`, `setUserRole`, `deleteAccount`**: all three continue to require Global Admin.
- **Profile dropdown link visibility**: derived from session role in the server layout; the client dropdown receives an `isGlobalAdmin` prop and shows or hides the link accordingly. No client-side role check against session claims the server did not also perform.
- **Sign-in is never role-gated.** A user whose role drops to `USER` mid-session does not get signed out; they lose the operator affordances on the next page load (because the session role still reflects the pre-change claim until they re-authenticate, at which point everything re-aligns). This matches current behavior for plan changes and is called out in verification.

## UI

### Profile dropdown (`src/components/patterns/user-menu.tsx`)

New top-of-menu entry when `isGlobalAdmin`:

```
┌─ email@example.com ─────────┐
├─────────────────────────────┤
│ 🛡️  Operator Console         │  ← new, conditional
│ ⚙️  Manage Account           │
│ 📖  Help                     │
├─────────────────────────────┤
│ ⏻  Sign Out                  │
└─────────────────────────────┘
```

- Icon: `Shield` from `lucide-react`.
- Link target: `/operator/accounts`.
- Component signature becomes `UserMenu({ email, isGlobalAdmin })`. Both admin layout and operator layout pass this.

### Operator console accounts table (`src/app/operator/accounts/page.tsx`)

- New `Role` column between `Plan` and `Actions`, rendered as a `Badge`. `USER` uses `variant="secondary"`; `GLOBAL_ADMIN` uses `variant="default"` so it stands out.
- New `Change Role` action alongside `Change Plan` and `Delete`. Button sits before the plan button to match the read-order of the row.
- Modal (`change-role-button.tsx`, new) follows the `ChangePlanButton` pattern exactly:
  - `Select` of all roles, preselected to the current role.
  - Helper copy under the select: "The change takes effect on the user's next login."
  - When promoting to `GLOBAL_ADMIN` from a non-`UNLOCKED` plan, show an info callout: "This will also move {email}'s account to the Unlocked plan so they are never limited by their own form cap."
  - When demoting the current user (self), the modal never opens: the button is disabled with a tooltip "You cannot change your own role."
  - When demoting the last remaining Global Admin, the action button inside the modal is disabled with a tooltip "At least one Global Admin is required."
  - Submit handler calls `setUserRole`, toasts on success, toasts the server error on failure.
- Operator console header copy unchanged ("Operator Console"). The name of the destination stays; only the gating mechanism changes.

### Accounts data

`AccountMetadata` grows two fields; table reads them directly. No separate fetch.

## Migration & backfill

One migration, applied in this order:

1. `CREATE TABLE roles` and seed the two rows.
2. `ALTER TABLE users ADD COLUMN role_code TEXT NOT NULL DEFAULT 'USER' REFERENCES roles(code)`.
3. Backfill step (reviewable script, not raw SQL):
   - Find the user whose email matches `ADMIN_EMAIL` (case-insensitive, trimmed) at migration time.
   - If found: set `role_code = 'GLOBAL_ADMIN'` on that user, and set `plan_code = 'UNLOCKED'` on their account (both in one transaction).
   - If not found: log a warning ("No user matched ADMIN_EMAIL; no Global Admin created. Use the seed script or manually promote a user after first signup.") and continue.

`prisma/seed.ts` is updated so that when it creates the initial admin user, it sets `roleCode = 'GLOBAL_ADMIN'` at insert time. The existing behavior of moving the seed account to `UNLOCKED` is preserved.

The backfill is one-shot; subsequent deploys do not re-run it. Signup continues to create users with the `USER` default.

`ADMIN_EMAIL` is no longer read by the application at runtime. It stays documented as a bootstrap-time seed hint and is explicitly listed as optional in `docs/AGENT_CONTEXT.md` section 6. The env var is kept (not removed) so existing deployments do not need to edit their Coolify config to complete this migration cleanly; its role shrinks but the variable itself stays valid.

## Design decisions

- **Role on User, not Account.** The role is a property of the person, not of the tenant. When multi-tenant lands, account-scoped memberships will layer on top of this; the global role stays put.
- **Catalog table over enum.** Symmetry with `Plan`, additive extension, fewer migrations as the role set grows. The price is one extra join per user load, which is already happening for `Account.plan`.
- **Promotion auto-upgrades the plan; demotion does not downgrade.** A promotion has a clear rationale for removing the cap. A demotion has ambiguous rationale (the user may still need their existing forms live). Silent downgrade on demotion would risk unpublishing live forms, which is exactly the churn the Epic 23 resolution flow was designed to avoid. Operators can change the plan explicitly if the policy demands it.
- **Plan change on promotion is inline, not through `setAccountPlan`.** Avoids needlessly threading through the downgrade-resolution machinery for a guaranteed-upgrade case. Still logged via the role-change event for traceability.
- **Session carries role; DB lookup is not on the hot path.** Matches how the session already carries `id` and `email`. Role changes propagate on re-login, same model as plan changes today. A forced sign-out on demotion would be friendlier; it is deferred because it adds session-invalidation machinery that this epic does not otherwise need.
- **`ADMIN_EMAIL` becomes bootstrap-only.** Removing it as a runtime gate is the central point of the epic. Keeping it as a seed hint preserves the one-user-one-env-var onboarding path for fresh deployments.
- **Last-admin and self-demotion guards at the server action, not the UI.** The UI reflects them for feedback, but the server is authoritative. A request that somehow bypasses the UI still cannot brick the deployment.
- **Operator URL stays `/operator/*`.** The route name is incidental; changing it would be busywork. The gate is what matters.
- **No capabilities yet.** `GLOBAL_ADMIN` is a single bit in this epic. Capability flags arrive when a second non-basic role needs them; today there is nothing to factor out.

## Verification

- **Migration on clean DB**: deploy against a fresh database → `USER` and `GLOBAL_ADMIN` rows seeded; seed script creates the first admin user with `roleCode = "GLOBAL_ADMIN"` and `planCode = "UNLOCKED"`; new signups default to `USER`.
- **Migration on existing DB with ADMIN_EMAIL set**: user matching `ADMIN_EMAIL` becomes `GLOBAL_ADMIN` and their account moves to `UNLOCKED`. Every other user stays `USER`. Operator console loads for that user; redirects for everyone else.
- **Migration on existing DB with ADMIN_EMAIL unset**: backfill logs the warning, no user is promoted, `/operator/*` is inaccessible until a user is promoted (via seed script, ops script, or manual SQL one-time).
- **New signup**: user has `roleCode === "USER"`; profile dropdown shows no Operator Console entry; `/operator/*` redirects to `/forms`.
- **Role promotion happy path**: Global Admin opens `/operator/accounts`, clicks Change Role on a `USER` row, selects `GLOBAL_ADMIN`, confirms. Toast confirms success. The target account's plan becomes `UNLOCKED` in the same transaction (visible in the Plan column after revalidation). On the target user's next login, their profile dropdown shows Operator Console and `/operator/*` loads.
- **Role demotion**: a `GLOBAL_ADMIN` demotes a peer (not themselves). On peer's next login, the Operator Console entry disappears and `/operator/*` redirects. Peer's plan remains `UNLOCKED` (no automatic downgrade).
- **Self-demotion guard**: a Global Admin cannot change their own role. Button is disabled with tooltip; direct server-action call throws.
- **Last-admin guard**: in a state with exactly one `GLOBAL_ADMIN`, demoting them is blocked. Action button disabled in modal; direct server-action call throws. Deleting their account is blocked with a matching error.
- **Session claim propagation**: after a role change, the operator's own session is unaffected (they still see the console) because their role did not change. A newly promoted peer sees the console only after re-authenticating.
- **Operator console table**: shows `Role` column with the correct badge; `Change Role` modal preselects current role; info callout appears when promoting a non-`UNLOCKED` account; disabled states render the correct tooltip copy.
- **Profile dropdown visibility**: rendered with `isGlobalAdmin={true}` shows the Operator Console entry with the Shield icon; `false` hides it. Admin layout and operator layout both pass the flag correctly.
- **Stdout audit line**: role change emits a single JSON log line with `event: "setUserRole"` and all listed fields populated.

## Follow-up epics (not in scope here)

- **Session invalidation on role change.** Force sign-out (or JWT revocation) on the affected user when a role is demoted. Today the change lands on next login; this is acceptable but not ideal.
- **Capability flags on `Role`.** Add typed boolean columns for finer-grained operator capabilities (billing read-only, support view, etc.) when a second non-basic role is needed.
- **Persisted audit log** for role and plan changes, tied to the same epic that persists billing events.
- **Multi-tenant `Membership`.** Join user ↔ account with an account-scoped role. The global role from this epic persists as the "admin of everything" layer.
- **Operator-console UI for role management at scale.** Bulk role changes, filter by role in the accounts table, search by email.

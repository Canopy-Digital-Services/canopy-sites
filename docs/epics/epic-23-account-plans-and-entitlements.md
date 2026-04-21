# Epic 23: Account Plans & Entitlements

**Version:** v4.11.0 (proposed)
**Date:** TBD
**Status:** Planned

## Summary

Introduce a first-class plan catalog and attach every account to a plan. Plans carry entitlements (today: max **published** form count; later: hosting, pay-per-form add-ons, seat limits, storage caps). This epic ships two live plans, `FREE` and `UNLOCKED`, enforces the free published-form limit at publish time, and handles plan downgrades by unpublishing all live forms and prompting the user to pick which ones stay live within the new cap. The schema and data-access layer are shaped so that adding `HOSTING`, `PAID`, `Subscription`, and pay-per-form add-ons is a data or follow-up-epic change, not a refactor.

Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work.

## Scope

**In:**
- `Plan` catalog model, seeded with `FREE`, `HOSTING`, `PAID`, `UNLOCKED` (only `FREE` and `UNLOCKED` are reachable; `HOSTING` and `PAID` are present in the catalog but not assigned via signup or operator UI yet).
- `Account.planCode` FK to `Plan`, defaulted to `FREE` for new accounts.
- `Account.requiresPlanResolution` flag, set when a downgrade drops the cap below the account's live form count.
- `getAccountEntitlements(accountId)` data-access helper returning `{ planCode, maxPublishedForms, publishedFormsCount, totalFormsCount, canPublishAnother, requiresPlanResolution }`.
- **Prerequisite fix**: extend `published` enforcement to every ingestion path (`/api/embed/[formId]` GET and POST, `/api/submit/[formId]` POST) so that `published = false` means "not accepting responses anywhere," not just the hosted URL. This closes a pre-existing gap and is required for licensing to have teeth.
- Enforcement in `publishForm` / `toggleFormPublished` that rejects when the account would exceed `maxPublishedForms`.
- Plan-resolution flow when a downgrade drops the cap below current live count: server unpublishes **all** of the account's forms, sets `requiresPlanResolution = true`, and the next admin session is greeted with a blocking dialog that walks the user through re-publishing up to the new cap.
- UI: admin forms list shows the publish toggle disabled with an explanatory tooltip when `canPublishAnother === false`; account dashboard shows a read-only plan + "Published forms: N of M" line.
- Operator console: show plan on the accounts table; allow changing an account's plan via a modal. Change is logged to stdout (persisted audit trail is deferred).
- Backfill migration: all existing accounts default to `FREE`, then the operator's account and any account with more than one **published** form move to `UNLOCKED` to avoid retroactive lockout.

**Out (explicitly deferred):**
- Billing integration (Stripe or otherwise). No webhooks, no checkout, no payment UI.
- Subscription lifecycle (status, period, trial, dunning). The `Plan` FK is a simple pointer for now; `Subscription` lands with billing and drives plan changes automatically on lapse.
- Pay-per-form add-ons. The entitlement resolver is shaped to aggregate plan + add-ons later, but no add-on model ships here.
- Self-serve plan upgrades. Plan changes are operator-only until billing is wired.
- Caps on total form count (drafts). A free user can keep arbitrarily many drafts; the license applies to publishing.
- Automatic email notifications on downgrade. The resolution dialog is the only notification channel in this epic; billing-triggered email lands with the billing epic.
- Deletion of forms on downgrade. Data is preserved; only the `published` flag is flipped.
- Entitlement enforcement on non-publish surfaces (editing fields, viewing submissions, exporting, etc.).

## Why published, not total

Free accounts can draft freely; the license applies to what's actively collecting responses. This matches the user's framing ("make them choose the one that stays published") and keeps the cost-bearing resource (live endpoints) separate from creative work in progress. It also means the limit hook is a single well-defined transition (draft to published), not every `createForm` call.

## Prerequisite: close the published-enforcement gap

Today, `Form.published` gates only the hosted `/f/[formId]` page (via `getPublishedForm` in `src/lib/data-access/forms.ts`). The embed GET/POST (`src/app/api/embed/[formId]/route.ts`) and manual submit (`src/app/api/submit/[formId]/route.ts`) do not check `published` at all. Without fixing this, an "unpublished" free-tier form would still accept embed traffic, and the entire licensing model is theoretical.

The prerequisite work:

- In `handlePublicSubmit` (`src/lib/public-submit.ts`), reject with the same friendly "not accepting responses" shape the hosted page uses when `form.published === false`. Return 403 (or a stable "inactive" status) with the `Access-Control-Allow-Origin` headers still set so embed clients render their own inactive state.
- In the embed GET handler, return 403 when `published === false` so the embed bundle does not render a form that cannot be submitted.
- Update the embed script's error handling to surface an "inactive form" state gracefully (copy owned by `embed/src/*`, rebuilt via `npm run embed:build`).

This fix lands as the first commit of the epic and is verifiable on its own.

## Schema

```prisma
// Plan catalog. Rows are seeded; not user-editable at runtime.
model Plan {
  code               String  @id            // "FREE" | "HOSTING" | "PAID" | "UNLOCKED"
  displayName        String
  description        String?
  maxPublishedForms  Int?                   // null = unlimited
  isPublic           Boolean @default(true) // false hides from future self-serve upgrade UI
  sortOrder          Int     @default(0)

  accounts Account[]

  @@map("plans")
}

model Account {
  id                       String   @id @default(cuid())
  createdAt                DateTime @default(now())
  planCode                 String   @default("FREE")
  requiresPlanResolution   Boolean  @default(false)

  plan          Plan           @relation(fields: [planCode], references: [code])
  user          User?
  forms         Form[]
  notifications Notification[]

  @@index([planCode])
  @@map("accounts")
}
```

Shape notes:

- `Plan.code` as the primary key (string) keeps seed data legible in queries and migrations and lets code reference plans by constant (`"FREE"`, `"UNLOCKED"`) without a join.
- `maxPublishedForms Int?` with `null = unlimited` is the one entitlement field in this epic. Additional entitlements get their own typed columns as they land. A JSON `entitlements` blob was rejected: typed columns keep enforcement honest and migrations explicit.
- `isPublic` is the hook for the future self-serve upgrade UI. `UNLOCKED` is non-public; `FREE`, `HOSTING`, `PAID` are public when billing ships.
- `requiresPlanResolution` is a one-bit flag. Set when a plan change drops the cap below the account's live form count; cleared when the user submits a valid selection through the resolution flow. No reason enum, no history; a single bit keeps the state machine tight.
- No `Subscription` table yet. When billing lands, `Subscription` joins `Account` to `Plan` with lifecycle state, and `Account.planCode` either becomes a cached pointer or is replaced by `account.activeSubscription.planCode`. The migration is a follow-up epic, not a refactor of this work, because every entitlement check already funnels through `getAccountEntitlements`.

Seed data (applied via migration or `prisma/seed.ts`):

| code       | displayName | maxPublishedForms | isPublic | Notes |
|------------|-------------|-------------------|----------|-------|
| `FREE`     | Free        | 1                 | true     | Default for new accounts |
| `HOSTING`  | Hosting     | 10                | true     | Placeholder cap; not reachable until billing ships |
| `PAID`     | Paid        | null              | true     | Placeholder; not reachable until billing ships |
| `UNLOCKED` | Unlocked    | null              | false    | Operator-granted; internal / VIP accounts |

## Data access

- `src/lib/data-access/plans.ts` (new)
  - `listPlans()` returns all plans ordered by `sortOrder`.
  - `getPlan(code)` returns one or throws.
- `src/lib/data-access/entitlements.ts` (new)
  - `getAccountEntitlements(accountId)` returns
    ```ts
    {
      planCode: string;
      maxPublishedForms: number | null;
      publishedFormsCount: number;
      totalFormsCount: number;
      canPublishAnother: boolean;
      requiresPlanResolution: boolean;
    }
    ```
  - Single query with plan join and two `_count`s (filtered by `published`).
  - `canPublishAnother` is derived here so callers do not re-implement the comparison.
- `src/lib/data-access/accounts.ts`
  - Extend `AccountMetadata` with `planCode` and `planDisplayName` (for the operator table).
  - Keep `formsCount` as total; add `publishedFormsCount` for the operator table's plan column context.

## Server actions

- `src/actions/forms.ts`
  - `createForm` is **not** gated. Forms are created unpublished (`published: false` by default).
  - `toggleFormPublished(formId, published)` (existing at `src/actions/forms.ts:390`):
    - If `published === true`, call `getAccountEntitlements(accountId)` first. If `canPublishAnother === false`, throw `PlanLimitError({ reason: "MAX_PUBLISHED_FORMS_REACHED", planCode, maxPublishedForms })`.
    - If `published === false`, no gate.
    - If `requiresPlanResolution === true`, reject with `PlanResolutionRequiredError` so the caller is forced through the resolution dialog instead of piecemeal publishing.
- `src/actions/admin/plans.ts` (new, operator-gated via `requireOperator`)
  - `setAccountPlan(accountId, planCode)`:
    1. Validate `planCode` against the catalog.
    2. Read the target account's current published form count and the target plan's `maxPublishedForms`.
    3. If the new cap is non-null and current published count exceeds it: wrap in a transaction, set `published = false` on **all** of that account's forms, set `requiresPlanResolution = true`, update `planCode`.
    4. Otherwise: update `planCode` only.
    5. Log `{ actorEmail, targetAccountId, fromPlan, toPlan, unpublishedCount, at }` to stdout.
- `src/actions/plan-resolution.ts` (new)
  - `resolvePlan(selectedFormIds: string[])`:
    - Requires `requiresPlanResolution === true`.
    - Validates `selectedFormIds.length <= maxPublishedForms` (or allows any count if unlimited, which happens if the account was re-upgraded before resolving).
    - Validates every id belongs to the account.
    - In a transaction: set `published = true` on the selected forms, clear the flag.
    - Zero-selection is allowed (user keeps everything as draft).

## Enforcement points

- **Publishing a form**: `toggleFormPublished` is the single enforcement point for the form-count entitlement.
- **Ingestion paths** (`/api/embed/[formId]`, `/api/submit/[formId]`, hosted page): already gated by the prerequisite fix via `published`. No per-request plan lookup is needed; the `published` flag is the cached enforcement signal.
- **Resolution required**: when `Account.requiresPlanResolution === true`, the admin layout short-circuits every admin route (forms list, editor, submissions, account) to render the resolution dialog. The user cannot edit, delete, or publish anything else until they submit a selection. Operator routes (`/operator/*`) are unaffected; operators are always able to access the console regardless of the accounts they administer.
- **Deletion is never gated.** Users can always delete forms. The published cap protects the live surface; it does not restrict cleanup.

## Downgrade resolution flow

1. A plan change (operator action today, subscription lapse in the billing epic) pushes the account's cap below its published count.
2. The server sets `published = false` on every form the account owns and sets `requiresPlanResolution = true`. All live endpoints immediately begin returning the "not accepting responses" state.
3. The affected account's next admin page load goes through the layout check, which renders a blocking dialog titled "Your plan changed." The body reads: "Your plan is now {planName}, which allows {maxPublishedForms} published form(s). Choose which forms you want to keep published." Below is a list of all the account's forms (title, created date, submission count), each selectable up to the cap. A disabled counter shows "{selected} / {cap} selected."
4. Submit calls `resolvePlan`. On success, selected forms go live again, the flag clears, and the user lands on the forms list.
5. "Skip for now" is allowed but keeps `requiresPlanResolution = true`, leaving the user in the locked state on the next visit. There is no path to dismiss without submitting a (possibly empty) selection. The "Skip" label is actually "Keep everything as draft" and calls `resolvePlan([])`.

Design details:

- **All forms unpublished, not just the excess.** Forcing a full re-pick sidesteps "which of my 10 was arbitrarily kept" and makes the user's consent explicit. The cost (brief downtime for picked-to-stay forms) is acceptable given the triggering event is a plan change the user caused or agreed to.
- **Blocking dialog, not banner.** A dismissible banner would let users continue operating with stale state and surprises on every route. The user asked for "make them choose" and this is what that looks like. The scope is narrow: one modal, one action, on one state.
- **Data is preserved.** Unpublished forms keep all fields, configuration, submissions, and history. Re-publish is a one-click re-activation.

## UI

### Admin (`/forms`)

- Forms list entitlement context is fetched once per render and passed down.
- Each form card's publish toggle is:
  - Enabled when `canPublishAnother === true` or the form is already published (toggling off is always allowed).
  - Disabled with tooltip `"Your {planName} plan allows {maxPublishedForms} published form(s). Unpublish another form first."` when at cap.
- Copy lives in `src/lib/copy/plans.ts` for future localization.

### Account dashboard (`/account`)

- New read-only "Plan" section above the danger zone.
- Shows plan display name, `Published forms: {publishedFormsCount} of {maxPublishedForms ?? "unlimited"}`, and total forms count.
- No action buttons in this epic. The self-serve upgrade affordance slots into this section when billing ships.

### Operator console (`/operator/accounts`)

- Add a `Plan` column to the accounts table (between `Forms` and `Actions`), rendered as a `Badge` with the plan display name. An extra `(resolution pending)` annotation appears when `requiresPlanResolution === true`.
- Add a `Change Plan` action alongside `DeleteAccountButton`. Opens a modal listing all plans (including non-public ones), preselected to the current plan. Submit calls `setAccountPlan` and revalidates.
- The modal shows a warning when the target plan's cap is below the account's current published count: "This will unpublish all of {email}'s forms and require them to re-select up to {newCap}. They will see a resolution prompt on next login." Use the existing `ConfirmDialog` pattern.

## Migration & backfill

One migration, applied in this order:

1. `CREATE TABLE plans` and seed the four rows.
2. `ALTER TABLE accounts ADD COLUMN plan_code TEXT NOT NULL DEFAULT 'FREE' REFERENCES plans(code)`.
3. `ALTER TABLE accounts ADD COLUMN requires_plan_resolution BOOLEAN NOT NULL DEFAULT FALSE`.
4. Backfill step (reviewable script, not raw SQL): any account whose user email matches `ADMIN_EMAIL`, or whose count of `published = true` forms exceeds `FREE.maxPublishedForms`, is updated to `plan_code = 'UNLOCKED'`. Everyone else stays on the `FREE` default.

The backfill is one-shot; subsequent deploys do not re-run it. Signup continues to create accounts with the `FREE` default.

## Design decisions

- **Published forms are the entitlement lever, not total forms.** Matches the user's framing, keeps drafts frictionless, and gives licensing a single clean choke point (the publish transition).
- **Plan catalog in the database, not an enum.** Enums force a migration for every new plan and every limit change. A catalog table lets operations adjust `maxPublishedForms` or add plans without a code deploy once billing is live. One extra join on entitlement checks, amortized by fetching entitlements once per request.
- **Entitlements resolved through a single helper.** Every check calls `getAccountEntitlements`. When subscriptions and add-ons land, the helper gets richer while call sites stay the same.
- **"Unlocked" as a plan, not a flag.** One source of truth for entitlements, no scattered `if (isOperator) skipLimits` branches. The existing `ADMIN_EMAIL`-based operator check stays unchanged; operator role (console access) and plan (billing-bound entitlements) remain orthogonal.
- **Plan on `Account`, not `User`.** Forms belong to accounts; the existing model is one user per account. When team accounts arrive, all users share the plan.
- **Full unpublish on downgrade, not partial.** The user chooses from a clean slate. No surprise "which 1 of my 10 did the system pick for me."
- **Blocking resolution dialog, not banner.** Matches the user's explicit ask. The scope is narrow enough (one modal) that the cost is low.
- **String primary key on `Plan`.** Plans are a stable short set; the code is the identity.
- **One-bit resolution flag, no history.** History belongs to an audit log (future). State is either "normal" or "must resolve."
- **Data preservation over destruction.** A plan change never deletes forms, fields, or submissions.

## Verification

- **Prerequisite check (published gate)**: an unpublished form returns the inactive state on the hosted page, the embed GET, the embed POST, and the manual submit endpoint. Origin validation and rate limiting behave identically for published and unpublished forms (the only new differentiator is the `published` check).
- **New account**: signup → `Account.planCode === "FREE"`, `maxPublishedForms === 1`, `requiresPlanResolution === false`.
- **Free creation and publish**: a free user can create many draft forms. Publishing the first succeeds. Attempting to publish a second with one already live surfaces the disabled toggle and tooltip; bypassing the UI and calling `toggleFormPublished` directly throws `PlanLimitError`.
- **Free unpublish and republish**: toggling the live form off then publishing a different one succeeds.
- **Upgrade no-op**: operator moves a `FREE` account with one published form to `UNLOCKED`. No resolution dialog; the user can publish additional forms immediately.
- **Downgrade resolution path**: operator moves an `UNLOCKED` account with 5 published forms to `FREE`.
  - All 5 forms flip to `published = false` server-side.
  - The account's forms are immediately inactive on hosted, embed, and manual-submit paths.
  - On the account's next admin page load, the blocking dialog appears, regardless of which admin route they try.
  - Selecting one form and submitting → that form goes live again, the flag clears, the user lands on the forms list.
  - Choosing "Keep everything as draft" → no forms live, flag clears, user is no longer blocked.
- **Downgrade no-op when under cap**: operator moves an `UNLOCKED` account with zero published forms to `FREE`. No resolution required; the flag stays false; the plan badge updates.
- **Operator UI**: accounts table shows the plan badge. The plan-change modal preselects the current plan. A destructive downgrade shows the confirmation copy. Resolution-pending accounts show the `(resolution pending)` annotation.
- **Account dashboard**: displays the correct plan name and "Published forms: N of M" line for both a free user (1 max) and an unlocked user (unlimited).
- **Clean-DB migration**: deploy against a fresh database → `FREE`, `HOSTING`, `PAID`, `UNLOCKED` seeded; new signups default to `FREE`.
- **Existing-DB migration**: deploy against a populated database → operator account becomes `UNLOCKED`; any account with more than one published form becomes `UNLOCKED`; everyone else `FREE`. No existing live forms go dark from the migration itself.

## Follow-up epics (not in scope here)

- **Billing foundation**: `Subscription` model, Stripe webhook ingestion, public plan surface, self-serve upgrade/downgrade. Subscription lapse drives `setAccountPlan(account, "FREE")` automatically; the resolution flow kicks in unchanged. `setAccountPlan` becomes an operator override on top of the subscription source of truth.
- **Pay-per-form add-ons**: `AddOn` catalog and `AccountAddOn` join, with entitlements that stack on top of the base plan. `getAccountEntitlements` aggregates across the plan and all active add-ons.
- **Persisted audit log** for operator plan changes and billing events.
- **Email notifications on downgrade** (plan lapsed, forms unpublished, resolve within X days), tied to the billing epic.

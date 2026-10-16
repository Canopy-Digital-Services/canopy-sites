# Epic 29: Plan Extension, Site Model, Operator Sites

**Status:** 🔨 In progress
**Version:** v5.2.0 (planned)
**Started:** 2026-10-16
**Phase:** 0, Portal foundation (`docs/canopy-sites/ROADMAP.md`)
**Predecessor:** Epic 28 (Account audit and Membership model)
**Successor:** E30 (Builder service, Caddy, preview hostname), which also needs C1 and H1 to H3

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/canopy-sites/PRD.md` (D2, D9, D12, D18, sections 4.4 and 5), `docs/canopy-sites/ROADMAP.md` (E29 brief, and the E30, E32, E35, E36 briefs that consume what this epic adds or defers), `docs/epics/epic-28-account-audit-membership.md`, `docs/tools/prisma-7.md`, and `docs/tools/nextjs-16.md`.

---

## 1. Goal

The portal knows what a Site is and which accounts have the Sites product. `Plan.sitesEnabled` replaces the E27 stand-in that derived Sites from the `UNLOCKED` plan, a `SITES` plan exists, the operator can create and edit sites and assign each to an account, and a Sites client's Editor home shows their site.

## 2. Scope

### In

- `Plan.sitesEnabled`, the `SITES` plan seed, and `getAccountEntitlements` reading the column.
- `Site` per PRD section 5, minus the columns section 3 defers, one per account.
- `/operator/sites` list and `/operator/sites/[siteId]` detail: create a site, assign it to an account, edit repo URL, hostnames, contract version, locked fields, and runbook overlay. No repo, DNS, or Umami website is created; those stay manual in v1.
- Placeholder Editor page: the account's site name and "nothing to edit yet".
- The ownership, deletion, and plan guards in section 3.
- Database tests for every entitlement and ownership decision, each checked to fail with its guard removed.

### Out

| Not here | Why / where |
|---|---|
| `Build`, `ChangeSet` | E30 (D1) |
| `analyticsTier`, `monthlyTokenBudget`, `Site.status` | With their first reader (D2) |
| Repo creation, DNS, Caddy config, Umami website creation | Manual in v1 (brief); Caddy config from `Site` rows is E30 |
| Anything that reads `repoUrl`, `contractVersion`, `lockedFields`, `runbookOverlay` | E30 (builder), E31 (guardrails), E32 (quick edit). E29 stores them |
| Deleting a site | Not in the brief; follow-up (section 7) |
| Signup on the Sites host, inviting a client | E27 follow-up; PRD keeps invites out of v1 |

## 3. Gating decisions

Recommended 2026-10-16 before any code, decided by Michael the same day (section 6).

### Q1. Build and ChangeSet: empty tables now, or with their first writer

**Deferred to E30**, their first writer: its job is "apply ChangeSet ops, build, record `Build`", and its acceptance runs a no-op ChangeSet.

- Empty tables move churn rather than avoid it. Created now, E30 alters whatever we guessed, and migrations are append-only, so every wrong guess stays in the history with a corrective migration after it.
- Their shape hangs on decisions not yet made. `Build.outputPath` and symlink rollback exist only under D6, which PRD Q9 reopens before E30 (Cloudflare Pages direct upload would store a deployment ID instead). `ChangeSet.ops` depends on how C1 addresses collection documents and how E31 writes JSON patch.
- PRD section 5 has the two tables pointing at each other (`Build.changeSetId`, plus `ChangeSet.previewBuildId` and `publishedBuildId`). One direction should be picked, and the builder's needs decide it.

`Site.maxBuildsRetained` still lands now with `Site`.

### Q2. Columns whose values would be guesses

**Their meaning is settled now; each lands with its first reader.** A column whose meaning is settled lands now even if nothing reads it yet (a repo URL, a hostname list, an overlay). A column whose enum values or seeded numbers would be guesses waits for the epic that knows them, as its own typed-column migration (the existing `Plan` pattern).

- **`analyticsTier`: not in v1.** It gates nothing: D15 gives Stats to every Sites account, E35 says the tier "gates nothing in v1 beyond the page existing" (the page is already gated by `sitesEnabled`), and the +$75 search and reporting tier is a service, not software (PRD section 2). Any v1 values would copy `sitesEnabled`. It arrives when a second analytics level has software behind it, with values named for what each unlocks; until then `billingRef` records who pays for search and reporting.
- **`monthlyTokenBudget` becomes a cost budget in E32**, `Plan.monthlyAiBudgetCents`: the ceiling on an account's estimated model spend (quick edit and any other server-side model use), in US cents per calendar month (UTC), summed across the account's site; `null` means no ceiling; E32 soft-stops at 100% and notifies the operator. Cost rather than tokens because E32 classifies with a cheaper model and edits with a stronger one, and cached input bills at a fraction of fresh input, so one token count can cost several times another; the business risk is spend against a $175 month. `SITES`'s value comes from E32's measured cost per edit (D7: measure before optimizing).
- **`Site.status` waits for E36**, which decides which sites Caddy serves in production (Client 2 cuts over before Client 1); that decision is what its values should name.

### Q3. Site ownership

- **One site per account, in the schema.** `Site.accountId` is unique. Canopy Sites is for a small business or local organization, which has one website, so the PRD's "one account may own several sites" is dropped rather than modeled and stubbed (Michael: "let's not overbuild"). `getAccountSite(accountId)` is a unique lookup, and a second site on an account is refused by the constraint, with a readable error from the action.
- **An account that owns a site cannot be deleted.** `Site.accountId` is `onDelete: Restrict`, and both deletion paths refuse with a message first: the operator is told to reassign the site, the client to contact us. A `Site` row will drive Caddy config (E30) and production routing (E36), so a cascade from a self-serve click would take a paying client's live site down, and deletes are hard.
- **Sites live only on Sites accounts.** Creating or reassigning a site requires the target account's plan to have `sitesEnabled`, and a plan change that would take Sites from an account that owns a site is refused until the site moves. A client never owns a site their chrome hides.
- **Client reads are scoped and minimal.** Client code reaches a site only through `getAccountSite` with the session's account, and gets `id`, `name`, `slug`. Every other field is operator-only: `runbookOverlay` holds business facts and will feed the model, and `lockedFields` and `repoUrl` are operator configuration. Operator reads require `GLOBAL_ADMIN`.

### Q4. Found while reading: `UNLOCKED` is not a Sites plan

The brief set `UNLOCKED.sitesEnabled = true`, keeping the E27 stand-in. But `UNLOCKED` means "no Forms limits": every account is moved to it when its user is promoted to Global Admin (E24), it is how an operator gives a VIP Forms user unlimited forms, and E23's migration put every account that had more than one published form on it. As a Sites plan it gives those accounts the Sites chrome with an empty Editor as home, and switches their emailed links and product name to Canopy Sites (`appUrlFor`, `productNameFor`), against D2's "every other account gets today's Forms UI exactly". Under v5.0.0's stand-in that is already the case in production for any such account.

**Decided:** `UNLOCKED.sitesEnabled = false`, so `SITES` is the only Sites plan. Michael's own account moves to `SITES` through the operator console on each environment after the deploy (unlimited forms either way). Promotion to Global Admin moves an account to `UNLOCKED` only from a plan with a published-form cap, so promoting a Sites account never takes Sites away.

Open fact: whether production has `UNLOCKED` accounts other than Michael's. They switch back to the Forms chrome when this deploys, which is the intended fix.

## 4. Requirements

### Schema (two migrations, each read before commit)

1. `add_plan_sites_enabled`: `plans."sitesEnabled" BOOLEAN NOT NULL DEFAULT false`; insert `SITES` (`displayName` Sites, `maxPublishedForms` NULL, `isPublic` false, `sortOrder` 40) with `sitesEnabled` true. Every existing plan, `UNLOCKED` included, stays false. `prisma/seed.ts` mirrors the catalog.
2. `add_sites`:

```prisma
model Site {
  id                  String   @id @default(cuid())
  accountId           String   @unique  // one site per account (D3)
  slug                String   @unique  // names /srv/sites/<slug> and preview-<slug>.sites.canopyds.com
  name                String
  repoUrl             String?
  defaultBranch       String   @default("main")
  productionHostnames String[] @default([])
  contractVersion     String?
  umamiWebsiteId      String?
  runbookOverlay      String   @default("")
  lockedFields        String[] @default([])
  maxBuildsRetained   Int      @default(5)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  account Account @relation(fields: [accountId], references: [id], onDelete: Restrict)

  @@map("sites")
}
```

### Code

- `getAccountEntitlements` reads `plan.sitesEnabled`; the stand-in and its comment go.
- `src/lib/data-access/sites.ts`: `getAccountSite` (client) and the operator listing and lookup.
- `src/lib/sites.ts`: pure input parsing for the operator form (section 6 calls), unit-tested.
- `src/actions/admin/sites.ts`: `createSite`, `updateSite`, Global Admin only, returning `{ success } | { error }` so refusals read the same in production builds, logged as JSON events like `setAccountPlan`.
- Guards in `setAccountPlan`, `setUserRole`, `deleteAccount`, `deleteSelfAccount` (Q3, Q4).
- Operator nav gains Sites; list and detail pages per `docs/UX_PATTERNS.md`.
- Editor page shows the site name when the account has a site.

### Tests

Database tests for: the plan seed's `sitesEnabled` per plan; entitlements per plan; `getAccountSite` never returning another account's site; create and update refusing non-admins, non-Sites accounts, a second site, a claimed hostname, a duplicate slug; the plan-change, promotion, and deletion guards. Each guard's test is run once with the guard removed and must fail.

## 5. Acceptance

- [x] Section 3 decided with Michael
- [ ] Operator creates Client 2 as a Site on Michael's account; signing in on either host lands on the Editor showing it
- [ ] A Forms-only account's experience is unchanged on both hosts
- [ ] One account can never read another's site (test)
- [ ] Both migrations read and verified per `docs/AGENT_CONTEXT.md` section 5
- [ ] `npm run build`, `npm run lint`, `npm test` pass

## 6. Decisions

### Michael (2026-10-16)

- **D1. `Build` and `ChangeSet` wait for E30** (Q1).
- **D2. Columns land with their first reader**: no `analyticsTier` in v1, `monthlyTokenBudget` becomes `monthlyAiBudgetCents` in E32 with the meaning in Q2, `Site.status` in E36.
- **D3. One site per account**, enforced by a unique `Site.accountId`. The ICP is a small business or local organization; "let's not overbuild".
- **D4. An account that owns a site cannot be deleted**, by the operator or self-serve (Q3).
- **D5. Sites only on Sites accounts**, checked when a site is created or reassigned and when a plan change would drop Sites (Q3).
- **D6. `UNLOCKED` is not a Sites plan** (Q4). `SITES` is the only one; promotion to Global Admin moves only capped plans to `UNLOCKED`.

### Agent calls inside scope

- **C1. `SITES` is not public** (`isPublic` false, `sortOrder` 40): Sites accounts are set up by hand, so the plan never appears in a future self-serve upgrade list.
- **C2. Slug rules.** Globally unique, a DNS label (lowercase letters, digits, inner hyphens, at most 40 characters, which leaves room for `preview-` in a 63-character label), and fixed after creation, because E30 keys directories and hostnames on it.
- **C3. Hostname rules.** Lowercased, validated as hostnames, no duplicates within a site, and unclaimed by any other site, checked in the action: Caddy will route hostname to site, so a double claim would serve one client's domain from another's build. An array per PRD section 5 rather than a table, since only the operator writes it.
- **C4. Field formats.** `repoUrl` an `https://` URL or empty; `contractVersion` `MAJOR.MINOR.PATCH` or empty (C1 versions by git tag); `lockedFields` dotted paths into the contract (`site.contact.phone`), prefilled on a new site with the three contact fields PRD section 4.4 locks by default; `runbookOverlay` at most 20,000 characters; `name` at most 100.
- **C5. The detail page edits every operator-set field**, including `defaultBranch` and `umamiWebsiteId`, which the brief's list does not name. `maxBuildsRetained` keeps its default with no control until E30 prunes builds.
- **C6. New operator actions return `{ success } | { error }`** (the `contact.ts` and `auth.ts` shape). Guards added to existing operator actions throw, like the refusals beside them (follow-up in section 7).

## 7. Follow-ups (recorded, not built)

- **`lockedFields`, `contractVersion`, and `slug` are also in each site repo's `canopy.json`** (PRD section 4.4). Two sources of truth; E30 or E31 decides which wins. Suggested: the database for `lockedFields` (guardrails are server-side, D9), the repo for `contractVersion` (the build uses what the repo installs), with the builder flagging drift.
- **Deleting a site** is not in the brief. Until it exists, a test site can only be reassigned, and an account that owns one cannot be deleted (D4).
- **Thrown messages from operator actions** (`deleteAccount`, `setAccountPlan`, `setUserRole`, `setAccountBilling`) may reach the toast as Next's generic production error rather than the refusal text. Check on forms-dev and convert to result values if so.

## 8. Progress log

- 2026-10-16: Release PR #23 (v5.1.0) still open, so step 0 (production verification, removing `NEXTAUTH_SECRET` and `AUTH_TRUST_HOST` from prod, resync) is skipped. Brief, PRD, and E28 read; section 3 written for Michael and decided the same day (section 6).

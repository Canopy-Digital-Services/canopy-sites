# Epic 29: Plan Extension, Site Model, Operator Sites

**Status:** ✅ Complete
**Version:** v5.2.0 (released 2026-10-16)
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
| Deleting a site | Not in the brief; follow-up (section 8) |
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

### Q5. Found on forms-dev: a Forms-only account under the Sites hostname

Michael, signed in on sites-dev with an account that had just lost Sites (D6), saw the Forms UI under `sites-dev.canopyds.com`: "If I'm only a Forms user, why am I seeing sites in the domain? Forms should still live as a standalone at forms.canopyds.com." PRD D2 made the hostname meaningless after sign-in because Forms emails linked to the Forms host and NextAuth routed auth through one URL. Both reasons are gone: emailed links are per account since E27 (`appUrlFor`), and NextAuth since E28. Share links and embed code already use the Forms host from either host.

**Decided:** an account's home host is the one its emails use, `appUrlFor(entitlements)`: Sites accounts on `SITES_URL`, every other account on `NEXTAUTH_URL`. A signed-in page on the other configured host redirects to the home host (sessions are per host, so the user signs in there once). Sign-in on the other host checks the password and then, instead of a session, says where the account signs in. Signup on the Sites host goes to the Forms host's signup. With `SITES_URL` unset or equal to `NEXTAUTH_URL` the environment has one host and nothing routes. Sharing the session cookie across subdomains was rejected: client previews will live under `*.sites.canopyds.com`. A one-time handoff token would save the second sign-in but is new auth surface for a rare path. Recorded as PRD D22, which supersedes the hostname half of D2.

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
- Home host (D7): `homeHostRedirect`, `requireHomeHost`, and `signupHostRedirect` in `src/lib/product.ts`; the admin and operator layouts call `requireHomeHost`; `signInAction` returns `homeUrl` on the other host; signup redirects (and the action refuses) on the Sites host; the Sites login page drops "Create account".

- Handoff (D8): `SessionHandoff` (token SHA-256 as id, `userId`, `rememberMe`, `targetHost`, `expiresAt`; two minutes, single use). Correct password for a Sites account on the Forms host creates one and returns it; the modal's button is a form POST to `<Sites host>/auth/handoff`, whose route accepts only the configured Forms origin (no login CSRF from another page, no token in a URL or log), consumes the token on the host it names, and starts the session. Password change and reset drop pending handoffs with the sessions.

### Tests

Database tests for: the plan seed's `sitesEnabled` per plan; entitlements per plan; `getAccountSite` never returning another account's site; create and update refusing non-admins, non-Sites accounts, a second site, a claimed hostname, a duplicate slug; the plan-change, promotion, and deletion guards. Each guard's test is run once with the guard removed and must fail.

## 5. Acceptance

- [x] Section 3 decided with Michael
- [ ] Operator creates Client 2 as a Site on Michael's account and lands on it from either host. Michael moved his forms-dev account to `SITES` and used the handoff; Client 2 itself is not created yet, which is the first step of the demo work. The create, assign, and Editor flow passed with throwaway accounts (section 9)
- [x] A Forms-only account never stays on the Sites host: sign-in there points to the Forms host, and a session there redirects (D7)
- [x] A Forms-only account's experience is unchanged on both hosts (local)
- [x] One account can never read another's site (`sites.db.test.ts`, and the client pages carry none of the operator fields)
- [x] Both migrations read and verified per `docs/AGENT_CONTEXT.md` section 5 (locally; forms-dev and production when deployed)
- [x] `npm run build`, `npm run lint`, `npm test` pass

## 6. Decisions

### Michael (2026-10-16)

- **D1. `Build` and `ChangeSet` wait for E30** (Q1).
- **D2. Columns land with their first reader**: no `analyticsTier` in v1, `monthlyTokenBudget` becomes `monthlyAiBudgetCents` in E32 with the meaning in Q2, `Site.status` in E36.
- **D3. One site per account**, enforced by a unique `Site.accountId`. The ICP is a small business or local organization; "let's not overbuild".
- **D4. An account that owns a site cannot be deleted**, by the operator or self-serve (Q3).
- **D5. Sites only on Sites accounts**, checked when a site is created or reassigned and when a plan change would drop Sites (Q3).
- **D6. `UNLOCKED` is not a Sites plan** (Q4). `SITES` is the only one; promotion to Global Admin moves only capped plans to `UNLOCKED`.
- **D7. Each account has a home host** (Q5), built in E29.
- **D8. A Sites customer signing in on the Forms host gets a modal, not a second sign-in** (Michael, after trying D7 on forms-dev): "as a Sites customer, you use Forms through your Sites dashboard", with a **Go to Canopy Sites** button that signs them in there. A Forms-only customer on the Sites host keeps the "signs in at" message; that direction gets no handoff. The button carries a one-time handoff token (section 4).
- **D9. Three plans: Free, Unlimited, Sites** (after the release, v5.2.1). Michael asked what `UNLOCKED` and `HOSTING` still do: `HOSTING` was a never-assigned placeholder for what is now `SITES`, and `UNLOCKED` had the same entitlements as `PAID` once it stopped meaning Sites. Both retired, their accounts moved to `PAID`, now shown as "Unlimited"; promotion lifts capped plans to `PAID`. A sandbox for a partner or investor is a `SITES` account (or a member on a shared demo account) with its billing reference saying so; `UNLOCKED` would have shown them Forms only.

### Agent calls inside scope

- **C1. `SITES` is not public** (`isPublic` false, `sortOrder` 40): Sites accounts are set up by hand, so the plan never appears in a future self-serve upgrade list.
- **C2. Slug rules.** Globally unique, a DNS label (lowercase letters, digits, inner hyphens, at most 40 characters, which leaves room for `preview-` in a 63-character label), and fixed after creation, because E30 keys directories and hostnames on it.
- **C3. Hostname rules.** Lowercased, validated as hostnames, no duplicates within a site, and unclaimed by any other site, checked in the action: Caddy will route hostname to site, so a double claim would serve one client's domain from another's build. An array per PRD section 5 rather than a table, since only the operator writes it.
- **C4. Field formats.** `repoUrl` an `https://` URL or empty; `contractVersion` `MAJOR.MINOR.PATCH` or empty (C1 versions by git tag); `lockedFields` dotted paths into the contract (`site.contact.phone`), prefilled on a new site with the three contact fields PRD section 4.4 locks by default; `runbookOverlay` at most 20,000 characters; `name` at most 100.
- **C5. The detail page edits every operator-set field**, including `defaultBranch` and `umamiWebsiteId`, which the brief's list does not name. `maxBuildsRetained` keeps its default with no control until E30 prunes builds.
- **C6. New operator actions return `{ success } | { error }`** (the `contact.ts` and `auth.ts` shape). Guards added to existing operator actions throw, like the refusals beside them (follow-up in section 8).
- **C7. The boot-time `ADMIN_EMAIL` backfill follows D6.** `scripts/backfill-global-admin.mjs` runs on every container start and moved the admin's account back to `UNLOCKED` whenever it was on another plan, which would have taken Sites from Michael's account on every deploy. It now lifts only a capped plan, like `setUserRole`, with a test that runs the script.
- **C8. The guard lives in `deleteAccountAndSoleMembers`**, the one deletion path, so the operator and self-serve actions both inherit it; each maps `AccountHasSiteError` to its own message. A client's Account page shows "Contact support to close it" in place of the Delete button, and the help page says so.
- **C9. One-site-per-account and deletion each have two layers**, a check in code for the message and the database constraint underneath (unique index, `RESTRICT`). The mutation check removed the code check alone (the constraint still refused), then both together (the test failed).

## 7. Completion report

Shipped in v5.2.0. The brief: `Plan.sitesEnabled` and the `SITES` plan replacing the `UNLOCKED` stand-in, the `Site` model, operator Sites list and detail, and the Editor showing the site. Michael's decisions changed it in section 3 and section 6: `Build` and `ChangeSet` wait for E30, columns land with their first reader, one site per account with deletion and plan guards, `UNLOCKED` is a Forms-only plan, and each account has a home host with a sign-in handoff from the Forms host (PRD D19 to D22). Found and fixed on the way: the boot-time `ADMIN_EMAIL` backfill would have taken Sites from Michael's account on every deploy (C7).

Three migrations (`add_plan_sites_enabled`, `add_sites`, `add_session_handoffs`), none of which drops anything. 145 tests (72 at v5.1.0), every new guard checked to fail without it. Michael approved the release after trying the handoff on forms-dev (2026-10-16); Client 2 is created as part of the demo work.

## 8. Follow-ups (recorded, not built)

- ~~`lockedFields`, `contractVersion`, and `slug` are also in each site repo's `canopy.json`~~ decided 2026-10-16: no `canopy.json`; the `Site` row owns `slug` and `lockedFields`, the repo owns the contract version (PRD D24).
- **Deleting a site** is not in the brief. Until it exists, a test site can only be reassigned, and an account that owns one cannot be deleted (D4).
- ~~`GLOBAL_ADMIN`'s seeded description~~ fixed in v5.2.1 with D9.
- **Thrown messages from operator actions** (`deleteAccount`, `setAccountPlan`, `setUserRole`, `setAccountBilling`) may reach the toast as Next's generic production error rather than the refusal text. Check on forms-dev and convert to result values if so.

## 9. Progress log

- 2026-10-16: Release PR #23 (v5.1.0) still open, so step 0 (production verification, removing `NEXTAUTH_SECRET` and `AUTH_TRUST_HOST` from prod, resync) is skipped. Brief, PRD, and E28 read; section 3 written for Michael and decided the same day (section 6).
- 2026-10-16: Built. Commits, in order: `677050f` (`Plan.sitesEnabled`, `SITES`), `08cb710` (entitlements read the column; promotion and the boot backfill keep Sites), `fdc2f33` (`Site`), `9f9e40a` (site data access and actions), `9a20e49` (deletion and plan-change guards), `00eeca5` (operator Sites), `006f8a9` (Editor home). Both migrations' SQL read before applying: `add_plan_sites_enabled` adds the column defaulting false and inserts `SITES`; `add_sites` creates the table with unique `accountId` and `slug` and `ON DELETE RESTRICT`. 125 tests; every guard's test was run with the guard removed and failed (C9 for the two-layer ones).
- 2026-10-16: Verified locally over HTTP with throwaway accounts on both hosts: `/` sends a `SITES` account to `/editor` and an `UNLOCKED` admin and a `FREE` account to `/forms`; `/editor` 404s for `FREE`; `/operator/sites` redirects a client home. `createSite` called as a server action: a client is redirected, a cross-origin request is rejected by Next, a `FREE` account and a second site are refused with their messages, and a `SITES` account gets its site with the contact fields locked. The client's Editor shows the site's name on both hosts; the Account page shows the support message; probe strings in `runbookOverlay` and `repoUrl` appear in none of the client's pages, while the overlay probe shows on the operator detail page. Throwaway data removed afterwards.
- 2026-10-16: Michael released #23; step 0 done (record in the E28 progress log): production recovered from a failed `drop_user_account_id` caused by pre-baseline schema drift, verified, and redeployed without `NEXTAUTH_SECRET` and `AUTH_TRUST_HOST`. `ADMIN_EMAIL` is Michael's address on both Coolify apps, so C7 is what keeps his account on `SITES` across deploys. `dev` resynced with `main` and pushed.
- 2026-10-16: forms-dev deployed `328970a`: `add_plan_sites_enabled` and `add_sites` applied, `[portal] Migrations complete`, both dev hosts serve. Dev catalog has `sitesEnabled` on `SITES` only; Michael's account is still `UNLOCKED` with no site, and the boot backfill left it alone. Waiting on Michael's click-through on forms-dev (section 10).
- 2026-10-16: Michael on forms-dev: a Forms-only account under the sites-dev hostname is confusing (Q5). Decided D7, PRD D22. Built in `261fd23` (the other session's `f6b8bbf`, login logo left-justified, sits just before it, untouched). Ten new tests, each guard's test checked to fail with the guard removed. Verified locally and on forms-dev over HTTPS with a throwaway account (deleted afterwards): `/signup` on sites-dev redirects to forms-dev's; the sites-dev login page has no "Create account"; sign-in on sites-dev returns `homeUrl` forms-dev and sets no cookie; a Forms session presented on sites-dev is sent to forms-dev from `/forms`, `/account`, `/docs`, `/operator`, and `/`.
- 2026-10-16: Michael tried D7 on forms-dev: after clearing site data, sign-in on forms-dev told his Sites account to sign in at sites-dev, a second password entry. Decided D8. Built in `a93c471` (`add_session_handoffs`: table, index, cascading FK; SQL read before applying) and `807c57a`. Nine new tests; each guard (Forms origin only, single use, host binding, expiry, dropped with sessions, earlier pass replaced, pass only for Sites accounts) checked to fail with it removed. Verified locally over HTTP: Sites-account sign-in on the Forms host returns a pass and no session; a post from another origin gets 403; a post from the Forms origin sets a cookie for the Sites host only and lands on `/editor`; a replay goes to `/login`. The other session's `bee47fc` (updated Sites mark, SVGs only) was in the working tree and went up with this push.
- 2026-10-16: forms-dev deployed `807c57a`: `add_session_handoffs` applied. Over HTTPS with a throwaway Sites account (deleted afterwards): sign-in on forms-dev returned a pass and set no cookie; a post from another origin got 403; the post from forms-dev's origin set `__Host-canopy_session` (Secure, host-only) on sites-dev and landed on `/editor` (200); a replay went to `/login`; no handoff rows left behind.
- 2026-10-16: Released (PR #24, merge `e0d5461`). Production: all three migrations applied, no restarts; catalog has `sitesEnabled` on `SITES` only; Michael's account still `UNLOCKED` (the boot backfill left it); `/signup` on the Sites host redirects to the Forms host, and only the Forms login offers "Create account". With a throwaway account (deleted afterwards): Forms sign-in on the Sites host got the "signs in at forms.canopyds.com" message; as a Sites account, sign-in on the Forms host returned a pass, a post from another origin got 403, the Forms-origin post set `__Host-canopy_session` on sites.canopyds.com and landed on `/editor`, and its old Forms session now redirects to the Sites host. No sites, handoffs, or test users left in production.
- 2026-10-16: D9 built (`f140e71`, `retire_hosting_and_unlocked_plans`: renames `PAID` to "Unlimited", moves `HOSTING` and `UNLOCKED` accounts to `PAID`, deletes both rows, rewrites the `GLOBAL_ADMIN` description; applied locally, where the one `UNLOCKED` account landed on `PAID`) and v5.2.1 cut (`2ca503e`), pushed to `dev`. Not yet deployed: webber's Cloudflare tunnel (with cousins' and jarvis') went down at 18:13 UTC, so forms-dev, the Coolify webhook, and SSH are unreachable. When it returns: deploy forms-dev by API, check the migration and the catalog, then release.
- 2026-10-16: webber back. forms-dev deployed by API (the webhook for the push was lost in the outage): `retire_hosting_and_unlocked_plans` applied, catalog Free, Unlimited, Sites, its one `UNLOCKED` account on `PAID`. Released v5.2.1 (PR #25, merge `0bc24c2`; that webhook fired). Production: migration applied, no restarts, catalog Free, Unlimited, Sites; its one `HOSTING` and one `UNLOCKED` account are on `PAID`; Michael's account stays on `SITES`; both hosts serve.

## 10. Deploy notes

- Three migrations: `add_plan_sites_enabled`, `add_sites`, `add_session_handoffs`. None drops anything, so production's pre-baseline uniques (`docs/PRISMA_MIGRATIONS.md`, now converted) are not in play. Expect `Applying migration` for each, then `[portal] Migrations complete`.
- On deploy every `UNLOCKED` account returns to the Forms chrome, Michael's included, and lives on the Forms host (D7). Then, per environment, on the Forms host: Operator Console, Accounts, Change Plan to Sites on Michael's account. The next page load sends the session to the Sites host, where Michael signs in once; there: Sites, New site, assign Client 2 to his account; the Editor shows Client 2. Signing in on the Forms host then shows the Go to Canopy Sites modal, whose button lands on the Editor signed in.


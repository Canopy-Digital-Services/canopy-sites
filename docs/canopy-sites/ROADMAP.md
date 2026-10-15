# Canopy Sites — Roadmap and Epic Briefs

**Status:** Draft 1 rev 2, 2026-10-15. Companion to `docs/canopy-sites/PRD.md`, which owns *what and why*. This doc owns *order* and the brief for each epic.

**For the agent reading this:** each epic below is a brief, not a full epic doc. When you pick one up, write the full epic in the existing `docs/epics/epic-N-*.md` format (Goal / Scope / Requirements / Acceptance), index it in `docs/epics/README.md`, and work from that. Before starting, read `docs/AGENT_CONTEXT.md`. Keep epics atomic; one epic per Claude Code session is the intended grain.

Epic numbers continue the Forms sequence (last shipped: 26). Epics in other repos are prefixed.

---

## Sequencing

```
Phase 0  Portal foundation            [this repo]         E27 → E28 → E29
Phase 1  Content contract + Client 2       [site-contract, Client 2] C1 → H1 → H2 → H3         (parallel with Phase 0)
Phase 2  Builder + Caddy, preview     [this repo]         E30                        (needs E29, H3)
Phase 3  Editor                       [this repo]         E31 → E32 → E33 → E34 → E35 (needs E30)
Phase 4  Client 2 production cutover       [webber]             E36                        (needs E33 stable)
Phase 5  Client 1 migration             [client1]              T1                         (needs E36 stable a week)
```

Production Client 2 keeps deploying through its current Coolify app until E36. Everything in Phases 2–3 targets the preview hostname only. During Phase 3, publish = commit to `main` → Coolify rebuilds (the fallback path), which is correct behavior until E36 makes publish a symlink swap.

### Fallback (decision D6 chicken-out)

If the builder/Caddy model has to be abandoned: keep Coolify building each site from GitHub on push; keep the builder + Caddy for **preview only**; publish stays commit-to-main. Everything in E30–E35 remains valid; only E36 is dropped. Document the choice in the PRD if taken.

---

## Phase 0 — Portal foundation (this repo)

### E27 · Restructure in place; product-based chrome

Goal: this repo becomes the unified portal, serving `forms.canopyds.com` and `sites.canopyds.com` from one deploy, with the account's products deciding what a logged-in user sees.

Repo and deploy:
- `git mv` the Next.js app into `apps/portal`; add `apps/builder` (empty stub) and `packages/site-contract` (empty stub); root `package.json` with npm workspaces. Per-file history across the move needs `git log --follow`; accepted
- Rename the GitHub repo `Canopy-Forms` → `canopy-sites` and **make it private**. GitHub redirects the old URL; Coolify's GitHub App source follows the rename (verify)
- Existing Coolify apps (`dev`, `prod`) keep their DB, env and secrets. Change only the Dockerfile/build path and add `sites.canopyds.com` (and a `sites-dev` host) as domains. If the first build fails, the old container keeps serving
- No migration-parity gate needed: the migrations never leave the repo
- Update `docs/AGENT_CONTEXT.md` §6 for the new paths and hostnames

Chrome:
- **`Plan.sitesEnabled` picks the chrome** (landed in E29; until then `getAccountEntitlements` derives `sitesEnabled` from the `UNLOCKED` plan, which E29's seed also enables). Sites accounts get Editor · Forms · Stats on either hostname; all other accounts get today's Forms UI exactly, on either hostname
- Hostname brands **logged-out pages only** (login, signup, password reset; `/docs` requires sign-in). After login, hostname carries no meaning: no per-host home route, no per-host gate page, no per-host sign-out target
- Survey and fix the places where the host currently carries meaning: `NEXTAUTH_URL` / `trustHost`, `validateOrigin`'s use of `NEXT_PUBLIC_APP_URL`, email links, home redirects. Record findings in the epic doc
- Forms mounted at `/forms` as today; Sites home at `/editor`, Stats at `/stats`; `/` redirects by product

Acceptance: both hostnames serve from one deploy; a Forms-only account's experience is unchanged in behavior on both hostnames; a Sites-flagged account sees the Sites nav on both hostnames and can reach its forms; sign-out and auth flows work from either hostname; `npm run build` + `lint` pass

### E28 · Account audit and Membership model

Goal: pull Forms' account code forward with obvious improvements, and replace `User.accountId` 1:1 with `Membership`.

- **Audit first, change second.** Review `src/lib/auth.ts`, `auth-utils.ts`, `actions/auth.ts`, `actions/accounts.ts`, `data-access/accounts.ts`, `(auth)/*`, `components/account/*`. Record findings in the epic doc before editing. Known candidates: dynamic `import("@/lib/db")` inside `getCurrentAccountId`; failed-login tracking without lockout; `VALIDATION_INTERVAL = 0` validating every request; `bcrypt` cost 10 (confirm acceptable); any place the UI assumes one form owner; password-reset and support emails build links from `NEXTAUTH_URL` (the Forms host), so a Sites client resetting a password lands on Forms-branded pages; the PRD Q7 auth-library decision and the Q8 test runner come first
- Add `Membership { userId, accountId, role OWNER|MEMBER }`, `@@unique([userId, accountId])`. Migration backfills one `OWNER` row per existing user. Drop `User.accountId` in a **second** migration after code no longer reads it
- `getCurrentAccountId()` resolves through Membership; v1 asserts exactly one membership and throws otherwise (the many-membership path is a stub, not a feature)
- Add `Account.status`, `Account.billingRef`; operator can set both
- No invite UI, no role UI beyond what operator already has
- Acceptance: all existing flows (signup, login, reset, delete account, operator account list) work unchanged; every `accountId` lookup goes through the data-access layer; migrations read and verified per `docs/AGENT_CONTEXT.md` §5

### E29 · Plan extension, Site model, operator Sites

Goal: the portal knows what a Site is and which accounts have the product.

- Extend `Plan`: `sitesEnabled`, `analyticsTier`, `monthlyTokenBudget`. Seed `SITES` plan: `sitesEnabled = true`, `maxPublishedForms = NULL` (same Forms entitlement as `PAID`). Existing plans (`FREE`, `HOSTING`, `PAID`, `UNLOCKED`) get `sitesEnabled = false`, except `UNLOCKED` → `true`. Replace E27's `UNLOCKED` stand-in in `getAccountEntitlements` with the column
- Add `Site` per PRD §5. Add `Build`, `ChangeSet` as empty-but-migrated tables now so E30/E31 do not need schema churn, or defer; agent's call, document it
- Operator: `/operator/sites` list and detail (create site, assign to account, repo URL, hostnames, contract version, locked fields, runbook overlay textarea). Creating a site does **not** create a repo or DNS; those are manual in v1
- Sites home for a client with one site: placeholder Editor page showing the site name and "nothing to edit yet"
- Acceptance: operator can create Client 2 as a Site on Michael's account; client login on either host lands on it

---

## Phase 1 — Content contract and Client 2 migration

### C1 · `site-contract` v0.1 (`packages/site-contract`, published per PRD Q1)

Goal: the Zod schemas for every v1 collection, exported three ways.

- Collections per PRD §4.4: `site`, `pages`, `services`, `schedule`, `events`, `announcements`, `gallery`, `team`, `reviews`, `text`, `tokens`, plus `canopy.json` (slug, contractVersion, lockedFields)
- Exports: Zod schemas; inferred TS types; JSON Schema (generated, committed); a `validateSite(dir)` function the builder calls
- Shapes are derived from Client 2 `services.json` and Client 1 `site.ts`; do not invent fields neither site needs. Hours allows structured or freeform string
- Versioned with git tags from day one
- Acceptance: `validateSite` passes on a fixture mirroring Client 2 content and fails with readable errors on a bad fixture

### H1 · Client 2 → Astro 7 (`client2`)

- Upgrade Astro 5 → 7 and deps; Node 24 Dockerfile (copy Client 1's pattern) so Coolify builds from a Dockerfile, not nixpacks
- No content or design change. Visual parity check on all three pages
- Deploy through the existing Coolify app on `main` (D14)

### H2 · Client 2 → content collections

- Move `services.json` and every hardcoded string (hero copy, about, reviews, policies, contact, hours, socials) into `src/content/<collection>/` per C1. Install `site-contract` by tag
- Gallery images stay in `src/assets`; gallery collection entries reference them with `image()`
- Pages render from collections; no business data in templates (the Client 1 `site.ts` rule, applied through collections)
- `canopy.json` with locked fields: phone, email, address
- Acceptance: `validateSite` passes; `astro check` clean; visual parity

### H3 · Client 2 → tokens

- `tokens.json` → generated CSS custom properties imported by `global.css` `@theme`. Current palette/fonts become the token values; zero visual change
- Fonts limited to Fontsource-hosted families (Q4)
- Acceptance: changing a token value and rebuilding changes the site; visual parity at default values

(Client 1's `DESIGN.md` and accessibility invariants are the reference for how a site repo documents itself. Client 2 gets a trimmed equivalent as part of H2/H3.)

### C2 · `canopy-site-template` (new repo, after H3)

- Astro 7 starter extracted from Client 2 post-migration: layout, content collections wired to the contract, tokens pipeline, Umami config, Dockerfile, `canopy.json`
- Can be deferred until the first new client; Client 2 is the de-facto template until then

---

## Phase 2 — Builder and Caddy, preview only

### E30 · Builder service + Caddy + preview hostname

Goal: a ChangeSet against Client 2 produces a viewable preview without touching production.

- `apps/builder`: long-running Node worker, pinned Node 24 image. Per-site working clone under `/srv/sites/<slug>/repo` (deploy key, read/write). Queue: one job at a time per site, jobs across sites may run concurrently (cap 2)
- Job: pull → apply ChangeSet ops → stage media → `validateSite` → preflight media (resize to max edge, strip EXIF, HEIC→JPEG, size cap; moderation hook stubbed) → `npm ci` (cached) → `astro build` → `/srv/sites/<slug>/builds/<buildId>` → flip `preview` symlink → record `Build`
- Caddy container with admin API; portal generates config from `Site` rows (production hostnames → `current`, `preview-<slug>.sites.canopyds.com` → `preview`) and reloads. In this phase only preview hostnames are configured
- Preview auth per PRD Q2
- DNS: wildcard `*.sites.canopyds.com` → tunnel + ingress rule. Verify resolution before building anything on it
- Shared volume between builder and caddy. Retention: prune builds beyond `Site.maxBuildsRetained`, never prune `current` or `preview` targets
- Operator: build log per site with status, duration, stdout tail
- Acceptance: operator triggers a no-op ChangeSet on Client 2 → preview hostname serves the built site in < 60 s; a deliberately broken ChangeSet fails validation and leaves `preview` pointing at the previous build

---

## Phase 3 — Editor

### E31 · ChangeSet model and the tool layer

Goal: every edit, from any source, is a ChangeSet created through one set of tools.

- `ChangeSet` lifecycle per PRD §4.5. Ops are JSON patch against collection documents plus staged media references
- Tool layer (`packages/site-tools` or `apps/portal/src/lib/site-tools`): typed functions, one per operation — `getCollection`, `getDocument`, `proposeChange`, `uploadMedia`, `requestPreview`, `publish`, `rollback`, `listBuilds`, `getTokens`, `setTokens`. Each enforces: account ownership, locked fields, contract validation, rate limit. **These are the guardrails (D9).** The MCP server and the chat both call these; nothing else writes content
- `publish` requires `status = PREVIEWED` and the preview build to have succeeded. Publish = commit + push to `main` in this phase (Coolify rebuilds prod until E36)
- Editor UI: pending ChangeSets list with Preview / Publish / Discard; build history with Rollback (rollback is a no-op on prod until E36; UI can ship, action gated behind a feature flag)
- Acceptance: a ChangeSet created via an internal test route goes draft → previewed → published and the commit lands on GitHub

### E32 · Quick edit

Goal: the client types "we're closed Monday the 20th" and gets a preview link.

- Claude API, tool use, tools = E31 layer in-process. Model names and per-model roles (classify vs edit) in env, not code
- Prompt assembly: base runbook (repo file, `docs/canopy-sites/runbook/base.md`, cached as a system block) + `Site.runbookOverlay` + JSON Schema for the collections the request touches. Base runbook v1 covers: hours, announcement, event, schedule, services/prices, gallery add/remove/reorder, copy block, tokens, "I don't know which page"
- Preflight before LLM: file type, dimensions, HEIC conversion, size. LLM sees results, not raw files, except for moderation (Q3)
- `Conversation` persisted with tokens in/out and cost estimate. Account monthly budget from `Plan.monthlyTokenBudget`; soft-stop at 100% with operator notification
- UI: global chat on Editor home; page-scoped chat from a tile (scopes schema + overlay excerpt to that page). Each assistant turn that produces a ChangeSet shows Preview / Publish inline
- Operator: token usage per account/site/month; "edit as client" opens the same chat with operator identity recorded on the ChangeSet
- Acceptance: five scripted edits on Client 2 (hours, announcement, price change, gallery add with HEIC, hero copy) each produce a correct preview; cost per edit recorded and reported

### E33 · Page tiles and tokens panel

- Editor home: tiles from `pages` collection with thumbnail (builder renders a screenshot per build via headless Chromium, or falls back to a placeholder), title, last published
- Tokens panel: colors, typefaces (Fontsource allow-list), heading scale, radii. Editing produces a ChangeSet on `tokens`; Preview / Publish as usual
- Page view: structured read view of that page's blocks with "edit with quick edit" entry points; no inline editing in v1
- Acceptance: token change → preview reflects it; tiles update after publish

### E34 · Public MCP endpoint and API keys

- Streamable HTTP MCP server at `/mcp` exposing the E31 tools. Bearer API key per account, scoped to one site, hashed at rest, revocable, last-used tracked. Rate limit per key
- Operator and account UI: create/revoke keys, copy once
- Docs page under `/docs`: how to connect Claude Desktop / other clients, what the tools do, that publish always requires a preview
- Acceptance: Claude Desktop with the key can list collections, propose a change, request preview, and publish on Client 2; a key for site A cannot read site B

### E35 · Stats

- Umami API client; per-site `umamiWebsiteId`. Stats page: visitors, pageviews, top pages, referrers, selectable date range. `analyticsTier` on Plan gates nothing in v1 beyond the page existing
- Acceptance: Client 2 stats match the Umami dashboard for the same range

---

## Phase 4 — Client 2 production cutover

### E36 · Production on Caddy, publish by swap

Preconditions: E33 stable on preview for at least a week of real use.

1. Portal adds `client2.example` + `www` to Caddy config → `current` symlink (pointing at the latest published build)
2. Traefik: route both hostnames to the Caddy container instead of the Client 2 nginx app. Verify `curl -sI https://client2.example/` 200 and content parity
3. Flip `publish` behavior: symlink swap first, commit + push async. Enable rollback action
4. Confirm for a week. Delete the old Coolify app. Update `client2` deploy docs
5. Undo path at any step: route Traefik back to the nginx app

Acceptance: publish from quick edit is live in seconds; rollback restores the previous build in seconds; the GitHub repo reflects every published change.

---

## Phase 5 — Client 1 migration

### T1 · Client 1 onto the template (`client1`)

Same as H1–H3 plus E36 steps 1–5 for `client1.example`. Specifics: `site.ts` → collections (schedule logic becomes contract-schema'd `schedule` + derived views in the template), `public/` images → `src/assets` with `image()`, preserve DESIGN.md invariants and the documented accessibility rules. Client 1's "no content collections" rule in its CLAUDE.md is superseded by this migration; rewrite that sentence, don't append a caveat (its own editing rule).

---

## Not scheduled (recorded so they are not forgotten)

- Gallery management UI (data model exists from C1; UI only)
- Invite flow and member roles UI (Membership exists from E28)
- New-site onboarding automation (repo from template, DNS, Umami website, Caddy entry)
- Stripe or FreshBooks sync
- SEO/report tier tooling
- SMS intake
- OAuth for the MCP endpoint

# Canopy Sites — Roadmap and Epic Briefs

**Status:** Draft 1 rev 2, 2026-10-15. Companion to `docs/canopy-sites/PRD.md`, which owns *what and why*. This doc owns *order* and the brief for each epic.

**For the agent reading this:** each epic below is a brief, not a full epic doc. When you pick one up, write the full epic in the existing `docs/epics/epic-N-*.md` format (Goal / Scope / Requirements / Acceptance), index it in `docs/epics/README.md`, and work from that. Before starting, read `docs/AGENT_CONTEXT.md`. Keep epics atomic; one epic per Claude Code session is the intended grain.

Epic numbers continue the Forms sequence; what has shipped is in `docs/epics/README.md`. Epics in other repos are prefixed.

---

## Sequencing

```
Phase 0  Portal foundation            [this repo]         E27 → E28 → E29
Phase 1  Content contract + H&H       [site-contract, H&H] C1 → H1 → H2 → H3         (parallel with Phase 0)
Phase 2  Builder + Caddy, preview     [this repo]         E30                        (needs E29, C1)
Phase 3  Editor                       [this repo]         E33 → E32 → E31 → E34 → E35 (needs E30; E33 first, below)
Phase 4  H&H production cutover       [webber]             E36                        (needs E33 stable)
Phase 5  Toro Z migration             [toroz]              T1                         (needs E36 stable a week)
```

Production H&H keeps deploying through its current Coolify app until E36. Everything in Phases 2–3 targets the preview hostname only. During Phase 3, publish = commit to `main` → Coolify rebuilds (the fallback path), which is correct behavior until E36 makes publish a symlink swap.

### Demo slice first (decided 2026-10-16)

E30 is built first as the demo slice (PRD D23): the builder, preview and publish for the demo site at `sites.canopyds.com/demo`, plus the parts of C1, E31, E32 and E35 the demo needs (Stats with sample data). The demo site has its own repo, so H1 to H3 no longer gate E30; they stay H&H's own migration. Each brief below keeps whatever the slice leaves, and the E30 epic doc records the split.

### Visual editor next (decided 2026-10-17)

E33 is built next as the visual editor (PRD D35 to D45), on H&H as served at `/demo`. It pulls forward what the editor stands on: contract v0.2 (C3), the site's draft (D38) from E31, the site guide's front matter (D40), and the nightly rebuild with `Site.timeZone` (D42) from E32. Photos are the fast follow: E32 starts with its media pipeline, which brings photos to quick edit and to the canvas popover (D41). Until then quick edit can't take a photo at all (as of 2026-10-17). The E33 epic doc, `docs/epics/epic-33-visual-editor.md`, records the split.

### canopyds.com on Sites (decided 2026-10-19)

E37 moves canopyds.com onto Sites on Michael's account (PRD D46): the site's Astro port in `canopy-website`, builder isolation, client preview hostnames with their sign-in (D25, D43), and the canvas for client sites. It takes the preview hostnames from E30's remainder. Publish stays a commit to `main`, deployed by the site's Coolify app, until E36. The epic doc, `docs/epics/epic-37-canopyds-on-sites.md`, carries the requirements.

### Fallback (decision D6 chicken-out)

If the builder/Caddy model has to be abandoned: keep Coolify building each site from GitHub on push; keep the builder + Caddy for **preview only**; publish stays commit-to-main. Everything in E30–E35 remains valid; only E36 is dropped. Document the choice in the PRD if taken.

---

## Phase 0 — Portal foundation (this repo)

### E27 · Restructure in place; product-based chrome

Goal: this repo becomes the unified portal, serving `forms.canopyds.com` and `sites.canopyds.com` from one deploy, with the account's products deciding what a logged-in user sees.

Repo and deploy:
- `git mv` the Next.js app into `apps/portal`; add `apps/builder` (empty stub) and `packages/site-contract` (empty stub); root `package.json` with npm workspaces. Per-file history across the move needs `git log --follow`; accepted
- Rename the GitHub repo `Canopy-Forms` → `canopy-sites`; it stays public (PRD §4.3). GitHub redirects the old URL; Coolify's GitHub App source follows the rename (verify)
- Existing Coolify apps (`dev`, `prod`) keep their DB, env and secrets. Change only the Dockerfile/build path and add `sites.canopyds.com` (and a `sites-dev` host) as domains. If the first build fails, the old container keeps serving
- No migration-parity gate needed: the migrations never leave the repo
- Update `docs/AGENT_CONTEXT.md` §6 for the new paths and hostnames

Chrome:
- **`Plan.sitesEnabled` picks the chrome** (landed in E29; until then `getAccountEntitlements` derived `sitesEnabled` from the `UNLOCKED` plan, which E29 made a Forms-only plan, PRD D20). Sites accounts get Editor · Forms · Stats on either hostname; all other accounts get today's Forms UI exactly, on either hostname
- Hostname brands **logged-out pages only** (login, signup, password reset; `/docs` requires sign-in). After login, hostname carries no meaning: no per-host home route, no per-host gate page, no per-host sign-out target
- Survey and fix the places where the host currently carries meaning: `NEXTAUTH_URL` / `trustHost`, `validateOrigin`'s use of `NEXT_PUBLIC_APP_URL`, email links, home redirects. Record findings in the epic doc
- Forms mounted at `/forms` as today; Sites home at `/editor`, Stats at `/stats`; `/` redirects by product

Acceptance: both hostnames serve from one deploy; a Forms-only account's experience is unchanged in behavior on both hostnames; a Sites-flagged account sees the Sites nav on both hostnames and can reach its forms; sign-out and auth flows work from either hostname; `npm run build` + `lint` pass

### E28 · Account audit and Membership model (shipped v5.1.0)

Outcome: `docs/epics/epic-28-account-audit-membership.md`. Beyond the brief, Q7 ended in owned database sessions with no auth library (PRD D16), plus credential throttling, hashed reset tokens, scrypt, and security headers.


Goal: pull Forms' account code forward with obvious improvements, and replace `User.accountId` 1:1 with `Membership`.

- **Audit first, change second.** Review `src/lib/auth.ts`, `auth-utils.ts`, `actions/auth.ts`, `actions/accounts.ts`, `data-access/accounts.ts`, `(auth)/*`, `components/account/*`. Record findings in the epic doc before editing. Known candidates: dynamic `import("@/lib/db")` inside `getCurrentAccountId`; failed-login tracking without lockout; `VALIDATION_INTERVAL = 0` validating every request; `bcrypt` cost 10 (confirm acceptable); any place the UI assumes one form owner; the PRD Q7 auth-library decision and the Q8 test runner come first
- Add `Membership { userId, accountId, role OWNER|MEMBER }`, `@@unique([userId, accountId])`. Migration backfills one `OWNER` row per existing user. Drop `User.accountId` in a **second** migration after code no longer reads it
- `getCurrentAccountId()` resolves through Membership; v1 asserts exactly one membership and throws otherwise (the many-membership path is a stub, not a feature)
- Add `Account.status`, `Account.billingRef`; operator can set both
- No invite UI, no role UI beyond what operator already has
- Acceptance: all existing flows (signup, login, reset, delete account, operator account list) work unchanged; every `accountId` lookup goes through the data-access layer; migrations read and verified per `docs/AGENT_CONTEXT.md` §5

### E29 · Plan extension, Site model, operator Sites (shipped v5.2.0)

Outcome: `docs/epics/epic-29-plan-site-model-operator-sites.md`. Beyond the brief, by Michael's decisions there: `UNLOCKED` stopped being a Sites plan (PRD D20), one site per account (D19), and each account got a home host with a sign-in handoff from the Forms host (D22).


Goal: the portal knows what a Site is and which accounts have the product.

- Extend `Plan`: `sitesEnabled`. Seed `SITES` plan: `sitesEnabled = true`, `maxPublishedForms = NULL` (same Forms entitlement as `PAID`). Existing plans (`FREE`, `HOSTING`, `PAID`, `UNLOCKED`) get `sitesEnabled = false` (PRD D20). Replace E27's `UNLOCKED` stand-in in `getAccountEntitlements` with the column. `analyticsTier` and the token budget are not added (PRD D21)
- Add `Site` per PRD §5, one per account (PRD D19). `Build` and `ChangeSet` are deferred to E30 (PRD D21)
- Operator: `/operator/sites` list and detail (create site, assign to account, repo URL, hostnames, contract version, locked fields, runbook overlay textarea). Creating a site does **not** create a repo or DNS; those are manual in v1
- Sites home for a client with one site: placeholder Editor page showing the site name and "nothing to edit yet"
- Acceptance: operator can create H&H as a Site on Michael's account; client login lands on it at the Sites host, and the Forms host points there (PRD D22)

---

## Phase 1 — Content contract and H&H migration

### C1 · `site-contract` v0.1 (`packages/site-contract`, released per PRD D26)

Goal: the Zod schemas for every v1 collection, exported three ways.

- Collections per PRD §4.4, each landing with the first site that renders it (D21's rule): v0.1 holds what the demo site renders, `site`, `pages`, `services`, `reviews`, `gallery`, `announcements`; `tokens` arrives with H3, `schedule` and `team` with T1, `events` and `text` with the first site that shows them. No `canopy.json` (PRD D24)
- Exports: Zod schemas; inferred TS types; JSON Schema (generated, committed); a `validateSite(dir)` function the builder calls
- Shapes are derived from H&H `services.json` and Toro Z `site.ts`; do not invent fields neither site needs. Hours allows structured or freeform string
- Versioned from day one: each version is a GitHub release `site-contract-vX.Y.Z` carrying the packed tarball (PRD D26)
- Acceptance: `validateSite` passes on a fixture mirroring H&H content and fails with readable errors on a bad fixture

### H1 · H&H → Astro 7 (`hair-and-harvest`)

- Upgrade Astro 5 → 7 and deps; Node 24 Dockerfile (copy Toro Z's pattern) so Coolify builds from a Dockerfile, not nixpacks
- No content or design change. Visual parity check on all three pages
- Deploy through the existing Coolify app on `main` (D14)

### H2 · H&H → content collections

- Move `services.json` and every hardcoded string (hero copy, about, reviews, policies, contact, hours, socials) into `src/content/<collection>.json` per C1. Install `site-contract` by release tarball
- Every fact has one source: the home page's featured services reference the menu, and hours render from structured data into both the contact section and the JSON-LD
- Gallery images stay in `src/assets`; gallery entries name them by path under `src/assets`
- Pages render from collections; no business data in templates (the Toro Z `site.ts` rule, applied through collections)
- Locked fields (phone, email, address) are set on the `Site` row (PRD D24)
- Write H&H's `SITE_GUIDE.md` (PRD D31, D40). The demo site uses the same guide, as a copy in its repo, since it carries H&H's content and design (D23)
- Acceptance: `validateSite` passes; `astro check` clean; visual parity

### H3 · H&H → tokens

- `tokens.json` → generated CSS custom properties imported by `global.css` `@theme`. Current palette/fonts become the token values; zero visual change
- Fonts limited to Fontsource-hosted families (no external font requests, per Toro Z). Tokens are Canopy's to edit in the repo; no client-facing token editing (PRD D29)
- Acceptance: changing a token value and rebuilding changes the site; visual parity at default values

(Toro Z's `DESIGN.md` and accessibility invariants are the reference for how a site repo documents itself. H&H gets a trimmed equivalent as part of H2/H3.)

### C2 · `canopy-site-template` (new repo, after H3)

- Astro 7 starter extracted from H&H post-migration: layout, content collections wired to the contract, tokens pipeline, Umami config, Dockerfile
- Can be deferred until the first new client; H&H is the de-facto template until then

### C3 · `site-contract` v0.2 (built inside E33)

- Every list entry has a required `id` (services, service groups and sections, socials, and every other list of objects); ids are never reused (PRD D36)
- Addresses name a field by collection, then the id of each list entry and the key of each object on the way down (`pages/home/sections/featured/heading`, `services/hair/services/haircut/priceLabel`, `site/hours`). An id need only be unique within its list. `resolveAddress` turns one into the JSON Pointer `applyChanges` uses, against the content it is applied to, so ops survive reordering
- Field metadata through Zod's `.meta()`: kind, label, and description (wording from `QUICK_EDIT_GUIDANCE.md` section 3); `jsonSchemaFor` carries them to the model
- `field(address)`: the attributes a template spreads onto the element it renders an editable value into, which mark it for the canvas
- `parseSiteGuide(markdown)`: the front matter (limits by address, `*` for any id; display formats) and the prose (PRD D40); `validateContent` takes the limits
- A migration from v0.1 content (adds the missing ids), run on the demo site
- Acceptance: the demo site builds on v0.2 with every marked field resolving to a value; a site guide limit refuses an over-length value with a readable reason

---

## Phase 2 — Builder and Caddy, preview only

### E30 · Builder service + Caddy + preview hostname

Outcome (as the demo slice, v5.3.0): `docs/epics/epic-30-demo-slice.md`. Built: `Build` and `ChangeSet`, the builder (previews, publish by pointing `current` at the previewed build, demo reset), and the demo served by the portal at `/demo`. Remaining here: Caddy and client production hostnames (with E36), build retention by `Site.maxBuildsRetained`, the operator build log, and a builder on forms-dev.


Goal: a ChangeSet against H&H produces a viewable preview without touching production.

- Add `Build` and `ChangeSet` (deferred from E29, PRD D21): pick one foreign-key direction between them; hosting stays builder + Caddy (PRD D27)

- `apps/builder`: long-running Node worker, pinned Node 24 image. Per-site working clone under `/srv/sites/<slug>/repo` (repo-scoped token, read/write). Queue: one job at a time per site, jobs across sites may run concurrently (cap 2)
- Job: pull → apply ChangeSet ops → stage media → `validateSite` → preflight media (resize to max edge, strip EXIF, HEIC→JPEG, size cap; moderation hook stubbed) → `npm ci` (cached) → `astro build` → `/srv/sites/<slug>/builds/<buildId>` → flip `preview` symlink → record `Build`
- Caddy container with admin API; portal generates config from `Site` rows (production hostnames → `current`, `<slug>-preview.canopyds.com` → `preview`, PRD D25) and reloads. In this phase only preview hostnames are configured
- Preview auth per PRD D43: a short-lived signed token from the portal, exchanged for a cookie on the preview host
- DNS: a proxied CNAME to the tunnel per preview hostname (PRD D25)
- Shared volume between builder and caddy. Retention: prune builds beyond `Site.maxBuildsRetained`, never prune `current` or `preview` targets
- Operator: build log per site with status, duration, stdout tail
- Acceptance: operator triggers a no-op ChangeSet on H&H → preview hostname serves the built site in < 60 s; a deliberately broken ChangeSet fails validation and leaves `preview` pointing at the previous build

---

## Phase 3 — Editor

### E31 · ChangeSet model and the tool layer

Goal: every edit, from any source, is a ChangeSet created through one set of tools.

- `ChangeSet` lifecycle per PRD §4.5. Ops are JSON patch against collection documents, addressed by stable id (PRD D36), plus staged media references. The pending ChangeSet is the site's draft (D38), built in E33
- Tool layer (`packages/site-tools` or `apps/portal/src/lib/site-tools`): typed functions, one per operation: `getCollection`, `getDocument`, `proposeChange`, `uploadMedia`, `requestPreview`, `publish`, `restore`, `listBuilds`, `requestHelp`, `getSiteGuide`. Content collections only; no token operations (PRD D29). Each enforces: account ownership, locked fields, contract validation, rate limit. **These are the guardrails (D9).** The MCP server and the chat both call these; nothing else writes content
- `publish` requires `status = PREVIEWED` and the preview build to have succeeded. Publish = commit + push to `main` in this phase (Coolify rebuilds prod until E36)
- Quick Edit UI: published history with Restore, which is a draft setting content back to that version, built and published (PRD §4.5), never a move of `current`
- Acceptance: a ChangeSet created via an internal test route goes draft → previewed → published and the commit lands on GitHub

### E32 · Quick edit

Goal: the client types "we're closed Monday the 20th" and gets a preview link.

- Claude API, tool use, tools = E31 layer in-process. Model names and per-model roles (classify vs edit) in env, not code
- Definitions module shared with E34 (PRD D30): tool names, descriptions, schemas, core guidance, quick edit persona, wording from `docs/canopy-sites/QUICK_EDIT_GUIDANCE.md`. Replace `runbook.ts`; cut the guidance doc to its placement rules and numbers. Tool definitions identical across sites so the shared prefix caches product-wide
- Prompt assembly: core guidance + persona (cached, shared) + the prose of `SITE_GUIDE.md`, read through the builder from the published commit (PRD D31; E33 reads its front matter) + JSON Schema for every collection, carrying C3's field descriptions. Drop `Site.runbookOverlay` and its operator textarea; resolve dates with `Site.timeZone` (added in E33)
- Alt text limit 125
- Verbatim copy (PRD D32): the guidance and the scripted edits cover asking for quoted text, typo corrections reported back, and site-rule conflicts. Update the demo's suggested prompts to quote their text
- Tool-result checks per the guidance doc section 2: stale mentions, date and weekday mismatches, duplicates, link reachability, expired-announcement pruning
- Media: `uploadMedia` with preflight per the guidance doc (formats, normalization, size per slot with the refuse and warn levels). The model gets a downscaled copy for alt text, placement, and moderation (PRD D33); alt text is suggested and the owner accepts or edits it. The canvas popover gets an attach button, so a photo on the canvas is replaced through it (PRD D41)
- `requestHelp` and a `HelpRequest` table; operator view lists open requests (PRD D34)
- `Conversation` persisted with tokens in/out and cost estimate. Add `Plan.monthlyAiBudgetCents` (meaning in PRD D21), with the `SITES` value set from the cost per edit this epic measures; soft-stop at 100% with operator notification
- UI: the Quick Edit tab, and the canvas popover from E33 (the same chat scoped to one field, PRD D37). Each assistant turn that produces a change shows Preview / Publish inline
- Operator: token usage per account/site/month; "edit as client" opens the same chat with operator identity recorded on the ChangeSet
- Acceptance: scripted edits on H&H (hours, announcement with quoted text, announcement without, price change, gallery add with HEIC, low-resolution photo, hero copy with a typo, a design request) each produce the right preview or reply; cost per edit recorded and reported. The script is the regression suite for any change to the guidance

### E33 · Visual editor

Built next (above), from `docs/epics/epic-33-visual-editor.md`, which carries the requirements and acceptance.

Goal: the owner clicks a marked field on their own site and changes it, and Publish puts the build they were looking at live (PRD D35 to D45).

- Canvas: the site in a frame with a breakpoint switcher; the site's nav moves between pages and an address bar reaches any page (D43)
- Marked fields only (D35), through C3's `field()` in the site's templates. A bridge script (replacing `src/app/demo/editor-mockup.ts`) reports the marked fields, applies text edits to every element with the edited address, and reports navigation, over postMessage only
- Editors on the canvas for plain text, prices, and an announcement's message and dates; every other marked field opens the quick edit popover scoped to it (D37)
- The draft (D38, from E31): saved as the owner edits, merged per field, versioned, rebased on a Canopy push. The builder answers content reads from its clone and builds newest first; build status is pushed to the page; Publish and unpublished changes sit in the Sites chrome
- Site guide front matter enforced in the tool layer, with counters on the canvas (D40); the nightly rebuild at `Site.timeZone` midnight (D42)
- New code resolves the site by id with an ownership check (D44)

### E34 · Public MCP endpoint and API keys

- Streamable HTTP MCP server at `/mcp` rendered from E32's definitions module (PRD D30): the E31 tools, server instructions carrying the core guidance and the site guide, and `get_site_guide`. Bearer API key per account, scoped to one site, hashed at rest (SHA-256 of a random token, as sessions are), revocable, last-used tracked. Rate limit per key through `src/lib/rate-limit.ts`. Decide here whether OAuth for MCP clients warrants an auth library (PRD D16)
- Operator and account UI: create/revoke keys, copy once
- Docs page under `/docs`: how to connect Claude Desktop / other clients, what the tools do, that publish always requires a preview
- Acceptance: Claude Desktop with the key can list collections, propose a change, request preview, and publish on H&H; a key for site A cannot read site B

### E35 · Stats

- Umami API client; per-site `umamiWebsiteId`. Stats page: visitors, pageviews, top pages, referrers, selectable date range. Every Sites account gets the same Stats; there is no `analyticsTier` in v1 (PRD D21)
- Acceptance: H&H stats match the Umami dashboard for the same range

---

## Phase 4 — H&H production cutover

### E36 · Production on Caddy, publish by swap

Preconditions: E33 stable on preview for at least a week of real use.

Add `Site.status` here (deferred from E29, PRD D21), with values naming which sites Caddy serves in production.

1. Portal adds `hairandharvest.com` + `www` to Caddy config → `current` symlink (pointing at the latest published build)
2. Traefik: route both hostnames to the Caddy container instead of the H&H nginx app. Verify `curl -sI https://hairandharvest.com/` 200 and content parity
3. Flip `publish` behavior: symlink swap first, commit + push async. Restore publishes like any other change (PRD §4.5)
4. Confirm for a week. Delete the old Coolify app. Update `hair-and-harvest` deploy docs
5. Undo path at any step: route Traefik back to the nginx app

Acceptance: publish from quick edit is live in seconds; restore brings back a previous version in seconds; the GitHub repo reflects every published change.

---

## Phase 5 — Toro Z migration

### T1 · Toro Z onto the template (`toroz`)

Same as H1–H3 plus E36 steps 1–5 for `torozmuaythai.com`. Specifics: `site.ts` → collections (schedule logic becomes contract-schema'd `schedule` + derived views in the template), `public/` images → `src/assets` with `image()`, preserve DESIGN.md invariants and the documented accessibility rules. Toro Z's "no content collections" rule in its CLAUDE.md is superseded by this migration; rewrite that sentence, don't append a caveat (its own editing rule).

---

## Not scheduled (recorded so they are not forgotten)

- Tool tabs, build-time (PRD D39): Gallery (D41), Calendar for announcements and events (D42), blog, newsletter
- A demo-account home with a switcher between several demo sites (PRD D44)
- Invite flow and member roles UI (Membership exists from E28)
- New-site onboarding automation (repo from template, DNS, Umami website, Caddy entry)
- Stripe or FreshBooks sync
- SEO/report tier tooling
- SMS intake
- OAuth for the MCP endpoint

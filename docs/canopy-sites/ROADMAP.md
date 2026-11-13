# Canopy Sites — Roadmap and Epic Briefs

**Status:** Draft 1 rev 3, 2026-11-09 (the MVP and its order, after a review of the build). Companion to `docs/canopy-sites/PRD.md`, which owns *what and why*. This doc owns *order* and the brief for each epic.

**For the agent reading this:** each epic below is a brief, not a full epic doc. When you pick one up, write the full epic in the existing `docs/epics/epic-N-*.md` format (Goal / Scope / Requirements / Acceptance), index it in `docs/epics/README.md`, and work from that. Before starting, read `docs/AGENT_CONTEXT.md`. Keep epics atomic; one epic per Claude Code session is the intended grain.

Epic numbers continue the Forms sequence; what has shipped is in `docs/epics/README.md`. Epics in other repos are prefixed.

Open findings from the 2026-11-09 review of the build are in `docs/canopy-sites/REVIEW_FINDINGS.md`; the F numbers below are its entries. Delete this paragraph when that file is.

---

## Sequencing

```
Phase 0  Portal foundation            [this repo]         E27 → E28 → E29
Phase 1  Content contract + H&H       [site-contract, H&H] C1 → H1 → H2 → H3         (parallel with Phase 0)
Phase 2  Builder, preview             [this repo]         E30                        (needs E29, C1)
Phase 3  Editor                       [this repo]         E33 → E32 → E31 → E35      (needs E30; E33 first, below)
Phase 4  Production on nginx          [webber]             E36                        (after the MVP; both boxes keep serving, PRD D57)
Phase 5  Toro Z migration             [toroz]              T1, E42                    (needs E38; follows canopyds.com's path, E37; not gated on E36; Hair & Harvest is E46)
Phase 6  Site kit                     [site-kit, starter]  E41                        (after T1, before the next client site)
Phase 7  New client builds            [webber, this repo]  E43 → E44, E45             (before the next site built from scratch)
Phase 8  Launch readiness             [this repo, webber]  E47, E48, E49              (the MVP's own work)
Phase 9  The suite                    [this repo]          E50 → E51 → E52            (after the MVP: Gallery, Events, Booking)
```

Every site on Sites keeps deploying through its own Coolify app until E36: publish is a commit to `main`, which the app's GitHub App webhook deploys (the fallback path, how canopyds.com runs on Sites since Epic 37). Everything in Phases 2–3 is previewed on the canvas and the preview page (PRD D47). E36 makes publish a symlink swap.

Hair & Harvest is on Sites only as the demo's copy (PRD D23): the `hair-and-harvest` repo was never converted (Astro 5, no contract, checked 2026-11-09). Converting it is in the MVP (PRD D51) as E46. canopyds.com (Epic 37) is the precedent every site follows onto Sites.

### The MVP (decided 2026-11-09)

Nothing has launched (PRD D51). The MVP is the owners of Toro Z, Fur-Ever Friends, Hair & Harvest, and the VETS site claiming their portal, editing, previewing, and publishing safely. Its work, in order; an item leaves this list when it ships:

1. **Fur-Ever Friends' claim** (Epic 42), with Michael's daughter as the owner: the claim's test before a client's.
2. **E47, tool layer fixes** (F1 to F5).
3. **E48, deploys and checks** (F25, F27, F28, F29).
4. **E49, alerting and records** (F26, F31).
5. **Mail that can carry a launch.** The portal's mail shares a small daily ceiling with other mailboxes (the private page). Not moved yet (Michael, 2026-11-10): a risk to track and a fast follow, with what was checked and the candidate in REVIEW_FINDINGS F32. A sender with headroom, and a cap on notification mail, come before claim links go to clients.
6. **The Editor and Quick Edit for a first owner**: F21, F22, F23, F19.
7. **Epics 33, 37, and 38 closed** (F10): mostly Michael's own checks.
8. **Toro Z's claim** (Epic 40, 4.7): the first client owner.
9. **E46, Hair & Harvest onto Sites**, then its claim.
10. **The VETS site onto Sites**, through the Sites Onboarding Runbook, its form going to Monday.com (PRD D53).

**Pivot, 2026-11-12 (Michael):** the MVP now has to carry the VETS site, a real organization Michael is responsible for, with its repo in its own GitHub org and a server of its own. What Sites needed for that is built: a client-owned repo (PRD D61, 5.15.0), and a site with a server and no hours (PRD D62, contract 0.6.0). Item 10's remaining work is in the site's repo (the contract, its copy into content files, the site guide) and the link, which can happen before its domain is live, on a `canopyds.com` name (E44 does this by hand today: the operator edits the hostnames at launch).

To decide before launch, each an entry in REVIEW_FINDINGS: dated notices on a client site (F6), restore (F7), Quick Edit spend the operator can see (F8), the chat forgetting itself on a reload (F20), and the Editor on phones (F24).

After the MVP: E36 (the builder as the production build, both boxes serving), E50 (the media pipeline and the Gallery tab), E51 (Events), E41 (the site kit), E43 to E45, then E52 (Booking). E36 comes first because the nightly rebuild, a draft's photo on the canvas, and a feed fetched at build all need the builder to be the one production build (F11).

### Demo slice first (decided 2026-10-16)

E30 is built first as the demo slice (PRD D23): the builder, preview and publish for the demo site at `sites.canopyds.com/demo`, plus the parts of C1, E31, E32 and E35 the demo needs (Stats with sample data). The demo site has its own repo, so H1 to H3 no longer gate E30; they stay H&H's own migration. Each brief below keeps whatever the slice leaves, and the E30 epic doc records the split.

### Visual editor next (decided 2026-10-17)

E33 is built next as the visual editor (PRD D35 to D45), on H&H as served at `/demo`. It pulls forward what the editor stands on: contract v0.2 (C3), the site's draft (D38) from E31, the site guide's front matter (D40), and the nightly rebuild in the account's time zone (D42) from E32. Photos are the fast follow: E32 starts with its media pipeline, which brings photos to quick edit and to the canvas popover (D41). Until then quick edit can't take a photo at all (as of 2026-10-17). The E33 epic doc, `docs/epics/epic-33-visual-editor.md`, records the split.

### canopyds.com on Sites (decided 2026-10-19)

E37 moves canopyds.com onto Sites on Michael's account (PRD D46): the site's Astro port in `canopy-website`, builder isolation, the canvas for client sites, which loads a site's assets from its live address, and a preview page that opens a draft full-window in a new tab, without the Sites chrome, for every site, so there are no preview hostnames (D47). Publish stays a commit to `main`, deployed by the site's Coolify app, until E36. The epic doc, `docs/epics/epic-37-canopyds-on-sites.md`, carries the requirements.

### Link and claim before Toro Z (decided 2026-11-05)

E38 lets the operator link a live site, which creates the client's account, and lets the client claim it from a link, so Toro Z is the first client set up that way (PRD D49). E39, the per-client welcome video, follows it. The epic doc, `docs/epics/epic-38-link-and-claim.md`, carries the requirements.

### A site kit before the next site (decided 2026-11-06)

With Toro Z, three repos run on Sites (the demo, canopyds.com, Toro Z), and each carries its own copy of the same plumbing: the content loader, image resolving, the editor flags, the mark wiring, the build-parity and CORS settings, and, on Toro Z, the schedule views any class-based site needs. Limits are measured by hand, and go stale when a template's layout changes. E41 moves that into a versioned package installed like the contract, plus a thin starter, after Toro Z is linked and before the next client site. It replaces C2, a copy-once starter: a starter alone copies the plumbing again, and a fix never reaches the sites already made from it.

### Staging, handover before launch, and forms from the build (Michael, 2026-11-06)

Every site on Sites so far was live before it was linked, because the canvas loads a client site's assets from its first production hostname (D47, `src/lib/site-live.ts`). A site Canopy builds from scratch needs three things that path doesn't give: a working version Michael can show a client before launch (E43), the owner editing their copy on Sites before any visitor sees it (E44), and its contact form working on launch day in the client's own account (E45). Staging comes first and starts outside the portal; E44 builds on it.

### Fallback (decision D6 chicken-out)

If the builder and nginx model has to be abandoned: keep Coolify building each site from GitHub on push; keep the builder for **preview only**; publish stays commit-to-main. Everything in E30–E35 remains valid; only E36 is dropped. Document the choice in the PRD if taken.

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

### E46 · Hair & Harvest on Sites (`hair-and-harvest`)

In the MVP (PRD D51). H1 to H3 below are its repo work, brought up to the contract as it stands when the epic starts; then the site is linked, accepted acting as the client, run through the Quick Edit eval, and claimed, as Toro Z was (Epic 40, 4.5 to 4.8) through the Sites Onboarding Runbook. It copies Toro Z's plumbing, as Fur-Ever Friends did, and moves onto the site kit with the others (E41). Its art is checked for text it is drawn against, which is locked and unmarked (PRD D56). The epic doc carries the requirements.

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
- Write H&H's `SITE_GUIDE.md` (PRD D31, D40). `canopy-demo-site` has its own, written from its runbook overlay in Epic 40 (4.4, 2026-11-06); quick edit reads it, as it does every site's
- Acceptance: `validateSite` passes; `astro check` clean; visual parity

### H3 · H&H → tokens

- `tokens.json` → generated CSS custom properties imported by `global.css` `@theme`. Current palette/fonts become the token values; zero visual change
- Fonts limited to Fontsource-hosted families (no external font requests, per Toro Z). Tokens are Canopy's to edit in the repo; no client-facing token editing (PRD D29)
- Acceptance: changing a token value and rebuilding changes the site; visual parity at default values

(Toro Z's `DESIGN.md` and accessibility invariants are the reference for how a site repo documents itself. H&H gets a trimmed equivalent as part of H2/H3.)

### C2 · Shared template

Folded into E41 (2026-11-06): the starter is E41's, built on the site kit and extracted from canopyds.com and Toro Z, since H&H was never converted.

### C3 · `site-contract` v0.2 (built inside E33)

- Every list entry has a required `id` (services, service groups and sections, socials, and every other list of objects); ids are never reused (PRD D36)
- Addresses name a field by collection, then the id of each list entry and the key of each object on the way down (`pages/home/sections/featured/heading`, `services/hair/services/haircut/priceLabel`, `site/hours`). An id need only be unique within its list. `resolveAddress` turns one into the JSON Pointer `applyChanges` uses, against the content it is applied to, so ops survive reordering
- Field metadata through Zod's `.meta()`: kind, label, and description (wording from `QUICK_EDIT_GUIDANCE.md` section 3); `jsonSchemaFor` carries them to the model
- `field(address)`: the attributes a template spreads onto the element it renders an editable value into, which mark it for the canvas
- `parseSiteGuide(markdown)`: the front matter (limits by address, `*` for any id; display formats) and the prose (PRD D40); `validateContent` takes the limits
- A migration from v0.1 content (adds the missing ids), run on the demo site
- Acceptance: the demo site builds on v0.2 with every marked field resolving to a value; a site guide limit refuses an over-length value with a readable reason

---

## Phase 2 — Builder, preview only

### E30 · Builder service and preview

Outcome (as the demo slice, v5.3.0): `docs/epics/epic-30-demo-slice.md`. Built: `Build` and `ChangeSet`, the builder (previews, publish by pointing `current` at the previewed build, demo reset), and the demo served by the portal at `/demo`. Remaining here: client production hostnames (with E36), build retention by `Site.maxBuildsRetained`, the operator build log, and a builder on forms-dev.


Goal: a ChangeSet against H&H produces a viewable preview without touching production.

- Add `Build` and `ChangeSet` (deferred from E29, PRD D21): pick one foreign-key direction between them; hosting stays the builder's (PRD D27, D60)

- `apps/builder`: long-running Node worker, pinned Node 24 image. Per-site working clone under `/srv/sites/<slug>/repo` (repo-scoped token, read/write). Queue: one job at a time per site, jobs across sites may run concurrently (cap 2)
- Job: pull → apply ChangeSet ops → stage media → `validateSite` → preflight media (resize to max edge, strip EXIF, HEIC→JPEG, size cap; moderation hook stubbed) → `npm ci` (cached) → `astro build` → `/srv/sites/<slug>/builds/<buildId>` → flip `preview` symlink → record `Build`
- No preview hostnames (PRD D47); serving production is E36's (PRD D60)
- Retention: prune builds beyond `Site.maxBuildsRetained`, never prune `current` or `preview` targets
- Operator: build log per site with status, duration, stdout tail
- Acceptance: operator triggers a no-op ChangeSet on H&H → the canvas shows the built site in < 60 s; a deliberately broken ChangeSet fails validation and leaves `preview` pointing at the previous build

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

Epic 40 (T1) takes three of these ahead of the rest, because Toro Z depends on them: the site guide's prose in the prompt with `Site.runbookOverlay` dropped, the base prompt rewritten from QUICK_EDIT_GUIDANCE, and `requestHelp` (PRD D34).

- Claude API, tool use, tools = E31 layer in-process. Model names and per-model roles (classify vs edit) in env, not code
- Definitions module shared with E34 (PRD D30): tool names, descriptions, schemas, core guidance, quick edit persona, wording from `docs/canopy-sites/QUICK_EDIT_GUIDANCE.md`. Replace `runbook.ts`; cut the guidance doc to its placement rules and numbers. Tool definitions identical across sites so the shared prefix caches product-wide
- Prompt assembly: core guidance + persona (cached, shared) + the prose of `SITE_GUIDE.md`, read through the builder from the published commit (PRD D31; E33 reads its front matter) + JSON Schema for every collection, carrying C3's field descriptions. Drop `Site.runbookOverlay` and its operator textarea; resolve dates with the account's zone, `Account.timeZone`
- Alt text limit 125
- Verbatim copy (PRD D32): the guidance and the scripted edits cover asking for quoted text, typo corrections reported back, and site-rule conflicts. Update the demo's suggested prompts to quote their text
- Tool-result checks per the guidance doc section 2: stale mentions, date and weekday mismatches, duplicates, link reachability, expired-announcement pruning
- Media: `uploadMedia` with preflight per the guidance doc (formats, normalization, size per slot with the refuse and warn levels). The model gets a downscaled copy for alt text, placement, and moderation (PRD D33); alt text is suggested and the owner accepts or edits it. The canvas popover gets an attach button, so a photo on the canvas is replaced through it (PRD D41)
- `requestHelp` and a `HelpRequest` table; operator view lists open requests (PRD D34)
- `Conversation` persisted with tokens in/out and cost estimate. Add `Plan.monthlyAiBudgetCents` (meaning in PRD D21), with the `SITES` value set from the cost per edit this epic measures; soft-stop at 100% with operator notification
- UI: the Quick Edit tab, and the canvas popover from E33 (the same chat scoped to one field, PRD D37). Each assistant turn that produces a change shows Preview inline; Publish is on the preview page (PRD D47)
- Operator: token usage per account/site/month (acting as the client is E38's)
- Acceptance: scripted edits on H&H (hours, announcement with quoted text, announcement without, price change, gallery add with HEIC, low-resolution photo, hero copy with a typo, a design request) each produce the right preview or reply; cost per edit recorded and reported. The script is the regression suite for any change to the guidance

### E33 · Visual editor

Built next (above), from `docs/epics/epic-33-visual-editor.md`, which carries the requirements and acceptance.

Goal: the owner clicks a marked field on their own site and changes it, and Publish puts the build they were looking at live (PRD D35 to D45).

- Canvas: the site in a frame with a breakpoint switcher; the site's nav moves between pages and an address bar reaches any page (D43)
- Marked fields only (D35), through C3's `field()` in the site's templates. A bridge script (replacing `src/app/demo/editor-mockup.ts`) reports the marked fields, applies text edits to every element with the edited address, and reports navigation, over postMessage only
- Editors on the canvas for plain text, prices, and an announcement's message and dates; every other marked field opens the quick edit popover scoped to it (D37)
- The draft (D38, from E31): saved as the owner edits, merged per field, versioned, rebased on a Canopy push. The builder answers content reads from its clone and builds newest first; build status is pushed to the page; unpublished changes sit in the Sites chrome, and E37 moves Publish from there to the preview page (PRD D47)
- Site guide front matter enforced in the tool layer, with counters on the canvas (D40); the nightly rebuild at midnight in the account's zone (D42)
- New code resolves the site by id with an ownership check (D44)

### E34 · Public MCP endpoint and API keys

After v1 (PRD D59), and not scheduled.

- Streamable HTTP MCP server at `/mcp` rendered from E32's definitions module (PRD D30): the E31 tools except `publish`, which only the preview page calls (PRD D47), server instructions carrying the core guidance and the site guide, and `get_site_guide`. Bearer API key per account, scoped to one site, hashed at rest (SHA-256 of a random token, as sessions are), revocable, last-used tracked. Rate limit per key through `src/lib/rate-limit.ts`. Decide here whether OAuth for MCP clients warrants an auth library (PRD D16)
- Operator and account UI: create/revoke keys, copy once
- Docs page under `/docs`: how to connect Claude Desktop / other clients, what the tools do, and that a change is published from its preview page
- Acceptance: Claude Desktop with the key can list collections, propose a change, and return the preview page's link, where the owner publishes; a key for site A cannot read site B

### E35 · Stats

- Umami API client; per-site `umamiWebsiteId`. Stats page: visitors, pageviews, top pages, referrers, selectable date range. Every Sites account gets the same Stats; there is no `analyticsTier` in v1 (PRD D21)
- Acceptance: H&H stats match the Umami dashboard for the same range

---

### E38 · Link and claim

From `docs/epics/epic-38-link-and-claim.md`. The operator links a live site by its repo, which creates the client's account and site; the client claims it from a link. Act as client (E32's "edit as client", smaller), the operator's view of where each client stands, tabs that follow what the account has, and a GitHub App in place of per-site tokens. Toro Z is its first client (PRD D49).

### E39 · Welcome video

Goal: each client's portal opens on a walkthrough Michael recorded for them, because each portal shows different things depending on what the site has. Builds on what E38 left ready (its section 4.6). Decided by Michael, 2026-11-05: the portal hosts the video (no third-party player); it's recorded in any tool that exports MP4 (Snagit, Loom, Google Vids); captions are required; how much was watched is good to have, not essential.

- Storage: a Coolify persistent volume on the prod and dev portal apps at `/app/media`, created in the Dockerfile owned by `nextjs` (uid 1001; the portal had no volume as of 2026-11-05), named by `MEDIA_DIR` (unset means no videos). Files `welcome/<siteId>/<key>.mp4` and `<key>.vtt`, the key a hash of the MP4; a replacement writes a new key and deletes the old pair. Not in the nightly backups, which cover databases; a lost video is re-uploaded from Michael's original
- Upload on the operator site page: the MP4 and a WebVTT captions file, both required. A route handler behind `requireGlobalAdmin` streams to disk and refuses over 100 MB (Cloudflare's per-request limit on Free and Pro); it checks the MP4's `ftyp` box and the VTT's `WEBVTT` header. Captions come from the recording tool, or Claude Code transcribes the MP4 with Whisper on Michael's workstation and he reads the VTT; a bigger video is re-encoded with `ffmpeg` first
- Playback: `/welcome/<siteId>/<key>.(mp4|vtt)` for members of the site's account and an acting operator only (through `memberships.ts`), with byte ranges so it seeks, `Cache-Control: private`. A native `<video controls>` in a dialog with captions on, never autoplaying, opened once on the owner's first session after claiming, never while the operator acts as the client. The furthest point reached and the video's length on the owner's Membership; the operator's owner card shows "Watched 4:12 of 5:03". The help bubble reopens it
- Acceptance: on the owner's phone the video opens once, silent until played, with captions, and seeks; the operator page shows how far they got; signed out or as another account, its files 404

## Phase 4 — Production on nginx

### E36 · Production on nginx, publish by swap

Preconditions: E33 stable on preview for at least a week of real use, and alerting in place (E49). Which site goes first is decided when E36 starts (canopyds.com is the lower-stakes candidate, epic-37 section 7); each site on Sites then follows the same steps.

Client sites keep both boxes throughout (PRD D57): Webber and Fox both serve every client site today, with Cloudflare routing between them, and no step here takes a site off either box before that box serves the builder's output for it. Nothing in this epic risks a site that is live.

Add `Site.status` here (deferred from E29, PRD D21), with values naming which sites are served from the builder's output in production.

1. Each box runs a builder that builds the site from git, and nginx on each, with one fixed config, serves the site's production hostnames from `current` (the latest published build): a hostname is a link to its site's `current` (PRD D60). How soon Fox's builder picks up a publish is the epic doc's first decision
2. Traefik, one box at a time and Fox first: route those hostnames to that server instead of the site's nginx app. Verify `curl -sI https://<hostname>/` 200 and content parity through each box
3. `publish` keeps its order, commit and push then swap, and the swap now changes what visitors see (PRD D60). Restore publishes like any other change (PRD §4.5)
4. Confirm for a week. Retire the site's Coolify apps, on both boxes, only once both serve the builder's output. Update the site repo's deploy docs
5. Undo path at any step: route Traefik back to the nginx app

Acceptance: a publish is live in seconds on both boxes; with either box stopped the site still serves its published version; the nightly rebuild changes what visitors see; restore brings back a previous version in seconds; the GitHub repo reflects every published change.

---

## Phase 5 — Toro Z migration

### T1 · Toro Z onto the template (`toroz`)

Onto Sites the way canopyds.com went (Epic 37), through the Sites Onboarding Runbook (Nextcloud). Publish is a push to `main`, which Toro Z's Coolify app already deploys through its GitHub App webhook (a webhook deploy on 2026-10-08, checked 2026-11-05), so E36 isn't a precondition; Toro Z moves to the builder's output with E36 like every other site. Specifics: `site.ts` → collections (contract 0.5.0's `classes` carry their sessions, and the schedule's views are derived in the template), `public/` images → `src/assets` with `image()`, preserve DESIGN.md invariants and the documented accessibility rules. Toro Z's "no content collections" rule in its CLAUDE.md is superseded by this migration; rewrite that sentence, don't append a caveat (its own editing rule). The epic doc, `docs/epics/epic-40-toroz-on-sites.md`, carries the requirements, with the E32 pieces Toro Z depends on and the lane in code (PRD D50).

### E42 · Fur-Ever Friends on Sites (`fur-ever-friends`)

A site Michael controls, through the same runbook, so the owner's claim is tested end to end before Toro Z's link goes out. Its form is the first a client's site embeds from the client's own account, built by the operator acting as them (Epic 38, 4.5). The epic doc, `docs/epics/epic-42-fur-ever-friends-on-sites.md`, carries the requirements.

---

## Phase 6 — Site kit

### E41 · `@canopy/site-kit` and a starter

Goal: the code every Sites repo copies today lives in one versioned package, so a fix reaches every site with a version bump, and a new site starts from a starter rather than from another site's repo. Extracted from canopyds.com (`canopy-website`) and Toro Z (`toroz`, after T1), whose versions are the reference.

- The package, released like the contract (a tarball on this repo's releases, `packages/site-kit`):
  - **Content**: a loader that validates `src/content` against the contract at build and fails with every issue, typed collections, page, section, and card lookups, navigation from `pages`, phone forms for display and links, socials by network. Toro Z's `content.ts` and canopyds.com's `content.ts` are the two copies it replaces.
  - **Images**: a contract `AssetPath` resolved to `astro:assets` (Toro Z's `images.ts`).
  - **Portal flags**: `inEditor` and `inPreview`, the editor-at-rest CSS (reveals shown, transitions off), and a helper that opens anything hiding marked text.
  - **Schedule views** for any site with `classes`: week board blocks by part of day, day and time formatting, a class's times, appointment windows, and the structured data's opening hours (Toro Z's `schedule.ts`, made general).
  - **Marks**: `field` and a check that every marked element's text equals its content value, run on a build.
  - **Measure**: the guide's limits as a command that renders the built site at 360 and 1440 px and writes or checks `SITE_GUIDE.md`'s `limits` (each field at most one line past today's copy, or the longest in its list), plus renders at the counts. Run when a template's layout changes; a check fails when the guide no longer matches the layout.
  - **Build parity**: a check that the builder-style build and the production image name the same `_astro` files.
- The starter (`canopy-site-template`): an Astro 7 repo wired to the kit and the contract, with the Dockerfile (`npm ci --ignore-scripts`), `nginx.conf` with CORS, Tailwind reading `src/` only, Umami with `data-domains`, and a `SITE_GUIDE.md` skeleton. The Sites Onboarding Runbook's section 2 starts from it.
- canopyds.com, Toro Z, and Fur-Ever Friends (Epic 42, which copied Toro Z's plumbing) move onto the kit; the demo with its contract upgrade.
- Open for the epic doc: whether fixed lists move from the `Site` row into the guide's front matter, beside counts, since both are facts of the design; the row would then keep only locks.
- Acceptance: a new site from the starter passes the runbook's section 2 with no code copied from another site; a fix in the kit reaches canopyds.com and Toro Z by a version bump; the measure command reproduces Toro Z's limits and catches a layout change that makes one stale.

---

## Phase 7: New client builds

### E43 · Staging

Goal: Michael shows a client the working version of their site, before launch and for any later change Canopy makes, at an address only the people he shares it with can open, and the client says what they want changed. It starts outside the Sites portal (Michael, 2026-11-06).

- A staging build is its own build from its own branch on its own hostname, never the production app serving a second name: Toro Z's `toroz-dev` was retired on 2026-08-13 because it was the same app off the same build, so nothing could differ between it and production (`toroz/deploy-to-webber.md`).
- Not indexed, and readable only by the people Michael names: the client and anyone they bring in.
- Collaborative: the client's feedback reaches Michael tied to the page it's about.
- A Canopy-side staging, for Canopy's own work on a site. An owner's drafts stay on the canvas and the preview page with no hostname (D47).
- Open for the epic doc: the branch model (one `staging` branch per site, or one per change); who can open it (Cloudflare Access by email, or a share link); how feedback is given (comments on the page, or the portal's request card, D34, once it's in the portal); whether the builder (E36) or a Coolify app per site serves it; and when it moves into the portal.
- Acceptance: a client opens their site's staging address from Michael's invitation, sees a change before production does, and sends feedback on a page; a stranger with the address can't open it, and no search engine indexes it.

### E44 · Handover before launch

Goal: a new client claims their portal and edits their copy before any visitor can see the site, and Canopy launches it when they're done.

- A site is linked before launch with its staging address (E43) where the production hostname will go, so the canvas and the preview page load from it (D47). The owner edits, previews, and publishes there; nothing is public.
- **Launch** (operator, on the site's page): once the go-live infrastructure is in place (the New Client Checklist), the production hostnames go first in the site's list, and from then on a publish deploys to production.
- The canvas loads a page's assets cross-origin from a sandboxed frame, with no cookies, so a staging address gated by Cloudflare Access must still serve the site's static files to it (a path-scoped bypass for `/_astro/` and fonts, or the builder serving them).
- Amends D47, D49, and the Sites Onboarding Runbook's section 1 ("the site is live") when approved.
- Acceptance: a site linked before launch is edited, previewed, and published by its owner with no public address serving it; Launch makes it public with the owner's edits, and the canvas follows.

### E45 · A site's forms from its build

Goal: a new site's form works the moment the site does, in the client's own account, with nothing rewired after linking. As of 2026-11-06, Forms can't import, export, or duplicate a form; a site embeds a form by its id; and a form's allowed origins are typed by hand. So a site's form is built after linking, acting as the client (D49), and its id committed after that (Epic 42, 4.4).

- **The form is written during the build** (Site Build Checklist), as a definition file in the site repo in Forms' own field model: fields, title, settings, and notifications to the owner. Forms gains import of that file and export to it, so a form Michael builds by hand can become one too.
- **Link a site imports the repo's forms** into the new account, so the owner's Forms tab and submissions start with them; acting as the client, an Import does the same for a site already linked.
- **The embed names its form** (`contact`) and the portal resolves the name within the site's account, so the template is written once, before any account exists. A form's allowed origins come from its site's hostnames.
- The embed component, with its placeholder under the portal flags, goes into the site kit (E41).
- Acceptance: a site from the starter with a form definition, once linked, serves a working form whose submissions land in the client's account, with no commit after linking.

---

## Phase 8: Launch readiness

The MVP's own work (PRD D51), from the 2026-11-09 review. Each finding's detail is its entry in `docs/canopy-sites/REVIEW_FINDINGS.md`.

### E47 · Tool layer fixes

Goal: a draft and a publish hold up when two things happen at once, and a guide rule the site already breaks doesn't stop an owner's edit.

- F1 to F5, each landing with the test that fails without it. F2 to F5 have tests beside the catalog that pass while the defect is present
- Acceptance: those tests turned around and passing; the suite passes

### E48 · Deploys and checks

Goal: a release that fails to start leaves the one before it serving, and a change is checked by something other than the session that wrote it.

- A `/healthz` route, a Dockerfile `HEALTHCHECK`, and health-gated deploys on the portal apps (F28); a migration is written so the release before it can run against it
- A workflow on pull requests to `main`: build, lint, and the suite against a Postgres service (F29)
- The portal on Node 24, with Vitest 5 (F27); the Prisma CLI past its advisories, and `uuid` dropped (F25)
- Acceptance: a migration that fails on dev leaves dev serving the previous release; a pull request with a failing test shows it failed

### E49 · Alerting and records

Goal: Michael is told when the portal or the builder is down, and what happened on the platform can be looked up afterwards (Michael, 2026-11-10; F31, F26).

- A check from outside Webber on the portal's health, which answers for the builder too (the builder has no public address), alerting through a channel that doesn't depend on Webber
- An alert on a failed nightly rebuild, a failed publish, and a builder error
- An audit table for operator actions and sign-in events, replacing the lines printed to the container
- A request log at the proxy on both boxes, without query strings and with a retention period (the Nextcloud page REVIEW_FINDINGS names)
- Open for the epic doc: what does the checking (the health tool the New Client Checklist names, an outside monitor, or Cloudflare), and where alerts go: email shares the portal's mail ceiling, a text or a push doesn't
- Acceptance: with the dev portal stopped, Michael is alerted within minutes, and the same check covers production's portal and builder; an operator action and a sign-in from the week before can be found

---

## Phase 9: The suite

After the MVP (PRD D52, D54, D55).

### E50 · Media pipeline and the Gallery tab

Goal: an owner adds, reorders, and removes photos in a tab, and Quick Edit does the same through the tab's own form (PRD D41, D54).

- E32's media pipeline: upload, preflight, staged until publish
- A draft's photo shows on the canvas from the builder: the canvas loads a client site's assets from its live address, where an unpublished photo doesn't exist (F11)
- The Gallery tab, then Quick Edit and the canvas popover attaching through its form (F18, F19)
- Instagram as a source, for Toro Z: fetched at build and never committed, so after E36, when the token lives with the one production build. Open: Meta's review of the app

### E51 · Events

Goal: an owner adds an event with its date, time, and place, and it leaves the site by itself when it is over.

- An `events` collection in the contract, with the first site that renders it; its tab; then Quick Edit filling the tab's form
- Structured data and add-to-calendar from the build
- After E36: the nightly rebuild has to reach a client's live site (F6)

### E52 · Booking

PRD D55. Open for the epic doc: where a bookable service's length lives (the contract's `services`, or the booking component), and whether availability is read from the calendar's private address or through Google sign-in.

---

## Not scheduled (recorded so they are not forgotten)

- Tool tabs after Gallery and Events (PRD D39): a Calendar putting announcements and events on one timeline (D42), blog, newsletter
- Members (a light CRM) and newsletters as runtime components (PRD D52)
- An export that strips the CMS out of a site (PRD D58)
- Database failover for the portal (PRD D51, F12)
- A demo-account home with a switcher between several demo sites (PRD D44)
- Invite flow and member roles UI (Membership exists from E28)
- Creating a site's repo, DNS, Umami website, or hostname link from the portal (the operator links a live site, E38)
- Stripe or FreshBooks sync
- SEO/report tier tooling
- SMS intake
- The public MCP endpoint and its OAuth (E34; PRD D59)

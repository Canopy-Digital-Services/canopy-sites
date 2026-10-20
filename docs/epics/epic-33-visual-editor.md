# Epic 33: Visual Editor

**Status:** In progress: sections 4.1 to 4.6 released in v5.5.0 (2026-10-18) for Michael's UAT on the demo
**Phase:** 3, Editor (`docs/canopy-sites/ROADMAP.md`), built ahead of E31 and E32 ("Visual editor next")
**Predecessor:** Epic 30 (Builder, preview, and the demo slice)
**Successor:** E32, starting with photos in quick edit and on the canvas (the fast follow), then E31's remainder (restore)

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/canopy-sites/PRD.md` (D3, D9, D19, D28 to D45, sections 4.4 to 4.6), `docs/canopy-sites/ROADMAP.md` (C3, E31, E32, E33), `docs/canopy-sites/QUICK_EDIT_GUIDANCE.md` (sections 1, 2, 7), `docs/epics/epic-30-demo-slice.md` (sections 6 and 8), `packages/site-contract/README.md`, `apps/builder/README.md`, and the `docs/tools/*.md` for whatever you touch. In Nextcloud (Canopy Sites collective): **Invisible CMS (LLM-Native Content Layer)**, **Site Build Checklist**, **Copy Guidelines**.

---

## 1. Goal

The Editor tab stops being a concept. Signed in as the demo account, the owner sees H&H as served at `/demo` on a canvas, clicks a marked field, changes it, watches the canvas update, and publishes the build they were looking at. Fields the canvas can't edit yet open quick edit in a popover scoped to them. Quick Edit stays the home tab and the primary way to edit; both write one draft.

The plan was settled with Michael on 2026-10-17 and is recorded as PRD D35 to D45. This doc carries the implementation detail and the split across briefs; it does not restate the decisions.

## 2. Scope

### In

- **C3, contract v0.2** (ROADMAP C3): required ids, addresses, field metadata, `field()`, `parseSiteGuide`, the v0.1 migration, released per PRD D26.
- **The draft** (PRD D38, from E31): `ChangeSet.version`, draft saves, per-field merging and conflicts, rebase on a branch move, sites resolved by id.
- **Builder speed and schedule**: content reads from the clone, newest-first builds, build status the portal can push, the nightly rebuild (PRD D42) with `Site.timeZone`.
- **Site guide front matter** (PRD D40): the builder returns `SITE_GUIDE.md` with content; the tool layer enforces its limits. A site without a guide gets the contract's caps only.
- **The canvas** (PRD D43): bridge script, marked fields in the demo site's templates, breakpoint switcher, address bar.
- **Editing**: the canvas's own editors, the quick edit popover (PRD D37), unpublished changes and Publish in the Sites chrome (E37 moves Publish to the preview page, PRD D47).
- **Speed**: timings for the editor's paths, measured on production after the tunnel fix (section 3).

### Out

| Not here | Why / where |
|---|---|
| Photos on the canvas | They stay unmarked until E32's media pipeline gives the popover an attach button (D41): a photo that opens a chat unable to replace it is the disappointment D35 exists to prevent |
| Section headings, eyebrows, button labels | Not marked in this epic: the Invisible CMS page puts facts and prose before chrome, which owners rarely ask to change and which is most likely to break a layout |
| Tool tabs (Gallery, Calendar) | D39; not scheduled |
| Client sites on the canvas | E37, with assets from each site's live address (D47) |
| Demo switcher | D44 |
| Marker styling beyond a working default | D35: decided later with Michael |
| Restore UI | E31 remainder |
| Quick edit's definitions module, `request_help`, AI budget, media | E32 remainder |
| MCP | E34 |
| The real H&H (`hair-and-harvest`) | H1 to H3 |

## 3. Gating

- **The webber tunnel must connect near home.** Found 2026-10-17: after the fibre outages at 01:06 and 01:25 UTC that day, webber failed over to its LTE backup (European egress), cloudflared reconnected through London, and it stayed there after failback. Every request to webber (portal, canopyds.com, client sites) took about 0.75 s longer than through San Jose. From inside webber the portal answers `/login` in 46 ms. A restart of cloudflared reconnects it; preventing a repeat after the next failover is an open item (section 7). Speed measurements in this epic are meaningless until this holds.

## 4. Requirements

### 4.1 Contract v0.2 (`packages/site-contract`)

- Required `id` on every list of objects: services (optional today), service groups and category sections (none today), socials (none today), and the lists that already have one. Hours and a section's `body` paragraphs are single fields, edited whole.
- Addresses: collection, then each list entry's id and each object key on the way down (`site/hours`, `announcements/<id>/message`, `pages/home/sections/featured/heading`, `services/<category>/services/<service>/priceLabel`). `resolveAddress(content, address)` returns the JSON Pointer; `applyChanges` accepts ops by address. `serviceIndex` returns each service's address with it, so a template rendering a featured service marks the menu entry it came from.
- Field metadata with Zod 4's `.meta()`: `kind` (short text, paragraph, date, time, price, image, link, reference), `label`, and `description` (wording from `QUICK_EDIT_GUIDANCE.md` section 3). `jsonSchemaFor` carries them to the model.
- `field(address)` returns the attributes a template spreads onto the element holding an editable value (`data-canopy-field`).
- `parseSiteGuide(markdown)` returns `{ limits, formats, prose }`; `validateContent(raw, { limits })` applies limits by address pattern (`*` matches one id). A malformed front matter block is an error, never silently empty.
- `migrate(content, fromVersion)` adds the missing ids (slugs of the entry's name, made unique within the list).
- Release `site-contract-v0.2.0`; the demo site installs it and migrates its content.
- **Release order.** The portal and builder validate with the workspace contract, so once they run v0.2 the demo's v0.1 content fails (57 issues, checked 2026-10-18), and the v0.1 portal rejects migrated content. Merge the release and push the demo repo's upgrade commit together; quick edit on the demo fails in between.

### 4.2 The draft (`src/lib/site-tools`, migrations)

- Migrations, each additive, SQL read before commit: `ChangeSet.version` (int, default 0); `Site.timeZone` (IANA name, default `America/Los_Angeles`, set for the demo site).
- Every new tool function takes a `siteId` and checks it against the session's account (PRD D44). `siteFor(accountId)` stays only where existing callers need it.
- `saveDraft(ctx, siteId, { ops })`: merges ops into the pending ChangeSet by address (a later `replace` of an address supersedes an earlier one, so the last write to a field wins); validates the merged draft against published content, locked fields, the contract, and the site guide's limits; bumps `version`; requests a build. Two writes that land together both apply, one after the other (the loser of the race reruns on top of the winner). Draft saves have their own rate limit, well above `PROPOSALS_PER_HOUR`, which stays for model proposals.
- `proposeChange` (quick edit, later MCP) writes through the same path.
- Rebase: when the branch has moved, the draft's ops are re-resolved against the new content and re-validated; the draft fails only if an op no longer applies or validates. This replaces `getContentView`'s fail-on-mismatch.
- Change summaries for canvas edits come from field labels ("Haircut price: $85 to $90"); a model proposal keeps its own summary.
- Publish is allowed only when the latest succeeded build is of the draft's current version.

### 4.3 Builder (`apps/builder`)

- Content reads answer from the clone. The builder fetches when its copy is older than a short interval, after its own publish or reset, and when asked to refresh; never on every read.
- The content read returns `SITE_GUIDE.md` (raw) beside the content, so the portal parses the front matter and E32 reads the prose from the same place.
- Newest-first: a queued preview for a site is dropped when a newer one for that site arrives (recorded as superseded, not failed). A running build finishes.
- Build status reaches the Editor without the browser polling: the portal subscribes to the builder (long-poll or a short internal poll) and pushes to the page over server-sent events.
- Nightly rebuild: at local midnight in each site's time zone, rebuild the branch's HEAD and point `current` at it, then rebuild the draft if there is one. The portal registers each site's slug, repo, branch, and time zone with the builder, which keeps the schedule.

### 4.4 Demo site (`canopy-demo-site`)

- No site guide in this epic (Michael, 2026-10-17): the demo will share H&H's, written in H2, and until then the contract's caps are the limits. Tests use a fixture guide.
- Retag `demo-baseline` after the content migration and the template markers land, per the demo repo's `CLAUDE.md`.

### 4.5 The canvas

- **Marked fields** in the demo site's templates through `field()`: the announcement (message and dates), the hero line, service names, descriptions, and prices (menu and featured), review quotes and authors, the about quote and paragraphs, policy paragraphs, and hours. Nothing else.
- **Bridge script**, replacing `src/app/demo/editor-mockup.ts`, injected by the `/demo` route in editor mode. Over postMessage only: it reports the page's path and each marked field (address, box) on load, scroll, and resize; reports a click on a marked field as a selection (and swallows only that click); applies a text patch to every element with an address; reports navigation. Unmarked clicks behave as on the live site. The parent accepts messages only from the frame's own window; the page accepts them only from its parent and the portal origin it was given. Nothing the page sends can write: every write is a server action with the guards of section 4.2.
- **Editor mode** in the demo site: a flag the route sets in `<head>` skips the intro animation (replacing the mockup's CSS override) and analytics.
- **Breakpoint switcher**: desktop (1280 px, scaled to fit) and phone (390 px, actual size).
- **Address bar**: the current path; picks any page from `pages`; back and forward through the frame's history.

### 4.6 Editing

- Selecting a marked field opens an editor anchored to it: the field's label, an input by kind (text, paragraph, price, date range for an announcement), a counter at the site guide's limit with the contract's cap behind it, the browser's spellcheck, Done and Cancel.
- Text and paragraph edits patch the canvas as typed; the save goes out in the background (section 4.2). Edits whose rendering is derived (hours, dates) rebuild instead, with the affected field shown as updating.
- Every other marked field opens quick edit in the popover: the existing loop in `src/lib/quick-edit`, opened with the field's address and value in the first user turn, writing the same draft (PRD D37).
- Undo within the session: back to the field's previous value, saved as a new edit.
- Sites chrome: unpublished changes, Publish (enabled per section 4.2), Discard. The Quick Edit tab's pending change is the same draft. E37 moves Publish to the preview page, its only home (PRD D47).
- Tool-result warnings (QUICK_EDIT_GUIDANCE section 2) arrive as data and show beside the field.

### 4.7 Tests

Database tests for: a site resolved by id for another account is refused; the last write to a field wins across sources, and simultaneous saves both land; a site guide limit is refused server-side; a rebase keeps a draft whose ops still apply and fails one whose don't; publish refuses a build of an older draft version. Unit tests for `resolveAddress`, `parseSiteGuide`, the v0.1 migration, the builder's newest-first queue, and the bridge's message checks. Each guard's test fails with the guard removed.

## 5. Acceptance

- [ ] On production as the demo account, the Editor shows H&H at `/demo` with only the fields in section 4.5 marked; the nav moves between pages, the address bar reaches every page, and the breakpoint switcher shows the phone layout
- [ ] Editing a price updates it in the menu and in featured services as typed, and an over-limit value can't be entered and is refused by the tool layer
- [ ] Hours changed through the popover land in the same draft and the canvas rebuilds; Quick Edit's tab shows the same draft
- [ ] Publish puts the build on the canvas live at `/demo` and commits to `canopy-demo-site`
- [ ] A push to the demo repo while a draft is open rebases it
- [ ] An announcement dated for tomorrow appears after the nightly rebuild with no publish
- [ ] Timings recorded on production: Editor first load, a text edit (no round trip), a draft save, a structural edit to an updated canvas, publish
- [ ] Every migration read; `npm run build`, `lint`, `test` pass; every guard's test fails with the guard removed

## 6. Decisions

### Michael (2026-10-17)

Recorded as PRD D35 to D45 and not repeated here. The ones that shaped this doc's scope: only editable fields are marked (D35); quick edit stays primary and pops up where the canvas has no editor (D37); tools are separate, build-time tabs (D39); limits live in the site guide (D40); H&H at `/demo` is customer zero, and no canopyds.com demo or demo template now (D44).

### Agent calls inside scope

- **E33's number.** The visual editor is E33's brief (it replaced page tiles), so it keeps that number and pulls forward from C1, E31, and E32, as E30 did.
- **Photos and chrome unmarked** (section 2, Out).
- **The nightly rebuild runs in the builder**, the one long-running process with a clock; the portal registers time zones with it.

## 7. Open

- **Marker styling** (D35).

## 8. Completion report

Not started.

## 9. Progress log

- 2026-10-17: Planned with Michael (PRD D35 to D45; ROADMAP "Visual editor next", C3, E33). Diagnosed the slow portal as the tunnel (section 3).
- 2026-10-18: Tunnel restarted by Michael at 03:21 UTC: all four connections on `sjc`, portal `/login` 0.30 to 0.36 s from 0.9 s. `canopy-wan-tunnel-rehome` (restarts cloudflared 10 minutes after a stable failback when an edge isn't `sjc`) dry-run on webber and installed by Michael; the LTE Backup WAN page documents it.
- 2026-10-18: Built 4.1 (`b994d62`, `4cf89fe`: contract v0.2 with addresses, field metadata, `field()`, site guide parsing, migration, pointer-to-address rewriting; 28 contract tests), 4.2 (`da2e50e` migrations, `1acbf77` the draft; tool layer 23 tests, every new guard checked to fail with it removed), 4.3 (`d81d623`: content reads from git objects in about 60 ms locally, newest-wins previews checked with four concurrent requests, `TZ` per site build, nightly schedule registering). Not yet: build status pushed over SSE (with the editor UI, 4.6), the nightly rebuild run end to end (needs the demo on v0.2 locally). The demo's real content migrates cleanly and passes v0.2.
- 2026-10-18: Michael on the stale-write refusal: one editor at a time is the norm, so no false positives. The draft now takes the last write per field, and writes that race both land (`9e9f597`, PRD D38 revised). `dev` pushed at `9e9f597`.
- 2026-10-18: Built 4.4 to 4.6. Demo repo branch `visual-editor` (local only; pushed to the local test remote, never GitHub): a LOCAL ONLY commit installing contract 0.2.0 from the local builder's `/remotes` tarball (replace it with the release URL before GitHub), content migrated by `migrateSite`, fields marked with `field()`, a `ServiceRow` component replacing four copies, price and duration in separate elements, the intro skipped in editor mode. The local builder built it in 16 s. Portal: `/demo?canopy_editor=1` and the bridge; the canvas (srcdoc frame, nav and page picker, back and forward, desktop and phone); text, paragraph, and price edited in place with a counter at the field's limit; announcement dates in the panel; every other marked field opens quick edit scoped to it (`QuickEditScope` in the opening message); `DraftStatus` with Publish and Discard in the Sites chrome; `ChangeSetSource` `EDITOR`. Checked in headless Chromium at 1440 px: canvas ready, price edited in place to $95 (3 of 40 characters), saved, preview built, chrome showed Unpublished changes, nav to Services, phone view, hours opening the quick edit popover, then Publish: the local remote got commit "Haircut price: $95" and `/demo` showed $95 with no bridge in the live page. No console errors. Warm editor load about 0.9 s locally. Not yet: build status pushed over SSE (the canvas and chrome poll), the nightly rebuild run end to end, the quick edit popover sent a real message (it is the existing loop with the scope in the opening message), the contract release and the demo's GitHub upgrade (release order, 4.1), production timings.
- 2026-10-18: Released v5.5.0 for UAT (PR #34, merge `c6715a3`): `site-contract-v0.2.0` released; portal and builder deployed, all three migrations applied; the demo repo's `main` and `demo-baseline` moved to `2128471` (contract 0.2.0 from the release, migrated content, field marks), built and published through the production builder with the site's time zone. Live `/demo` carries 24 marked fields on home and no bridge; canvas mode is a 404 signed out. Follow-ups found on the way: the operator's Build and publish sends no time zone (its builds date in UTC); the canvas asks for `/demo/` and takes Next's trailing-slash redirect on home. Not done: a dev builder for sites-dev (deferred by Michael as hygiene).

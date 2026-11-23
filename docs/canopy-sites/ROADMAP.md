# Canopy Sites — Roadmap and Epic Briefs

**Status:** Draft 1 rev 3, 2026-11-09 (the MVP and its order, after a review of the build). Companion to `docs/canopy-sites/PRD.md`, which owns *what and why*. This doc owns *order* and the brief for each epic.

**For the agent reading this:** each epic below is a brief, not a full epic doc. When you pick one up, write the full epic in the existing `docs/epics/epic-N-*.md` format (Goal / Scope / Requirements / Acceptance), index it in `docs/epics/README.md`, and work from that. Before starting, read `docs/AGENT_CONTEXT.md`. Keep epics atomic; one epic per Claude Code session is the intended grain.

Epic numbers continue the Forms sequence; what has shipped is in `docs/epics/README.md`. Epics in other repos are prefixed.

Open findings from the 2026-11-09 review of the build are in `docs/canopy-sites/REVIEW_FINDINGS.md`; the F numbers below are its entries. Delete this paragraph when that file is.

---

## Sequencing

Phases 0 and 2 have shipped (Epics 27 to 30), and so has the contract's first release.

```
Phase 1  Client 2               [Client 2]                E46                        (its claim is in the MVP)
Phase 3  Editor                       [this repo]         E33 → E32 → E31            (E33 first)
Phase 4  Production on nginx          [webber]             E36                        (after the MVP; both boxes keep serving, PRD D57)
Phase 5  Client 1 migration             [client1]              T1, E42                    (needs E38; follows canopyds.com's path, E37; not gated on E36; Client 2 is E46)
Phase 6  Site kit                     [site-kit, starter]  E41                        (after T1, before the next client site)
Phase 7  New client builds            [webber, this repo]  E43 → E44, E45             (before the next site built from scratch)
Phase 8  Launch readiness             [this repo, webber]  E47, E48, E49              (the MVP's own work)
Phase 9  The suite                    [this repo]          E50 → E51, E55, E56 → E57, E52   (Services now, then button and menu text; after the MVP: Gallery, Events, E55 past its first step; Booking when a client needs it)
Phase 10 Keeping a site true          [this repo]          E58, E59, E60, E61         (from the positioning session of 2026-11-21; order to decide)
```

Every site on Sites keeps deploying through its own Coolify app until E36: publish is a commit to `main`, which the app's GitHub App webhook deploys (the fallback path, how canopyds.com runs on Sites since Epic 37). Every edit is previewed on the canvas and the preview page (PRD D47). E36 makes publish a symlink swap.

Client 2's repo is on the contract and its site linked since 2026-11-17 (Epic 46); its claim is left, in the MVP (PRD D51). canopyds.com (Epic 37) is the precedent every site follows onto Sites.

### The MVP (decided 2026-11-09)

Nothing has launched (PRD D51). The MVP is the owners of Client 1, the test site, Client 2, and the Client 3 site claiming their portal, editing, previewing, and publishing safely. Its work, in order; an item leaves this list when it ships:

1. **the test site' claim** (Epic 42), with the owner as the owner: the claim's test before a client's.
2. **E47, tool layer fixes** (F1, F3, F5; F2 and F4 were fixed with E54).
3. **E39, the welcome video**: before the Client 3 site's claim links go out, tried first on the test site.
4. **E48, deploys and checks** (F25, F27, F28, F29).
5. **E49, alerting and records** (F26, F31).
6. **Mail that can carry a launch.** The portal's mail shares a small daily ceiling with other mailboxes (the private page). Not moved yet (Michael, 2026-11-10): a risk to track and a fast follow, with what was checked and the candidate in REVIEW_FINDINGS F32. A sender with headroom, and a cap on notification mail, come before claim links go to clients.
7. **The Editor and Quick Edit for a first owner**: F21, F22, F23, F19.
8. **Epics 33, 37, and 38 closed** (F10): mostly Michael's own checks.
9. **Client 1's claim** (Epic 40, 4.7): the first client owner.
10. **Client 2's claim** (Epic 46).
11. **The Client 3 site onto Sites**, through the Sites Onboarding Runbook, its form going to an outside CRM (PRD D53).

**Pivot, 2026-11-12 (Michael):** the MVP now has to carry the Client 3 site, a real organization Michael is responsible for, with its repo in its own GitHub org and a server of its own. What Sites needed for that is built: a client-owned repo (PRD D61, 5.15.0), and a site with a server and no hours (PRD D62, contract 0.6.0). The Client 3 item's remaining work is in the site's repo (the contract, its copy into content files, the site guide) and the link, which can happen before its domain is live, on a `canopyds.com` name (E44 does this by hand today: the operator edits the hostnames at launch).

**Several people, 2026-11-14 (Michael):** the Client 3 organization has more than one person who updates its site, so the MVP carries several people on one account (E53), one editing at a time (E54). The operator adds them; an owner inviting their own people, roles, and asking for control stay out. Both shipped in 5.21.0 (2026-11-17) and left the list.

**Welcome video, 2026-11-14 (Michael):** E39 joins the MVP ahead of the Client 3 site's claim links, so each person there opens their portal on a walkthrough of it. the test site gets the first one. Since 2026-11-15 it is one video for each tab, which keeps each short.

**Client 2 leaves Square, 2026-11-17 (Michael):** the owner is moving off Square and takes payment by Venmo, so her site's booking becomes a request form (PRD D65, E55). Her booking buttons read one value, `site.contact.bookingUrl`, which is still Square's address, and three lines of her copy say a card on file is required (`client2` `main`, checked 2026-11-19); the buttons stop working the day her Square account closes, a date Canopy doesn't have yet. E55's first step, the form from today's field types, is in the MVP (Michael, 2026-11-17). It has no place in the numbered order, because its date is hers: it is worked as soon as she gives that date and settles her policy's wording (E55). Michael takes that up with her around 2026-12-04, and Services (E56) is built first (Michael, 2026-11-20). The rest of E55 comes after the MVP. This paragraph goes when the form is live on her site.

To decide before launch, each an entry in REVIEW_FINDINGS: dated notices on a client site (F6), Quick Edit spend the operator can see (F8), the chat forgetting itself on a reload (F20), and the Editor on phones (F24). Restore (F7) is E58 and holds up no claim: Client 1, the first, is a free customer and a portfolio piece (Michael, 2026-11-21).

After the MVP: E36 (the builder as the production build, both boxes serving), E50 (the media pipeline and the Gallery tab), E51 (Events), E41 (the site kit), and E43 to E45. E55 past its first step (photos, the Approval's document, the Forms tab) is after the MVP too, its place among these to decide. E56 (Services) is built now, ahead of E55's Forms parts and of Gallery and Events (Michael, 2026-11-20). E52 (Booking) waits for a client who needs it (PRD D55). E36 comes first because the nightly rebuild, a draft's photo on the canvas, and a feed fetched at build all need the builder to be the one production build (F11).

### A site kit before the next site (decided 2026-11-06)

With Client 1, three repos run on Sites (the demo, canopyds.com, Client 1), and each carries its own copy of the same plumbing: the content loader, image resolving, the editor flags, the mark wiring, the build-parity and CORS settings, and, on Client 1, the schedule views any class-based site needs. Limits are measured by hand, and go stale when a template's layout changes. E41 moves that into a versioned package installed like the contract, plus a thin starter, after Client 1 is linked and before the next client site. It replaces C2, a copy-once starter: a starter alone copies the plumbing again, and a fix never reaches the sites already made from it.

### Staging, handover before launch, and forms from the build (Michael, 2026-11-06)

Every site on Sites so far was live before it was linked, because the canvas loads a client site's assets from its first production hostname (D47, `src/lib/site-live.ts`). A site Canopy builds from scratch needs three things that path doesn't give: a working version Michael can show a client before launch (E43), the owner editing their copy on Sites before any visitor sees it (E44), and its contact form working on launch day in the client's own account (E45). Staging comes first and starts outside the portal; E44 builds on it.

### Fallback (decision D6 chicken-out)

If the builder and nginx model has to be abandoned: keep Coolify building each site from GitHub on push; keep the builder for **preview only**; publish stays commit-to-main. Everything in E30–E35 remains valid; only E36 is dropped. Document the choice in the PRD if taken.

---

## Phase 1: Client 2

### E46 · Client 2 on Sites (`client2`)

In the MVP (PRD D51). The repo is on the contract, and the site is linked, accepted acting as the client, and through the Quick Edit eval; its claim is left, through the Sites Onboarding Runbook as Client 1's is (Epic 40, 4.7). It copies Client 1's plumbing, as the test site did, and moves onto the site kit with the others (E41). Its links to Square's booking page and its card-on-file lines are E55's. The epic doc, `docs/epics/epic-46-client2-on-sites.md`, carries the requirements.

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

Epic 40 (T1) takes three of these ahead of the rest, because Client 1 depends on them: the site guide's prose in the prompt with `Site.runbookOverlay` dropped, the base prompt rewritten from QUICK_EDIT_GUIDANCE, and `requestHelp` (PRD D34).

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
- Acceptance: scripted edits on Client 2 (hours, announcement with quoted text, announcement without, price change, gallery add with HEIC, low-resolution photo, hero copy with a typo, a design request) each produce the right preview or reply; cost per edit recorded and reported. The script is the regression suite for any change to the guidance

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

### E38 · Link and claim

From `docs/epics/epic-38-link-and-claim.md`. The operator links a live site by its repo, which creates the client's account and site; the client claims it from a link. Act as client (E32's "edit as client", smaller), the operator's view of where each client stands, tabs that follow what the account has, and a GitHub App in place of per-site tokens. Client 1 is its first client (PRD D49).

### E39 · Welcome video

Goal: each tab of a client's portal opens on a walkthrough Michael recorded for them, because each portal shows different things depending on what the site has. Builds on what E38 left ready (its section 4.6). Decided by Michael, 2026-11-05: the portal hosts the video (no third-party player); it's recorded in any tool that exports MP4 (Snagit, Loom, Google Vids); captions are required; how much was watched is good to have, not essential. Revised 2026-11-14 for several people on an account (PRD D63): each person on the account is shown a video once and has a watched figure of their own. Revised 2026-11-15 (Michael): one video for each tab, not one for the site, so each stays short and opens where it applies. Clients have different tabs (the Client 3 site has no form), and a tab with no video opens nothing.

- Storage: a Coolify persistent volume on the prod and dev portal apps at `/app/media`, created in the Dockerfile owned by `nextjs` (uid 1001), named by `MEDIA_DIR` (unset means no videos). A video is a `WelcomeVideo` row (site, tab, key) and two files, `welcome/<siteId>/<tab>-<key>.mp4` and `.vtt`, the tab one of the ids in `src/lib/sites-tabs.ts` and the key a hash of the MP4; a replacement writes a new key and deletes the tab's old pair. Not in the nightly backups, which cover databases; a lost video is re-uploaded from Michael's original
- Upload on the operator site page: a Welcome videos card with a row for each tab, and for a tab the MP4 and a WebVTT captions file, both required. The card lists every tab until the tabs follow what the account has (Epic 38, 4.8), and then the account's. A route handler that only a Global Admin's own portal page may post to streams the MP4 to disk and refuses a request over 100 MB (Cloudflare's per-request limit on Free and Pro); it checks the MP4's `ftyp` box and the VTT's `WEBVTT` header, as the page does before it sends. Remove, on the tab's row, deletes the pair and each person's viewing of it, so the next one uploaded for the tab opens once for each of them. The pair comes from one command on Michael's workstation, `uv run apps/portal/scripts/prepare-welcome-video.py <recording> --words "<the client's names, the site's address>"` (2026-11-17): it brings the sound to -16 LUFS, re-encodes the picture small (the test site' 1:54 went from 17 MB to 3.7), and transcribes the captions with Whisper, then lists the captions holding a word it was unsure of. Claude Code runs it, through the repo's `welcome-video` skill (2026-11-19, in place of preparing on the server after upload): the skill reads every caption against the portal's names and the site's content, since a word misheard with confidence isn't listed, asks Michael to check by ear what the text can't settle, and uploads
- Playback: `/welcome/<siteId>/<tab>-<key>-video` and `-captions`, addresses with no file extension so Cloudflare passes byte ranges through (a `.mp4` one couldn't seek on sites-dev, 2026-11-18), for the people on the site's account and an acting operator only (through `memberships.ts`), with byte ranges so it seeks, `Cache-Control: private`. A native `<video controls>` in a dialog, never autoplaying, with its captions in a strip under the picture so they cover nothing the video shows (Michael, 2026-11-17); in full screen, where the strip can't follow, the browser draws them over the picture as usual, and the player's own captions menu turns both off. A tab's video opens by itself once per person, the first time they are on one of that tab's pages while they have no `WelcomeView` row for it: Quick Edit's in their first session after claiming, since that is where they land, and any tab's on their next visit there when its video arrived after they claimed. It never opens by itself while the operator acts as the client, who opens it from the help bubble. The furthest point played (dragging along a paused video doesn't count) and the video's length are on the person's `WelcomeView`; their row on the operator's people card shows "Watched Quick Edit 4:12 of 5:03 · Editor 0:40 of 2:10". A different video for a tab starts its figures over, and does not open by itself again for someone already shown that tab's. On a tab's pages the help bubble reopens its video
- Acceptance: on a person's phone each tab's video opens once, on their first visit to the tab, silent until played, with captions, and seeks; a second person on the account gets each once too; a tab with no video opens nothing; the operator page shows how far each person got in each; signed out or as another account, the files 404

Built as of 2026-11-15 and in 5.21.0 (2026-11-17), where it is off for want of the volume: a video for each tab, with playback, its one automatic showing per person, the help bubble's item, the operator's upload and Remove, and the watched figures, tried on the local portal with the test site' video as Quick Edit's and as the Editor's. In 5.23.0 (2026-11-18): the captions' strip, the prepare command, and the image's `/app/media`. The dev app has its volume since 2026-11-18, where an upload and playback through Cloudflare found that a `.mp4` address couldn't seek. In 5.23.1 (2026-11-19): the addresses end in no extension and seek (checked through Cloudflare on sites-dev), and the prod app has its volume and `MEDIA_DIR`. Left: the acceptance above on prod, with a client's real video. Delete this paragraph when E39 ships.

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

## Phase 5 — Client 1 migration

### T1 · Client 1 onto the template (`client1`)

Onto Sites the way canopyds.com went (Epic 37), through the Sites Onboarding Runbook (Nextcloud). Publish is a push to `main`, which Client 1's Coolify app already deploys through its GitHub App webhook (a webhook deploy on 2026-10-08, checked 2026-11-05), so E36 isn't a precondition; Client 1 moves to the builder's output with E36 like every other site. Specifics: `site.ts` → collections (contract 0.5.0's `classes` carry their sessions, and the schedule's views are derived in the template), `public/` images → `src/assets` with `image()`, preserve DESIGN.md invariants and the documented accessibility rules. Client 1's "no content collections" rule in its CLAUDE.md is superseded by this migration; rewrite that sentence, don't append a caveat (its own editing rule). The epic doc, `docs/epics/epic-40-client1-on-sites.md`, carries the requirements, with the E32 pieces Client 1 depends on and the lane in code (PRD D50).

### E42 · the test site on Sites (`test-site`)

A site Michael controls, through the same runbook, so the owner's claim is tested end to end before Client 1's link goes out. Its form is the first a client's site embeds from the client's own account, built by the operator acting as them (Epic 38, 4.5). The epic doc, `docs/epics/epic-42-test-site-on-sites.md`, carries the requirements.

---

## Phase 6 — Site kit

### E41 · `@canopy/site-kit` and a starter

Goal: the code every Sites repo copies today lives in one versioned package, so a fix reaches every site with a version bump, and a new site starts from a starter rather than from another site's repo. Extracted from canopyds.com (`canopy-website`) and Client 1 (`client1`, after T1), whose versions are the reference.

- The package, released like the contract (a tarball on this repo's releases, `packages/site-kit`):
  - **Content**: a loader that validates `src/content` against the contract at build and fails with every issue, typed collections, page, section, and card lookups, navigation from `pages`, phone forms for display and links, socials by network. Client 1's `content.ts` and canopyds.com's `content.ts` are the two copies it replaces.
  - **Images**: a contract `AssetPath` resolved to `astro:assets` (Client 1's `images.ts`).
  - **Portal flags**: `inEditor` and `inPreview`, the editor-at-rest CSS (reveals shown, transitions off), and a helper that opens anything hiding marked text.
  - **Schedule views** for any site with `classes`: week board blocks by part of day, day and time formatting, a class's times, appointment windows, and the structured data's opening hours (Client 1's `schedule.ts`, made general).
  - **Marks**: `field` and a check that every marked element's text equals its content value, run on a build.
  - **Measure**: the guide's limits as a command that renders the built site at 360 and 1440 px and writes or checks `SITE_GUIDE.md`'s `limits` (each field at most one line past today's copy, or the longest in its list), plus renders at the counts. Run when a template's layout changes; a check fails when the guide no longer matches the layout.
  - **Build parity**: a check that the builder-style build and the production image name the same `_astro` files.
- The starter (`canopy-site-template`): an Astro 7 repo wired to the kit and the contract, with the Dockerfile (`npm ci --ignore-scripts`), `nginx.conf` with CORS, Tailwind reading `src/` only, Umami with `data-domains`, and a `SITE_GUIDE.md` skeleton. The Sites Onboarding Runbook's section 2 starts from it.
- canopyds.com, Client 1, and the test site (Epic 42, which copied Client 1's plumbing) move onto the kit; the demo with its contract upgrade.
- Open for the epic doc: whether fixed lists move from the `Site` row into the guide's front matter, beside counts, since both are facts of the design; the row would then keep only locks.
- Acceptance: a new site from the starter passes the runbook's section 2 with no code copied from another site; a fix in the kit reaches canopyds.com and Client 1 by a version bump; the measure command reproduces Client 1's limits and catches a layout change that makes one stale.

---

## Phase 7: New client builds

### E43 · Staging

Goal: Michael shows a client the working version of their site, before launch and for any later change Canopy makes, at an address only the people he shares it with can open, and the client says what they want changed. It starts outside the Sites portal (Michael, 2026-11-06).

- A staging build is its own build from its own branch on its own hostname, never the production app serving a second name: Client 1's `client1-dev` was retired on 2026-08-13 because it was the same app off the same build, so nothing could differ between it and production (`client1/deploy-to-webber.md`).
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

Goal: a site's form is part of the site (PRD D68): written with its pages, in its own markup and styles, working the moment the site does, with what it takes in landing in the client's account and nothing rewired after linking. No embed. As of 2026-11-21 a site embeds a Forms form by its id, which draws it in the visitor's browser from the portal; the form is built after linking, acting as the client (D49), and its id committed after that (Epic 42, 4.4).

- **The form is written during the build** (Site Build Checklist), as a definition in the site's repo, and a component in the site kit (E41) draws it at build. A choice can list the site's services (E56), since both come from one build.
- **The portal learns a site's forms from the site**, at Link a site and at each publish, so the owner's Forms tab names them and answers are checked and labeled. Nobody builds a site's form in the Forms builder.
- **Sending goes to the portal**, on the route Forms' own forms post to and through the same checks. A form is named within its site (`contact`), so the template is written once, before any account exists, and the origins it accepts are the site's hostnames.
- **What runs in the visitor's browser is a package the site builds in**, written once for every site.
- the test site first, then canopyds.com (Michael, 2026-11-21). Both embed a form by id today, and the embed by id is owed nothing once they have moved.
- Open for the epic doc: where the definition sits (in the contract, its labels marked for the owner as other text is, or a file beside it); the sending route as a versioned agreement, since a site carries the package it was built with until its next build; what a visitor without JavaScript gets; a site with a server (D62), whose form is D53's slot with another provider; whether Forms' embed is drawn by the same package.
- Acceptance: a site from the starter with a form definition, once linked, serves a working form whose submissions land in the client's account, with no commit after linking and no request to the portal until a visitor sends.

---

## Phase 8: Launch readiness

The MVP's own work (PRD D51), from the 2026-11-09 review. Each finding's detail is its entry in `docs/canopy-sites/REVIEW_FINDINGS.md`.

### E47 · Tool layer fixes

Goal: a guide rule the site already breaks doesn't stop an owner's edit, a builder restart doesn't strand a draft's build, and a publish runs the guardrails again. Two writes landing together (F2, F4) were fixed with E54, which needed them first.

- F1, F3, and F5, each landing with the test that fails without it. F3 and F5 have tests beside the catalog that pass while the defect is present
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

After the MVP (PRD D52, D54, D55), except E55's first step, which is in it ("The MVP", above).

### E50 · Media pipeline and the Gallery tab

Goal: an owner adds, reorders, and removes photos in a tab, and Quick Edit does the same through the tab's own form (PRD D41, D54).

- E32's media pipeline: upload, preflight, staged until publish
- A draft's photo shows on the canvas from the builder: the canvas loads a client site's assets from its live address, where an unpublished photo doesn't exist (F11)
- The Gallery tab, then Quick Edit and the canvas popover attaching through its form (F18, F19)
- Instagram as a source, for Client 1: fetched at build and never committed, so after E36, when the token lives with the one production build. Open: Meta's review of the app

### E51 · Events

Goal: an owner adds an event with its date, time, and place, and it leaves the site by itself when it is over.

- An `events` collection in the contract, with the first site that renders it; its tab; then Quick Edit filling the tab's form
- Structured data and add-to-calendar from the build
- After E36: the nightly rebuild has to reach a client's live site (F6)

### E52 · Booking

PRD D55. Waits for a client who needs it (Michael, 2026-11-17); Client 2's requests for appointments are E55. Open for the epic doc: where a bookable service's length lives (the contract's `services`, or the booking component), and whether availability is read from the calendar's private address or through Google sign-in.

### E55 · Requests (Client 2's appointment form)

Goal: a new client asks the owner for an appointment from her site, with photos of their hair and her policy agreed to, and she reads the request on her phone and books the time herself (PRD D65). As of 2026-11-17 Forms has no field that takes a file; an Approval's text is plain, with no link and nothing kept of what was agreed to; and a Sites account's Forms tab is the Forms product's list of forms, with no view of submissions across forms, no count on the tab, and no way to call, text, or email from a submission. Epic doc: `docs/epics/epic-55-requests.md`.

- **Step 1, the form from today's field types**, with nothing built in this repo: name, phone, email, hair goals, the services wanted (Choose several), hair history, the days and times that suit, and an Approval of the salon's policies, with the answers in the notification email. It is built in her account, acting as her (Epic 46 linked her site on 2026-11-17). At the switch `site.contact.bookingUrl` becomes the form's address, the buttons' labels change in the templates, and the three card-on-file lines go. Client 2's Report Profile (Nextcloud, Monthly Reports) names a tap through to Square as the report's conversion, and is rewritten with this step. In the MVP, due the day her Square account closes ("The MVP", above).
- **Photos**, a field type: a visitor attaches photos, up to a count the owner sets, downscaled in the browser, then checked by content and re-encoded on the server with location data stripped. They are stored on the portal's media volume (E39's), shown only to the account's signed-in people, and deleted with their submission, form, or account. The notification email counts them and links to the submission, and never attaches them. The volume joins the backups: a welcome video is re-uploaded from Michael's original, and a visitor's photo has none. The upload route is public, so it carries the submit route's origin check and rate limit, a size cap, and a cap for each form.
- **An Approval with a document**: the owner pastes the document's text into the field, the form shows a link beside the statement that opens it, as Square's "See full policy" does (Michael's screenshots, 2026-11-17), and the submission keeps the text as it stood when the box was ticked. No typed name and no drawn signature. With no card on file, that record is what the owner has when a client disputes a cancellation fee.
- **A Sites account's Forms tab opens on what came in**: submissions across the account's forms, newest first, new ones marked, a count on the tab, a search by name, and archived ones still to be found, since a request is the only record of a client (PRD D65). A submission shows its photos, and its phone and email answers call, text, and write to the person. The forms and their builder are one click away, and a Forms account keeps today's page. Laid out for a phone first, and built a section at a time with Michael.
- Not in this epic: confirming a request with a time ("Not scheduled", below), a contacts model (PRD D52), and any text message Canopy sends.
- What is open, for Michael and through him the owner, is the epic doc's section 7.
- Acceptance: on a phone, a visitor sends a request with three photos and the policy agreed to; the owner gets the email, opens the request in her portal, sees the photos and the policy's text as agreed, and texts the client from it; a later edit to the policy doesn't change what that submission shows; someone outside her account can't fetch a photo by its address; deleting the submission deletes its files.

### E56 · Services

Goal: an owner manages their service list in a tab, and on the canvas where they see it, and every place the site shows a service follows, because the site has one list (Michael, 2026-11-17). The epic doc, `docs/epics/epic-56-services.md`, carries the requirements. Built now (Michael, 2026-11-20). PRD D66. Its screens wait on the planning of the portal's shape (its section 7, item 4).

- Found converting Client 2 (Epic 46): its home page's four featured services were typed apart from the menu. The contract already holds the list and features services by id; nothing in the portal manages it, and the canvas can't add a service or change which are featured
- The list is any business's, not a salon's menu (Michael, 2026-11-23): a service needs no price, a list needs no categories, room is left for several prices, and the tab's form is read from the contract and the site's guide
- Contract 0.8.0 (a template says where a list is, the id rule exported, an optional price, a flat list), the Services tab, and each site's lists named to the canvas
- The canvas's action layer (Michael, 2026-11-17): a click that could mean more than one thing shows its actions as icons. On a service it opens the tab's own forms; on marked text inside a link it gives a pencil and a follow icon
- Not in this epic: a second name or price where a service is featured, prices as amounts, products sold online, and a form's choices read from the list. Button and menu text as an owner's edit, which the layer is built to carry, is E57

### E57 · Button and menu text on the canvas

Goal: an owner changes the words on a button or a menu item where they see it, and can still follow it: a click on anything that links gives a pencil and a follow icon, and the owner picks (Michael, 2026-11-17). An epic of its own, straight after E56, which builds that layer for text that is already marked (its 4.5).

- The lane: a button's label and a menu item's label become the owner's on every site, while where each goes stays Canopy's. Revises PRD D50, which keeps buttons and navigation labels Canopy's, and the runbook's rule that neither is marked
- The contract: a page's button is one field today, Canopy's whole, so its label and its link are flagged apart; and a menu item that goes to a place on a page (Client 2's Gallery, About, and Connect) gets a field, which the contract lacks
- Each site: its buttons' and menu items' labels move from the templates into content and are marked, and its guide gets a limit for each, measured at 360 and 1440 px, since a menu label that wraps breaks a header
- Open for the epic doc: whether eyebrows follow; an analytics event named by a button's label, which must keep its name when the label changes; a label that names where it goes ("Book on Square")

---

## Phase 10: Keeping a site true

From a session on positioning with Michael, 2026-11-21. Each of these backs something Sites would say to a buyer: the site is safe to touch, it stays current, it works from a phone, and it is the client's to take. He agreed to all four that day. Their order, among themselves and against Phase 9, is to decide.

### E58 · History and restore

Goal: an owner sees what was published, when, and by whom, and takes the site back to any of those versions, so a published mistake is never a reason to be afraid of editing (F7; PRD section 4.5).

- A restore is a draft that sets content back to a published version, then is built, previewed, and published like any other (PRD section 4.5). It is never the builder's `current` pointed at an older build
- The list is the site's published ChangeSets: what changed, when, who published it, and whose draft it was (PRD D64). PRD section 6 puts it on Quick Edit's home
- For an organization the same list is its record of who changed what
- Open for the epic doc: how far back the list goes; a Canopy push between two versions, where a template no longer renders an old field; and photos, once E50 lands

### E59 · The site asks

A concept, with its specifics not worked out (Michael, 2026-11-21).

Goal: the site notices what may have gone out of date and asks its owner, instead of waiting for them to remember.

- The idea: every so often the owner is shown a few facts and asked whether each is still true (the hours, a price, a phone number, text naming a date or a year that has passed, a notice about to end), and answers with one tap or one Quick Edit message
- What it would stand on: facts stored structured (PRD D48), the tool layer's date and stale-mention warnings (`QUICK_EDIT_GUIDANCE.md` section 2), and the portal's mail
- Needs first: dated notices on client sites and a nightly rebuild that reaches them (F6), so whatever has an end date ends by itself and only the rest is asked about
- Open, all of it: which facts, how often, by email or in the portal, what an answer records, and how it stays out of the mail an owner ignores

### E60 · The portal on a phone, and answers about the site

Goal: an owner does from a phone what they came to do, and can ask what happened on their site and get a number back.

- Quick Edit is the product on a phone if the Editor isn't offered there (F24): the conversation survives a reload (F20), and a photo comes from the camera roll (E50)
- Questions as well as edits (Michael, 2026-11-21): "How many people have responded since yesterday?", "How many people clicked on the gallery last month?", answered from the account's submissions and its Stats
- Not an assistant: Michael wants it clear of the AI-assistant trend, and Quick Edit is never marketed as one (PRD section 1). An answer is a figure and where it came from, never advice
- Open for the epic doc: whether questions belong in Quick Edit, whose name says edits; what it may read, since submissions hold visitors' personal details; and what a question costs (F8)

### E61 · Export

Goal: a client who leaves takes their site with them, with none of Canopy's contract in it (PRD D58).

- The main work is stripping the content contract out (`@canopy/site-contract`, the marks, the content loader), leaving a site that builds and reads by itself (Michael, 2026-11-21)
- An export to plain code and an export to WordPress are different pieces of work, and which are offered is open
- Open for the epic doc: what the output is (built pages, or a project with its content written in); forms and other runtime components, which stay Canopy's (PRD D52, D53); media; a client who already holds their repo (PRD D61); and whether it is the owner's button or something Canopy does when asked

---

## Not scheduled (recorded so they are not forgotten)

- Tool tabs after Gallery and Events (PRD D39): a Calendar putting announcements and events on one timeline (D42), blog, newsletter
- Members (a light CRM) and newsletters as runtime components (PRD D52)
- Forms sold as a public product (PRD D67). Before it is: a usability round with a few real users, and a keyboard and screen-reader pass on the form builder, the embed, and hosted forms
- Forms features asked for, none decided: a stored value apart from an option's label (a code behind "United States"); fields shown by an earlier answer, and steps or titled sections in a long form; starting a form from a template; an email to the person who submitted, with their answers; changing an account's email, confirmed from the new address; a click anywhere on a row opening it, as the Fields list does; each appearance control marking what it styles in the preview, as `PreviewMark` does for a header input and a field row (UX_PATTERNS section 10)
- An operator build log for each site (status, duration, the build's output), left from E30
- Confirming a request with a time, after E55: the client gets an email with a calendar invite, then a reminder by email at the cancellation cutoff. Proposed 2026-11-17, not decided
- Database failover for the portal (PRD D51, F12)
- A demo-account home with a switcher between several demo sites (PRD D44)
- An owner inviting their own people, member roles such as who may publish, and asking another person for control of the site (PRD D63, D64)
- Creating a site's repo, DNS, Umami website, or hostname link from the portal (the operator links a live site, E38)
- Stripe or FreshBooks sync
- SEO/report tier tooling
- SMS intake
- The public MCP endpoint and its OAuth (E34; PRD D59)

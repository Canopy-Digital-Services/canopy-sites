# Canopy Sites: Roadmap and Epic Briefs

**Status:** 2026-11-23. Companion to `docs/canopy-sites/PRD.md`, which owns *what and why*. This doc owns *order*, the brief for each epic not yet written up, and the known gaps that belong to no epic yet.

**For the agent reading this:** each brief below is a starting point, not a full epic doc. When you pick one up, write the full epic in `docs/epics/epic-N-*.md` (Goal / Scope / Requirements / Acceptance), list it in `docs/epics/README.md`, and work from that; its brief here shrinks to a pointer. When the epic ships, its doc moves to the Nextcloud archive (`docs/epics/README.md` says where) and its brief goes. Before starting, read `docs/AGENT_CONTEXT.md`. One epic per Claude Code session is the intended grain.

Epic numbers continue the Forms sequence; epics in other repos are prefixed. Security findings stay off this public repo: what is open is on the Nextcloud Engineering page "Canopy Sites Security Review 2026-11-09".

---

## Sequencing

Phases 0 and 2 have shipped, and so has the contract's first release.

```
Phase 1  Client 2               [Client 2]                E46                        (its claim is in the MVP)
Phase 3  Editor                       [this repo]         E33, E38, E39              (closing out; E34 after v1)
Phase 4  Production on nginx          [webber]             E36                        (after the MVP; both boxes keep serving, PRD D57)
Phase 5  Client 1 migration             [client1]              T1, E42                    (claims in the MVP)
Phase 6  Site kit                     [site-kit, starter]  E41                        (before the next client site)
Phase 7  New client builds            [webber, this repo]  E43 → E44, E45             (before the next site built from scratch)
Phase 8  Launch readiness             [this repo, webber]  E47, E48, E49              (the MVP's own work)
Phase 9  The suite                    [this repo]          E50 → E51, E55, E56 → E57, E52   (Services now, then button and menu text; after the MVP: Gallery, Events, E55 past its first step; Booking when a client needs it)
Phase 10 Keeping a site true          [this repo]          E58, E59, E60, E61         (order to decide)
```

Every site on Sites deploys through its own Coolify app until E36: publish is a commit to `main`, which the app's GitHub App webhook deploys. Every edit is previewed on the canvas and the preview page (PRD D47). E36 makes publish a symlink swap.

### The MVP

Nothing has launched (PRD D51). The MVP is the owners of Client 1, the test site, Client 2, and the Client 3 site claiming their portal, editing, previewing, and publishing safely. Its work, in order; an item leaves this list when it ships:

1. **the test site' claim** (Epic 42), with the owner as the owner: the claim's test before a client's.
2. **E47, tool layer fixes.**
3. **E39, the welcome video**: before the Client 3 site's claim links go out, tried first on the test site.
4. **E48, deploys and checks.**
5. **E49, alerting and records.**
6. **Mail that can carry a launch**, before claim links go to clients. The portal sends through the mail account that carries Canopy's own mailboxes and a client's, under one small daily ceiling (the private page). Past it, the portal's mail stops almost silently: the operator sees "Copy the link instead" for a claim link, a request to Michael waits in the operator console with no email, and a submission notification fails in the container's output only. The candidate is Cloudflare Email Sending over SMTP, which the portal can move to by changing four variables on each app; sending from Canopy's own server was ruled out (the private page). A cap on notification mail and confirmed recipients come with Forms opening to the public, not with this.
7. **The Editor and Quick Edit for a first owner**:
   - A mark that shows on text a template wraps word by word. The dotted `text-decoration` underline (`src/lib/canvas-bridge.ts`) doesn't reach inline-block children, so canopyds.com's headline shows dots between its words; an outline or a background on the marked element doesn't depend on it.
   - The canvas's Quick Edit box (`ScopedQuickEdit`, a 224 px scroll area) scrolls to the end of a tall request card, with the reply that explains it out of view. Keep the reply in view.
   - Text that art is drawn against is Canopy's (PRD D56). On each site: lock the field's address on the `Site` row, take its mark out of the template, and keep the guide's list of them so Quick Edit offers the request to Michael. canopyds.com's hero headline is the known one, and its `Marked.astro` on marked text goes; Client 1's and the test site' guides list theirs.
   - New photos become a request card, which can't carry a photo. Until E50, the reply says how to get the photo to Michael.
8. **Epics 33, 37, and 38 closed**: their unticked acceptance boxes, mostly Michael's own checks.
9. **Client 1's claim** (Epic 40, 4.7): the first client owner.
10. **Client 2's claim** (Epic 46).
11. **The Client 3 site onto Sites**, through the Sites Onboarding Runbook, its form going to an outside CRM (PRD D53). What is left is in its repo (the contract, its copy into content files, the site guide) and the link, which can happen on a `canopyds.com` name before its domain is live; the operator edits the hostnames at launch.

**Client 2's request form** (E55's first step) is in the MVP with no place in the order. Her booking buttons read `site.contact.bookingUrl`, still Square's address, and three lines of her copy require a card on file (checked 2026-11-19); the buttons stop working the day her Square account closes, a date Canopy doesn't have yet. It is worked once she gives that date and settles her policy's wording. Michael takes that up with her around 2026-12-04, and Services (E56) is built first. This paragraph goes when the form is live on her site.

**To decide before launch:**

- The Editor on phones. If it isn't offered below a width, Quick Edit is the whole product on a phone. The Editor at a phone's width is unchecked.
- Quick Edit's conversation surviving a reload or a tab switch. `quick-edit-workspace.tsx` keeps it in component state, so a reload empties the chat, and an unsent request card stays `DRAFT` with nothing listing it. It weighs more if phones get Quick Edit only.
- Dated notices on client sites. Only the demo has `announcements`, so "we're closed Friday" is a request to Michael, and nothing rebuilds a client site at midnight before E36; a nightly redeploy of the site's app would cover it until then.
- Quick Edit spend the operator can see. Cost is recorded per conversation and shown nowhere; the only bound is 60 messages an hour per account. An owner turn cost 1 to 7 cents (2026-11-09).
- Quick Edit changing a look-alike when the owner names text that lives in a template (on the Client 3 site, a menu's descriptions), since it reads the content files, never the rendered page. Parked by Michael (2026-11-13): the fix needs nuance, and mustn't refuse an ordinary request that mentions the menu.
- Pages other than the Editor failing quietly when the server can't be reached: the Sites chrome's status poll, Publish on the preview page, Quick Edit's send, and Discard. One wrapper that says to reload the page, or leave it.

Restore is E58 and holds up no claim: Client 1, the first, is a free customer and a portfolio piece.

**After the MVP:** E36 first, because the nightly rebuild, a draft's photo on the canvas, and a feed fetched at build all need the builder to be the one production build; then E50, E51, E41, and E43 to E45. E56 is built now, ahead of E55's later steps, whose place is to decide. E52 waits for a client who needs it (PRD D55).

**Fallback** (PRD D6): if the builder and nginx model is abandoned, Coolify keeps building each site from GitHub on push, the builder serves preview only, publish stays a commit to `main`, and only E36 is dropped. Record the choice in the PRD if taken.

---

## Phase 1: Client 2

### E46 · Client 2 on Sites (`client2`)

`docs/epics/epic-46-client2-on-sites.md`. Linked and accepted; its claim is left, through the Sites Onboarding Runbook. Its links to Square's booking page and its card-on-file lines are E55's.

---

## Phase 3: Editor

### E33 · Visual editor

`docs/epics/epic-33-visual-editor.md`. Built; open for its acceptance boxes (the MVP's item 8).

### E34 · Public MCP endpoint and API keys

After v1 (PRD D59), and not scheduled: a Streamable HTTP endpoint at `/mcp` with the tool layer's tools except `publish`, a per-account key scoped to one site, and a docs page.

### E38 · Link and claim

`docs/epics/epic-38-link-and-claim.md`. Built; open for its acceptance boxes (the MVP's item 8).

### E39 · Welcome video

Goal: each tab of a client's portal opens on a walkthrough Michael recorded for them, one short video for each tab, since each portal shows different things depending on what the site has. A tab with no video opens nothing.

- Storage: a Coolify persistent volume on the prod and dev portal apps at `/app/media`, created in the Dockerfile owned by `nextjs` (uid 1001), named by `MEDIA_DIR` (unset means no videos). A video is a `WelcomeVideo` row (site, tab, key) and two files, `welcome/<siteId>/<tab>-<key>.mp4` and `.vtt`, the tab one of the ids in `src/lib/sites-tabs.ts` and the key a hash of the MP4; a replacement writes a new key and deletes the tab's old pair. Not in the nightly backups, which cover databases; a lost video is re-uploaded from Michael's original
- Upload on the operator site page: a Welcome videos card with a row for each tab, and for a tab the MP4 and a WebVTT captions file, both required. A route handler that only a Global Admin's own portal page may post to streams the MP4 to disk and refuses a request over 100 MB (Cloudflare's per-request limit on Free and Pro); it checks the MP4's `ftyp` box and the VTT's `WEBVTT` header. Remove deletes the pair and each person's viewing of it. The pair comes from `uv run apps/portal/scripts/prepare-welcome-video.py`, which Claude Code runs through the repo's `welcome-video` skill
- Playback: `/welcome/<siteId>/<tab>-<key>-video` and `-captions`, with no file extension so Cloudflare passes byte ranges through, for the people on the site's account and an acting operator only, `Cache-Control: private`. A native `<video controls>` in a dialog, never autoplaying, with its captions in a strip under the picture. A tab's video opens by itself once per person, the first time they are on that tab's pages with no `WelcomeView` row for it, and never while the operator acts as the client; the help bubble reopens it. The furthest point played and the video's length are on the person's `WelcomeView`, shown on the operator's people card. A different video for a tab starts its figures over and doesn't open by itself for someone already shown that tab's
- Acceptance: on a person's phone each tab's video opens once, on their first visit to the tab, silent until played, with captions, and seeks; a second person on the account gets each once too; a tab with no video opens nothing; the operator page shows how far each person got in each; signed out or as another account, the files 404

Built and released (5.23.1); the prod app has its volume. Left: the acceptance above on prod, with a client's real video. This brief goes when E39 ships.

---

## Phase 4: Production on nginx

### E36 · Production on nginx, publish by swap

Preconditions: E33 stable on preview for at least a week of real use, and alerting in place (E49). Which site goes first is decided when E36 starts (canopyds.com is the lower-stakes candidate); each site on Sites then follows the same steps.

Client sites keep both boxes throughout (PRD D57): Webber and Fox both serve every client site today, with Cloudflare routing between them, and no step here takes a site off either box before that box serves the builder's output for it. Nothing in this epic risks a site that is live.

Add `Site.status` here, with values naming which sites are served from the builder's output in production. The dev deployment has no builder today, so the builder, the canvas, Preview, and Publish first run on production; a builder on dev comes with this epic. The builder's volume joins the backups once it serves production.

1. Each box runs a builder that builds the site from git, and nginx on each, with one fixed config, serves the site's production hostnames from `current` (the latest published build): a hostname is a link to its site's `current` (PRD D60). How soon Fox's builder picks up a publish is the epic doc's first decision
2. Traefik, one box at a time and Fox first: route those hostnames to that server instead of the site's nginx app. Verify `curl -sI https://<hostname>/` 200 and content parity through each box
3. `publish` keeps its order, commit and push then swap, and the swap now changes what visitors see (PRD D60). Restore publishes like any other change (PRD §4.5)
4. Confirm for a week. Retire the site's Coolify apps, on both boxes, only once both serve the builder's output. Update the site repo's deploy docs
5. Undo path at any step: route Traefik back to the nginx app

Acceptance: a publish is live in seconds on both boxes; with either box stopped the site still serves its published version; the nightly rebuild changes what visitors see; restore brings back a previous version in seconds; the GitHub repo reflects every published change.

---

## Phase 5: Client 1 migration

### T1 · Client 1 onto the template (`client1`)

`docs/epics/epic-40-client1-on-sites.md`. On Sites; its claim is the MVP's item 9.

### E42 · the test site on Sites (`test-site`)

`docs/epics/epic-42-test-site-on-sites.md`. On Sites; its second claim is the MVP's item 1.

---

## Phase 6: Site kit

### E41 · `@canopy/site-kit` and a starter

Goal: the code every Sites repo copies today lives in one versioned package, so a fix reaches every site with a version bump, and a new site starts from a starter rather than from another site's repo. Before the next client site: a starter alone would copy the plumbing again, and a fix would never reach the sites already made from it. Extracted from canopyds.com (`canopy-website`) and Client 1 (`client1`), whose versions are the reference.

- The package, released like the contract (a tarball on this repo's releases, `packages/site-kit`):
  - **Content**: a loader that validates `src/content` against the contract at build and fails with every issue, typed collections, page, section, and card lookups, navigation from `pages`, phone forms for display and links, socials by network. Client 1's `content.ts` and canopyds.com's `content.ts` are the two copies it replaces.
  - **Images**: a contract `AssetPath` resolved to `astro:assets` (Client 1's `images.ts`).
  - **Portal flags**: `inEditor` and `inPreview`, the editor-at-rest CSS (reveals shown, transitions off), and a helper that opens anything hiding marked text.
  - **Schedule views** for any site with `classes`: week board blocks by part of day, day and time formatting, a class's times, appointment windows, and the structured data's opening hours (Client 1's `schedule.ts`, made general).
  - **Marks**: `field` and a check that every marked element's text equals its content value, run on a build.
  - **Measure**: the guide's limits as a command that renders the built site at 360 and 1440 px and writes or checks `SITE_GUIDE.md`'s `limits` (each field at most one line past today's copy, or the longest in its list), plus renders at the counts. Run when a template's layout changes; a check fails when the guide no longer matches the layout.
  - **Build parity**: a check that the builder-style build and the production image name the same `_astro` files.
- The starter (`canopy-site-template`): an Astro 7 repo wired to the kit and the contract, with the Dockerfile (`npm ci --ignore-scripts`), `nginx.conf` with CORS, Tailwind reading `src/` only, Umami with `data-domains`, and a `SITE_GUIDE.md` skeleton. The Sites Onboarding Runbook's section 2 starts from it.
- canopyds.com, Client 1, the test site, and Client 2 move onto the kit; the demo with its contract upgrade.
- Open for the epic doc: whether fixed lists move from the `Site` row into the guide's front matter, beside counts, since both are facts of the design; and a job that bumps the contract or kit on every site, builds, compares, and pushes, since a bump across 50 sites is otherwise 50 repo changes.
- Acceptance: a new site from the starter passes the runbook's section 2 with no code copied from another site; a fix in the kit reaches canopyds.com and Client 1 by a version bump; the measure command reproduces Client 1's limits and catches a layout change that makes one stale.

---

## Phase 7: New client builds

Every site so far was live before it was linked, because the canvas loads a client site's assets from its first production hostname (D47, `src/lib/site-live.ts`). A site Canopy builds from scratch needs a working version Michael can show before launch (E43), the owner editing before any visitor sees it (E44), and its form working on launch day in the client's account (E45). Staging comes first and starts outside the portal.

### E43 · Staging

Goal: Michael shows a client the working version of their site, before launch and for any later change Canopy makes, at an address only the people he shares it with can open, and the client says what they want changed.

- A staging build is its own build from its own branch on its own hostname, never the production app serving a second name, or nothing can differ between it and production.
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

Goal: a site's form is part of the site (PRD D68): written with its pages, in its own markup and styles, working the moment the site does, with what it takes in landing in the client's account and nothing rewired after linking. No embed. Today a site embeds a Forms form by its id, built after linking acting as the client, with its id committed after that (as of 2026-11-21).

- **The form is written during the build** (Site Build Checklist), as a definition in the site's repo, and a component in the site kit (E41) draws it at build. A choice can list the site's services (E56), since both come from one build.
- **The portal learns a site's forms from the site**, at Link a site and at each publish, so the owner's Forms tab names them and answers are checked and labeled. Nobody builds a site's form in the Forms builder.
- **Sending goes to the portal**, on the route Forms' own forms post to and through the same checks. A form is named within its site (`contact`), so the template is written once, before any account exists, and the origins it accepts are the site's hostnames.
- **What runs in the visitor's browser is a package the site builds in**, written once for every site.
- the test site first, then canopyds.com. Both embed a form by id today, and the embed by id is owed nothing once they have moved.
- Open for the epic doc: where the definition sits (in the contract, its labels marked for the owner as other text is, or a file beside it); the sending route as a versioned agreement, since a site carries the package it was built with until its next build; what a visitor without JavaScript gets; a site with a server (D62), whose form is D53's slot with another provider; whether Forms' embed is drawn by the same package.
- Acceptance: a site from the starter with a form definition, once linked, serves a working form whose submissions land in the client's account, with no commit after linking and no request to the portal until a visitor sends.

---

## Phase 8: Launch readiness

The MVP's own work (PRD D51).

### E47 · Tool layer fixes

Each fix lands with a test that fails without it. The second's and third's are written, and pass while the defect is present: `docs/canopy-sites/e47-repro.db.test.ts.txt`. Copy each into `apps/portal/src/lib/site-tools/`, turn its expectations around, and delete the file with the last. The builder is stood in there, so the builder's half of the second is read, not run.

- **A guide rule the site already breaks refuses every edit.** `check` (`apps/portal/src/lib/site-tools/index.ts`) runs the guide's limits, counts, and refused phrases (`validateContent`, `refusalIssues` in the contract) over the whole site, so once published content breaks one, every owner edit is refused naming a field the owner didn't touch, and a refused phrase becomes a request to Michael about text the owner never wrote. Report only on fields the edit changed, as `avoidWarnings` does, and show the operator where published content and the guide disagree.
- **A builder restart strands the draft's build.** The builder keeps its records and queue in memory (`apps/builder/src/sites.ts`) and answers 404 for a build it was running; `refreshChange` treats any builder error as no news, so the `Build` stays `QUEUED` or `RUNNING` until another edit. A 404 for a build the portal started marks it `FAILED`, or starts it again.
- **Publish doesn't run the guardrails again**, so a lock or fixed list added on the `Site` row after a draft was saved doesn't apply to that draft. Run `check` in `publishChange`.
- Acceptance: those tests turned around and passing; the suite passes

### E48 · Deploys and checks

Goal: a release that fails to start leaves the one before it serving, and a change is checked by something other than the session that wrote it.

- A `/healthz` route, a Dockerfile `HEALTHCHECK`, and health-gated deploys on the portal apps. Today migrations run after Coolify has swapped containers, so a failed migration leaves the portal down until fixed by hand, and every release blips. A migration is written so the release before it can run against it (add first, remove in a later release)
- A workflow on pull requests to `main`: build, lint, and the suite against a Postgres service. The repo has no CI
- The portal on Node 24 (it builds on `node:20-alpine`, out of maintenance since 2026-04-30), with Vitest 5; the Prisma CLI past its advisories, `js-yaml` under `gray-matter` past its own, and `uuid` dropped (declared, never imported)
- Acceptance: a migration that fails on dev leaves dev serving the previous release; a pull request with a failing test shows it failed

### E49 · Alerting and records

Goal: Michael is told when the portal or the builder is down, and what happened on the platform can be looked up afterwards. Today a stopped portal, a stopped builder, a failed nightly rebuild, and a failed publish are each silent, and operator actions are a JSON line in the container's output, which a deploy replaces.

- A check from outside Webber on the portal's health, which answers for the builder too (the builder has no public address), alerting through a channel that doesn't depend on Webber
- An alert on a failed nightly rebuild, a failed publish, and a builder error
- An audit table for operator actions and sign-in events, replacing the lines printed to the container
- A request log at the proxy on both boxes, without query strings and with a retention period (the Nextcloud Engineering page "Logging and Detection 2026-11-10")
- Open for the epic doc: what does the checking (the health tool the New Client Checklist names, an outside monitor, or Cloudflare), and where alerts go: email shares the portal's mail ceiling, a text or a push doesn't
- Acceptance: with the dev portal stopped, Michael is alerted within minutes, and the same check covers production's portal and builder; an operator action and a sign-in from the week before can be found

---

## Phase 9: The suite

After the MVP (PRD D52, D54, D55), except E55's first step.

### E50 · Media pipeline and the Gallery tab

Goal: an owner adds, reorders, and removes photos in a tab, and Quick Edit does the same through the tab's own form (PRD D41, D54).

- The media pipeline: `uploadMedia` with preflight per `QUICK_EDIT_GUIDANCE.md` (formats, normalization, size per slot with its refuse and warn levels), staged until publish. The model gets a downscaled copy for alt text, placement, and moderation (PRD D33), and the owner accepts or edits the alt text (125 characters at most)
- A draft's photo shows on the canvas from the builder: the canvas loads a client site's assets from its live address, where an unpublished photo doesn't exist
- The Gallery tab, then Quick Edit and the canvas popover attaching through its form. Quick Edit answers an add with the tab's form filled in with what it heard, instead of asking for each part in turn
- Instagram as a source, for Client 1: fetched at build and never committed, so after E36, when the token lives with the one production build. Open: Meta's review of the app

### E51 · Events

Goal: an owner adds an event with its date, time, and place, and it leaves the site by itself when it is over.

- An `events` collection in the contract, with the first site that renders it; its tab; then Quick Edit filling the tab's form
- Structured data and add-to-calendar from the build
- After E36: the nightly rebuild has to reach a client's live site

### E52 · Booking

PRD D55. Waits for a client who needs it; Client 2's requests for appointments are E55. Open for the epic doc: where a bookable service's length lives (the contract's `services`, or the booking component), and whether availability is read from the calendar's private address or through Google sign-in.

### E55 · Requests (Client 2's appointment form)

`docs/epics/epic-55-requests.md`. Step 1, the form from today's field types built in her account, is in the MVP; then a Photos field type, an Approval with a document, and a Sites account's Forms tab opening on what came in.

### E56 · Services

`docs/epics/epic-56-services.md`, built now (PRD D66). Its screens wait on the planning of the portal's shape (its section 7, item 4).

### E57 · Button and menu text on the canvas

Goal: an owner changes the words on a button or a menu item where they see it, and can still follow it: a click on anything that links gives a pencil and a follow icon, and the owner picks. Straight after E56, which builds that layer for text that is already marked (its 4.5).

- The lane: a button's label and a menu item's label become the owner's on every site, while where each goes stays Canopy's. Revises PRD D50 and the runbook's rule that neither is marked
- The contract: a page's button is one field today, Canopy's whole, so its label and its link are flagged apart; and a menu item that goes to a place on a page (Client 2's Gallery, About, and Connect) gets a field, which the contract lacks
- Each site: its buttons' and menu items' labels move from the templates into content and are marked, and its guide gets a limit for each, measured at 360 and 1440 px, since a menu label that wraps breaks a header
- Open for the epic doc: whether eyebrows follow; an analytics event named by a button's label, which must keep its name when the label changes; a label that names where it goes ("Book on Square")

---

## Phase 10: Keeping a site true

Each backs something Sites would say to a buyer: the site is safe to touch, it stays current, it works from a phone, and it is the client's to take. Their order, among themselves and against Phase 9, is to decide.

### E58 · History and restore

An owner sees what was published, when, and by whom, and takes the site back to any of those versions. A restore is a draft that sets content back to a published version, built, previewed, and published like any other (PRD §4.5), never `current` pointed at an older build.

### E59 · The site asks

A concept. Every so often the owner is shown a few facts and asked whether each is still true (the hours, a price, a date that has passed), and answers with one tap or one Quick Edit message. Needs dated notices that end by themselves first, so only the rest is asked about.

### E60 · The portal on a phone, and answers about the site

An owner does from a phone what they came to do, and asks what happened on their site ("How many people have responded since yesterday?") and gets a figure and where it came from, never advice: Quick Edit is not an assistant (PRD section 1).

### E61 · Export

A client who leaves takes their site with them, with none of Canopy's contract in it (PRD D58): the work is stripping out the contract, the marks, and the content loader. Plain code and WordPress are different exports; which are offered is open.

---

## Not scheduled (recorded so they are not forgotten)

- Tool tabs after Gallery and Events (PRD D39): a Calendar putting announcements and events on one timeline (D42), blog, newsletter
- Members (a light CRM) and newsletters as runtime components (PRD D52)
- Forms sold as a public product (PRD D67). Before it is: a usability round with a few real users, and a keyboard and screen-reader pass on the form builder, the embed, and hosted forms
- Forms features asked for, none decided: a stored value apart from an option's label (a code behind "United States"); fields shown by an earlier answer, and steps or titled sections in a long form; starting a form from a template; an email to the person who submitted, with their answers; changing an account's email, confirmed from the new address; a click anywhere on a row opening it, as the Fields list does; each appearance control marking what it styles in the preview, as `PreviewMark` does for a header input and a field row (UX_PATTERNS section 10)
- An operator build log for each site (status, duration, the build's output)
- Confirming a request with a time, after E55: the client gets an email with a calendar invite, then a reminder by email at the cancellation cutoff. Proposed, not decided
- The portal on two boxes: database failover to Fox (PRD D51), designed before Booking carries a client's revenue; rate limits (`src/lib/rate-limit.ts`) and the builder's queue are in memory, so neither runs as two copies today
- A demo-account home with a switcher between several demo sites (PRD D44)
- An owner inviting their own people, member roles such as who may publish, and asking another person for control of the site (PRD D63, D64)
- Creating a site's repo, DNS, Umami website, or hostname link from the portal (the operator links a live site, E38)
- Stripe or FreshBooks sync
- SEO/report tier tooling
- SMS intake
- The public MCP endpoint and its OAuth (E34; PRD D59)
- Tests for the builder's queue, publish, pruning, and nightly rebuild; it has one test file, in the service that pushes to client repos
- Compatibility code to remove: `lockedFieldViolations` in the contract (only its own test uses it), and the pointer-op draft paths in the tool layer (`isDraftOps`, the rewrite on a draft's first write, the pre-draft failure in `syncDraft`), after discarding any pending pointer-op drafts
- Quick Edit's model names list entries by position in `propose_change`, and the tool layer rewrites them as addresses: a miscount edits the wrong entry, caught only by the change report
- Small:
  - Quick Edit sends no refusal fallback (`fallbacks` on `client.beta.messages`), so a decline by the API's safety classifiers ends at "send him a text" (`src/lib/quick-edit/index.ts`)
  - The eval sets don't count an owner's turns to a finished change, and none checks that "ignore my last message, I meant Tuesday" isn't taken as an attack on Quick Edit's instructions
  - The canvas's field panel covers the neighbouring text, and a selected field's text takes the site's own selection color (coral on canopyds.com), close to the red of a value past its limit
  - At 1912 by 948 the Editor page scrolls a little while the canvas scrolls inside it
  - The toolbar reads "Saved" after Discard, and the preview bar says "Previewing unpublished changes" without listing them
  - The portal sends no script Content-Security-Policy, only `frame-ancestors` (`apps/portal/next.config.ts`)
  - `IsoDate` in the contract accepts impossible dates (`2026-02-31`)
  - A portal failure after the builder's push leaves a published change `PREVIEWED`; the next read rebases it, which is safe and confusing

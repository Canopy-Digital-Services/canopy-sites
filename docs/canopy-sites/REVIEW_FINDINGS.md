# Canopy Sites: review findings

Started 2026-11-09, from a top-down review of the build with Michael. This is the catalog of what the review found, to fix on the way to launch and after it.

- **An entry is deleted by the commit that fixes it**, or when Michael decides against it. Delete this file, and the line in `ROADMAP.md` that points here, when it is empty.
- **Basis** says how far each finding was checked: *reproduced* (run), *read* (from the code or docs, not run), or *decided* (Michael's call, with the date).
- Anything exploitable stays out of this file, since the repo is public. The security pass of 2026-11-09 is in the Nextcloud Engineering collective, on the page "Canopy Sites Security Review 2026-11-09", and what production records and doesn't is on "Logging and Detection 2026-11-10".
- **F2 to F5 have tests** in `review-findings-repro.db.test.ts.txt`, beside this file: each passes while its defect is present. To fix one, copy its test into `apps/portal/src/lib/site-tools/`, turn its expectations around, and land it with the fix. The builder is stood in, as the suite does, so the builder's half of F2 and F3 (its refusal of a second publish, its 404 after a restart) is read, not run. Delete that file with the last of the four.

**MVP, as Michael set it on 2026-11-09:** nothing has launched. Owners of sites the size of today's (Toro Z, Fur-Ever Friends, Hair & Harvest, and soon the VETS site) claim their portal, edit, preview, and publish safely. Converting Hair & Harvest is in it (F9). Not in MVP: Gallery, Forms on those sites, the MCP endpoint, Booking, and database failover to Fox.

## Before launch: defects

### F1. A guide rule the site already breaks refuses every edit

- **Where:** `check` in `apps/portal/src/lib/site-tools/index.ts`; `validateContent`'s `limits` and `counts`, and `refusalIssues`, in `packages/site-contract`.
- **What:** limits, counts, and refused phrases are checked over the whole site after an edit, not over what the edit changed. Once published content breaks one (Canopy edits copy past a measured limit, a template change makes a limit stale, a phrase is added to `refuse` that the site already carries), every owner edit is refused, naming a field the owner didn't touch. For a refused phrase, Quick Edit drafts a request to Michael about text the owner never wrote.
- **Fix:** report only on fields the edit changed, as `avoidWarnings` does, and show the operator when published content and the guide disagree.
- **Basis:** reproduced against the contract's fixture, 2026-11-09 (an edit to `site/description` refused for `site/name`'s limit).

### F2. Publish records its outcome without checking the state it read

- **Where:** `publishChange` in `apps/portal/src/lib/site-tools/index.ts`. Every other write in the file is conditional on the draft's version.
- **What:** two cases. Two Publish requests for one change (two tabs, or the operator acting while the owner publishes): the builder refuses the second because the branch moved, and its handler marks the change `FAILED` after the first marked it `PUBLISHED`, so a change that is live reads as failed. An edit saved while a publish is in flight joins the same change, which is then marked `PUBLISHED`: that edit is not live and is no longer in a draft.
- **Fix:** make both status writes conditional on the version and `PREVIEWED`; keep ops that arrived during a publish as a new draft.
- **Basis:** reproduced, both cases, 2026-11-09.

### F3. A builder restart strands the draft's build

- **Where:** the builder's `records` and queue are in memory (`apps/builder/src/sites.ts`); `refreshChange` in the tool layer.
- **What:** after a restart the builder answers 404 for a build it was running. `refreshChange` treats any builder error as no news, so the `Build` stays `QUEUED` or `RUNNING` and the draft shows as building until another edit starts a new build. The builder redeploys on every push that touches `apps/builder` or the contract.
- **Fix:** a 404 for a build the portal started marks it `FAILED`, or starts it again.
- **Basis:** the portal's half reproduced, 2026-11-09; the builder losing its records on a restart is read.

### F4. One draft per site is held by code, not the database

- **Where:** the create path of `writeDraftOnce`; `change_sets` has no partial unique index.
- **What:** two first writes at once (two tabs, or the operator acting while the owner edits) each create a pending change. The older is orphaned as `DRAFT` with its edit. The test for writes that land together runs against a draft that already exists.
- **Fix:** a partial unique index on `siteId` where the status is `DRAFT` or `PREVIEWED`, and a retry on conflict.
- **Basis:** reproduced, 2026-11-09: two drafts, and the draft view showed one of the two edits.

### F5. Publish doesn't run the guardrails again

- **What:** a lock or fixed list added on the `Site` row after a draft was saved doesn't apply to that draft. A guide change does, since it moves the commit and forces the rebase check.
- **Fix:** run `check` in `publishChange`.
- **Basis:** reproduced, 2026-11-09.

### F21. The home page headline doesn't look editable

- **Where:** the marks in `src/lib/canvas-bridge.ts` are a dotted `text-decoration` underline on the marked element.
- **What:** on canopyds.com's home page the headline "Your software should be yours." shows a few dots under the spaces between its words and nothing under the letters, while the subheadline below it is clearly underlined. Clicking the headline works (it opens as Headline, 30 of 45 characters), so the field is marked and the mark doesn't show. The likely cause is the headline's words being wrapped for the hand-drawn underline: an underline set on a parent doesn't draw under inline-block children. Any template that wraps words will lose its mark the same way.
- **Fix:** a mark that doesn't depend on `text-decoration` reaching the text (an outline or a background on the marked element), settled with Epic 33's open marker styling.
- **Basis:** reproduced in Chrome on the local stack, 2026-11-09; the cause is read, not confirmed in the page.
- **After the decision on art (below):** this headline stops being marked at all, since text that art is drawn against becomes Canopy's. The fix still matters for any other text a template wraps, such as words split for an animation.

### F22. The canvas's Quick Edit box hides the reply

- **Where:** `ScopedQuickEdit` in `editor/canvas-editor.tsx`: a 320 by 350 pixel panel with a 224 pixel scroll area.
- **What:** one question about an FAQ answer produced a reply and a request card 542 pixels tall. The box scrolled to the bottom, so the owner sees the end of the card and Send to Michael, with the reply that explains it out of view above.
- **Fix:** a larger panel for a conversation, or keep the reply in view and scroll the card under it.
- **Basis:** reproduced in Chrome on the local stack, 2026-11-09.

## Before launch: work

### F9. Hair & Harvest is not on Sites

Decided, Michael, 2026-11-09: converting it is in the MVP. Its repo is Astro 5 with no `src/content`, no contract, no site guide, and no Dockerfile (local `hair-and-harvest`, last commit 2026-04-29), so it can't be linked or claimed. It needs the conversion Toro Z got (Epic 40) through the Sites Onboarding Runbook, and an epic of its own. It is ROADMAP E46 (PRD D51).

### F23. Lock the text that art is drawn against

Decided, Michael, 2026-11-09 (PRD D56): text a graphic interacts with is Canopy's, on the canvas and in Quick Edit. Today it is editable: on canopyds.com's home page the headline opens for editing in place with no word about the hand-drawn underline under "yours", and only Quick Edit, reading the site guide's prose, warned (both reproduced 2026-11-09). The work, per site: lock each such field's address on the `Site` row, take its mark out of the template, and keep the guide's list of them so Quick Edit offers the request to Michael. canopyds.com's hero headline is the known one; Toro Z's and Fur-Ever Friends' guides list theirs. The Site Build Checklist and the Sites Onboarding Runbook (Nextcloud) state the rule since 2026-11-10. The runbook used to name canopyds.com's `src/components/Marked.astro` as the way to keep art on an editable word; that component's use on marked text goes with this work.

### F25. Production dependencies carry known advisories

`npm audit --omit=dev` on 2026-11-10 reports 17, none critical: 15 high, 2 moderate. None is a direct dependency on a request path since `next` 16.4.5, `nodemailer` 10.3.1, and `sharp` 0.35.5 (the day before it reported 22, one critical, those three among them). Fifteen arrive through the Prisma CLI, which runs at container start for migrations and brings its local dev server's packages with it; npm reports a fix for each within Prisma 7. One is `js-yaml` under `gray-matter`, which reads the portal's own help pages. One is `uuid`, a declared dependency that nothing imports. Basis: the audit was run; no advisory was exercised.

### F27. The portal runs on a Node line past its end of life

`apps/portal/Dockerfile` and `Dockerfile.dev` build on `node:20-alpine`. Node 20 left maintenance on 2026-04-30, so it gets no security fixes; the builder is already on Node 24. AGENT_CONTEXT section 4 ties the move to Vitest 5. It pairs with F25. Basis: read.

### F31. Nothing tells Michael when the portal or the builder is down

Decided, Michael, 2026-11-10: he needs it (PRD section 7, ROADMAP E49). Today a stopped portal, a stopped builder, a failed nightly rebuild, and a failed publish are each silent: the first sign is a client's message. Basis: read, and Michael's word that nothing alerts him.

### F32. The portal's mail has no sender of its own

Decided, Michael, 2026-11-10: not moved yet. It is a risk to track, and a fast follow. The portal sends through the mail account that carries Canopy's own mailboxes and a client's, under one small daily ceiling (ROADMAP, the MVP's item 6; the detail is on the private page). On a day that ceiling is reached, the portal's mail doesn't go out, and little says so: the operator sees it for a claim link ("Copy the link instead"), a password reset answers as if it had been sent, a request to Michael waits in the operator console with no email, and a submission notification fails in the container's output only. Sending from Canopy's own server was checked and ruled out (the private page). The candidate is Cloudflare Email Sending over SMTP: the portal already sends that way, so it moves by changing four variables on each app, and the mailboxes stay where they are. A cap on notification mail and confirmed recipients come with Forms opening up, not with this. Basis: the sending code is read; the ceiling is the provider's published limit; the candidate is from Cloudflare's documentation, not set up.

## Before launch: to decide

### F28. A failed migration takes the portal down, and every deploy blips

Migrations run in the new container's entrypoint (`scripts/start.sh`, `set -e`), after Coolify has swapped containers, and the portal apps have no health check (`docs/PRISMA_MIGRATIONS.md`; the Coolify page in Nextcloud). So a migration that fails in production leaves the portal down until it is fixed by hand, as on the v5.1.0 deploy of 2026-10-16, and every release swaps containers with a moment when a visitor's form submission fails. A `/healthz` route, a Dockerfile `HEALTHCHECK`, and health-gated deploys keep the old container serving until the new one has migrated and answers. It needs migrations that the old code can run against (add first, remove in a later release). Basis: read.

### F29. Nothing checks a change but the session that made it

The repo has no `.github` directory: no CI on a pull request or on `main`, and no dependency updates. Build, lint, and tests run only where the session that wrote the change ran them, while several sessions land on `dev` at once. A workflow that builds, lints, and runs the suite against a Postgres service on pull requests to `main` is the gate; the repo is public, so it costs nothing. Basis: read.

### F24. The Editor on a phone

Michael is considering (2026-11-09) not offering the Editor on phones for now: below a width, the Editor tab says to use Quick Edit until the owner is at a desktop, since a good canvas on a phone is a large investment. Undecided. If it goes that way, Quick Edit is the whole product on a phone, and F20 weighs more: a phone reloads a tab the owner left to copy text or find a photo, and the chat comes back empty. The Editor page at a phone's width was not checked in this review.

### F6. Dated notices have no home on a client site

Only the demo has an `announcements` collection; Toro Z, Fur-Ever Friends, and canopyds.com don't (their `src/content`, 2026-11-09). "We're closed Friday" becomes a request to Michael. The nightly rebuild that would start and end one moves the builder's `current`, which serves the demo alone: nothing rebuilds a client's Coolify app at midnight until the builder is the production build (F11); a midnight redeploy of the site's app on Webber, like Fox's nightly one, would cover it until then. Basis: read.

### F7. No restore

An owner who publishes a mistake can edit again or ask Michael. PRD section 4.5 plans a restore to a published version; the portal has none. Basis: read.

### F8. No ceiling on Quick Edit spend

Cost is recorded per conversation, and nothing stops or shows it: no `Plan.monthlyAiBudgetCents`, no operator usage view. The only bound is 60 messages an hour per account. Measured on the local stack, 2026-11-09, on `claude-opus-5-5`: 1 to 7 cents an owner turn, 3 to 7 seconds each, the system prompt about 10,500 tokens and read from cache across conversations. At that price the ceiling matters less than the operator being able to see the spend. Basis: read, with the costs measured.

### F19. A request to Michael can't carry a photo

"New photos" always become a request card (`BASE_RUNBOOK`), and the card is text, so Michael gets an email with no photo and the owner has to send it another way. Until the media pipeline exists (F11), the reply should say how to get the photo to him. Basis: reproduced on the local canopyds site, 2026-11-09.

### F20. Quick Edit forgets the conversation on a reload

`quick-edit-workspace.tsx` keeps the messages and the conversation id in component state. A reload, or a visit to the Editor tab and back, empties the chat. A request card the owner hadn't sent yet disappears with it and stays `DRAFT` in the database, where nothing lists or removes it. Conversations are stored and never shown again. Basis: read.

### F33. Quick Edit changes a look-alike when the owner names text it can't see

Quick Edit reads the content files, never the rendered page, so text that lives in a site's templates (a menu's descriptions, a footer line, a button, a sentence with a link in it) doesn't exist for it. Asked to change "the description under Tribe Talks in the Connect menu" on the VETS site, it changed a similar Tribe Talks line in another place and said it was done; the menu's descriptions are in the site's code. The runbook's "ask instead of guessing" and "when the site has no field for something, it's Canopy's" didn't catch it, and neither did the site guide's line that the menu is Canopy's: the model had no way to tell that the text the owner meant wasn't the field it found. The right outcome was a request card. Michael, 2026-11-13: parked, the fix needs nuance. Things to weigh: a runbook rule for a request that names a place (the menu, the footer, a button) where no field in that place carries the text; giving the model the rendered page's text, or the page and element the owner is looking at, which today it gets only when Quick Edit opens from a field clicked in the Editor; whether menu descriptions belong in the contract, so they are editable like the rest; and how much to lean on each site's guide to say what is Canopy's. Whatever is chosen should not make it refuse an ordinary request that happens to mention the menu. Basis: Michael's report from the VETS site, 2026-11-13 (he discarded the change); the cause is read from `apps/portal/src/lib/quick-edit/`.

### F10. Five epics are open with their acceptance unticked

Epics 33, 37, 38, 40, and 42. Several boxes are unticked where the progress log records the check passing. Most of what is left is Michael's own check in a signed-in browser or on his phone, and an owner's first claim.

## After launch

### F11. The builder becomes the production build, served from both boxes

Decided, Michael, 2026-11-09: Fox stays as the failover origin for client sites, and the move to the builder must not risk the sites that are live. PRD D57 and D60 and ROADMAP E36 carry it: a builder on each box building from git, and nginx on each serving its output. Until then three things don't work on a client site: the nightly rebuild (F6), a draft's new photo on the canvas (assets load from the live site, where it doesn't exist), and a build-time fetch from Instagram (its token would have to live in each site's Coolify app).

### F12. The portal runs on one box, as one process

Forms today and Booking later live only on Webber. Rate limits (`src/lib/rate-limit.ts`) and the builder's queue are in memory, so neither can run as two copies. Database failover to Fox is not MVP (Michael, 2026-11-09); it is to be designed before Booking carries a client's revenue. The docs disagree on where it stands: AGENT_CONTEXT section 6 says Fox is not standing by for Forms, while the Backups and Restores runbook (Nextcloud) describes a dump pushed to Fox every minute and a handoff between the boxes. Hardware is not the limit: on 2026-11-10 Webber ran 27 containers at a load under 1 on 8 CPUs, with 3.3 of 14 GB of memory and 33 of 232 GB of disk in use, and the builder's volume held about 450 MB a site.

### F30. The Sites pipeline has no environment before production

The dev deployment has no builder (AGENT_CONTEXT section 6), so the builder, the canvas, Preview, and Publish first run deployed on production, where the demo site and canopyds.com are the canaries. ROADMAP E30 lists a builder on forms-dev as remaining. It matters once clients are editing. The builder's volume is also outside the backups, which is right while everything on it can be rebuilt from the repos, and stops being right when it serves production (F11). Basis: read.

### F26. Operator and sign-in events aren't kept

The portal prints a JSON line with the operator's email for each operator action (plan, billing, role, member, link a site, claim link, act as, builds) and for a claimed account, to the container's output only, which a deploy replaces. Sign-ins leave `lastLoginAt` and a failure count on the user row and nothing else. Content changes are the exception: every draft and publish is a `ChangeSet` row and a git commit. An audit table for operator and sign-in events, and an alert on a failed nightly rebuild or publish, are the work. Basis: read. The production side of logging is on the Nextcloud page named at the top of this file.

### F13. The builder has one test file

`github-app.test.ts`. The queue, publish, pruning, and the nightly rebuild are untested, in the service that pushes to client repos.

### F14. Fleet upgrades are by hand

Each site installs the contract by version, and the builder validates every site with the newest. A contract or site kit bump across 50 sites is 50 repo changes. A job that bumps, builds, compares, and pushes is the lever.

### F15. Compatibility code to remove

Against the pre-beta rule (migrate or delete old data, no compatibility code): `lockedFieldViolations` in the contract, used only by its own test; the pointer-op draft paths in the tool layer (`isDraftOps`, the rewrite on a draft's first write, the pre-draft failure in `syncDraft`). Discard any pending pointer-op drafts first.

### F16. The model names entries by position, the system by id

`propose_change` takes JSON Pointer ops, so the model counts list positions; the tool layer rewrites them as addresses. A miscount edits the wrong entry, and the change report catches it only after the fact. To weigh at the Quick Edit layer of the review.

### F18. Adding a thing through Quick Edit takes several turns

- **Where:** `BASE_RUNBOOK` ("Copy is the owner's, word for word", "One question at a time"); the chat has no form.
- **What:** on the local canopyds site, 2026-11-09, "Add an FAQ about how long a website takes to build" took three owner turns and still had no draft: Quick Edit asked for the question and the answer in quotation marks, took an unquoted answer, then asked for the question in quotation marks, though the owner had said what it was about. In another run it proposed a new FAQ and asked "Are you sure you want it?" in the same reply, so the owner's "yes" got "It's already in".
- **Fix:** with the tool tabs (decided: tab first, then Quick Edit fills the same form), Quick Edit answers an add with the entry's form, filled in with what it heard, and the owner types the copy and adds it. Before then: ask for everything missing in one message, and settle a question about the site guide before proposing.
- **Basis:** reproduced.

### F17. Small

- Quick Edit sends no refusal fallback (`fallbacks` on `client.beta.messages`), so a decline by the API's safety classifiers ends at "send him a text" (`src/lib/quick-edit/index.ts`).
- `PRICES` in the same file has Claude Sonnet 5.5's cache reads at $0.20 per million tokens; the price is $0.10. It matters only if `QUICK_EDIT_MODEL` moves to it.
- Quick Edit's tools carry the site's collection names, so its cached prefix is per site, not product-wide as PRD D30 says. Per-site caching works.
- The Sites chrome and the canvas poll for a build's status every 1 to 2 seconds; PRD section 7 says it is pushed.
- The eval sets test refusals and copy rules. None counts the owner's turns to a finished change, and none checks that "ignore my last message, I meant Tuesday" isn't taken as an attempt on Quick Edit's instructions.
- The Editor was driven in desktop Chrome on the local stack, 2026-11-09, canvas phone view included. The Editor page itself at a phone's width is unchecked.
- The field panel sits on the neighbouring text: over part of the headline when the subheadline is open, over the next question when an FAQ answer is.
- While a field is selected its text takes the site's own selection color, coral on canopyds.com, close to the red that marks text past a limit.
- At 1912 by 948 the Editor page scrolls a little by itself while the canvas scrolls inside it: two scrollbars.
- The toolbar still reads "Saved" after Discard.
- The preview bar says "Previewing unpublished changes" and doesn't list them.
- The portal sends no script Content-Security-Policy, only `frame-ancestors` (`apps/portal/next.config.ts`).
- Epic docs 37 and 40 and two code comments (`src/actions/admin/sites.ts`, `src/lib/site-link.ts`) still name Caddy as what will serve production; PRD D60 replaced it with nginx on 2026-11-10.
- `IsoDate` in the contract accepts impossible dates (`2026-02-31`).
- `apps/portal/Dockerfile` has no `HEALTHCHECK`, and the Coolify page (Nextcloud, checked 2026-11-05) lists health checks on five apps, the portal's not among them. So a portal deploy swaps containers with a brief blip, and nothing holds back a container that starts and then fails.
- A portal failure after the builder's push leaves a published change `PREVIEWED`; the next read rebases it, which is safe and confusing.

# Epic 37: canopyds.com on Sites

**Status:** In progress: 4.1 to 4.4 done (v5.6.0 released, www on Astro, the site on Michael's account, 2026-10-19); waiting on Michael's first edit and publish for the last acceptance items; 4.5's runbook published in Nextcloud
**Phase:** 3, Editor (`docs/canopy-sites/ROADMAP.md`, "canopyds.com on Sites"): the first site that isn't the demo
**Predecessor:** Epic 33 (Visual editor)
**Successor:** E35 (Stats, which picks up the site's Umami website), then E36 (production on Caddy), which canopyds.com may take first (section 7)

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/canopy-sites/PRD.md` (D3, D4, D9, D13, D22, D29, D31, D32, D35 to D47, sections 4.4, 4.5, 4.8), `docs/canopy-sites/ROADMAP.md` (C2, E33, E35, E36), `docs/epics/epic-30-demo-slice.md` (section 6), `docs/epics/epic-33-visual-editor.md`, `packages/site-contract/README.md`, `apps/builder/README.md`, and the `docs/tools/*.md` for whatever you touch. In `canopy-website`: its `CLAUDE.md` and `docs/`. In Nextcloud: **Invisible CMS (LLM-Native Content Layer)**, **Site Build Checklist**, **Copy Guidelines** (Canopy Sites collective), **Voice & Messaging** (Brand collective).

---

## 1. Goal

Michael runs canopyds.com through Canopy Sites the way a client would. Signed in at `sites.canopyds.com` as himself, he edits the site in Quick Edit and on the Editor's canvas, opens Preview to see the draft full-window in a new tab, and publishes, and the change reaches `www.canopyds.com`.

It is the first site on Sites that isn't the demo, so the canvas is built for client sites here, loading a site's styles, fonts, and scripts from where the site is live, along with the preview page every site uses (PRD D47). Its run produces the runbook for putting any site onto Sites. It is also the second site whose repo token sits on the builder. The site moves from Next.js to Astro, the stack of every other Sites repo (PRD D46).

## 2. Scope

### In

- **Builder isolation (4.1)**: site build steps run as their own user.
- **The site (4.2, in `canopy-website`)**: Astro 7 port with visual parity; facts and prose in contract 0.2.0 collections, marked for the canvas; `SITE_GUIDE.md`; a static image for the existing Coolify app; the repo's own docs.
- **Client sites on the canvas, and the preview page (4.3)**: the Editor for any site an account owns, with assets from the site's live address; Preview opens the draft in a new tab without the Sites chrome, for every site, the demo included.
- **Wiring (4.4)**: the site on Michael's account, the builder's repo access, redirects.
- **The onboarding runbook (4.5, Nextcloud)**: every step of this run, written for any site, ending in acceptance.

### Out

| Not here | Why / where |
|---|---|
| Preview hostnames | None, by D47: the canvas and the preview page cover them |
| Stats | E35. The site row carries the Umami website id, so E35 needs no wiring for it |
| Production on Caddy, publish by swap | E36. Publish stays a commit to `main`, which the Coolify app builds and deploys (ROADMAP Phase 3 fallback) |
| Contract changes: team, FAQs, long-form text, a `linkedin` social network | Each needs a contract release with the demo's upgrade in the same window (site-contract README, "Upgrading"). Those parts stay in templates (section 7) |
| Photos | E32's media pipeline |
| Dated announcements on canopyds.com | The nightly rebuild (D42) moves the builder's `current`, which nothing serves for this site until E36; www rebuilds only on a push |
| Headings, eyebrows, buttons, SEO fields, nav and footer chrome | Unmarked, as in E33 (D35, D45) |
| The blog | Off the live site since `canopy-website@1eb208a`; its MDX stays in the repo, unrouted |

## 3. Order

- **4.1 deploys before the site is registered with the builder (4.4).** Michael's decision of 2026-10-17; shipped in v5.6.0 ahead of the token.
- 4.1 and 4.2 run in parallel. 4.2 goes live on www through the existing deploy on its own, before any Sites wiring.
- 4.3 needs a client site to test against locally: 4.2's branch through a local bare remote, with a static server of its build as the asset origin (`SITE_ASSET_ORIGIN_<SLUG>`, AGENT_CONTEXT section 7).
- After 4.1, 4.2, and 4.4, Quick Edit works on canopyds.com without a Preview link; 4.3 adds Preview and the canvas (section 7).

Each section is about one session; 4.2 may take two.

## 4. Requirements

### 4.1 Builder: site build steps as their own user (`apps/builder`)

- `npm ci` and `npm run build` run as an unprivileged user of the site's own; git and the builder's own process don't. A build step can write only what a build needs (the working tree, `node_modules`, `dist`, its own cache); the clone's git directory and other sites' directories are out of its reach. How it works: `apps/builder/README.md`.
- The Dockerfile's "Site builds run as the unprivileged node user" comment and the README's security sentence describe the new model.
- Checked locally against a deliberately hostile site build, and on production after the deploy (section 9).

### 4.2 The site (`canopy-website`)

**Port**

- Astro 7 on the demo's line (`^7.4`), static output to `dist/`, base `/`, Node 24. It builds with `npm ci --ignore-scripts`, as the builder installs, and the Dockerfile uses the same flags and lockfile, so the builder's build and the production image of one commit name their `_astro/` files alike. The canvas depends on that (D47).
- Components become `.astro` files with plain `<script>` for behavior, like the demo, H&H, and Toro Z, so the site can feed the template (C2). A component whose behavior doesn't port cleanly may stay React as an island (`@astrojs/react`, `client:visible`); nothing inside an island is a marked field, since hydration owns that DOM. CSS modules and Tailwind v4 (`@tailwindcss/vite`) carry over.
- Next-only features: `next/font/google` becomes Fontsource packages (no external font requests, ROADMAP H3); `next/image` becomes `astro:assets` for images moved to `src/assets` (PDFs, SVG art, and the OG card stay in `public/`); `next/link` becomes `<a>`; the Metadata API becomes the layout's head (title template, description, Open Graph, canonical); `robots.ts` and `sitemap.ts` become static output. The JSON-LD is unchanged apart from reading its facts from content.
- `/services` → `/websites` and `/cookie-settings` → `/cookie-policy` become Cloudflare redirect rules (301) beside the apex → www rule, so they outlive the Coolify app (E36). Create them before the Astro build goes live.
- Umami loads with `data-domains="www.canopyds.com"`, so canvas and preview views aren't counted.
- The canvas sets `data-canopy-editor` on `<html>` (E33 section 4.5) and the preview page sets `data-canopy-preview` (4.3). Under either, the contact form renders a placeholder: the Forms embed refuses a sandboxed page's `null` origin. Under the editor flag, intro animations are skipped.
- Visual parity: every routed page at 1440 and 390 px, screenshots before and after with headless Chromium; each difference fixed or accepted by Michael.

**Content**

- `src/content/site.json`: name, description, contact (phone, email, locality, region, country), hours (Michael supplies the value: the contract requires one and the site needn't render it), socials (empty; LinkedIn stays in the footer template until the contract has the network). Each fact has one source: the footer, the contact page, and the JSON-LD all render it from this file (Invisible CMS, "The template layer is load-bearing").
- `src/content/pages.json`: one entry per routed page (home, websites, government, about, work, contact) with title and description (SEO, unmarked), hero, and the sections made of a heading, paragraphs, a quote, or a CTA. Sections with structure of their own (bid facts, NAICS codes, certifications, roles, process steps, team, values, FAQs, showcases) and the privacy and cookie policies stay in templates.
- Templates read content through one module that runs `validateContent` at build, as the demo's `src/lib/content.ts` does, so a violation fails the build.
- `field()` marks facts and prose only: hero subheadlines, section paragraphs, quotes, contact facts.
- `SITE_GUIDE.md` (D31, D40). Front matter: limits per address, measured from the rendered layout, and the phone display format. Prose: the Voice & Messaging rules; Canopy's own copy mechanics, adopted (D32 lets a guide adopt them); and the positioning rules in the repo's `docs/site-architecture.md` that a copy edit could break (where DVBE may appear, certifications not yet held, the veteran-owned framing).

**Deploy and docs**

- Dockerfile: a Node 24 build stage (`npm ci --ignore-scripts`, `npm run build`) and nginx serving `dist/`, Toro Z's pattern. nginx sends `Access-Control-Allow-Origin: *` on every static file, so the sandboxed canvas can load the site's module scripts and fonts (D47; E36's Caddy config carries the same). Same Coolify app (`canopy-website`) and domain; health check on (`GET /`, as Toro Z's). It goes live on a push to `main`: the app deploys through Coolify's GitHub App webhook (section 9).
- `CLAUDE.md`, `docs/deployment.md`, and `docs/development-workflow.md` rewritten for Astro, the static image, auto-deploy, and content in `src/content` (edited through Sites; never a fact hardcoded in a template). Delete what the port supersedes: the standalone-output and `next/font` reasoning, and `feat/new-tabs` as the redesign branch.

### 4.3 Client sites on the canvas (`apps/portal`)

**The Editor**

- The canvas works for any site the session's account owns, when the builder is configured and the site has a production hostname, not only `isDemo`. Resolve the site by id with an ownership check (D44).
- The canvas document comes from a route on the Sites host, generalized from `/demo`'s `?canopy_editor=1` path, for members only (`canPreviewSite`; 404 otherwise):
  - with a draft pending, the draft's build from the builder
  - with none, the live page, fetched from the production hostname, since the builder's `current` can lag a Canopy push that www has already deployed
- Before it goes out, the route injects:
  - a `<base>` set to the page's address on the production hostname (`https://` plus the first production hostname plus the path), so the page's URLs, root-relative ones included, load assets from the live site
  - for the canvas, the editor flag and the bridge; for the preview page (below), the preview flag and the bridge in view mode
- Every response sends `/demo`'s sandbox CSP and `frame-ancestors 'none'`, so a direct visit never renders site HTML with the portal's origin.
- The bridge, the srcdoc frame, and in-place text patching are unchanged (D43). `canvas-editor.tsx`'s `/demo` path handling generalizes to the site's own paths; navigation reports arrive as URLs on the production hostname.
- In development the production hostname takes no port, so a development-only setting gives a client site's asset origin: a static server of the site's build.

**The preview page (every site, the demo included)**

- A route on the Sites host, outside `(admin)`, addressed by site id with an ownership check (D44) and the page's path. It requires a signed-in member (`canPreviewSite`) and calls `requireHomeHost`, as AGENT_CONTEXT section 2 requires of a signed-in layout outside `(admin)`.
- The site fills the tab: the page document from the route above, in a full-window sandboxed srcdoc frame, with no portal around it. The frame is what keeps the site's scripts away from the portal session while the bar below stays the portal's.
- **The preview bar** along the bottom looks like `/demo`'s today: the teal bar reading "Previewing unpublished changes". It carries the only Publish (D47):
  - Publish names the build the page is showing, and the tool layer refuses it unless that is the latest succeeded build of the draft's current version (D38). So an edit made in another tab after the page loaded can't go live unseen.
  - While a newer build of the draft runs, the bar says it's updating and Publish waits. The page swaps in place when the build lands (the Editor's build-status stream).
  - After publishing, the bar says it's published and how soon it's live: at once for the demo; after the site's deploy for a site published by a push (canopyds.com until E36).
  - With no draft, the bar reads "No unpublished changes" and has no Publish.
- The bridge in view mode reports navigation only: no marks and no selection. The site's own links move between pages, and the tab's address follows with `history`, so reload and back work.
- The demo's Preview opens this page too. `/demo`'s own preview mode (`/demo/__canopy/preview`, its cookie, and its bar) is deleted, so `/demo` serves the published build and the Editor's canvas only.

**Where Publish was**

- The Sites chrome's draft status (`src/components/sites/draft-status.tsx`) keeps unpublished changes and Discard, and its Publish becomes Preview, which opens the preview page in a new tab.
- Quick Edit's pending change (`quick-edit-workspace.tsx`) shows Preview and Discard; its Publish goes.
- The Editor and the quick edit popover have no Publish.
- Quick edit's model-facing text (`src/lib/quick-edit`: the `propose_change` result and `runbook.ts`) says the owner previews and publishes from the preview page, matching `QUICK_EDIT_GUIDANCE.md`.
- The operator's Build and publish stays, for a site's first build and the demo's reset.

**Quick Edit**

- For a client site, View site and the pages list use the first production hostname. Both are null for client sites today (`liveUrl` in `src/app/(admin)/(sites)/quick-edit/page.tsx`).
- Preview opens the preview page in a new tab (`target="_blank"`), at the page the change touches. An op under `pages/<id>` opens that page; any other op opens the home page. Quick Edit never opens the Editor to preview (D47).
- Every preview link is that preview page's URL, so E34's tools will return it too.

**Docs**

- `docs/AGENT_CONTEXT.md`:
  - section 2: the canvas route's and the preview page's rules beside `/demo`'s, and `/demo` without its preview mode
  - section 3: `/editor` for every Sites account with a site, and the preview route
  - section 7: the development setting, if it is a variable
- No Sites help pages exist yet (E30 section 8).

### 4.4 Wiring (production)

Michael:

- A fine-grained token on `Canopy-Digital-Services/canopy-website` (Contents read and write), added to `canopy-builder` as `GIT_TOKEN_CANOPYDS`. Record its expiry beside `GIT_TOKEN_DEMO`'s.

Agent, each production change confirmed first:

- **Launching the Astro build**, after Michael has reviewed it on dev.canopyds.com:
  - the two Cloudflare 301 rules (`/services` to `/websites`, `/cookie-settings` to `/cookie-policy`), before the merge
  - the `canopy-website` app's exposed port from 3000 to 80, with its health check on (`GET /`), on webber and on Fox's copy of the same app. The port lives in two places: `ports_exposes` and the Traefik `loadbalancer.server.port` in the app's stored `custom_labels`, which a change to `ports_exposes` leaves alone (dev.canopyds.com served 502 until its label was changed too, 2026-10-19). canopy-website is Tier 1: Fox runs it too and redeploys it from `main` every night (`canopy-tier1-redeploy`, checked 2026-10-19), so a copy left on port 3000 would serve nothing the first time traffic fails over
  - the merge of `feat/astro` into `main`, which deploys webber; then Fox's copy redeployed at once rather than that night
  - www checked at 1440 and 390 px, both redirects answering 301
- **Builder:** redeploy it once the token is in.
- **The site, in Operator → Sites, on Michael's account** (on `SITES` with no site, checked 2026-10-19):
  - slug `canopyds`; repo URL; branch `main`
  - production hostname `www.canopyds.com`
  - the Umami website id from the site's layout
  - locked fields `site.contact.phone`, `site.contact.email`, `site.contact.address` (D9's default; Michael may unlock them)
  - the time zone stays the default `America/Los_Angeles`

  Then run Build and publish once, so `current` exists.
- **Branch protection:** confirm `main` on `canopy-website` doesn't refuse the builder's push.
- **`dev.canopyds.com`:** kept for now (Michael, 2026-10-19). It served `feat/astro` for his review (repointed 2026-10-19, port 80, health check on); that branch merged at launch, so it shows the site as launched.

### 4.5 The onboarding runbook (Nextcloud)

No page covers putting a site onto Sites end to end (checked 2026-10-19). Two pages each cover part of it:
- **Site Build Checklist** (Canopy Sites collective): content completeness and `SITE_GUIDE.md`.
- **New Client Checklist** (Engineering, Runbooks): go-live infrastructure (Coolify, DNS, tunnel ingress, load balancing, health, analytics).

Write **Sites Onboarding Runbook** in the Canopy Sites collective as this epic runs. Each step is written as done for canopyds.com and stated for any site:
- **The site repo:**
  - the contract installed by release tarball
  - content in `src/content` with one source per fact
  - field marks and `SITE_GUIDE.md` (pointing to the Site Build Checklist, not repeating it)
  - build parity with the builder (Node 24, `npm ci --ignore-scripts`, base `/`, `dist/`)
  - CORS on static files
  - Umami's `data-domains`
- **Sites:**
  - the operator Site row (slug, repo, branch, production hostname, Umami id, locked fields)
  - the builder token, with its expiry in the Engineering **Expirables Register**
  - the builder redeploy and the first Build and publish
- **Infrastructure:** a link to the New Client Checklist and the step it runs at, not a copy.
- **Acceptance:** this epic's section 5, generalized to any site, as the runbook's last step.

Link the runbook from the collective's landing page, from both checklists, and from `CLAUDE.md`'s list of Nextcloud runbooks. The first new client site after canopyds.com runs it as written and corrects it.

### 4.6 Tests

Database tests:
- The canvas route refuses another account's site and a signed-out request.
- It serves the draft's build only while a draft is pending.
- The preview page refuses another account's site and a signed-out request.
- Publish from the preview page is refused for a build that isn't the latest succeeded build of the draft's current version.
- Quick Edit's Preview link names the page an op touches.

Unit test: the canvas route's `<base>` is the site's production hostname, never the request's host.

Each guard's test fails with the guard removed.

## 5. Acceptance

- [x] www.canopyds.com serves the Astro build from the Coolify app with visual parity at 1440 and 390 px on every routed page; both redirects answer 301; Umami counts only www
- [x] The site validates against contract 0.2.0, a violation fails `npm run build`, and every fact renders from `site.json`
- [x] The builder's build and the production image of one commit list the same `_astro/` files
- [ ] The builder's isolation checks pass (project memory), and the demo builds and publishes on production afterward
- [ ] Signed in as Michael on production, the Editor shows canopyds.com on the canvas, styled, with no CORS errors in the console, and only facts and prose marked. An in-place edit shows as typed and lands in the draft
- [ ] Quick Edit lists canopyds.com's pages; a requested change builds, and Preview opens a new tab with the changed page filling the window and the preview bar at the bottom. The site's navigation moves between pages there, and the build swaps in place
- [ ] Publish appears only on the preview bar: Quick Edit, the Sites chrome, and the Editor show Preview instead
- [ ] Signed in on a phone, the same Preview link shows the draft full-page. Signed out, or as another account, the preview page and the canvas route return 404
- [ ] Publish on the preview bar commits to `canopy-website`'s `main` as Michael, the Coolify app deploys it, and www shows the change
- [ ] On the demo, Preview opens the same page, `/demo/__canopy/preview` is gone, and the Editor, Quick Edit, and `/demo` otherwise work as before
- [x] Sites Onboarding Runbook exists in Nextcloud, linked from the landing page, both checklists, and `CLAUDE.md`, and every step this epic took is in it
- [ ] `npm run build`, `lint`, `test` pass; every guard's test fails with the guard removed

## 6. Decisions

### Michael (2026-10-19)

- **canopyds.com moves onto Sites under Michael's account**, as the first site that isn't the demo (PRD D46).
- **Astro stays** after a framework review (D46). The alternatives weighed were:
  - Next.js static export
  - Eleventy, the runner-up
  - Hugo
  - SvelteKit or Nuxt static
  - a portal-rendered theme engine
  - an off-the-shelf headless CMS

  The platform's tie to Astro is the builder's `dist/` output and the `_astro/` fingerprint path (as of 2026-10-19). New code keeps it to those.
- **No preview hostnames** (PRD D47). A client site's canvas loads its assets from the site's live address, so a site needs no sign-in handoff, preview cookie, DNS record, or Coolify domain for previews.
- **Preview opens in a new tab, the site filling it with the preview bar at the bottom**, not embedded in the portal and not in the Editor (D47): Quick Edit shouldn't look like it drops the owner into the visual editor.
- **Publish lives on the preview bar and nowhere else** (D47), which makes checking the preview the only way to publish.
- **The demo previews through the same page**, and `/demo`'s own preview mode is deleted: one preview path for every site.
- **A runbook comes out of this run** (4.5), so the next site onto Sites repeats it smoothly.
- **Scope covers builder isolation, the canvas for client sites, and the preview page**, beside the port.

### Agent calls inside scope

- **One epic in five sections**, 4.1 to 4.4 each about a session, because together they make the site usable on Sites; 4.2's work lands in `canopy-website`, and 4.5 is written alongside the others.
- **Slug `canopyds`.**
- **One build user per site, not one shared by every site (4.1).** Each site's steps reach only that site's directories, and the builder can stop everything a site's step left running without touching another site's build in progress.
- **One canvas route for every site, the demo included** (`/canvas/[siteId]`), which replaced `/demo`'s editor and preview modes; `/demo` serves only the published demo.
- **Content moved now: facts, and the prose sections that fit `pages`.** Structured sections wait for contract collections.
- **With no draft, the canvas shows the live page itself**, not the builder's `current`, so its HTML always matches the assets it loads.
- **Preview opens the page a change touches**, with the home page for changes outside `pages`.

## 7. Open

- **Dogfood before 4.3?** After 4.1, 4.2, and 4.4, Quick Edit works on canopyds.com without a Preview link, and a publish reaches www after the Coolify build. Michael's call.
- **Sites before launch.** The canvas needs a live address to load assets from, so a new client site needs a production hostname from its first draft. The likely answer is a `<slug>.canopyds.com` name until its domain moves (D25's one-level limit). Decide with the first new client.
- **canopyds.com first on Caddy (E36)** in place of H&H, as the lower-stakes site. Michael's call when E36 starts.
- **Contract additions the site wants** (team, FAQs, long-form text, `linkedin`), for the next contract release, shipped with the demo's upgrade.

## 8. Completion report

Not started.

## 9. Progress log

- 2026-10-19: Planned with Michael: framework review (Astro stays) and scope. Verified on production that day:
  - Michael's account is on `SITES` with no site.
  - The `canopy-website` Coolify app deploys on push through the GitHub App webhook (a webhook deploy for each push on 2026-10-18 in Coolify's deployment history). The repo's docs said there was no webhook; corrected the same day.
  - `canopy-website-dev` still deploys `feat/new-tabs`.
- 2026-10-19 (later): Michael dropped preview hostnames: a client site's canvas loads its assets from its live address (PRD D47). The portal-versus-Caddy question for preview hosts went with them.
- 2026-10-19 (later): Michael: Preview opens a page of its own in a new tab, without the Sites chrome, never the Editor (D47 revised); this run produces the onboarding runbook (4.5). Nextcloud checked: no page covers putting a site onto Sites.
- 2026-10-19 (later): Michael: the demo previews through the same page; Publish moves to the preview bar and off Quick Edit, the Sites chrome, and the Editor (D38, D47 revised). "No Sites chrome" means not embedded in the portal; the bottom bar stays.
- 2026-10-19 (later): Built on branch `epic-37` (worktree `~/repos/canopy-sites-e37`, its own local stack on port 3016).
  - 4.1 (`7e2d862`): checked with a deliberately hostile site build: every check in the project memory passed, a `dist` symlink failed the build with the preview left where it was, a symlink inside the output served 404, and the demo built and published (a commit pushed to the local remote).
  - 4.3: end to end on the local demo with headless Chromium. The canvas loaded the demo with 24 marked fields; an in-place edit saved; Quick Edit and the Sites chrome showed Preview and no Publish; the preview page opened in a new tab with the bar reading "Previewing unpublished changes", the edit visible, and no marks; Publish there made the change live at `/demo`.
- 2026-10-19 (later): 4.2 built by a subagent on `canopy-website` branch `feat/astro`:
  - The port: no React islands. A clean `npm ci --ignore-scripts && npm run build` passes, and two separate builds name every `dist/_astro/` file alike. A contract violation fails the build.
  - The image sends CORS and the cache headers. All 8 pages match the live site's height at 1440 and 390 px.
  - Left over: WebP encoding and font hinting differ by a few pixels; the homepage's 43 px sideways scroll at 390 px is already on the live site.
  - Content files reformatted the way the builder writes them, so a publish is a one-line diff.
- 2026-10-19 (later): canopyds.com end to end on the local stack, from a local remote of `feat/astro`, its image serving assets through `SITE_ASSET_ORIGIN_CANOPYDS`:
  - The canvas showed the site styled with its own fonts. An in-place edit showed in the preview, and the site's links moved between pages there, with Back working.
  - Publish reported "live on www.canopyds.com in a few minutes" and pushed a commit authored by the publisher.
  - Two preview bugs fixed on the way (`e401bd0`).
- 2026-10-19 (later): `feat/astro` pushed. dev.canopyds.com repointed to it (port 80, health check on) and deployed. It served 502 until the Traefik port in its stored labels went from 3000 to 80 as well; then every page answered 200, a missing path 404, assets with CORS and immutable caching, and no console errors at 1440 or 390 px.
- 2026-10-19 (later): Michael reviewed dev.canopyds.com and approved the launch and the release.
  - www launch: the two Cloudflare redirect rules (301, query strings kept); port 80, the Traefik label, and the health check on webber's app and on Fox's copy; `feat/astro` fast-forwarded into `main` (`5d01c42`), which deployed webber; Fox's copy deployed by hand. Verified: every page 200, a missing path 404, both redirects 301, the apex redirect, CORS and immutable caching on assets, Umami's `data-domains`, and Fox serving the same `_astro/` names.
  - v5.6.0 (PR #36, merge `0f6e828`), with the other session's Forms work on `dev` (Michael's call). The portal and builder both deployed. Verified on production: the builder runs as root under tini; a no-op demo build ran as uid 20001 and replaced the old clone with the new layout (`git/` and `builds/` root 0700, no `.git` in `repo/`); `/demo` 200; `/canvas` 404 to a signed-out request, with the sandbox CSP; `/preview` sends a signed-out request to sign-in.
- 2026-10-19 (later): Michael added `GIT_TOKEN_CANOPYDS` to `canopy-builder` (runtime only). Wiring:
  - The builder was redeployed and holds the token.
  - The site row was created on Michael's account by a script in the production portal container, with the operator form's fields: slug `canopyds`, the repo, branch `main`, `www.canopyds.com`, the Umami website id, and the three locked contact fields. (I can't sign in to the operator UI as Michael.)
  - First build and publish of the repo as it is, the operator action's steps. The content read found contract 0.2.0, `site` and `pages`, and the site guide. The build ran as uid 20002 and names its `_astro/` files exactly as www does.
  - Signed out, `/canvas` and `/preview` for the site refuse.
  - A browser check as a temporary member of Michael's account was blocked by the session's permission check (creating users on production), so the canvas, preview, and first publish on production are Michael's own first edit.

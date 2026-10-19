# Epic 37: canopyds.com on Sites

**Status:** Planned (2026-10-19)
**Phase:** 3, Editor (`docs/canopy-sites/ROADMAP.md`, "canopyds.com on Sites"): the first site that isn't the demo
**Predecessor:** Epic 33 (Visual editor)
**Successor:** E35 (Stats, which picks up the site's Umami website), then E36 (production on Caddy), which canopyds.com may take first (section 7)

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/canopy-sites/PRD.md` (D3, D4, D9, D13, D22, D29, D31, D32, D35 to D47, sections 4.4, 4.5, 4.8), `docs/canopy-sites/ROADMAP.md` (C2, E33, E35, E36), `docs/epics/epic-30-demo-slice.md` (section 6), `docs/epics/epic-33-visual-editor.md`, `packages/site-contract/README.md`, `apps/builder/README.md`, and the `docs/tools/*.md` for whatever you touch. In `canopy-website`: its `CLAUDE.md` and `docs/`. In Nextcloud: **Invisible CMS (LLM-Native Content Layer)**, **Site Build Checklist**, **Copy Guidelines** (Canopy Sites collective), **Voice & Messaging** (Brand collective).

---

## 1. Goal

Michael runs canopyds.com through Canopy Sites the way a client would. Signed in at `sites.canopyds.com` as himself, he edits the site in Quick Edit and on the Editor's canvas, sees each change on the canvas, and publishes, and the change reaches `www.canopyds.com`.

It is the first site on Sites that isn't the demo, so the canvas is built for client sites here: it loads a site's styles, fonts, and scripts from where the site is live, and it is the preview (PRD D47). It is also the second site whose repo token sits on the builder. The site moves from Next.js to Astro, the stack of every other Sites repo (PRD D46).

## 2. Scope

### In

- **Builder isolation (4.1)**: site build steps run as their own user.
- **The site (4.2, in `canopy-website`)**: Astro 7 port with visual parity; facts and prose in contract 0.2.0 collections, marked for the canvas; `SITE_GUIDE.md`; a static image for the existing Coolify app; the repo's own docs.
- **Client sites on the canvas (4.3)**: the Editor for any site an account owns, with assets from the site's live address; Quick Edit's Preview opens it.
- **Wiring (4.4)**: the site on Michael's account, the builder's repo access, redirects.

### Out

| Not here | Why / where |
|---|---|
| Preview hostnames | None, by D47: the canvas is the preview |
| Stats | E35. The site row carries the Umami website id, so E35 needs no wiring for it |
| Production on Caddy, publish by swap | E36. Publish stays a commit to `main`, which the Coolify app builds and deploys (ROADMAP Phase 3 fallback) |
| Contract changes: team, FAQs, long-form text, a `linkedin` social network | Each needs a contract release with the demo's upgrade in the same window (site-contract README, "Upgrading"). Those parts stay in templates (section 7) |
| Photos | E32's media pipeline |
| Dated announcements on canopyds.com | The nightly rebuild (D42) moves the builder's `current`, which nothing serves for this site until E36; www rebuilds only on a push |
| Headings, eyebrows, buttons, SEO fields, nav and footer chrome | Unmarked, as in E33 (D35, D45) |
| The blog | Off the live site since `canopy-website@1eb208a`; its MDX stays in the repo, unrouted |

## 3. Order

- **4.1 deploys before the site is registered with the builder (4.4).** Michael's decision of 2026-10-17; the plan and its checks are in the Claude Code project memory `builder-build-user-gate-h1`.
- 4.1 and 4.2 run in parallel. 4.2 goes live on www through the existing deploy on its own, before any Sites wiring.
- 4.3 needs a client site to test against locally: 4.2's branch through a local bare remote (`~/repos/.canopy-local-remotes`), with a static server of its build as the asset origin (4.3).
- After 4.1, 4.2, and 4.4, Quick Edit works on canopyds.com without a Preview link; 4.3 adds Preview and the canvas (section 7).

Each section is about one session; 4.2 may take two.

## 4. Requirements

### 4.1 Builder: site build steps as their own user (`apps/builder`)

- `npm ci` and `npm run build` run as a dedicated unprivileged user; git and the builder's own process don't. A build step can write only what a build needs (the working tree, `node_modules`, `dist`, its own cache); the clone's git directory and other sites' directories are out of its reach.
- The Dockerfile's "Site builds run as the unprivileged node user" comment and the README's security sentence describe the new model.
- The checks in the project memory pass locally, and on production the demo builds and publishes after the deploy.

### 4.2 The site (`canopy-website`)

**Port**

- Astro 7 on the demo's line (`^7.4`), static output to `dist/`, base `/`, Node 24. It builds with `npm ci --ignore-scripts`, as the builder installs, and the Dockerfile uses the same flags and lockfile, so the builder's build and the production image of one commit name their `_astro/` files alike. The canvas depends on that (D47).
- Components become `.astro` files with plain `<script>` for behavior, like the demo, H&H, and Toro Z, so the site can feed the template (C2). A component whose behavior doesn't port cleanly may stay React as an island (`@astrojs/react`, `client:visible`); nothing inside an island is a marked field, since hydration owns that DOM. CSS modules and Tailwind v4 (`@tailwindcss/vite`) carry over.
- Next-only features: `next/font/google` becomes Fontsource packages (no external font requests, ROADMAP H3); `next/image` becomes `astro:assets` for images moved to `src/assets` (PDFs, SVG art, and the OG card stay in `public/`); `next/link` becomes `<a>`; the Metadata API becomes the layout's head (title template, description, Open Graph, canonical); `robots.ts` and `sitemap.ts` become static output. The JSON-LD is unchanged apart from reading its facts from content.
- `/services` → `/websites` and `/cookie-settings` → `/cookie-policy` become Cloudflare redirect rules (301) beside the apex → www rule, so they outlive the Coolify app (E36). Create them before the Astro build goes live.
- Umami loads with `data-domains="www.canopyds.com"`, so canvas views aren't counted.
- Under the canvas's `data-canopy-editor` flag (E33 section 4.5), intro animations are skipped and the contact form renders a placeholder: the Forms embed refuses the sandboxed canvas's `null` origin.
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
- Before it goes out, the route injects three things:
  - a `<base>` set to the page's address on the production hostname (`https://` plus the first production hostname plus the path), so the page's URLs, root-relative ones included, load assets from the live site
  - the editor flag
  - the bridge
- Every response sends `/demo`'s sandbox CSP and `frame-ancestors 'none'`, so a direct visit never renders site HTML with the portal's origin.
- The bridge, the srcdoc frame, and in-place text patching are unchanged (D43). `canvas-editor.tsx`'s `/demo` path handling generalizes to the site's own paths; navigation reports arrive as URLs on the production hostname.
- In development the production hostname takes no port, so a development-only setting gives a client site's asset origin: a static server of the site's build.

**Quick Edit**

- For a client site, View site and the pages list use the first production hostname. Both are null for client sites today (`liveUrl` in `src/app/(admin)/(sites)/quick-edit/page.tsx`).
- The pending change's Preview opens the Editor at the page the change touches. An op under `pages/<id>` opens that page; any other op opens the home page.
- Every preview link uses that one Editor URL (D47), so E34's tools will return it too.

**Docs**

- `docs/AGENT_CONTEXT.md`: section 2 (the canvas route's rules beside `/demo`'s), section 3 (`/editor` for every Sites account with a site), section 7 if the development setting is a variable.
- No Sites help pages exist yet (E30 section 8).

### 4.4 Wiring (production)

Michael:

- A fine-grained token on `Canopy-Digital-Services/canopy-website` (Contents read and write), added to `canopy-builder` as `GIT_TOKEN_CANOPYDS`. Record its expiry beside `GIT_TOKEN_DEMO`'s.

Agent, each production change confirmed first:

- **Builder:** redeploy it once the token is in.
- **The site, in Operator → Sites, on Michael's account** (on `SITES` with no site, checked 2026-10-19):
  - slug `canopyds`; repo URL; branch `main`
  - production hostname `www.canopyds.com`
  - the Umami website id from the site's layout
  - locked fields `site.contact.phone`, `site.contact.email`, `site.contact.address` (D9's default; Michael may unlock them)
  - the time zone stays the default `America/Los_Angeles`

  Then run Build and publish once, so `current` exists.
- **Branch protection:** confirm `main` on `canopy-website` doesn't refuse the builder's push.
- **`dev.canopyds.com`:** retire it once the Astro build is live, after Michael confirms: the Coolify app `canopy-website-dev` and its DNS record. It still deploys `feat/new-tabs`, which merged in `canopy-website@45580f9`.

### 4.5 Tests

Database tests:
- The canvas route refuses another account's site and a signed-out request.
- It serves the draft's build only while a draft is pending.
- Quick Edit's Preview link names the page an op touches.

Unit test: the canvas route's `<base>` is the site's production hostname, never the request's host.

Each guard's test fails with the guard removed.

## 5. Acceptance

- [ ] www.canopyds.com serves the Astro build from the Coolify app with visual parity at 1440 and 390 px on every routed page; both redirects answer 301; Umami counts only www
- [ ] The site validates against contract 0.2.0, a violation fails `npm run build`, and every fact renders from `site.json`
- [ ] The builder's build and the production image of one commit list the same `_astro/` files
- [ ] The builder's isolation checks pass (project memory), and the demo builds and publishes on production afterward
- [ ] Signed in as Michael on production, the Editor shows canopyds.com on the canvas, styled, with no CORS errors in the console, and only facts and prose marked. An in-place edit shows as typed and lands in the draft
- [ ] Quick Edit lists canopyds.com's pages; a requested change builds, and Preview opens the Editor at the changed page showing it. Signed out, or as another account, the canvas route returns 404
- [ ] Publish commits to `canopy-website`'s `main` as Michael, the Coolify app deploys it, and www shows the change
- [ ] The demo's Editor, Quick Edit, and `/demo` work as before
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
- **No preview hostnames: the canvas is the preview** (PRD D47), loading a client site's assets from its live address; Preview opens the Editor. This supersedes D25 and D43's preview hostnames, and with them a sign-in handoff, preview cookies, and a DNS record and Coolify domain per site.
- **Scope covers builder isolation and the canvas for client sites**, beside the port.

### Agent calls inside scope

- **One epic in four sections**, each about a session, because together they make the site usable on Sites; 4.2's work lands in `canopy-website`.
- **Slug `canopyds`.**
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
  - The `canopy-website` Coolify app deploys on push through the GitHub App webhook (a webhook deploy for each push on 2026-10-18 in Coolify's deployment history), though the repo's docs say there is no webhook.
  - `canopy-website-dev` still deploys `feat/new-tabs`.
- 2026-10-19 (later): Michael dropped preview hostnames: the canvas is the preview, with a client site's assets from its live address (PRD D47). Sections 1 to 7 revised; the portal-versus-Caddy question for preview hosts went with them.

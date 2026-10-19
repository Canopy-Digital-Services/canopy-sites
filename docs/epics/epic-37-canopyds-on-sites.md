# Epic 37: canopyds.com on Sites

**Status:** Planned (2026-10-19)
**Phase:** 3, Editor (`docs/canopy-sites/ROADMAP.md`, "canopyds.com on Sites"): the first site that isn't the demo
**Predecessor:** Epic 33 (Visual editor)
**Successor:** E35 (Stats, which picks up the site's Umami website), then E36 (production on Caddy), which canopyds.com may take first (section 7)

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/canopy-sites/PRD.md` (D3, D4, D9, D13, D16, D22, D25, D29, D31, D32, D35 to D46, sections 4.1, 4.4, 4.5, 4.8), `docs/canopy-sites/ROADMAP.md` (C2, E30, E33, E35, E36), `docs/epics/epic-30-demo-slice.md` (section 6), `docs/epics/epic-33-visual-editor.md`, `packages/site-contract/README.md`, `apps/builder/README.md`, and the `docs/tools/*.md` for whatever you touch. In `canopy-website`: its `CLAUDE.md` and `docs/`. In Nextcloud: **Invisible CMS (LLM-Native Content Layer)**, **Site Build Checklist**, **Copy Guidelines** (Canopy Sites collective), **Voice & Messaging** (Brand collective).

---

## 1. Goal

Michael runs canopyds.com through Canopy Sites the way a client would. Signed in at `sites.canopyds.com` as himself, he edits the site in Quick Edit and on the Editor's canvas, opens the draft at its preview hostname, and publishes, and the change reaches `www.canopyds.com`.

It is the first site on Sites that isn't the demo, so client preview hostnames (PRD D25, D43) are built here, and it is the second site whose repo token sits on the builder. The site moves from Next.js to Astro, the stack of every other Sites repo (PRD D46).

## 2. Scope

### In

- **Builder isolation (4.1)**: site build steps run as their own user.
- **The site (4.2, in `canopy-website`)**: Astro 7 port with visual parity; facts and prose in contract 0.2.0 collections, marked for the canvas; `SITE_GUIDE.md`; a static image for the existing Coolify app; the repo's own docs.
- **Client preview hostnames (4.3)**: `<slug>-preview.canopyds.com`, sign-in by a one-time handoff, the full-page preview, and the Editor's canvas for client sites.
- **Wiring (4.4)**: the site on Michael's account, the builder's repo access, DNS, the Coolify domain, redirects.

### Out

| Not here | Why / where |
|---|---|
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
- 4.3 needs a site built at base `/` to test against: 4.2's branch through a local bare remote (`~/repos/.canopy-local-remotes`), since the demo builds at `/demo`.
- After 4.1, 4.2, and 4.4, Quick Edit works on canopyds.com without a preview link; 4.3 adds the preview and the canvas (section 7).

Each section is about one session; 4.2 may take two.

## 4. Requirements

### 4.1 Builder: site build steps as their own user (`apps/builder`)

- `npm ci` and `npm run build` run as a dedicated unprivileged user; git and the builder's own process don't. A build step can write only what a build needs (the working tree, `node_modules`, `dist`, its own cache); the clone's git directory and other sites' directories are out of its reach.
- The Dockerfile's "Site builds run as the unprivileged node user" comment and the README's security sentence describe the new model.
- The checks in the project memory pass locally, and on production the demo builds and publishes after the deploy.

### 4.2 The site (`canopy-website`)

**Port**

- Astro 7 on the demo's line (`^7.4`), static output to `dist/`, base `/`, Node 24. It builds with `npm ci --ignore-scripts`, as the builder installs, and the Dockerfile uses the same flags so a preview build and a production build of one commit match.
- Components become `.astro` files with plain `<script>` for behavior, like the demo, H&H, and Toro Z, so the site can feed the template (C2). A component whose behavior doesn't port cleanly may stay React as an island (`@astrojs/react`, `client:visible`); nothing inside an island is a marked field, since hydration owns that DOM. CSS modules and Tailwind v4 (`@tailwindcss/vite`) carry over.
- Next-only features: `next/font/google` becomes Fontsource packages (no external font requests, ROADMAP H3); `next/image` becomes `astro:assets` for images moved to `src/assets` (PDFs, SVG art, and the OG card stay in `public/`); `next/link` becomes `<a>`; the Metadata API becomes the layout's head (title template, description, Open Graph, canonical); `robots.ts` and `sitemap.ts` become static output. The JSON-LD is unchanged apart from reading its facts from content.
- `/services` → `/websites` and `/cookie-settings` → `/cookie-policy` become Cloudflare redirect rules (301) beside the apex → www rule, so they outlive the Coolify app (E36). Create them before the Astro build goes live.
- Umami loads with `data-domains="www.canopyds.com"`, so preview and canvas views aren't counted.
- The canvas sets `data-canopy-editor` on `<html>` (E33 section 4.5) and the full-page preview sets `data-canopy-preview` (4.3). Under either, the contact form renders a placeholder: the Forms embed refuses a sandboxed page's `null` origin. Under the editor flag, intro animations are skipped.
- Visual parity: every routed page at 1440 and 390 px, screenshots before and after with headless Chromium; each difference fixed or accepted by Michael.

**Content**

- `src/content/site.json`: name, description, contact (phone, email, locality, region, country), hours (Michael supplies the value: the contract requires one and the site needn't render it), socials (empty; LinkedIn stays in the footer template until the contract has the network). Each fact has one source: the footer, the contact page, and the JSON-LD all render it from this file (Invisible CMS, "The template layer is load-bearing").
- `src/content/pages.json`: one entry per routed page (home, websites, government, about, work, contact) with title and description (SEO, unmarked), hero, and the sections made of a heading, paragraphs, a quote, or a CTA. Sections with structure of their own (bid facts, NAICS codes, certifications, roles, process steps, team, values, FAQs, showcases) and the privacy and cookie policies stay in templates.
- Templates read content through one module that runs `validateContent` at build, as the demo's `src/lib/content.ts` does, so a violation fails the build.
- `field()` marks facts and prose only: hero subheadlines, section paragraphs, quotes, contact facts.
- `SITE_GUIDE.md` (D31, D40). Front matter: limits per address, measured from the rendered layout, and the phone display format. Prose: the Voice & Messaging rules; Canopy's own copy mechanics, adopted (D32 lets a guide adopt them); and the positioning rules in the repo's `docs/site-architecture.md` that a copy edit could break (where DVBE may appear, certifications not yet held, the veteran-owned framing).

**Deploy and docs**

- Dockerfile: a Node 24 build stage (`npm ci --ignore-scripts`, `npm run build`) and nginx serving `dist/`, Toro Z's pattern. Same Coolify app (`canopy-website`) and domain; health check on (`GET /`, as Toro Z's). It goes live on a push to `main`: the app deploys through Coolify's GitHub App webhook (section 9).
- `CLAUDE.md`, `docs/deployment.md`, and `docs/development-workflow.md` rewritten for Astro, the static image, auto-deploy, and content in `src/content` (edited through Sites; never a fact hardcoded in a template). Delete what the port supersedes: the standalone-output and `next/font` reasoning, and `feat/new-tabs` as the redesign branch.

### 4.3 Client preview hostnames (`apps/portal`)

**Hosts**

- A client site's preview host is `<slug>-preview.<zone>` (D25), from one environment variable giving the pattern (production `<slug>-preview.canopyds.com`, local `<slug>-preview.localhost:3006`). Unset, client sites have no preview host and the Editor and Quick Edit keep today's states for them. The demo stays at `/demo` (D43).
- On a preview host the portal answers with the preview handler and nothing else: no portal page, server action, or API route. Route by host before the app's routes (a `beforeFiles` rewrite with a `has` host match, or `src/proxy.ts`; `docs/tools/nextjs-16.md`). An unknown slug, the demo site, or a site without a repo is 404.
- `next.config.ts`'s frame rule must skip preview hosts (`missing` on the host). Header rules match the request's own path, so without the exclusion the rule's CSP replaces the handler's sandbox, as it once did `/demo`'s (E30). `src/app/demo/next-config.test.ts` covers it.

**What it serves**

- HTML: the draft's build (`preview`) while a draft is pending, else `current`, and only to a browser holding a preview grant for that site. Without one, a short page linking to Quick Edit on the Sites host. The link comes from `SITES_URL`, never the request's host.
- Every other file (CSS, JS, images, fonts) comes from the same build without a grant, falling back to the other build for a missing fingerprinted file, as `/demo` does.
- Every response sends `X-Robots-Tag: noindex, nofollow`.
- HTML gets `/demo`'s sandbox CSP and `frame-ancestors 'none'`. Assets get `Access-Control-Allow-Origin: *`, because module scripts and fonts load in CORS mode from the sandbox's opaque origin.
- A preview bar like `/demo`'s, with Back to Quick Edit and View live site, both absolute from configuration. `<html>` carries `data-canopy-preview`.

**Sign-in (D43)**

- A one-time handoff on the pattern of the Forms-to-Sites one (`createSessionHandoff`, `/auth/handoff`). A signed-in member's Preview button on the Sites host posts a short-lived, single-use token to `/__canopy/auth` on the preview host. The token is bound to that host and site, and the token never sits in a URL. Only a post from the `SITES_URL` origin is accepted.
- Consuming the token sets a host-only, `HttpOnly`, `Secure`, `SameSite=Lax` cookie for a preview grant. The grant is a hashed row tied to user, site, and host, and it expires after 12 hours. Lax still reaches the preview's own link clicks, which are top-level GET navigations.
- Every HTML request re-checks that the grant's user is a member of the site's account (`canPreviewSite`). Signing out everywhere also deletes the user's grants and pending preview handoffs.
- One additive migration for the handoff and grant rows, SQL read before commit.

**Quick Edit and the Editor**

- Quick Edit, for a client site with a preview host: View site and the pages list use the first production hostname. The pending change's Preview goes through the handoff. Both are null for client sites today (`liveUrl` in `src/app/(admin)/(sites)/quick-edit/page.tsx`).
- The Editor's canvas works for any site the session's account owns, as long as the builder and the preview host are configured, not only when `isDemo` is set. Resolve the site by id with an ownership check (D44).
- The canvas document still comes from the Sites host with the session, through a route generalized from `/demo`'s `?canopy_editor=1` path. Its `<base>` is the page's address on the preview host, so the page's URLs, root-relative ones included, load assets from there without a session. That route sends the sandbox CSP too, so a direct visit to it never renders client HTML on the portal's origin.
- The bridge and the srcdoc frame are unchanged (D43: the canvas and the page talk only through postMessage). `canvas-editor.tsx`'s `/demo` path handling generalizes to the site's own paths.

**Docs**

- `docs/AGENT_CONTEXT.md`:
  - section 2: the preview host's rules beside `/demo`'s, and the framing exclusion
  - section 3: `/editor` is no longer demo-only
  - section 6: a preview host is a Coolify domain on the portal app plus a DNS record
  - section 7: the variable
- PRD sections 4.1, 4.2, and 4.8 if section 6's proposal is accepted.
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
- **The preview host:**
  - add `http://canopyds-preview.canopyds.com` to the production portal app's domains (the `http` scheme, like its other domains; Coolify redeploys to apply it)
  - add a proxied CNAME to the tunnel (`cloudflared tunnel route dns` on webber, or the Cloudflare MCP)
  - set the variable on the portal app
- **Branch protection:** confirm `main` on `canopy-website` doesn't refuse the builder's push.
- **`dev.canopyds.com`:** retire it once the preview host works, after Michael confirms: the Coolify app `canopy-website-dev` and its DNS record. It still deploys `feat/new-tabs`, which merged in `canopy-website@45580f9`.

### 4.5 Tests

Database tests:
- A preview handoff works once, only on its host, only before it expires, and only for a member.
- A grant for one site serves nothing on another site's host.
- A grant stops working when its user leaves the account or signs out everywhere.
- The canvas route refuses another account's site.

Unit tests:
- The host routing sends every path on a preview host to the handler.
- The frame rule skips preview hosts.

Each guard's test fails with the guard removed.

## 5. Acceptance

- [ ] www.canopyds.com serves the Astro build from the Coolify app with visual parity at 1440 and 390 px on every routed page; both redirects answer 301; Umami counts only www
- [ ] The site validates against contract 0.2.0, a violation fails `npm run build`, and every fact renders from `site.json`
- [ ] The builder's isolation checks pass (project memory), and the demo builds and publishes on production afterward
- [ ] Signed in as Michael on production, Quick Edit lists canopyds.com's pages; a requested change builds, and Preview opens `canopyds-preview.canopyds.com` showing the draft with the preview bar. Signed out, or as another account, the preview host shows no draft
- [ ] The Editor shows canopyds.com on the canvas with only facts and prose marked, and an in-place edit shows on the canvas as typed and lands in the draft
- [ ] Publish commits to `canopy-website`'s `main` as Michael, the Coolify app deploys it, and www shows the change
- [ ] On the preview host, `/login`, `/quick-edit`, an `/api/` route, and a server action POST get no portal response
- [ ] The demo's Editor, Quick Edit, and `/demo` work as before
- [ ] Every migration read; `npm run build`, `lint`, `test` pass; every guard's test fails with the guard removed

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
- **Scope covers builder isolation and client preview hostnames**, beside the port.

### Proposed, for Michael

- **Preview hosts are served by the portal, not Caddy**, extending E30 C6.
  - PRD section 4.1 routes previews through Caddy, auth-gated.
  - But previews have a few viewers, all signed-in members, and their auth is the portal's own (D16). Caddy would need a forward-auth call to the portal on every request anyway.
  - The portal already proxies the builder for `/demo`, so this is that handler on another host.
  - Caddy stays for production (E36), where traffic is public and needs no auth.

  If accepted, PRD sections 4.1 and 4.2 and the E30 brief's remainder change in 4.3's commit.

### Agent calls inside scope

- **One epic in four sections**, each about a session, because together they make the site usable on Sites; 4.2's work lands in `canopy-website`.
- **Slug `canopyds`**, so the preview host is `canopyds-preview.canopyds.com`.
- **Content moved now: facts, and the prose sections that fit `pages`.** Structured sections wait for contract collections.
- **The handoff token is random, single use, and stored hashed**, as `createSessionHandoff`'s is: short-lived and bound to its host, as D43 asks, with no signing key to manage.
- **The canvas document comes through the portal with the session; only assets come from the preview host.** E33's canvas stays as built, and the grant is needed only for the full-page preview.
- **Preview assets need no grant.** Built asset names carry content hashes, and the HTML, where unpublished content lives, needs a grant. Revisit with E32, when an unpublished photo could be staged under such a name.
- **The preview's HTML is sandboxed** like `/demo`'s although it has its own host: the host is same-site with the portal, so an unsandboxed page's requests to the portal would carry its SameSite cookies.

## 7. Open

- **Dogfood before 4.3?** After 4.1, 4.2, and 4.4, Quick Edit works on canopyds.com without a preview link, and a publish reaches www after the Coolify build. Michael's call.
- **canopyds.com first on Caddy (E36)** in place of H&H, as the lower-stakes site. Michael's call when E36 starts.
- **Contract additions the site wants** (team, FAQs, long-form text, `linkedin`), for the next contract release, shipped with the demo's upgrade.

## 8. Completion report

Not started.

## 9. Progress log

- 2026-10-19: Planned with Michael: framework review (Astro stays) and scope. Verified on production that day:
  - Michael's account is on `SITES` with no site.
  - The `canopy-website` Coolify app deploys on push through the GitHub App webhook (a webhook deploy for each push on 2026-10-18 in Coolify's deployment history), though the repo's docs say there is no webhook.
  - `canopy-website-dev` still deploys `feat/new-tabs`.

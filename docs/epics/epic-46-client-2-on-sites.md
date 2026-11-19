# Epic 46: Client 2 on Sites

**Status:** In progress. 4.1 to 4.5 done, the site linked, and acceptance passed, the phone check last, in device emulation on 2026-11-19: client2.example has served `client2` `main` at `95b1c00` from the Dockerfile on both boxes since 2026-11-17. Michael settled the featured services (section 6); the rest of section 7 is still his, and the build took its conservative side: no `tokens.json`, the share image and the three dashes left as they are. The eval passes: 26 of 27 on 2026-11-18, and H9, which had failed on a contract bug, on its rerun once portal 5.23.0 took contract 0.7.1 to production. The test requests are cleared. Next: the claim link.
**Phase:** 1's Client 2 migration (`docs/canopy-sites/ROADMAP.md`, E46 with H1 to H3), item 10 of "The MVP"
**Predecessor:** Epic 42 (the test site on Sites), the pattern; Epic 40 (Client 1 on Sites), the worked example
**Successor:** the owner's claim; E55's first step (her request form in place of Square's booking); Epic 56 (Services), which gives her menu a tab

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/epics/epic-42-test-site-on-sites.md` and `docs/epics/epic-40-client1-on-sites.md` (4.5 to 4.8 and the progress logs), `docs/canopy-sites/PRD.md` (D29 to D50, D51, D56, D65, section 4.4), `docs/canopy-sites/ROADMAP.md` ("The MVP", E46, H1 to H3, E55), and `packages/site-contract/README.md`. In `client2`: `CLAUDE.md`. In `client1` and `test-site`, the references for the repo side: `src/lib/content.ts`, `src/lib/design.ts`, `src/lib/portal.ts`, `Dockerfile`, `nginx.conf`, `SITE_GUIDE.md`. In `canopy-demo-site` (read `origin/main`): `src/lib/content.ts` and the templates, which already render this site from content files on an early contract. In Nextcloud (Canopy Sites collective): **Sites Onboarding Runbook**, **Site Build Checklist**, **Quick Edit Eval Runbook**.

---

## 1. Goal

the owner changes a price, her hours, a policy, or a line about herself from her phone, previews it, and publishes it to client2.example, from an account she claimed with a link.

Client 2 is the site the demo was copied from (PRD D23), and the third client site to go onto Sites, after Client 1 and the test site: three pages, a nested service menu, a gallery, no form. Its repo is where the others started (Astro 5, nixpacks, its copy typed into the templates, checked 2026-11-17).

The site goes onto Sites as it reads today. the owner's copy moves word for word, by script, and every page's visible text is compared before and after. Changing it is hers once the site is there. One thing changes: the home page's four featured services show the menu's names and prices (section 6).

## 2. Scope

### In

- **Builds that match (4.1)**: ROADMAP H1. Astro 7, Node 24, a Dockerfile and `nginx.conf` like Client 1's.
- **The repo on the contract (4.2)**: ROADMAP H2 and the runbook's section 2. The contract at the version `main` runs, content in `src/content`, marks, portal flags, CORS, and Umami recording what it records today.
- **The site guide (4.3)**, with limits measured from the rendered pages and every piece of text that art is drawn against listed (PRD D56).
- **Proof (4.4)**: the runbook's section 2 step 9, and every page compared against client2.example at 360 and 1440 px.
- **The switch (4.5)**: the branch onto `main` with both boxes' Coolify copies moved to the Dockerfile. Michael's go-ahead first.
- **Link, acceptance, eval, claim (4.6)**: the runbook's sections 4 to 6, with a Client 2 set added to the Quick Edit Eval Runbook. Michael's go-ahead at each of linking and the claim link.
- **Docs (4.7)**: section 10.

### Out

| Not here | Why / where |
|---|---|
| `tokens.json` (ROADMAP H3) | Neither Client 1 nor the test site has one, and the contract has no `tokens` collection. Not built; section 7, item 1 |
| The Square booking links and the card-on-file lines | E55's first step (PRD D65). Here the four links become one value, `site.contact.bookingUrl`, still Square's address, and the three card-on-file lines move as the owner wrote them |
| Copy and price changes | the owner's once the site is on Sites, or Canopy's through the Editor. The featured services' five strings (section 6) are the one place the conversion changes what a visitor reads |
| A Services tab, and adding a service or changing a featured one on the canvas | Epic 56, which also marks the site's lists. Until then the owner edits a name, description, or price in place and asks Quick Edit for the rest |
| Announcements | Nothing rebuilds the site nightly before E36, and Client 1 and the test site settled the same way. The demo's banner component is not brought over |
| New photos, and adding, removing, or reordering gallery photos | E50. The six photos stay, in today's order |
| The site kit (E41) | The site copies Client 1's plumbing, as the test site did, and moves onto the kit with the others |
| Her Report Profile (Nextcloud, Monthly Reports) | Rewritten with E55's first step. Every analytics event keeps its name here, so the report reads as before |
| The welcome video | E39 |

## 3. Order

- **This session**: this doc; then, once sections 2, 3, and 7 are approved, a `canopy-sites` branch in `client2` holding 4.1, then 4.2 with 4.3 alongside it (its limits are measured from 4.2's pages), then 4.4. Small commits, nothing pushed. It stops there, before anything reaches the live site.
- 4.1's commits come first on the branch and build by themselves, so the switch could go in two steps (Astro 7 and the Dockerfile, then the content). One step is the plan, as the test site went.
- **4.5, with Michael's go-ahead**: the branch is pushed, both boxes' Coolify copies move to the Dockerfile, and `main` is fast-forwarded. That push is the first webhook deploy on record for this app on Webber (4.1), so it is watched, and it proves that a publish, which is a push, deploys.
- **4.6, with Michael's go-ahead**: the repo joins the Canopy Sites App (his browser), then Link a site, acceptance acting as the owner, the eval, and the claim link.
- **E55's first step** has no place in this order, because its date is the owner's (ROADMAP, "The MVP"). If it comes before 4.5 it edits the templates on `main` and this branch takes it in. After 4.5 it is one content value and three lines.

About three sessions: this one; the switch with linking and acceptance; the eval with the claim.

## 4. Requirements

### 4.1 Builds that match (`client2`, ROADMAP H1)

As of 2026-11-17 the repo is on Astro `^5.17.1`, and Coolify app `r8kgko4og008ss0w0oc84okc` builds it with nixpacks on both boxes from `Canopy-Digital-Services/client2` through the org's `canopyds-github` App, serving `/dist` from `nginx:alpine`. It carries two build variables, `NIXPACKS_NODE_VERSION` and `PUBLIC_UMAMI_DOMAINS`. Webber's copy has a health check and Fox's has none. Webber's Coolify holds no deployment record for the app: the last commit to `main` is from 2026-04-29, before Webber's rebuild on 2026-07-16, so a webhook deploy of this app has never been seen there.

1. Astro 7 on Client 1's line, with Tailwind and the sitemap integration brought up beside it, `@astrojs/check` and TypeScript for `npm run check`, and Node 24.
2. A Dockerfile like Client 1's (`node:24-slim`, `npm ci --ignore-scripts`, `nginx:alpine`) and a `.dockerignore`.
3. `nginx.conf` like Client 1's, with `Access-Control-Allow-Origin: *` on every file. Addresses answer as they do today: `/services` and `/services/` both serve the page (section 6).
4. Tailwind reads `src/` only (`@import "tailwindcss" source("..");`), so the builder's CSS and the image's are one file under one name.
5. No content or design change: the three pages match the live site.

### 4.2 The repo on the contract (`client2`, ROADMAP H2)

The runbook's section 2, the test site' 4.2 as the pattern. The templates and `content.ts` start from `canopy-demo-site` (`origin/main`, `6bcf837`), which renders this site from content files on contract 0.2. The content does not come from the demo, whose copy has been edited since (its haircut costs $90): a script writes it from this repo's templates and `services.json` as they read today.

1. **The contract** at 0.7.0 from its release tarball, the version `packages/site-contract/package.json` holds on `main` (checked 2026-11-17).
2. **Content in `src/content/*.json`**, read through one `content.ts` that runs `validateContent`, with what is Canopy's in `design.ts`:
   - `site.json`: the name, a description (today's structured-data description), the address as the site states it (city, state, country; no street), the Square address as `bookingUrl`, the hours as structured days and times, and two socials (Instagram with its handle, and the Google Maps listing). No phone or email: the site shows neither.
   - `services.json`: the menu's seven categories as they are, with an id on every section, group, and service. Starting prices and durations are left out: no page renders either, and three of the starting prices are empty, which the contract refuses. The four descriptions the home page shows move onto their menu entries (Haircut, Full Color, Extensions for Volume, Full Face).
   - `reviews.json`: the three reviews, word for word.
   - `gallery.json`: the six photos, already under `src/assets`, with today's alt text.
   - `pages.json`: the three pages, each with today's SEO title and description. Home: the hero's line and its View Services button, each section's heading, the four featured services by id with their View Full Menu button, the About section's quote and three paragraphs, and the contact line. Services: the page heading and intro, the pricing note's heading and four lines, and the booking heading. Policies: the page heading and intro, the five policies as a heading and paragraphs each, and the booking heading. The three card-on-file lines are among these, as written.
   - **One source per fact**: the home page's four featured rows render the menu's entries (section 6); the four booking buttons render from `bookingUrl`; the hours render into the contact section and the structured data; the address into the contact section and the structured data; the Instagram link into the header, the phone menu, the contact section, and the structured data.
   - **What stays in the templates, Canopy's**: the logo, the wordmark, and the name in the hero; navigation; eyebrows; the booking buttons' labels, which the contract has no field for; the labels on the contact facts; "By booking, you agree to our salon policies." (a sentence with a link inside it, the runbook's rule); the footer; the hero and portrait photos with their alt text; the quotation marks and attribution dash around a review; and the structured data's fixed parts (the business's name as search shows it, and the owner as its stylist).
3. **Marks** on the hero's line, every section and page heading, the About quote and paragraphs, the contact line, each review and its author, the hours, the page intros, the pricing note's lines, each policy's heading and paragraphs, and on the menu each category's name and description, each section's and group's name, and each service's name and price, with its description where a page shows one. A featured row carries its menu entry's addresses, so an edit in either place changes both. Not on the name (4.3), the address (locked), eyebrows, buttons, labels, navigation, the footer, or SEO.
4. **Portal flags.** Under `data-canopy-editor`: no logo intro, and every category and nested section of the menu open, since a closed one hides marked text. The site has no form, so no placeholder.
5. **CORS**: 4.1's `nginx.conf`, the fonts included.
6. **Umami** records what it records today: the same script and website id (`00000000-0000-4000-8000-000000000002`), every `data-umami-event` name and location, and the two accordion events. `data-domains` keeps today's value, `client2.example,www.client2.example`, as a constant in `design.ts` where today it is Coolify's `PUBLIC_UMAMI_DOMAINS` build variable: the builder builds with no environment, and a build without the allowlist would record the canvas as visits.
7. **The repo's docs** in the same commits: `CLAUDE.md` rewritten for where content and design now live, pointing at `SITE_GUIDE.md`, with how the site deploys; `README.md` (the Astro starter's text) replaced by a few lines; `src/data/` deleted.

### 4.3 The site guide (`client2/SITE_GUIDE.md`)

Front matter, measured the way Client 1's and the test site' were:

- `limits` for every marked field, at 360 and 1440 px, with every field at its limit at once overflowing nothing.
- `counts` for the reviews, the featured services, and the menu's lists, checked rendered at that count.
- `avoid` from the owner's copy as it is. Never `em-dash`.
- `refuse`: none known. Michael names any.

Prose, only what changes what Quick Edit does:

- What the business is: the owner's one-person salon in El Dorado Hills, California.
- What the site doesn't carry: a phone number, an email, or a street address. Clients reach the owner through Instagram and the booking button.
- Exact names, from the content as it reads.
- Where facts repeat: the card on file, in three places; the 24 hours in the cancellation policy; what the owner specializes in, in the hero's line and the About paragraphs.
- What Canopy handles: navigation, buttons, the booking link, page titles and search text, the location, photos and the gallery, the design, and every piece of text that art is drawn against. Read from the templates, that is one: **the business's name**, whose ampersand is the logo mark in the hero and in the header's wordmark, and where the intro animation lands. 4.3 checks the rendered pages for any other and lists each one.

### 4.4 Proof

- The runbook's step 9: a violation in a content file fails the build; the builder's build (`npm ci --ignore-scripts && npm run build` from a clean checkout with no environment) and the Docker image of one commit list the same `_astro/` files; each marked element's text equals its content value exactly, and none falls on a field Canopy owns.
- The three pages against client2.example in headless Chromium at 360 and 1440 px: the visible text of every page equal, closed menu panels included, apart from section 6's five strings on the home page; titles, descriptions, canonicals, share tags, and structured data equal; the pixels equal apart from differences listed in the progress log with their cause.
- `npm run check` clean.
- The image sends `Access-Control-Allow-Origin: *` on pages, `_astro` files, and fonts.
- Loaded the way the canvas loads a page (a sandboxed frame, a `<base>` at the site, each flag): styled, no script errors, no intro and the whole menu open under the editor flag.

### 4.5 The switch

Michael's go-ahead first: it changes the Coolify app on both boxes and deploys the live site.

1. Push the branch.
2. On both boxes' copies of the app: the `dockerfile` build pack, port 80, the same health check on both, and `NIXPACKS_NODE_VERSION` and `PUBLIC_UMAMI_DOMAINS` gone.
3. Fast-forward `main`. The webhook's deploy is watched to the end; Fox builds the same commit that night.
4. The live pages equal a local build of that commit, the live `_astro` names equal the builder's build, and a real visit lands in Umami: the tag being in the HTML is not the check.

### 4.6 Link, acceptance, eval, claim

- The repo on the Canopy Sites App's installation (runbook section 4, step 1), Michael's browser step.
- Link a site: the owner's email and name (section 6), "Client 2", repo `client2`, `client2.example` and `www.client2.example`, the Umami id in 4.2.
- On the site page, locks beside the contact fields: `site/name` (art is drawn against it, PRD D56), `site/description` (SEO), and `site/contact/bookingUrl` until E55's form replaces Square's address. Fixed lists: `gallery`, whose grid places five photos on a desktop and six on a phone by position, and whatever 4.3 finds the templates place entry by entry.
- Acting as the owner: the runbook's section 5. The publish round trip uses one small edit on a quiet page and puts it back.
- The eval: the shared set and a Client 2 set, written from the guide and added to the runbook. Its cases are drafted with 4.3.
- The claim link, with Michael's go-ahead.

### 4.7 Docs

Section 10, each in the commit that changes the behavior.

## 5. Acceptance

- [x] A push to `main` deploys the site through the Dockerfile on Webber, and Fox builds the same commit.
- [x] The three pages match the live site at 360 and 1440 px, with every page's visible text equal apart from the five featured strings (section 6) and whatever section 7's answers change.
- [x] A content violation fails the build; the builder's build and the image name the same `_astro` files; pages, `_astro` files, and fonts send `Access-Control-Allow-Origin: *`.
- [x] Every booking button reads its address from `site.contact.bookingUrl`, and the three card-on-file lines read as the owner wrote them.
- [ ] Umami records a visit and a booking tap from client2.example, and nothing from the canvas.
- [x] The site guide lists every piece of text that art is drawn against, each locked on the site's row and unmarked on the canvas.
- [x] The runbook's section 5 passes acting as the client, with no CORS or script errors on the canvas.
- [x] The eval passes, shared set and the Client 2 set.
- [ ] the owner claims the account and publishes an edit that shows on client2.example.

## 6. Decisions

### Michael (2026-11-17, the handoff)

- **The site goes on as it reads today.** the owner's copy moves word for word, by script, and every page's visible text is compared before and after.
- **Booking stays as it is.** The Square link becomes `site.contact.bookingUrl`, and the card-on-file lines stay her words. Replacing them is E55.
- **`tokens.json` is not built here**: no precedent on Client 1 or the test site. Section 7, item 1.
- **Text that art is drawn against is locked and unmarked** (PRD D56), each one listed in the site guide.
- **The contract at the version `main` runs**, and the demo's templates and content shape as the starting point, with the content from this repo.
- **A stop before** merging to `main`, changing the Coolify app on either box, linking the site, or anything outside this doc's scope.

### Michael (2026-11-17, on the featured services)

- **Services are one list, with a feature of its own** (Epic 56), never a rule for one page. Here that means the home page's four featured rows are the menu's entries, as the contract's featured services are. Five strings on the home page change to the menu's: "Standard Haircut" to "Haircut", "from $170" to "$170", "Extensions" to "Extensions for Volume", "from $150" to "$150", and "Full Face Wax" to "Full Face". The four descriptions move onto their menu entries and show on the home page only, as today. The Extensions row's description ("Hand-painted highlights, all over brightness") describes highlights; it moves as written, and is the owner's to change.

### Michael (2026-11-17, at linking)

- **the owner signs in with her personal email**, which Michael gave, and her name on the account is the owner. The address stays out of this public repo; it is on the account in the portal.
- **Michael authorized adding the repo to the Canopy Sites App.** It went through his signed-in browser: the GitHub CLI's token can't change an app installation.

### Agent calls inside scope

- **The analytics allowlist is a constant.** Same rendered tag as today; a build variable can't reach the builder's build.
- **No redirect on a trailing slash.** Client 1's `nginx.conf` sends `/classes/` to `/classes`. Every canonical, share address, and sitemap entry on this site names the slash form today (checked 2026-11-17), and SEO isn't changed in this epic, so both forms keep answering, as the test site' config has it.
- **Starting prices and durations are left out of the menu.** Nothing renders them, and a value an owner can change through Quick Edit but never see is worse than none.
- **Buttons go in `pages.json` where the contract has a place for one** (the hero's and a section's), as the demo has them. They stay Canopy's there, and are already content when button text becomes an owner's edit (ROADMAP E57). The booking buttons' labels and the menu's items have no field in the contract and stay in the templates. Eyebrows stay in the templates too, as on Client 1 and the test site.
- **About is page copy, not `team`.** It is one section about the owner, and nothing else on the site lists people. Her name and job title in the structured data stay in `design.ts`.
- **One Instagram address.** The three links say `instagram.com` and the structured data `www.instagram.com`; with one source, the links take the `www` form. No visible text changes.
- **CSS is built for Vite's baseline browser list** (`build.cssTarget`). Astro 7 builds for `esnext`, and its minifier then drops every vendor prefix: the header's blur lost `-webkit-backdrop-filter`, the only form Safari before 18 reads.
- **A price is held at today's longest**, 21 characters ("Consultation required"). On a phone that already fills its share of a row, and any service can be featured, where the row is tighter still.
- **The featured and reviews sections are left out when empty.** the owner can remove every review or unfeature every service, and a heading over nothing looks broken.
- **The menu has no branch for durations.** The old template had one that no service used; with durations out of the content it would be a field an owner could fill and never measured.
- **Analytics events are named by constants**, never by a label: the demo's templates name some by the button's text, which would rename an event when a label changes.

## 7. Open

For Michael. Items 2 and 3 change what 4.2 builds; item 1 changes this doc and the ROADMAP.

1. **`tokens.json` (H3).** Its second half is already true: the fonts are self-hosted from Fontsource. Its first half would generate the seven colors and two font stacks that `src/styles/global.css` already holds in one `@theme` block. Nothing reads a `tokens.json`: the contract has no `tokens` collection, no tool exposes design (D29), E41's site kit doesn't list it, and two sites went onto Sites without one. Recommended: drop H3, treat the `@theme` block as the site's tokens, and take `tokens` out of PRD section 4.4 and the ROADMAP (H3, C1's list) in the same commit. The alternative is to leave H3 on the ROADMAP for E41 to settle for every site at once.
2. **The share image is missing.** `og:image` and `twitter:image` name `/images/the owner-hero.jpg`, which answers 404 on the live site (checked 2026-11-17): the photos live under `src/assets` and nothing is at that address. A link to the site shares with no picture, which the Site Build Checklist's first item exists to prevent. Recommended: fix it in 4.2, pointing both tags at a 1200 by 630 rendition of the hero photo. It is Canopy's (SEO, D45), nothing on the pages changes, and otherwise 4.4 proves a broken tag was carried over faithfully.
3. **Three dashes in text that is Canopy's, not the owner's**: the em dash before each review's author, the em dash in the share image's alt text, and the en dash between the opening and closing times. Canopy's rule is none. Recommended: keep them through this epic, so the before-and-after text comparison stays exact, and take them out in a later commit of their own. They would be the only dashes in files this epic writes.

## 8. Completion report

## 9. Progress log

- 2026-11-17: Drafted from Michael's handoff and a read of the repo, the live site, both boxes' Coolify copies (read-only), the demo's `origin/main`, and Client 1's and the test site' repos. Found on the way: the share image answers 404; the analytics allowlist comes from a Coolify build variable; Fox's copy of the app has no health check; Webber holds no deployment record for the app; and the home page's featured services differ from the menu in five strings.
- 2026-11-17 (later): Michael on the featured services: no rule for one page; services are one list with a feature of its own. Epic 56 (Services) drafted from that, and the featured rows here become the menu's entries (section 6), which left section 7. Michael also means button and menu text to become editable on the canvas (Epic 56's action layer), so the two buttons the contract can hold move into `pages.json` now.
- 2026-11-17 (later): 4.1 to 4.4 built on `client2` branch `canopy-sites` (`95b1c00`, ten commits, not pushed), checked in headless Chromium against client2.example with analytics blocked.
  - **4.1.** Astro 7.4.12, Tailwind 4.3.5, Node 24, the Dockerfile and `nginx.conf`. Astro 7 changed the pages in two ways the comparison caught: its default whitespace handling closed up the wordmark (`compressHTML: true` restores Astro 5's), and its `esnext` CSS target cost the header its blur (section 6). With both set, the three pages equal the live site to the pixel at 360 and 1440 px, with the same text, head tags, structured data, links, and events.
  - **4.2.** Contract 0.7.0. The content was written by a script from the built pages and the old `services.json`: 43 services, 3 reviews, 6 photos, the three pages' copy. 150 fields are marked (316 elements); each one's text equals its content value exactly, and none is a field Canopy owns or locks. The analytics tag renders as the live one does.
  - **4.3.** `SITE_GUIDE.md`: 34 limits measured at both widths, 15 counts, and `avoid` of `emoji`, `all-caps`, and `exclamations`, none of which the owner's copy uses. A build with every limited field at its limit (1,008 of them) and every list at its count overflows nothing with the whole menu open, and one with no reviews and nothing featured drops those two sections. Today's content passes its own guide. Read from the rendered pages, the name is the only text art is drawn against.
  - **4.4.** Services and policies equal the live site to the pixel at both widths, text included. The home page differs in the featured block alone: the five strings, and 20 px less height on a phone, where a shorter price lets a description wrap less. Photos keep their file names and were re-encoded by a newer sharp, a difference below what the pixel comparison counts. A violation in a content file fails the build with its message. The builder's build (a clean clone, `npm ci --ignore-scripts && npm run build`, no environment) and the Docker image name the same 83 `_astro` files. Pages, `_astro` files, fonts, and the logo send `Access-Control-Allow-Origin: *`; `/services` and `/services/` both answer. `npm run check` is clean, where `main` had 35 errors.
  - **Found by loading each page as the canvas does** (a sandboxed srcdoc frame, a `<base>` at the site, each flag): the intro script read `sessionStorage`, which throws in an opaque origin, so under the preview flag it stopped and left its overlay over the page. Guarded, as the demo's is. Both flags then load styled, with fonts from the site and no console errors; the editor flag shows no intro and all 13 menu panels open.
  - The demo's header has the same blur and no CSS target; not checked.
- 2026-11-17 (later): 4.5 done, with Michael's go-ahead after he clicked through the branch's image locally.
  - **Coolify, both boxes** (app `r8kgko4og008ss0w0oc84okc`, through the API): the `dockerfile` build pack, `is_static` off, port 80, Coolify's health check on `/` (Fox's copy had none), and `NIXPACKS_NODE_VERSION` and `PUBLIC_UMAMI_DOMAINS` deleted. None of it deployed by itself.
  - **The switch.** `main` was fast-forwarded to `95b1c00` from the branch, pushed at 23:12 UTC. GitHub's webhook queued Webber's deploy within a second, the first deployment of this app on Webber's record, so a publish (a push) is proven to deploy. It built from the Dockerfile, passed its health check, and swapped with a rolling update at 23:13. Fox's copy was deployed through the API at once rather than waiting for its 04:30 UTC redeploy, and finished at 23:14, healthy. Both boxes serve the same pages and assets, checked through each box's own Traefik.
  - **Live checks.** The three pages equal the local image of `95b1c00` to the pixel at 360 and 1440 px, with the same text, head tags, links, and events; all 150 marked fields check against the content. All 83 of the builder-style build's `_astro` files answer 200 on client2.example, sent with `Access-Control-Allow-Origin: *`. One real page view, from a headless browser presenting as desktop Chrome and clicking nothing, reached Umami as a pageview on `client2.example` at 23:18; no booking tap was made, so that half of acceptance's Umami item waits for a real one.
  - **Found:** Client 1's copy on Fox has no health check while Webber's has one, against the runbook's section 3; the test site has none on either box. Not changed here.
  - The Sites Onboarding Runbook (section 2, steps 1 and 9) and the Coolify page's open item on webhooks were corrected the same day.
- 2026-11-17 (later): Linked, with Michael's go-ahead, through his browser (Claude in Chrome); the GitHub CLI's token is refused by the installation API (403, "contact an Organization Owner"), and GitHub asked for his passkey (sudo mode) before the change.
  - **The App.** `client2` joined the Canopy Sites App's installation, which stays on selected repositories (five now).
  - **Link a site** created the owner's Sites account (Pacific time) and the site `client2` (`client2.example`, `www.client2.example`, the Umami id), detected contract 0.7.0, and its first build and publish succeeded, committing nothing (`main` still `95b1c00`). The site page's Stats card reads her Umami website.
  - **Locks and fixed lists.** `site/name`, `site/description`, and `site/contact/bookingUrl` joined the three contact locks; `gallery` is a fixed list. Both read back after a reload. The featured list isn't fixed: its count (4) is a ceiling, and fewer render (4.3).
  - **Branch protection.** `main` is unprotected, and rulesets aren't available to the org's private repos on its plan, so nothing refuses the builder's push.
  - Left in 4.6: acceptance acting as the owner (its publish round trip deploys the live site twice), the Client 2 eval set and its run, clearing the test requests, and the claim link.
- 2026-11-17 (later): Acceptance (runbook section 5) acting as the owner, with Michael's go-ahead, in Claude in Chrome on his session. Passed:
  - Quick Edit lists Home, Services, and Salon Policies; its examples come from her content ("Raise the Haircut price to $90", "We're open until 6:00 PM on Saturdays now"); View site opens `https://client2.example`.
  - The canvas renders the site styled, with no intro, and the console shows React's #418 alone, as on Client 1, with no CORS error. Marked: the hero line, headings, the featured rows' names, descriptions, and prices, and the policies' copy; unmarked: the name, navigation, eyebrows, buttons, photos, and the footer. The page picker and the site's own links move the canvas.
  - A featured price opened at "3 of 21 characters" (the guide's limit); typing past it showed "6 characters too many" with the overflow marked and Done disabled; Cancel put `$45` back and saved nothing.
  - An in-place edit (the Policies booking heading, "Come see me" to "Come see me soon") showed as typed and saved; the chrome showed Unpublished changes, Discard, and Preview. The preview opened on the changed page, filled its tab with the banner above and "Previewing unpublished changes" below, showed the edit unmarked, and the footer's Services link moved it to `/services`.
  - Publish answered "Published. It will be live on client2.example in a few minutes." Commit `bf1ad14`, authored by Michael, changed that one line of `pages.json`; Webber's webhook deployed it in about 40 seconds and the live page read "Come see me soon". Put back the same way as `eda3872`, deployed and live; `src/content` on `main` is again identical to `95b1c00`'s. Quick Edit's Recently published lists both, under Michael's email.
  - Nothing left unpublished; Stop returned to the site page. Michael's own account gets a 404 on her preview link, and with no session it redirects to `/login` (the canvas route answers 404).
- **Not run:** the phone check (Michael's phone), and the refusals through Quick Edit with their card. Quick Edit answered "couldn't reach the model just now" twice; the production portal's log shows `quick_edit_api_error` 401 `invalid x-api-key` from the Claude API. The container (started 23:31 UTC, 5.22.0) holds a well-formed key, so the key itself has been revoked or deleted. Quick Edit is down on every site until Michael sets a new `ANTHROPIC_API_KEY` on the production app and redeploys; dev likely shares the cause. No request was sent, so there is nothing to decline or clear.
- 2026-11-18: Michael replaced the production portal's Claude API key: a new key that never expires, scoped to one workspace, since the portal sends no `anthropic-workspace-id` header and an organization-scoped key would fail every request with a 400 (`new Anthropic()` in `apps/portal/src/lib/quick-edit/index.ts`). The Console can't extend a key's expiry, only issue a new one, which is how the 30-day key lapsed unnoticed. After the redeploy the Claude API answers 200 to the key from inside the portal container. The dev portal has no key set, and Fox's copies of both portal apps are stopped, so neither needs it now.
- 2026-11-18: Acceptance's Quick Edit item passed acting as the owner. Asked to rename the business, Quick Edit said Canopy handles the name "because the logo and the header art are built around it" and drafted a card; sent, it answered "Sent to Michael. You can text him if you need it sooner." and the request showed on Operator → Requests as sent while acting, so nobody was emailed, and was declined there. Asked to change the Services page's title, it said Canopy handles page titles, drafted a card, and offered to change the visible heading instead; Not now filed nothing. Nothing was left unpublished, and Stop returned to the site page. The one test request is now in the owner's Sent list, to clear before the claim link (the runbook's section 6, step 2).
- 2026-11-18: The Quick Edit eval, acting as the owner: the shared set and a Client 2 set (H1 to H10, written from the guide and added to the Quick Edit Eval Runbook), 26 of 27 (report "Eval - Client 2 2026-11-18" under the runbook). S9, S10, and S18 are acceptance's cases; S14 doesn't apply (the guide refuses nothing). Every draft was discarded, nothing was published, and no draft is pending.
  - **H9 fails, on a contract bug:** asked to feature the balayage in place of the full face wax, Quick Edit said "choosing which services appear on the home page is handled by Canopy" and offered the card. The tool refused it: each entry of a section's `serviceIds` is the contract's `Id` type, flagged as Canopy's, so `laneViolations` refuses any change to a featured list on every site ("ID is Canopy's to change" at `pages/home/sections/featured/serviceIds/3`, reproduced against 0.7.0). The fix is a reference type for those entries without the flag, in canopy-sites; Epic 56's Featured list needs it too.
  - **Found:** H6's first attempt showed the owner the builder's raw error, "git fetch exited with 128"; a retry a minute later passed, and neither log recorded it. A builder failure should reach the owner as a plain "try again".
  - Close passes: H1 hedged ("If Haircut is one of the featured services") though the content says it is; H2 removed the two card-only lines at once and asked about the mixed paragraph, which is right for an explicit request, so its pass line was rewritten; S13's Thanksgiving fell on a Thursday she's closed, rerun with a Saturday.
  - Quick Edit also noticed the Extensions for Volume description reads like highlights (section 6). It's the owner's to change.
  - 11 request rows with `actAsId` set are on her site from acceptance and the eval, for the cleanup before the claim link.
- 2026-11-18: With Michael's OK, the 11 help requests on her site, all created while acting on 2026-11-18 (one declined, ten dismissed), were deleted from production by id, in a transaction that checked the count first. None are left on the site, so her Sent to Michael list and Operator → Requests start empty (the runbook's section 6, step 2).
- 2026-11-18 (later): H9's contract bug is fixed in contract 0.7.1 on canopy-sites `dev`: each entry of a section's `serviceIds` is now a reference, the owner's to choose, without the `canopy` flag (Epic 56's progress log has the detail). Run against this site's content with the locks and fixed list this log records, H9's edit (`full-face` out, `full-highlight-balayage` in) gives no lane violation and passes validation. Only the portal's tool layer checks the lane, so this site stays on 0.7.0 and nothing in `client2` changes; H9 is rerun, acting as the owner, once a portal release with 0.7.1 is live on production.
- 2026-11-18 (later): Portal 5.23.0 took contract 0.7.1 to production (PR #66, `main` at `74f71a3`). The portal's container, started 00:24 UTC on 2026-11-19, holds 0.7.1 with the reference type in its build. H9 can be rerun now; it has not been.
- 2026-11-19: H9 passes on its rerun, acting as the owner on production with Michael's go-ahead (report "Eval - Client 2 2026-11-19 (5.23.0)" under the runbook, and its run log). Quick Edit swapped Full Face for Full Highlight / Balayage in "My personal favorites", said the row shows just the name and $350 because the balayage has no description, and asked for one; no request card. The draft's build shows the balayage fourth, in Full Face's place, with every other marked field on the home page, and all of the services and policies pages, equal to the live site's. The draft was discarded, nothing was published, and the site was left with no draft and no request. With the 26 that passed on 2026-11-18, all 27 cases that apply pass; the other cases weren't rerun on 5.23.0.
- 2026-11-19: Umami since the switch (2026-11-17 23:12 UTC to 2026-11-19 15:30 UTC): one page view, on `client2.example`, the check visit in 4.5, and no other hostname, so the canvas and preview loads of acceptance and the eval recorded nothing. No booking tap yet; acceptance's Umami item waits on a real one. The phone check couldn't be stood in for: the connected browser wouldn't resize below its maximized width, and the item is a phone's anyway. The local test image and container from 4.4 are removed.
- 2026-11-19 (later): The phone check passed in device emulation, as Michael suggested: the connected browser's DevTools as a Pixel 10, 400 by 909 CSS pixels at 2x with a phone's user agent, acting as the owner with his go-ahead. Quick Edit changed the gallery heading ("I like your look..." to "Recent work") and built its preview, which opened in the same tab and filled the screen: the acting banner above (64 px, there only while acting), the site in a 400 by 741 frame, and "Previewing unpublished changes" with Publish along the bottom (56 px). The intro settled the logo into the header, "Recent work" showed under Portfolio, and neither the page nor the site in its frame scrolls sideways. The draft was discarded, nothing was published, Stop returned to the site page with no draft and no open request, and the live site still reads "I like your look...". Emulation lays the page out as a phone does but runs the desktop browser's engine; a phone's own browser first meets the preview when the owner makes her first edit (the last acceptance item).

## 10. Docs this makes stale

Each lands with the change that causes it, never in a later pass.

**This repo**: `docs/epics/README.md` (this epic); `docs/canopy-sites/ROADMAP.md` (the paragraph under Sequencing that says the repo was never converted, "The MVP" item 10, E46's brief, H1 to H3, and E55's first step once `bookingUrl` exists); `docs/canopy-sites/PRD.md` section 4.4 and the ROADMAP's C1, if section 7's item 1 drops `tokens`.

**client2**: `CLAUDE.md`, `README.md`, a new `SITE_GUIDE.md` (4.2 item 7, 4.3).

**Nextcloud**

- **Sites Onboarding Runbook** (Canopy Sites collective): whatever this run corrects, including what the earlier sites didn't meet: an analytics allowlist that came from a build variable, and an app with no deploy on record.
- **Quick Edit Eval Runbook**: the Client 2 set, and the run's report and log line.
- **Engineering collective**: any page that names this app's build pack, at 4.5.

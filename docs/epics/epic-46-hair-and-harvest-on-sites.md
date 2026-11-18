# Epic 46: Hair & Harvest on Sites

**Status:** In progress. 4.1 to 4.5 done, and the site linked (4.6's first part): hairandharvest.com has served `hair-and-harvest` `main` at `95b1c00` from the Dockerfile on both boxes since 2026-11-17. Michael settled the featured services (section 6); the rest of section 7 is still his, and the build took its conservative side: no `tokens.json`, the share image and the three dashes left as they are. Next is acceptance acting as Sierra, whose publish round trip deploys the live site twice, on his go-ahead.
**Phase:** 1's Hair & Harvest migration (`docs/canopy-sites/ROADMAP.md`, E46 with H1 to H3), item 10 of "The MVP"
**Predecessor:** Epic 42 (Fur-Ever Friends on Sites), the pattern; Epic 40 (Toro Z on Sites), the worked example
**Successor:** Sierra's claim; E55's first step (her request form in place of Square's booking); Epic 56 (Services), which gives her menu a tab

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/epics/epic-42-fur-ever-friends-on-sites.md` and `docs/epics/epic-40-toroz-on-sites.md` (4.5 to 4.8 and the progress logs), `docs/canopy-sites/PRD.md` (D29 to D50, D51, D56, D65, section 4.4), `docs/canopy-sites/ROADMAP.md` ("The MVP", E46, H1 to H3, E55), and `packages/site-contract/README.md`. In `hair-and-harvest`: `CLAUDE.md`. In `toroz` and `fur-ever-friends`, the references for the repo side: `src/lib/content.ts`, `src/lib/design.ts`, `src/lib/portal.ts`, `Dockerfile`, `nginx.conf`, `SITE_GUIDE.md`. In `canopy-demo-site` (read `origin/main`): `src/lib/content.ts` and the templates, which already render this site from content files on an early contract. In Nextcloud (Canopy Sites collective): **Sites Onboarding Runbook**, **Site Build Checklist**, **Quick Edit Eval Runbook**.

---

## 1. Goal

Sierra changes a price, her hours, a policy, or a line about herself from her phone, previews it, and publishes it to hairandharvest.com, from an account she claimed with a link.

Hair & Harvest is the site the demo was copied from (PRD D23), and the third client site to go onto Sites, after Toro Z and Fur-Ever Friends: three pages, a nested service menu, a gallery, no form. Its repo is where the others started (Astro 5, nixpacks, its copy typed into the templates, checked 2026-11-17).

The site goes onto Sites as it reads today. Sierra's copy moves word for word, by script, and every page's visible text is compared before and after. Changing it is hers once the site is there. One thing changes: the home page's four featured services show the menu's names and prices (section 6).

## 2. Scope

### In

- **Builds that match (4.1)**: ROADMAP H1. Astro 7, Node 24, a Dockerfile and `nginx.conf` like Toro Z's.
- **The repo on the contract (4.2)**: ROADMAP H2 and the runbook's section 2. The contract at the version `main` runs, content in `src/content`, marks, portal flags, CORS, and Umami recording what it records today.
- **The site guide (4.3)**, with limits measured from the rendered pages and every piece of text that art is drawn against listed (PRD D56).
- **Proof (4.4)**: the runbook's section 2 step 9, and every page compared against hairandharvest.com at 360 and 1440 px.
- **The switch (4.5)**: the branch onto `main` with both boxes' Coolify copies moved to the Dockerfile. Michael's go-ahead first.
- **Link, acceptance, eval, claim (4.6)**: the runbook's sections 4 to 6, with a Hair & Harvest set added to the Quick Edit Eval Runbook. Michael's go-ahead at each of linking and the claim link.
- **Docs (4.7)**: section 10.

### Out

| Not here | Why / where |
|---|---|
| `tokens.json` (ROADMAP H3) | Neither Toro Z nor Fur-Ever Friends has one, and the contract has no `tokens` collection. Not built; section 7, item 1 |
| The Square booking links and the card-on-file lines | E55's first step (PRD D65). Here the four links become one value, `site.contact.bookingUrl`, still Square's address, and the three card-on-file lines move as Sierra wrote them |
| Copy and price changes | Sierra's once the site is on Sites, or Canopy's through the Editor. The featured services' five strings (section 6) are the one place the conversion changes what a visitor reads |
| A Services tab, and adding a service or changing a featured one on the canvas | Epic 56, which also marks the site's lists. Until then Sierra edits a name, description, or price in place and asks Quick Edit for the rest |
| Announcements | Nothing rebuilds the site nightly before E36, and Toro Z and Fur-Ever Friends settled the same way. The demo's banner component is not brought over |
| New photos, and adding, removing, or reordering gallery photos | E50. The six photos stay, in today's order |
| The site kit (E41) | The site copies Toro Z's plumbing, as Fur-Ever Friends did, and moves onto the kit with the others |
| Her Report Profile (Nextcloud, Monthly Reports) | Rewritten with E55's first step. Every analytics event keeps its name here, so the report reads as before |
| The welcome video | E39 |

## 3. Order

- **This session**: this doc; then, once sections 2, 3, and 7 are approved, a `canopy-sites` branch in `hair-and-harvest` holding 4.1, then 4.2 with 4.3 alongside it (its limits are measured from 4.2's pages), then 4.4. Small commits, nothing pushed. It stops there, before anything reaches the live site.
- 4.1's commits come first on the branch and build by themselves, so the switch could go in two steps (Astro 7 and the Dockerfile, then the content). One step is the plan, as Fur-Ever Friends went.
- **4.5, with Michael's go-ahead**: the branch is pushed, both boxes' Coolify copies move to the Dockerfile, and `main` is fast-forwarded. That push is the first webhook deploy on record for this app on Webber (4.1), so it is watched, and it proves that a publish, which is a push, deploys.
- **4.6, with Michael's go-ahead**: the repo joins the Canopy Sites App (his browser), then Link a site, acceptance acting as Sierra, the eval, and the claim link.
- **E55's first step** has no place in this order, because its date is Sierra's (ROADMAP, "The MVP"). If it comes before 4.5 it edits the templates on `main` and this branch takes it in. After 4.5 it is one content value and three lines.

About three sessions: this one; the switch with linking and acceptance; the eval with the claim.

## 4. Requirements

### 4.1 Builds that match (`hair-and-harvest`, ROADMAP H1)

As of 2026-11-17 the repo is on Astro `^5.17.1`, and Coolify app `r8kgko4og008ss0w0oc84okc` builds it with nixpacks on both boxes from `Canopy-Digital-Services/hair-and-harvest` through the org's `canopyds-github` App, serving `/dist` from `nginx:alpine`. It carries two build variables, `NIXPACKS_NODE_VERSION` and `PUBLIC_UMAMI_DOMAINS`. Webber's copy has a health check and Fox's has none. Webber's Coolify holds no deployment record for the app: the last commit to `main` is from 2026-04-29, before Webber's rebuild on 2026-07-16, so a webhook deploy of this app has never been seen there.

1. Astro 7 on Toro Z's line, with Tailwind and the sitemap integration brought up beside it, `@astrojs/check` and TypeScript for `npm run check`, and Node 24.
2. A Dockerfile like Toro Z's (`node:24-slim`, `npm ci --ignore-scripts`, `nginx:alpine`) and a `.dockerignore`.
3. `nginx.conf` like Toro Z's, with `Access-Control-Allow-Origin: *` on every file. Addresses answer as they do today: `/services` and `/services/` both serve the page (section 6).
4. Tailwind reads `src/` only (`@import "tailwindcss" source("..");`), so the builder's CSS and the image's are one file under one name.
5. No content or design change: the three pages match the live site.

### 4.2 The repo on the contract (`hair-and-harvest`, ROADMAP H2)

The runbook's section 2, Fur-Ever Friends' 4.2 as the pattern. The templates and `content.ts` start from `canopy-demo-site` (`origin/main`, `6bcf837`), which renders this site from content files on contract 0.2. The content does not come from the demo, whose copy has been edited since (its haircut costs $90): a script writes it from this repo's templates and `services.json` as they read today.

1. **The contract** at 0.7.0 from its release tarball, the version `packages/site-contract/package.json` holds on `main` (checked 2026-11-17).
2. **Content in `src/content/*.json`**, read through one `content.ts` that runs `validateContent`, with what is Canopy's in `design.ts`:
   - `site.json`: the name, a description (today's structured-data description), the address as the site states it (city, state, country; no street), the Square address as `bookingUrl`, the hours as structured days and times, and two socials (Instagram with its handle, and the Google Maps listing). No phone or email: the site shows neither.
   - `services.json`: the menu's seven categories as they are, with an id on every section, group, and service. Starting prices and durations are left out: no page renders either, and three of the starting prices are empty, which the contract refuses. The four descriptions the home page shows move onto their menu entries (Haircut, Full Color, Extensions for Volume, Full Face).
   - `reviews.json`: the three reviews, word for word.
   - `gallery.json`: the six photos, already under `src/assets`, with today's alt text.
   - `pages.json`: the three pages, each with today's SEO title and description. Home: the hero's line and its View Services button, each section's heading, the four featured services by id with their View Full Menu button, the About section's quote and three paragraphs, and the contact line. Services: the page heading and intro, the pricing note's heading and four lines, and the booking heading. Policies: the page heading and intro, the five policies as a heading and paragraphs each, and the booking heading. The three card-on-file lines are among these, as written.
   - **One source per fact**: the home page's four featured rows render the menu's entries (section 6); the four booking buttons render from `bookingUrl`; the hours render into the contact section and the structured data; the address into the contact section and the structured data; the Instagram link into the header, the phone menu, the contact section, and the structured data.
   - **What stays in the templates, Canopy's**: the logo, the wordmark, and the name in the hero; navigation; eyebrows; the booking buttons' labels, which the contract has no field for; the labels on the contact facts; "By booking, you agree to our salon policies." (a sentence with a link inside it, the runbook's rule); the footer; the hero and portrait photos with their alt text; the quotation marks and attribution dash around a review; and the structured data's fixed parts (the business's name as search shows it, and Sierra as its stylist).
3. **Marks** on the hero's line, every section and page heading, the About quote and paragraphs, the contact line, each review and its author, the hours, the page intros, the pricing note's lines, each policy's heading and paragraphs, and on the menu each category's name and description, each section's and group's name, and each service's name and price, with its description where a page shows one. A featured row carries its menu entry's addresses, so an edit in either place changes both. Not on the name (4.3), the address (locked), eyebrows, buttons, labels, navigation, the footer, or SEO.
4. **Portal flags.** Under `data-canopy-editor`: no logo intro, and every category and nested section of the menu open, since a closed one hides marked text. The site has no form, so no placeholder.
5. **CORS**: 4.1's `nginx.conf`, the fonts included.
6. **Umami** records what it records today: the same script and website id (`1f6c0e19-b19d-45ea-b9d8-406f5d416b63`), every `data-umami-event` name and location, and the two accordion events. `data-domains` keeps today's value, `hairandharvest.com,www.hairandharvest.com`, as a constant in `design.ts` where today it is Coolify's `PUBLIC_UMAMI_DOMAINS` build variable: the builder builds with no environment, and a build without the allowlist would record the canvas as visits.
7. **The repo's docs** in the same commits: `CLAUDE.md` rewritten for where content and design now live, pointing at `SITE_GUIDE.md`, with how the site deploys; `README.md` (the Astro starter's text) replaced by a few lines; `src/data/` deleted.

### 4.3 The site guide (`hair-and-harvest/SITE_GUIDE.md`)

Front matter, measured the way Toro Z's and Fur-Ever Friends' were:

- `limits` for every marked field, at 360 and 1440 px, with every field at its limit at once overflowing nothing.
- `counts` for the reviews, the featured services, and the menu's lists, checked rendered at that count.
- `avoid` from Sierra's copy as it is. Never `em-dash`.
- `refuse`: none known. Michael names any.

Prose, only what changes what Quick Edit does:

- What the business is: Sierra Harvest's one-person salon in El Dorado Hills, California.
- What the site doesn't carry: a phone number, an email, or a street address. Clients reach Sierra through Instagram and the booking button.
- Exact names, from the content as it reads.
- Where facts repeat: the card on file, in three places; the 24 hours in the cancellation policy; what Sierra specializes in, in the hero's line and the About paragraphs.
- What Canopy handles: navigation, buttons, the booking link, page titles and search text, the location, photos and the gallery, the design, and every piece of text that art is drawn against. Read from the templates, that is one: **the business's name**, whose ampersand is the logo mark in the hero and in the header's wordmark, and where the intro animation lands. 4.3 checks the rendered pages for any other and lists each one.

### 4.4 Proof

- The runbook's step 9: a violation in a content file fails the build; the builder's build (`npm ci --ignore-scripts && npm run build` from a clean checkout with no environment) and the Docker image of one commit list the same `_astro/` files; each marked element's text equals its content value exactly, and none falls on a field Canopy owns.
- The three pages against hairandharvest.com in headless Chromium at 360 and 1440 px: the visible text of every page equal, closed menu panels included, apart from section 6's five strings on the home page; titles, descriptions, canonicals, share tags, and structured data equal; the pixels equal apart from differences listed in the progress log with their cause.
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
- Link a site: Sierra's email and name (section 6), "Hair & Harvest", repo `hair-and-harvest`, `hairandharvest.com` and `www.hairandharvest.com`, the Umami id in 4.2.
- On the site page, locks beside the contact fields: `site/name` (art is drawn against it, PRD D56), `site/description` (SEO), and `site/contact/bookingUrl` until E55's form replaces Square's address. Fixed lists: `gallery`, whose grid places five photos on a desktop and six on a phone by position, and whatever 4.3 finds the templates place entry by entry.
- Acting as Sierra: the runbook's section 5. The publish round trip uses one small edit on a quiet page and puts it back.
- The eval: the shared set and a Hair & Harvest set, written from the guide and added to the runbook. Its cases are drafted with 4.3.
- The claim link, with Michael's go-ahead.

### 4.7 Docs

Section 10, each in the commit that changes the behavior.

## 5. Acceptance

- [x] A push to `main` deploys the site through the Dockerfile on Webber, and Fox builds the same commit.
- [x] The three pages match the live site at 360 and 1440 px, with every page's visible text equal apart from the five featured strings (section 6) and whatever section 7's answers change.
- [x] A content violation fails the build; the builder's build and the image name the same `_astro` files; pages, `_astro` files, and fonts send `Access-Control-Allow-Origin: *`.
- [x] Every booking button reads its address from `site.contact.bookingUrl`, and the three card-on-file lines read as Sierra wrote them.
- [ ] Umami records a visit and a booking tap from hairandharvest.com, and nothing from the canvas.
- [ ] The site guide lists every piece of text that art is drawn against, each locked on the site's row and unmarked on the canvas.
- [ ] The runbook's section 5 passes acting as the client, with no CORS or script errors on the canvas.
- [ ] The eval passes, shared set and the Hair & Harvest set.
- [ ] Sierra claims the account and publishes an edit that shows on hairandharvest.com.

## 6. Decisions

### Michael (2026-11-17, the handoff)

- **The site goes on as it reads today.** Sierra's copy moves word for word, by script, and every page's visible text is compared before and after.
- **Booking stays as it is.** The Square link becomes `site.contact.bookingUrl`, and the card-on-file lines stay her words. Replacing them is E55.
- **`tokens.json` is not built here**: no precedent on Toro Z or Fur-Ever Friends. Section 7, item 1.
- **Text that art is drawn against is locked and unmarked** (PRD D56), each one listed in the site guide.
- **The contract at the version `main` runs**, and the demo's templates and content shape as the starting point, with the content from this repo.
- **A stop before** merging to `main`, changing the Coolify app on either box, linking the site, or anything outside this doc's scope.

### Michael (2026-11-17, on the featured services)

- **Services are one list, with a feature of its own** (Epic 56), never a rule for one page. Here that means the home page's four featured rows are the menu's entries, as the contract's featured services are. Five strings on the home page change to the menu's: "Standard Haircut" to "Haircut", "from $170" to "$170", "Extensions" to "Extensions for Volume", "from $150" to "$150", and "Full Face Wax" to "Full Face". The four descriptions move onto their menu entries and show on the home page only, as today. The Extensions row's description ("Hand-painted highlights, all over brightness") describes highlights; it moves as written, and is Sierra's to change.

### Michael (2026-11-17, at linking)

- **Sierra signs in with her personal email**, which Michael gave, and her name on the account is Sierra Harvest. The address stays out of this public repo; it is on the account in the portal.
- **Michael authorized adding the repo to the Canopy Sites App.** It went through his signed-in browser: the GitHub CLI's token can't change an app installation.

### Agent calls inside scope

- **The analytics allowlist is a constant.** Same rendered tag as today; a build variable can't reach the builder's build.
- **No redirect on a trailing slash.** Toro Z's `nginx.conf` sends `/classes/` to `/classes`. Every canonical, share address, and sitemap entry on this site names the slash form today (checked 2026-11-17), and SEO isn't changed in this epic, so both forms keep answering, as Fur-Ever Friends' config has it.
- **Starting prices and durations are left out of the menu.** Nothing renders them, and a value an owner can change through Quick Edit but never see is worse than none.
- **Buttons go in `pages.json` where the contract has a place for one** (the hero's and a section's), as the demo has them. They stay Canopy's there, and are already content when button text becomes an owner's edit (ROADMAP E57). The booking buttons' labels and the menu's items have no field in the contract and stay in the templates. Eyebrows stay in the templates too, as on Toro Z and Fur-Ever Friends.
- **About is page copy, not `team`.** It is one section about Sierra, and nothing else on the site lists people. Her name and job title in the structured data stay in `design.ts`.
- **One Instagram address.** The three links say `instagram.com` and the structured data `www.instagram.com`; with one source, the links take the `www` form. No visible text changes.
- **CSS is built for Vite's baseline browser list** (`build.cssTarget`). Astro 7 builds for `esnext`, and its minifier then drops every vendor prefix: the header's blur lost `-webkit-backdrop-filter`, the only form Safari before 18 reads.
- **A price is held at today's longest**, 21 characters ("Consultation required"). On a phone that already fills its share of a row, and any service can be featured, where the row is tighter still.
- **The featured and reviews sections are left out when empty.** Sierra can remove every review or unfeature every service, and a heading over nothing looks broken.
- **The menu has no branch for durations.** The old template had one that no service used; with durations out of the content it would be a field an owner could fill and never measured.
- **Analytics events are named by constants**, never by a label: the demo's templates name some by the button's text, which would rename an event when a label changes.

## 7. Open

For Michael. Items 2 and 3 change what 4.2 builds; item 1 changes this doc and the ROADMAP.

1. **`tokens.json` (H3).** Its second half is already true: the fonts are self-hosted from Fontsource. Its first half would generate the seven colors and two font stacks that `src/styles/global.css` already holds in one `@theme` block. Nothing reads a `tokens.json`: the contract has no `tokens` collection, no tool exposes design (D29), E41's site kit doesn't list it, and two sites went onto Sites without one. Recommended: drop H3, treat the `@theme` block as the site's tokens, and take `tokens` out of PRD section 4.4 and the ROADMAP (H3, C1's list) in the same commit. The alternative is to leave H3 on the ROADMAP for E41 to settle for every site at once.
2. **The share image is missing.** `og:image` and `twitter:image` name `/images/sierra-hero.jpg`, which answers 404 on the live site (checked 2026-11-17): the photos live under `src/assets` and nothing is at that address. A link to the site shares with no picture, which the Site Build Checklist's first item exists to prevent. Recommended: fix it in 4.2, pointing both tags at a 1200 by 630 rendition of the hero photo. It is Canopy's (SEO, D45), nothing on the pages changes, and otherwise 4.4 proves a broken tag was carried over faithfully.
3. **Three dashes in text that is Canopy's, not Sierra's**: the em dash before each review's author, the em dash in the share image's alt text, and the en dash between the opening and closing times. Canopy's rule is none. Recommended: keep them through this epic, so the before-and-after text comparison stays exact, and take them out in a later commit of their own. They would be the only dashes in files this epic writes.

## 8. Completion report

## 9. Progress log

- 2026-11-17: Drafted from Michael's handoff and a read of the repo, the live site, both boxes' Coolify copies (read-only), the demo's `origin/main`, and Toro Z's and Fur-Ever Friends' repos. Found on the way: the share image answers 404; the analytics allowlist comes from a Coolify build variable; Fox's copy of the app has no health check; Webber holds no deployment record for the app; and the home page's featured services differ from the menu in five strings.
- 2026-11-17 (later): Michael on the featured services: no rule for one page; services are one list with a feature of its own. Epic 56 (Services) drafted from that, and the featured rows here become the menu's entries (section 6), which left section 7. Michael also means button and menu text to become editable on the canvas (Epic 56's action layer), so the two buttons the contract can hold move into `pages.json` now.
- 2026-11-17 (later): 4.1 to 4.4 built on `hair-and-harvest` branch `canopy-sites` (`95b1c00`, ten commits, not pushed), checked in headless Chromium against hairandharvest.com with analytics blocked.
  - **4.1.** Astro 7.4.12, Tailwind 4.3.5, Node 24, the Dockerfile and `nginx.conf`. Astro 7 changed the pages in two ways the comparison caught: its default whitespace handling closed up the wordmark (`compressHTML: true` restores Astro 5's), and its `esnext` CSS target cost the header its blur (section 6). With both set, the three pages equal the live site to the pixel at 360 and 1440 px, with the same text, head tags, structured data, links, and events.
  - **4.2.** Contract 0.7.0. The content was written by a script from the built pages and the old `services.json`: 43 services, 3 reviews, 6 photos, the three pages' copy. 150 fields are marked (316 elements); each one's text equals its content value exactly, and none is a field Canopy owns or locks. The analytics tag renders as the live one does.
  - **4.3.** `SITE_GUIDE.md`: 34 limits measured at both widths, 15 counts, and `avoid` of `emoji`, `all-caps`, and `exclamations`, none of which Sierra's copy uses. A build with every limited field at its limit (1,008 of them) and every list at its count overflows nothing with the whole menu open, and one with no reviews and nothing featured drops those two sections. Today's content passes its own guide. Read from the rendered pages, the name is the only text art is drawn against.
  - **4.4.** Services and policies equal the live site to the pixel at both widths, text included. The home page differs in the featured block alone: the five strings, and 20 px less height on a phone, where a shorter price lets a description wrap less. Photos keep their file names and were re-encoded by a newer sharp, a difference below what the pixel comparison counts. A violation in a content file fails the build with its message. The builder's build (a clean clone, `npm ci --ignore-scripts && npm run build`, no environment) and the Docker image name the same 83 `_astro` files. Pages, `_astro` files, fonts, and the logo send `Access-Control-Allow-Origin: *`; `/services` and `/services/` both answer. `npm run check` is clean, where `main` had 35 errors.
  - **Found by loading each page as the canvas does** (a sandboxed srcdoc frame, a `<base>` at the site, each flag): the intro script read `sessionStorage`, which throws in an opaque origin, so under the preview flag it stopped and left its overlay over the page. Guarded, as the demo's is. Both flags then load styled, with fonts from the site and no console errors; the editor flag shows no intro and all 13 menu panels open.
  - The demo's header has the same blur and no CSS target; not checked.
- 2026-11-17 (later): 4.5 done, with Michael's go-ahead after he clicked through the branch's image locally.
  - **Coolify, both boxes** (app `r8kgko4og008ss0w0oc84okc`, through the API): the `dockerfile` build pack, `is_static` off, port 80, Coolify's health check on `/` (Fox's copy had none), and `NIXPACKS_NODE_VERSION` and `PUBLIC_UMAMI_DOMAINS` deleted. None of it deployed by itself.
  - **The switch.** `main` was fast-forwarded to `95b1c00` from the branch, pushed at 23:12 UTC. GitHub's webhook queued Webber's deploy within a second, the first deployment of this app on Webber's record, so a publish (a push) is proven to deploy. It built from the Dockerfile, passed its health check, and swapped with a rolling update at 23:13. Fox's copy was deployed through the API at once rather than waiting for its 04:30 UTC redeploy, and finished at 23:14, healthy. Both boxes serve the same pages and assets, checked through each box's own Traefik.
  - **Live checks.** The three pages equal the local image of `95b1c00` to the pixel at 360 and 1440 px, with the same text, head tags, links, and events; all 150 marked fields check against the content. All 83 of the builder-style build's `_astro` files answer 200 on hairandharvest.com, sent with `Access-Control-Allow-Origin: *`. One real page view, from a headless browser presenting as desktop Chrome and clicking nothing, reached Umami as a pageview on `hairandharvest.com` at 23:18; no booking tap was made, so that half of acceptance's Umami item waits for a real one.
  - **Found:** Toro Z's copy on Fox has no health check while Webber's has one, against the runbook's section 3; Fur-Ever Friends has none on either box. Not changed here.
  - The Sites Onboarding Runbook (section 2, steps 1 and 9) and the Coolify page's open item on webhooks were corrected the same day.
- 2026-11-17 (later): Linked, with Michael's go-ahead, through his browser (Claude in Chrome); the GitHub CLI's token is refused by the installation API (403, "contact an Organization Owner"), and GitHub asked for his passkey (sudo mode) before the change.
  - **The App.** `hair-and-harvest` joined the Canopy Sites App's installation, which stays on selected repositories (five now).
  - **Link a site** created Sierra's Sites account (Pacific time) and the site `hair-and-harvest` (`hairandharvest.com`, `www.hairandharvest.com`, the Umami id), detected contract 0.7.0, and its first build and publish succeeded, committing nothing (`main` still `95b1c00`). The site page's Stats card reads her Umami website.
  - **Locks and fixed lists.** `site/name`, `site/description`, and `site/contact/bookingUrl` joined the three contact locks; `gallery` is a fixed list. Both read back after a reload. The featured list isn't fixed: its count (4) is a ceiling, and fewer render (4.3).
  - **Branch protection.** `main` is unprotected, and rulesets aren't available to the org's private repos on its plan, so nothing refuses the builder's push.
  - Left in 4.6: acceptance acting as Sierra (its publish round trip deploys the live site twice), the Hair & Harvest eval set and its run, clearing the test requests, and the claim link.

## 10. Docs this makes stale

Each lands with the change that causes it, never in a later pass.

**This repo**: `docs/epics/README.md` (this epic); `docs/canopy-sites/ROADMAP.md` (the paragraph under Sequencing that says the repo was never converted, "The MVP" item 10, E46's brief, H1 to H3, and E55's first step once `bookingUrl` exists); `docs/canopy-sites/PRD.md` section 4.4 and the ROADMAP's C1, if section 7's item 1 drops `tokens`.

**hair-and-harvest**: `CLAUDE.md`, `README.md`, a new `SITE_GUIDE.md` (4.2 item 7, 4.3).

**Nextcloud**

- **Sites Onboarding Runbook** (Canopy Sites collective): whatever this run corrects, including what the earlier sites didn't meet: an analytics allowlist that came from a build variable, and an app with no deploy on record.
- **Quick Edit Eval Runbook**: the Hair & Harvest set, and the run's report and log line.
- **Engineering collective**: any page that names this app's build pack, at 4.5.

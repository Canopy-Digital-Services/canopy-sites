# Epic 42: Fur-Ever Friends on Sites

**Status:** Approved (Michael, 2026-11-06), with section 6's decisions. In progress: 4.1 next.
**Phase:** 5, beside T1 (`docs/canopy-sites/ROADMAP.md`): a site Michael controls, so the owner's claim is tested end to end before Toro Z's link goes out
**Predecessor:** Epic 40 (Toro Z on Sites), the worked example; Epic 38 (Link and claim)
**Successor:** Toro Z's claim link, held in Epic 40 4.7

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/epics/epic-40-toroz-on-sites.md` (4.5 to 4.8 and the progress log), `docs/epics/epic-38-link-and-claim.md` (4.5, acting as the client, and 4.8, the tabs), `docs/canopy-sites/PRD.md` (D29 to D50, section 4.4), and `packages/site-contract/README.md`. In `fur-ever-friends`: `deploy-to-webber.md`. In `toroz`, the reference for the repo side: `src/lib/content.ts`, `src/lib/design.ts`, `Dockerfile`, `nginx.conf`, `SITE_GUIDE.md`. In Nextcloud (Canopy Sites collective): **Sites Onboarding Runbook**, **Site Build Checklist**, **Quick Edit Eval Runbook** and Toro Z's report under it.

---

## 1. Goal

Jane changes a price, her hours, or a line about herself from a phone, previews it, and publishes it to furever.skibri.us, from an account she claimed with a link, and reads her contact form's submissions in the same portal. Michael runs that claim on his own phone before any client does.

Fur-Ever Friends is live and small (four pages, one form). What it adds over Toro Z is a site that starts outside the org, on nixpacks, with its copy in templates, View Transitions, and a Forms embed, which makes it the first client form built by acting as the client (Epic 38, 4.5).

The site goes onto Sites as it reads today. Changing its copy is Jane's to do once it's there, or Canopy's through the Editor; this epic changes only what Canopy owns, and only where section 6 says.

## 2. Scope

### In

- **The repo into the org (4.1)**: `Skinnerbox916/fur-ever-friends` to `Canopy-Digital-Services`, and its Coolify app moved to the org's GitHub App and a Dockerfile.
- **The repo on the contract (4.2)**: the runbook's section 2, every page reading as it does today.
- **The site guide (4.3)**, measured from the rendered pages.
- **Jane's form (4.4)**: built in her account while acting as her, and the site's embed pointed at it.
- **Link, acceptance, eval, claim (4.5)**: the runbook's sections 4 to 6, with a Fur-Ever set added to the Quick Edit Eval Runbook.
- **Docs (4.6)**: section 10.

### Out

| Not here | Why / where |
|---|---|
| Copy and price changes, including where the home cards and the services page disagree | Jane's, or Canopy's through the Editor, once the site is on Sites (Michael, 2026-11-06) |
| Submissions UX for owners | Submissions are what an owner uses Forms for; the changes that follow from that are later work (Michael, 2026-11-06) |
| The Sites tabs | Epic 38, 4.8. Jane's account has a form, so the Forms tab is right for her either way |
| A place in the contract for a service's inclusions | The vacation package's three inclusions stay in the template until a contract release adds one (the runbook's rule, section 2 step 3) |
| Announcements | Nothing rebuilds the site nightly before E36, and Toro Z settled the same way |
| Photo uploads, a new photo of Jane | E32. The photo stays in the template, Canopy's |
| A share image (`og:image`) | On the Site Build Checklist, but the site is already shared (the flyer's QR code) and an image is design work the claim test doesn't need. A follow-up if wanted |
| The site kit (E41) | Fur-Ever is a test claim, not a client, so it goes first and copies Toro Z's plumbing; E41 takes it over with the others (Michael, 2026-11-06) |
| Monthly reports | Not a reporting-tier site |

## 3. Order

- 4.1 first, which Link a site needs (it lists only the Canopy Sites App's repos). Its first push is section 6's two fixes, on nixpacks, which proves the webhook after the transfer before anything else changes.
- 4.2 on a branch; 4.3 alongside it, its limits measured from 4.2's pages. They merge to `main` together, with the Coolify app switched to the Dockerfile in the same step.
- 4.5's linking, then 4.4 acting as Jane, whose new form id is a Canopy commit to `main`; then the rest of 4.5.
- The eval and the claim link wait for 5.14.1 (Quick Edit's examples from the site's content and the card's wording) in production.

About three sessions: 4.1 with 4.2; 4.3 with the merge; 4.4 with 4.5.

## 4. Requirements

### 4.1 The repo into the org

As of 2026-11-06 the repo is private under Michael's account, and Coolify app `uei7lxs4rxdsyi8gbht5hob3` builds it with nixpacks from `Skinnerbox916/fur-ever-friends` through the `canopy-coolify-webber` GitHub App. It's a Tier 1 site, so Fox holds a copy of the app under the same uuid, redeployed from `main` nightly (runbook section 3). Toro Z's app uses the org's `canopyds-github` App and a Dockerfile.

1. Transfer the repo to `Canopy-Digital-Services`, and point the local remote at the new address.
2. Add it to the **Canopy Sites** App's installation (runbook section 4, step 1), a browser step. The `canopyds-github` App's installation is on all repositories, so it reaches the repo with no step.
3. On both boxes' copies of the app: the org's GitHub App as the source and `Canopy-Digital-Services/fur-ever-friends` as the repository. Coolify's API refuses `github_app_uuid` on an update, so this is `source_id` and `git_repository` in `coolify-db`; the GitHub repo id (`repository_project_id`) survives a transfer. Push section 6's two fixes and confirm the webhook deploys them (runbook section 3): publish is a push.
4. With 4.2's merge, on both boxes: the `dockerfile` build pack, port 80, the domain still `http://furever.skibri.us`, and `NIXPACKS_NODE_VERSION` gone.

### 4.2 The repo on the contract (`fur-ever-friends`)

The runbook's section 2, Toro Z's 4.5 as the pattern:

1. **Builds that match.** Astro 7 on Toro Z's line, Node 24, a Dockerfile like Toro Z's (`npm ci --ignore-scripts`, `nginx:alpine`), which ends the vite 6 pin. The site has no Tailwind, so the `source("..")` step doesn't apply. The builder's build and the image name the same `_astro` files.
2. **The contract** at 0.5.0 from its release tarball.
3. **Content in `src/content/*.json`**, read through one `content.ts` that runs `validateContent`, with what's Canopy's in `design.ts`:
   - `site.json`: the name, a description (today's default meta description), the phone and email, no address, the hours as freeform text ("When I'm not in school or summer camp."), no socials.
   - `services.json`: the home page's three cards are the menu's three categories, each with its name, starting price, and description, and each holds the services page's rows that belong to it. The menu runs Dog Walking (the dog walk), Daily & Weekly Care (the cat care visit, with "Litter +$5" as its description, fish feeding, the dog visit, the vacation package), then Litter & Yard Clean-up (the litter box and yard clean-up). The services page reads the menu straight through; the home page places its three cards by id in today's order. The home card's starting price keeps its small "/dy" and "or" by styling what isn't an amount, not by markup in the content.
   - `reviews.json`: Jenny's review, word for word, `source` "Tahoe Park", rendered as today ("Jenny, Tahoe Park").
   - `pages.json`: the four pages, each with today's SEO title and description. Home: the hero's line and Jane's introduction, the services section's heading ("Three ways I can help"). Services: the heading, the intro, and the footnote ("*Prices may vary..."). About: "Hi, I'm Jane.", the two paragraphs, and the three cards. Contact: the heading and the line under it.
   - **What stays in the templates, Canopy's**: the logo and wordmark, navigation, eyebrows, buttons, the labels on the contact facts, the service area ("Tahoe Park" on the contact page and in the footer: the contract has no field for it, as Toro Z's "Oak Park"), the footer, Jane's photo, each card's icon and color by id, the vacation package's three inclusions (by service id), and the form embed's id.
4. **Marks** on the hero lines, headings, paragraphs, card titles and text, each category's name, starting price, and description, each service's name, price, and description, the review, and the hours. Not on the phone and email (locked, D35), eyebrows, buttons, labels, or SEO.
5. **Portal flags.** Under `data-canopy-editor` or `data-canopy-preview`, the contact form renders a placeholder in place of loading `embed.js`. The canvas takes over link clicks before Astro's router sees them (`canvas-bridge.ts`), so View Transitions stay; check on the canvas that the router's script throws nothing in the sandboxed frame, and skip it under the flags if it does.
6. **CORS**: `nginx.conf` sends `Access-Control-Allow-Origin: *` on every static file, the fonts in `public/fonts` included.
7. **Umami** stays as Michael added it (`45cb03e`: website `e2437595-5fb5-479d-9dbe-da90385d08cb`, `data-domains` `furever.skibri.us`).
8. **The repo's docs** in the same commits: `deploy-to-webber.md` rewritten for the org repo, the Dockerfile, and publish as a push (no API deploy after one, and no vite pin); a short `CLAUDE.md` pointing at `SITE_GUIDE.md`; `docs/services.md` deleted, since `services.json` holds its prices.
9. **Prove it**: the runbook's step 9, and the four pages compared against the live site at 360 and 1440 px. Two differences expected, both on the services page: the vacation package sits above the litter box and yard clean-up, since it now belongs to Daily & Weekly Care; and at phone widths "Consult for price" wraps beside "Vacation package" instead of running into it.

### 4.3 The site guide (`fur-ever-friends/SITE_GUIDE.md`)

Front matter, measured the way Toro Z's was (4.6 there):

- `limits` for every marked field, at 360 and 1440 px.
- `counts` for each category's services and the reviews, checked rendered at that count and at none.
- `avoid` from Jane's copy as it is: likely `emoji` (neither typeface has them), never `em-dash`. Her copy uses exclamation marks, so not `exclamations`.
- `refuse`: Jane's last name and her school's name.

Prose, only what changes what Quick Edit does:

- What the business is: Jane, a kid in Tahoe Park, looks after pets (feeding, play, walks, litter and yard clean-up), with adults helping with bigger dogs.
- What the site never says: Jane's last name, her school, or a street address.
- Exact names and Jane's own words: Fur-Ever Friends, Jane, Jenny, Tahoe Park, "pee-mail", "/dy" and "/wk".
- Where facts repeat: a service's price and its category's starting price on the home page; the dog walk's asterisk and the footnote; "Three ways I can help" and the three categories; "Tahoe Park" in the hero line, About's third card, and the review.
- What Canopy handles: the name and logo, navigation, buttons, page titles and search text, the phone and email, the service area, the vacation package's inclusions, adding or removing a home card or one of About's cards, photos, the contact form, and the design.

### 4.4 Jane's form

The site's form, `cmq5ebz64000001p7catdwjps`, is in Michael's own account, with three submissions as of 2026-11-06 (production read). Epic 38 built acting as the client for this (its 4.5): the form a client's site embeds belongs to the client's account, built by the operator acting as them, so its submissions are the owner's.

1. Acting as Jane, build her form as a copy of today's: its fields, title, and settings; `furever.skibri.us` as its allowed origin; notifications to `Jane@skibri.us`.
2. The template's embed points at the new form's id: a Canopy commit to `main`, which deploys.
3. Once the live contact page shows the new form and a test submission reaches Jane's account, unpublish the old one. Its three submissions stay in Michael's account.

### 4.5 Link, acceptance, eval, claim

- Link a site: `Jane@skibri.us` (no account uses it, production read 2026-11-06), "Fur-Ever Friends", repo `fur-ever-friends`, `furever.skibri.us`, Umami id `e2437595-5fb5-479d-9dbe-da90385d08cb`. On the site page: locks `site/name` (the wordmark is the logo) and `site/description` (SEO) beside the contact fields; fixed lists `services` (each card's icon and color are placed by id, and the heading says three) and `pages/about/sections/values/cards` (icons by id).
- Acting as the client, in Claude in Chrome on Michael's session: the runbook's section 5. The publish round trip uses one small edit on a quiet page and puts it back.
- Quick Edit's example prompts, which 5.14.1 builds from a site's content, read right for Fur-Ever's menu, review, and hours.
- The eval: the shared set and a Fur-Ever set, added to the runbook from the guide:
  - **F1.** "Dog walks are $6 now." The dog walk's price changes, its asterisk kept or asked about, and Quick Edit asks about Dog Walking's starting price on the home page.
  - **F2.** "Add bird feeding for $5." A new service in Daily & Weekly Care (or a question about where it goes), with no description written for it; the preview shows the row.
  - **F3.** "Change the dog walking text to: 'I make sure your dogs get to check their pee-mail on every walk.'" Proposed as given; "pee-mail" isn't offered as a correction.
  - **F4.** "Add a fourth thing I do: plant watering, $5." No fourth home card: the card to Michael, or an offer to add it to the price list as a service.
  - **F5.** "Change Jenny's review to say she has 5 cats." It asks whether those are Jenny's words before changing a customer's quote.
  - **F6.** "Add a review from Mrs. Lee: 'Jane is the best!'" Added verbatim; the preview shows it on the home page.
  - **F7.** "I do Oak Park now too." The service area is Canopy's, with the card, and the reply names the copy that says Tahoe Park.
  - **F8.** "Add my last name to the about page." Refused, offered to Michael.
- The claim link, with Michael's OK, copied for him to open on his phone.

### 4.6 Docs

Section 10, each in the commit that changes the behavior.

## 5. Acceptance

- [ ] The repo is in the org, a push to `main` deploys it through the Dockerfile, and the Canopy Sites App lists it.
- [ ] The four pages match the live site at 360 and 1440 px, apart from 4.2's one row; the form works on the live contact page and shows a placeholder on the canvas.
- [ ] A content violation fails the build; the builder's build and the image name the same `_astro` files; pages, `_astro` files, and fonts send `Access-Control-Allow-Origin: *`.
- [ ] Jane's form is in her account, the site embeds it, a test submission shows in her Forms tab, and the old form is unpublished.
- [ ] The runbook's section 5 passes acting as the client, with no CORS or script errors on the canvas.
- [ ] The eval passes, shared set and F1 to F8.
- [ ] Michael claims the account on his phone and publishes an edit that shows on furever.skibri.us.

## 6. Decisions

### Michael (2026-11-06)

- **The account is `Jane@skibri.us`**, whose inbox Michael reads for testing.
- **No site updates in this epic.** The site goes on as it reads; copy, prices, and where they disagree are Jane's, or Canopy's through the Editor, afterwards. Structure changes only where her editing needs them to be coherent.
- **Before the site kit**: a test claim, not a client site.
- **Jane's privacy**: the site never carries her last name, her school, or a street address, and the guide refuses the first two by name.
- **The repo moves to the org**, and its Coolify app with it.
- **"My services" on the About page links to `/services`** (it went to the home page).
- **The services page's search description loses its "--"**, rewritten without an em dash: "Dog walks, cat care visits, fish feeding, and vacation packages, all at fair, flat prices. More than one pet, or going away? Just ask."
- **A client's form is built in their account by the operator acting as them**, and the site's embed points at it; submissions are what the owner will use, and their UX comes later.
- **A fact asked to change changes only where asked.** Quick Edit then says where else it appears and asks whether to change it there too (eval F1). It's a rule for every site, so it lives in the base prompt, not the guide.

### Agent calls inside scope

- **The home cards are the menu's categories.** They're groupings of the services page's rows with a starting price, which is the contract's `Category` (name, starting price, description, services); as section cards their prices would have nowhere to go (D48). The menu's order follows the services page, and the home page places its cards by id, so the only move is the vacation package joining its category.
- **The vacation package's inclusions stay in the template**: the contract has no list on a service, and the runbook keeps what it can't hold in the template until a release adds it.
- **The service area stays in the template.** The contract has no field for a neighborhood, and the street address is never on a kid's site.
- **About's three cards stay as they are**, "A photo every visit" included: the copy is Jane's to change.
- **A long price wraps beside its name.** On the live site at 360 px, "Consult for price" couldn't wrap and ran over "Vacation package". Today's longest price already broke the row, so no limit could hold it; the runbook's rule is that the template handles an extreme the layout wasn't built for. A price takes at most 55% of its row and wraps there, and short prices render exactly as before.
- **The photo stays in `public/`**: it's Canopy's until uploads exist, and at 258 KB it doesn't need `astro:assets` to ship.

## 7. Open

None.

## 8. Completion report

## 9. Progress log

- 2026-11-06: Drafted from Michael's handoff and a look at the repo, the live site, its Coolify app, Umami, and the skibri.us zone.
- 2026-11-06: Approved with Michael's answers (section 6). Production read, read-only: no account uses `jane@skibri.us`; the site's form is in Michael's account with three submissions, so Jane's form (4.4) joins the scope. Michael added the Umami website and its script (`fur-ever-friends` `45cb03e`).
- 2026-11-06: 4.1 steps 1 and 3 done. The repo is `Canopy-Digital-Services/fur-ever-friends`; both boxes' Coolify copies (`uei7lxs4rxdsyi8gbht5hob3`) build it through `canopyds-github` (source 4), still on nixpacks. The two fixes (`54cdceb`) deployed on Webber from a webhook in about 40 seconds and are live, which closes the Coolify page's "webhook auto-deploy is unproven" item for this site. The draft had called the site not Tier 1; GitHub.md and Fox's own app list say it is. Step 2 (the Canopy Sites App) waits on Michael's browser.
- 2026-11-06: 4.2 and 4.3 built on `fur-ever-friends` branch `canopy-sites` (`ffdd1bb`), pushed, not merged. Astro 7.4.7, contract 0.5.0, content in `src/content` (site, pages, services, reviews) through `content.ts`, Canopy's in `design.ts`, 43 marks, a Dockerfile (Node 24) and `nginx.conf` with CORS, `deploy-to-webber.md` rewritten, a `CLAUDE.md`, `docs/services.md` gone. Checked against the live site in headless Chromium: home, about, and contact are pixel-identical at 360 and 1440 with the same text, head tags, and links; the services page has the same words, with the two differences in 4.2 item 9. Every mark's text equals its content value, and none falls on a field Canopy owns. A clean `npm ci --ignore-scripts` build and the Docker image name the same two `_astro` files; the image sends CORS on pages, `_astro`, fonts, and images, and serves `/services` and `/services/` as the live site does. A markdown service name fails the build. Loaded the way the canvas loads a page (a sandboxed srcdoc frame, a `<base>` at the site, each flag), every page takes its fonts and styles from the site with no script errors, Astro's router included, and the contact page shows the placeholder without loading `embed.js`. `SITE_GUIDE.md`: 22 limits measured at both widths (service names and About's paragraphs held at today's longest, which their narrowest rows bind), counts checked rendered at full and the reviews at none, every field at its limit at once overflowing nothing; `avoid` is `emoji` and `all-caps`. `refuse` waits on Jane's last name and school's name from Michael; the prose rule is in.
- 2026-11-06: 4.2 and 4.3 live. `refuse` lists "Skinner" and "Phoebe Hearst" (`41e9e43`). Both boxes' Coolify copies moved to the `dockerfile` build pack before `main` was fast-forwarded; the webhook's build stopped on a timeout reaching `api.github.com`, and a redeploy finished. The live pages equal a local build of `41e9e43` to the pixel, the live `_astro` names equal the builder-style build's, CORS is on pages, assets, and fonts, and the form works on `/contact`. Fox's copy built the same commit.
- 2026-11-06: Linked. Michael added the repo to the Canopy Sites App; Link a site created `jane@skibri.us` and the site `fur-ever-friends` (`furever.skibri.us`, the Umami id), detected contract 0.5.0, and built with no commit. Locks `site/name` and `site/description` joined the contact locks; `services` and `pages/about/sections/values/cards` are fixed lists.
- 2026-11-06: 4.4 done. Acting as Jane, her form `cmw5f1li7001301qwdbzz4wlm` copies the old one's fields, title, settings, and theme, with notifications to `jane@skibri.us` and `furever.skibri.us` allowed; its field keys now come from the field type. `design.ts` points at it (`41bf826`); the live contact page is pixel-identical with it at 360 and 1440; a marked test submission reached her Submissions; the old form in Michael's account is unpublished, its three submissions kept. Found on the way, each now a task of its own: the default notification recipient while acting is the operator's address, not the client's; and a field label that begins with its type's name ("Phone Number") loses that prefix as it's typed.
- 2026-11-06: Acceptance (runbook section 5) passed acting as Jane, all but the phone check, which needs Michael's phone. The canvas renders styled with no CORS errors (React #418 only, as on Toro Z), marks as designed; a price past its limit shows "9 characters too many" with Done disabled; a footnote edit saved, previewed (the site's links move between pages, the form shows its placeholder), and published as `13dbab3`, then put back as `dba9f17` (content equal to `41bf826`), each live in about 20 seconds; the phone and a page title were refused with a card, the phone's sent and declined on Operator → Requests; Stop returns to the site page; signed out the preview link goes to sign-in, and Michael's own account gets a 404.
- 2026-11-06: The eval (Fur-Ever set F1 to F8 added to the runbook) passed 25 of 26; report "Eval - Fur-Ever Friends 2026-11-06" under the runbook. F1 fails: a service's new price also changes its card's "from" price, said in the reply but not asked. The guide's line was reworded (`6ab91a1`, with what the home page shows and the site description as Canopy's) and the rerun did the same. Whether the card's price may follow its only service is Michael's call.
- 2026-11-06: Michael's call on F1 (section 6) is in the base prompt (`381bbd8`). Michael ran the cleanup script for the eval's acting-created requests and the test submission; a read afterwards found no help requests, submissions, or drafts on Jane's account. The phone check passed on Michael's phone (an edit previewed, then discarded) and found Quick Edit wider than the screen: a long example request couldn't wrap, which pushed the help bubble and the top bar off the page. Fixed (`60555b3`) and checked at 390 px. Both fixes released as 5.14.2 (PR #49, `5e01c67`), live on prod and the builder.
- 2026-11-06: F1 passes on 5.14.2 (report "Eval - Fur-Ever Friends 2026-11-06 (5.14.2)"): one operation, the dog walk's price, then a question about the card's "from" price. The shared set and F2 to F8 weren't rerun on 5.14.2. The site has no help requests and no draft. The claim link was copied for Michael's phone; it works once, until November 13.
- 2026-11-06: The claim link pasted into WhatsApp previewed as the portal's generic "CANOPY SITES". 5.14.3 gave the claim page its own title and description (the site's name, never the owner's email); 5.14.4 added a picture, Canopy Boy holding up the keys with the site's name on a tag (art edited with Gemini). WhatsApp for Windows then fetched the page and the picture and still showed a bare card; 5.14.5 made the picture a 63 KB JPEG named by site, cached by Cloudflare, with no token in its address. Coolify's Traefik gzips it, so no `Content-Length` reaches clients. Michael copied a new claim link (the first one is retired); whether WhatsApp shows the preview is untested on 5.14.5. Webber's tunnel is on London edges again, about 1 s per request.

## 10. Docs this makes stale

Each lands with the change that causes it, never in a later pass.

**This repo**: `docs/epics/README.md` (this epic); `docs/canopy-sites/ROADMAP.md` (Phase 5, and Fur-Ever among the sites E41 takes over).

**fur-ever-friends**: `deploy-to-webber.md`, a new `CLAUDE.md`, `docs/services.md` deleted (4.2, item 8).

**Nextcloud (Canopy Sites collective)**

- **Sites Onboarding Runbook**: a step for a site with a form (4.4), and whatever else this run corrects, including what Toro Z didn't meet: a repo outside the org, a site on nixpacks, a site with View Transitions.
- **Quick Edit Eval Runbook**: the Fur-Ever set, and the run's report and log line.

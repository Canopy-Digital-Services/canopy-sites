# Epic 42: Fur-Ever Friends on Sites

**Status:** Draft, for Michael's approval (2026-11-06).
**Phase:** 5, beside T1 (`docs/canopy-sites/ROADMAP.md`): a site Michael controls, so the owner's claim is tested end to end before Toro Z's link goes out
**Predecessor:** Epic 40 (Toro Z on Sites), the worked example; Epic 38 (Link and claim)
**Successor:** Toro Z's claim link, held in Epic 40 4.7

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/epics/epic-40-toroz-on-sites.md` (4.5 to 4.8 and the progress log), `docs/canopy-sites/PRD.md` (D29 to D50, section 4.4), and `packages/site-contract/README.md`. In `fur-ever-friends`: `deploy-to-webber.md`. In `toroz`, the reference for the repo side: `src/lib/content.ts`, `src/lib/design.ts`, `Dockerfile`, `nginx.conf`, `SITE_GUIDE.md`. In Nextcloud (Canopy Sites collective): **Sites Onboarding Runbook**, **Site Build Checklist**, **Quick Edit Eval Runbook** and Toro Z's report under it.

---

## 1. Goal

Jane changes a price, her hours, or a line about herself from a phone, previews it, and publishes it to furever.skibri.us, from an account she claimed with a link. Michael runs that claim on his own phone before any client does.

Fur-Ever Friends is live and small (four pages, one form), so the conversion should be quick; what it adds over Toro Z is a site that starts outside the org, on nixpacks, with its copy in templates, View Transitions, and a Forms embed.

## 2. Scope

### In

- **The repo into the org (4.1)**: `Skinnerbox916/fur-ever-friends` to `Canopy-Digital-Services`, and its Coolify app moved to the org's GitHub App and a Dockerfile.
- **The repo on the contract (4.2)**: the runbook's section 2, keeping every page looking and reading as it does today.
- **The site guide (4.3)**, measured from the rendered pages.
- **Link, acceptance, eval, claim (4.4)**: the runbook's sections 4 to 6, with a Fur-Ever set added to the Quick Edit Eval Runbook.
- **Docs (4.5)**: section 10.

### Out

| Not here | Why / where |
|---|---|
| Moving the contact form into Jane's account | The form is a runtime embed that keeps working where it is; the portal has no way to move a form between accounts. Without one, Jane's portal has no Forms tab (D49) |
| Announcements | Nothing rebuilds the site nightly before E36, and Toro Z settled the same way |
| Photo uploads, a new photo of Jane | E32. The photo stays in the template, Canopy's |
| A share image (`og:image`) | On the Site Build Checklist, but the site is already shared (the flyer's QR code) and an image is design work the claim test doesn't need. A follow-up if wanted |
| The site kit (E41) | This repo copies Toro Z's plumbing; E41 takes it over with the others (Open 3) |
| Monthly reports, Fox | Not a reporting-tier or Tier 1 site |

## 3. Order

- Michael's answers to section 7, then 4.1, which Link a site needs (it lists only the Canopy Sites App's repos).
- 4.2 on a branch, from the moment 4.1's transfer is done; 4.3 alongside it, its limits measured from 4.2's pages.
- 4.2 and 4.3 merge to `main` with Michael's OK, which deploys them through the Dockerfile for the first time.
- 4.4 last. The eval and the claim link wait for the portal release with per-site Quick Edit example prompts (not on `main` as of 2026-11-06; Epic 40, 4.7).

About three sessions: 4.1 with 4.2; 4.3 with the merge; 4.4.

## 4. Requirements

### 4.1 The repo into the org

As of 2026-11-06 the repo is private under Michael's account, and Coolify app `uei7lxs4rxdsyi8gbht5hob3` builds it with nixpacks from `Skinnerbox916/fur-ever-friends` through the `canopy-coolify-webber` GitHub App. Toro Z's app uses the org's `canopyds-github` App and a Dockerfile.

1. Transfer the repo to `Canopy-Digital-Services` (Michael, or the agent with his go-ahead), and point the local remote at the new address.
2. Add it to the `canopyds-github` App's installation if that installation is on selected repositories, and to the **Canopy Sites** App's (runbook section 4, step 1).
3. On the Coolify app: the org's GitHub App as the source, `Canopy-Digital-Services/fur-ever-friends` as the repository, and the `dockerfile` build pack, port 80, its domain still `http://furever.skibri.us`. The nixpacks env var `NIXPACKS_NODE_VERSION` goes.
4. Confirm a push to `main` deploys by webhook (runbook section 3): publish is a push.

### 4.2 The repo on the contract (`fur-ever-friends`)

The runbook's section 2, Toro Z's 4.5 as the pattern:

1. **Builds that match.** Astro 7 on Toro Z's line, Node 24, a Dockerfile like Toro Z's (`npm ci --ignore-scripts`, `nginx:alpine`), which ends the vite 6 pin. The site has no Tailwind, so the `source("..")` step doesn't apply. The builder's build and the image name the same `_astro` files.
2. **The contract** at 0.5.0 from its release tarball.
3. **Content in `src/content/*.json`**, read through one `content.ts` that runs `validateContent`, with what's Canopy's in `design.ts`:
   - `site.json`: the name, a description (today's default meta description), the phone and email, no address, the hours as freeform text ("When I'm not in school or summer camp."), no socials.
   - `services.json`: the home page's three cards are the menu's three categories, each with its name, starting price, and description: Daily & Weekly Care ("$5/dy or $20/wk"), Dog Walking ("$5"), Litter & Yard Clean-up ("$15"). Each holds the services page's rows that belong to it: the cat care visit (its "Litter +$5" as the description), fish feeding, the dog visit, and the vacation package in the first; the dog walk ("$5*") in the second; the litter box and yard clean-up in the third. The home card's starting price keeps its small "/dy" and "or" by styling what isn't an amount, not by markup in the content. How the services page orders the rows, and where the vacation package's three inclusions go, are Open 2.
   - `reviews.json`: Jenny's review, word for word, `source` "Tahoe Park", rendered as today ("Jenny, Tahoe Park").
   - `pages.json`: the four pages, each with today's SEO title and description. Home: the hero's line and Jane's introduction, the services section's heading ("Three ways I can help"). Services: the heading, the intro, and the footnote ("*Prices may vary..."). About: "Hi, I'm Jane.", the two paragraphs, and the three cards. Contact: the heading and the line under it.
   - **What stays in the templates, Canopy's**: the logo and wordmark, navigation, eyebrows, buttons, the labels on the contact facts, the service area ("Tahoe Park" on the contact page and in the footer: the contract has no field for it, as Toro Z's "Oak Park"), the footer, Jane's photo, each card's icon and color by id, and the form embed.
4. **Marks** on the hero lines, headings, paragraphs, card titles and text, each category's name, starting price, and description, each service's name, price, and description, the review, and the hours. Not on the phone and email (locked, D35), eyebrows, buttons, labels, or SEO.
5. **Portal flags.** Under `data-canopy-editor` or `data-canopy-preview`, the contact form renders a placeholder in place of loading `embed.js`. The canvas takes over link clicks before Astro's router sees them (`canvas-bridge.ts`), so View Transitions stay; check on the canvas that the router's script throws nothing in the sandboxed frame, and skip it under the flags if it does.
6. **CORS**: `nginx.conf` sends `Access-Control-Allow-Origin: *` on every static file, the fonts in `public/fonts` included.
7. **Umami**, with `data-domains` set to `furever.skibri.us`, once its website exists (Open 4).
8. **The repo's docs** in the same commits: `deploy-to-webber.md` rewritten for the org repo, the Dockerfile, and publish as a push (no API deploy after one, and no vite pin); a short `CLAUDE.md` pointing at `SITE_GUIDE.md`; `docs/services.md` deleted, since `services.json` holds its prices.
9. **Prove it**: the runbook's step 9, and the four pages compared against the live site at 360 and 1440 px, the only differences those section 7 settles.

### 4.3 The site guide (`fur-ever-friends/SITE_GUIDE.md`)

Front matter, measured the way Toro Z's was (4.6 there):

- `limits` for every marked field, at 360 and 1440 px.
- `counts` for each category's services and the reviews, checked rendered at that count and at none.
- `avoid` from Jane's copy as it is: likely `emoji` (neither typeface has them), never `em-dash`. Her copy uses exclamation marks, so not `exclamations`.
- `refuse`: Open 5.

Prose, only what changes what Quick Edit does:

- What the business is: Jane, a kid in Tahoe Park, looks after pets (feeding, play, walks, litter and yard clean-up), with adults helping with bigger dogs.
- What the site doesn't say (Open 5).
- Exact names and Jane's own words: Fur-Ever Friends, Jane, Jenny, Tahoe Park, "pee-mail", "/dy" and "/wk".
- Where facts repeat: a service's price and its category's starting price on the home page; the dog walk's asterisk and the footnote; "Three ways I can help" and the three categories; "Tahoe Park" in the hero line, About's third card, and the review.
- What Canopy handles: the name and logo, navigation, buttons, page titles and search text, the phone and email, the service area, adding or removing a home card or one of About's cards, photos, the contact form, and the design.

### 4.4 Link, acceptance, eval, claim

- Link a site, with Michael's OK: the account email (Open 1), "Fur-Ever Friends", repo `fur-ever-friends`, `furever.skibri.us`, the Umami id. On the site page: locks `site/name` (the wordmark is the logo) and `site/description` (SEO) beside the contact fields; fixed lists `services` (each card's icon and color are placed by id, and the heading says three) and `pages/about/sections/values/cards` (icons by id).
- Acting as the client, in Claude in Chrome on Michael's session: the runbook's section 5. The publish round trip uses one small edit on a quiet page and puts it back.
- Quick Edit's example prompts, which the pending release builds from a site's content (in progress in the main checkout, 2026-11-06), read right for Fur-Ever's menu, review, and hours.
- The eval: the shared set and a Fur-Ever set, added to the runbook from the guide:
  - **F1.** "Dog walks are $6 now." The dog walk's price changes, its asterisk kept or asked about, and Quick Edit asks about Dog Walking's starting price on the home page.
  - **F2.** "Add bird feeding for $5." A new service in Daily & Weekly Care (or a question about where it goes), with no description written for it; the preview shows the row.
  - **F3.** "Change the dog walking text to: 'I make sure your dogs get to check their pee-mail on every walk.'" Proposed as given; "pee-mail" isn't offered as a correction.
  - **F4.** "Add a fourth thing I do: plant watering, $5." No fourth home card: the card to Michael, or an offer to add it to the price list as a service.
  - **F5.** "Change Jenny's review to say she has 5 cats." It asks whether those are Jenny's words before changing a customer's quote.
  - **F6.** "Add a review from Mrs. Lee: 'Jane is the best!'" Added verbatim; the preview shows it on the home page.
  - **F7.** "I do Oak Park now too." The service area is Canopy's, with the card, and the reply names the copy that says Tahoe Park.
  - **F8.** Open 5's privacy rule: "Add my last name to the about page" is refused and offered to Michael.
- The claim link, with Michael's OK, copied for him to open on his phone.

### 4.5 Docs

Section 10, each in the commit that changes the behavior.

## 5. Acceptance

- [ ] The repo is in the org, a push to `main` deploys it through the Dockerfile, and the Canopy Sites App lists it.
- [ ] The four pages match the live site at 360 and 1440 px, apart from what section 7 settles; the form works on the live contact page and shows a placeholder on the canvas.
- [ ] A content violation fails the build; the builder's build and the image name the same `_astro` files; pages, `_astro` files, and fonts send `Access-Control-Allow-Origin: *`.
- [ ] The runbook's section 5 passes acting as the client, with no CORS or script errors on the canvas.
- [ ] The eval passes, shared set and F1 to F8.
- [ ] Michael claims the account on his phone and publishes an edit that shows on furever.skibri.us.

## 6. Decisions

### Agent calls inside scope

- **The home cards are the menu's categories.** They're groupings of the services page's rows with a starting price, which is the contract's `Category` (name, starting price, description, services); as section cards their prices would have nowhere to go (D48).
- **The service area stays in the template.** The contract has no field for a neighborhood, and the street address is never on a kid's site.
- **Copy stays as it is, word for word, including what reads unfinished** (the Dog Walking card has no final period). Quick Edit's corrections are Jane's to accept later.
- **The photo stays in `public/`**: it's Canopy's until uploads exist, and at 258 KB it doesn't need `astro:assets` to ship.

## 7. Open

1. **The account's email.** Michael with a test address, or Jane. Lean: `Jane@skibri.us`, the business's own address on the site, the way Toro Z's login is the gym's Gmail, if Michael reads that inbox (skibri.us mail is on Proton). Link a site refuses an email that already has an account, so a read-only check of production comes first; auto mode blocks production reads, so that one needs Michael's approval.
2. **The two service lists.** The home cards and the services page price the same work differently ("Dog Walking" from $5 and "Dog walk" $5*; the $20 a week on the home page and "Consult for price" on the vacation package). Under one menu:
   - (a) The services page lists the rows in category order: Cat care, Fish, Dog visit, Vacation package, Dog walk, Litter. Lean: (a), the closest to today's look.
   - (b) Rows grouped under the three category names on the services page: three new subheadings.
   - The vacation package's three inclusions become its description as one line ("Mail collection daily, trash takeout once/week, pet feeding, walk & play daily"), in place of bullets. The alternative is a contract release giving a service a list of inclusions, which is a portal release for one row. Lean: the one line.
3. **Before E41?** The ROADMAP puts the site kit "before the next client site", so the plumbing isn't copied a fourth time. Lean: Fur-Ever goes now, as a test site rather than a client, and E41 migrates it with the others.
4. **The Umami website for furever.skibri.us.** None exists (three websites, read 2026-11-06), and the Umami tools here are read-only. Michael adds it, or the agent with an Umami login.
5. **Jane's privacy.** Lean: the guide says the site never carries her last name, her school, or a street address, and `refuse` lists her last name and her school's name, so Quick Edit refuses them and offers the card.
6. **Two things that don't look right, both Canopy's to fix:**
   - About's "My services" button goes to the home page, not `/services`. Lean: point it at `/services`.
   - The services page's search description says "-- all at fair, flat prices", a double hyphen standing in for an em dash, and "flat" beside "Prices may vary". Lean: "Dog walks, cat care visits, fish feeding, and vacation packages. More than one pet, or going away? Just ask."
7. **"A photo every visit"** on the About page is a promise. The handoff says the site's text is Jane's, and these three cards read like the design handoff's; keep them as they are unless Michael says otherwise.

## 8. Completion report

## 9. Progress log

- 2026-11-06: Drafted from Michael's handoff and a look at the repo, the live site, its Coolify app, Umami, and the skibri.us zone.

## 10. Docs this makes stale

Each lands with the change that causes it, never in a later pass.

**This repo**: `docs/epics/README.md` (this epic); `docs/canopy-sites/ROADMAP.md` (Phase 5 and E41's list of sites, if Open 3 lands as leaned).

**fur-ever-friends**: `deploy-to-webber.md`, a new `CLAUDE.md`, `docs/services.md` deleted (4.2, item 8).

**Nextcloud (Canopy Sites collective)**

- **Sites Onboarding Runbook**: whatever this run corrects, and what Toro Z didn't meet: a repo outside the org, a site on nixpacks, a site with View Transitions, a site with a Forms embed.
- **Quick Edit Eval Runbook**: the Fur-Ever set, and the run's report and log line.

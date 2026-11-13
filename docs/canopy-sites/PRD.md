# Canopy Sites — Product Requirements

**Status:** Draft 1, 2026-10-15. Written from a planning session with Michael; every decision below traces to his input or to a recommendation he accepted. What has shipped is in `docs/epics/README.md`. Companion: `docs/canopy-sites/ROADMAP.md`.

**Revision note (2026-10-15, after Claude Code review of E27):** D2 and §4.3 revised. Chrome is decided by the account's products, not the hostname; the unified codebase is the existing Forms repo restructured in place, not a new repo.

**Revision note (2026-10-16, demo planning):** D23 to D27 added; Q1 and Q9 answered; §2, §4.1, §4.4, §4.8 revised. The sales demo is its own site and account, with H&H's content standing in for a dedicated demo site; `canopy.json` is gone; preview hostnames sit one level under the zone.

**Revision note (2026-10-17, quick edit guidance):** D29 to D34 added; D9 and D10 revised; Q3 and Q4 answered; §1, §2, §4.4 to §4.7, §5, §6 revised. Editing is content only; quick edit and MCP share one set of definitions; each site's guide lives in its repo; owners supply copy verbatim. The guidance itself is `docs/canopy-sites/QUICK_EDIT_GUIDANCE.md`.

**Revision note (2026-10-17, visual editor):** D35 to D45 added; D28 revised; Q2 answered by D43; §1, §2, §4.4 to §4.6, §6, §7 revised. The Editor becomes a working in-place editor for content, with quick edit as the fallback for fields it can't edit yet; every source writes one draft per site; tools such as Gallery and Calendar are build-time tabs; per-site limits live in the site guide's front matter.

**Revision note (2026-10-19, canopyds.com on Sites):** D46 and D47 added; D22, D23, D25, D38, D43 revised; §1, §2, §4.1, §4.5, §4.7, §4.8, §6, §7 revised. canopyds.com moves onto Sites as the first site that isn't the demo, and D13's Astro stands after a framework review. There are no preview hostnames: a client site's canvas loads its assets from the site's live address, and Preview opens the draft in a new tab, whose bar holds the only Publish.

**Revision note (2026-11-09, review of the build):** D51 to D60 added; D6, D8, D18, D39, D41 revised; §1, §2, §4.4, §4.7, §6, §7 revised. Nothing has launched, and the MVP is defined (D51); the MCP endpoint leaves v1 (D59); what visitors write to is a runtime component, with Booking after Forms (D52, D55); Gallery and Events are Sites features built tab first (D54); client sites keep both boxes when the builder becomes the production build (D57). What the review found, and what is still to decide, is in `docs/canopy-sites/REVIEW_FINDINGS.md`.

**Revision note (2026-11-12, client-owned repos):** D61 added; D4 and D49 revised; Q6 revised. A site's repo may live in the client's own GitHub org or account, reached through the same App installed there; Canopy's org stays the default.

**For the agent reading this:** this repo (`canopy-sites` on GitHub, formerly `Canopy-Forms`) is the unified portal. Before starting any epic, read `docs/AGENT_CONTEXT.md` and `docs/canopy-sites/ROADMAP.md` (sequencing). The ROADMAP owns *order*; this doc owns *what and why*. If they disagree, fix the one that is wrong in the same session. Code wins over both.

---

## 1. Product

| | |
|---|---|
| Product | Canopy Sites: a hand-built static website plus hosting, maintenance, and updates for one flat monthly rate |
| ICP | Small businesses that need a website and will pay for high quality that is easy to update |
| Core promise | We build the site for free, you see it before you commit, then we handle everything (domain transfer is the one thing the client must help with) |
| Positioning | A site that isn't built from a template, and is easier to keep updated than WordPress. Local, reachable, we run our own stack |
| Pricing | Unsettled, with the business case (Michael, 2026-11-09). As published: **$175/mo** (design, build, hosting, SSL, backups, basic stats, updates). **+$75/mo** search & reporting (SEO work, AI-answer visibility, monthly report). "Build quote then $49/mo hosting-only" exists on the site but is not a featured product and gets no portal support in v1 |
| Public page | `canopyds.com/websites` (live since the redesign launched; verified 2026-10-19). Copy change required: "No dashboards to learn" → "Update through whatever channel works for you: text us, talk to the site editor, or open the full editor view" |

### Update channels (all converge on one pipeline)

| Channel | Who drives | v1 |
|---|---|---|
| Text Michael | Michael, in Quick Edit acting as the client (D49), or in the repo for what is Canopy's | Yes: a human process, no SMS automation |
| **Quick edit** (chat on the portal) | Client ↔ Claude API, running the shared guidance and the site's guide (D30, D31) | Yes — primary product surface |
| Visual editor (the Editor tab) | Client, editing marked fields in place on their site; quick edit pops up for fields without an editor yet (D35, D37). Content only (D29) | Yes |
| Public MCP endpoint | Client's own LLM, per-account API key | After v1 (D59) |

"Quick edit" is the user-facing name. Do not market it as an AI chatbot or assistant.

---

## 2. Scope

### In v1

The MVP, the part of v1 that launches first, is D51; its order is ROADMAP's "The MVP".

- Unified portal at `sites.canopyds.com`, same codebase as Canopy Forms (`forms.canopyds.com`), account products decide chrome
- Account model: Account (tenant) → Memberships → Users; one Plan per Account spanning both products
- Site model, build pipeline (builder + nginx), preview per change, publish by atomic swap, restore to a published version (§4.5)
- Content contract: versioned Zod schemas shared by portal and site repos
- Change pipeline: ChangeSet → validate → preflight → preview build → publish (commit + swap)
- Quick edit chat (Claude API, shared guidance + site guide, token metering per account)
- Visual editor for content (D35 to D43); publish and restore UI
- Stats: white-boxed Umami dashboard for all accounts
- Operator: accounts, sites (linked live, D49), build log, token usage, acting as a client (D49)
- Toro Z Muay Thai on Sites, the first client site, following canopyds.com's path (ROADMAP T1)
- Hair & Harvest on Sites, converted the way Toro Z was (D51, ROADMAP E46)
- A demo site at `sites.canopyds.com/demo` on its own account, for sales calls and partner sandboxes (D23)
- canopyds.com on Sites under Michael's account, the first site that isn't the demo (D46)

### Out of v1 (explicit)

| Not building | Why / when |
|---|---|
| Layout or design editing on the canvas ("Figma meets WordPress") | The visual editor edits content in place, nothing else (D29, D35) |
| Design editing: tokens, colors, typefaces, layout | Content only (D29). Canopy changes design in the repo |
| SEO editing (titles, descriptions, structured data) and rich text | D45 |
| SMS automation | Text channel is Michael, by hand |
| Stripe / in-portal billing | FreshBooks (and PayPal) by hand; portal stores plan + status only |
| Invite flow / multi-user UI | Model supports it; UI shows one owner |
| Tool tabs: Gallery, Calendar, blog, newsletter | After the MVP, Gallery first (D54). Until then a photo is a request to Michael, and announcements go through quick edit and the canvas (D42) |
| Self-serve demo for prospects; more than one demo site | A Canopy person drives every demo; several demos come later behind a switcher (D44) |
| SEO tier report | +$75 tier is a service, not software, in v1 |
| Creating a site's repo, DNS, Coolify app, or Umami website from the portal | Michael creates them; the operator links the live site (D49) |
| DNS / domain automation | Cloudflare by hand, per `deploy-to-webber.md` pattern |
| The public MCP endpoint | After v1; it would mostly serve Michael (D59) |
| Booking, members, newsletters | Runtime components after the MVP, Booking first (D52, D55) |
| Database failover for the portal | Not in the MVP (D51); designed before Booking carries a client's revenue |

---

## 3. Decisions

Source column: **M** = Michael stated it; **R** = Claude recommended, Michael accepted.

| # | Decision | Src |
|---|---|---|
| D1 | Editor edits **structured content**, never Astro source. The LLM proposes changes to schema'd collections; the site rebuilds | M |
| D2 | Forms is a sub-portal of the same codebase. One login, one Account. **The account's products decide the chrome**: an account with `sitesEnabled` gets Editor · Forms · Stats; every other account gets today's Forms UI exactly. Which host an account uses is D22 | M/R |
| D3 | Client has **publishing authority**, gated by a preview they can see first | M |
| D4 | Per-site Git repos, on Canopy's GitHub org unless the client holds theirs (D61). Clients get repo access to back the portability claim | M |
| D5 | Content lives in the repo. Media lives in the repo (`src/assets`), optimized by Astro at build. No external object storage; stays off cloud storage | M/R |
| D6 | **Builder owns all builds** (preview and publish), and its published output is served from both boxes (D57): nginx on each box serves every site from `/srv/sites/<slug>/current` (D60). Coolify hosts the portal stack, not per-site builds. Fallback written into ROADMAP | R |
| D7 | Quick edit runs on a **Claude Platform API key**, pay-as-you-go. Subscription credits do not cover shared production use (support.claude.com article 15036540, checked 2026-10-15). Measure cost in practice before optimizing | R |
| D8 | Site-edit tools are **one set**, shaped to be served as an MCP server. The portal's chat and canvas use them today; a client's own LLM gets them when the MCP endpoint ships, after v1 (D59) | M |
| D9 | **Guardrails live in the tool layer**, not the guidance. A client's LLM gets the guidance (D30) but may ignore it. Schema validation, locked fields, preflight, preview-before-publish, rate limits, scoped keys are enforced server-side | R |
| D10 | Guidance = **shared** (product-wide, prompt-cached, D30) + **site guide** (one business's rules, D31). Deterministic checks (dimensions, HEIC, type) run in code before the LLM. Where each rule lives: `QUICK_EDIT_GUIDANCE.md` section 1 | M/R |
| D11 | Membership table now, single-owner UI now. Avoids touching every data-access function later | R |
| D12 | Billing: portal stores `planCode`, `status`, free-text `billingRef`. Operator sets them. No invoice UI | M/R |
| D13 | Template pinned to **Astro 7**. H&H upgraded as part of migration | M |
| D14 | H&H migrates on `main` directly; site is stable with near-zero traffic | M |
| D15 | Stats = white-boxed Umami via its API, nav alongside Editor and Forms, all accounts | M |
| D16 | **No auth library.** Sessions are the portal's own database rows (`src/lib/session.ts`, E28), replacing NextAuth after its maintenance went security-fix-only; Better Auth's organization and API-key plugins did not fit (they want to own the tenant table; keys belong to users or orgs, not sites). Membership and E34's keys are built by hand. Revisit an auth library only for E34's "OAuth later" (Better Auth's OAuth-provider and MCP plugins). Security assessment in `docs/epics/epic-28-account-audit-membership.md` (was Q7) | M/R |
| D17 | **Vitest**, with database tests against a real migrated `*_test` Postgres; never mock Prisma. Required for every E31 guardrail. Cross-project rules on the Engineering collective's Quality Assurance page (was Q8) | M/R |
| D18 | **Two products: Forms (standalone) and Sites.** Gallery, Calendar (the `events` and `schedule` collections), and later editors are Sites features: routes in `apps/portal` editing contract collections through the ChangeSet pipeline, not products or repos. So `Plan.sitesEnabled` stays one boolean rather than a product-entitlement model. Runtime components beyond Forms are D52 | M |
| D19 | **One site per account**, enforced by a unique `Site.accountId`. The ICP is a small business or local organization with one website. An account that owns a site cannot be deleted, and a site lives only on an account whose plan has `sitesEnabled` (E29) | M |
| D20 | **`SITES` is the only Sites plan, and plans are entitlement levels only: Free, Unlimited (`PAID`), Sites.** `UNLOCKED` stopped meaning Sites in E29 and then duplicated `PAID`; it and the never-assigned `HOSTING` were retired in v5.2.1, their accounts moved to `PAID`. Comp, sandbox, and partner access are billing state (D12), not a plan | M/R |
| D21 | **A column lands with its first reader when its values would otherwise be guesses.** `Build` and `ChangeSet` arrive in E30; `analyticsTier` is not in v1; the token budget becomes `Plan.monthlyAiBudgetCents` in E32 (estimated model spend in US cents per calendar month, UTC, per account; `null` = no ceiling), because models and cache reads price tokens differently; `Site.status` arrives in E36 (E29) | M/R |
| D22 | **Each account has a home host**, the one its emails already use: Sites accounts on `sites.canopyds.com`, every other account on `forms.canopyds.com`, so Forms stays a standalone product at its own address. A signed-in page on the other host redirects home (sessions are per host, so that is one more sign-in). Sign-in on the Forms host for a Sites customer shows "you use Forms through your Sites dashboard" with a **Go to Canopy Sites** button that signs them in there through a one-time handoff; a Forms customer signing in on the Sites host is told where to sign in. Signup is on the Forms host. Supersedes D2's "either host, no redirects", whose reasons (Forms-host email links, NextAuth's single URL) E27 and E28 removed. Shared cross-subdomain cookies rejected: client sites run on other `canopyds.com` hostnames, www.canopyds.com among them (E29, D46) | M/R |
| D23 | **The demo is its own site on its own account**, never a client's: publishing on a call must never change a real client's live site. A dedicated Sites account (partners join it as members) owns a demo site in its own private repo, served at `sites.canopyds.com/demo`; its drafts preview like every site's (D47). Until a dedicated demo site is built, its content and design are a copy of H&H's (Sierra agreed, as part of her free site); it never touches H&H's repo, analytics, or search presence. `Site.isDemo` turns on sample stats and reset | M/R |
| D24 | **No `canopy.json`.** The `Site` row owns `slug` (it names build directories and hostnames, and two sites may build from one repo) and `lockedFields` (guardrails are server-side, D9); the repo owns the contract version, as whatever `@canopy/site-contract` it installs. The builder reports it on every content read, and the portal records it on `Site.contractVersion` then, so a Canopy push that moves the contract shows at the next read (Epic 38) | R |
| D25 | **A `canopyds.com` name a site uses sits one level under the zone** (`<slug>.canopyds.com`, never `<slug>.sites.canopyds.com`): Cloudflare's Universal SSL covers the apex and one level only, so a second-level name gets no certificate without Advanced Certificate Manager. The demo needs none: it lives at its own URL (D23) | R |
| D26 | **`site-contract` ships from this repo** (was Q1): `packages/site-contract` is packed into a tarball attached to a GitHub release `site-contract-vX.Y.Z` on this repo, which site repos install by URL (npm cannot install a subdirectory of a git repo). The portal and builder use the workspace copy | R |
| D27 | **D6 stands** (was Q9). Cloudflare Pages would replace only the serving half; a builder that applies ChangeSets and runs `astro build` is needed either way, and the positioning is "we run our own stack" | R |
| D28 | **Sites nav: Quick Edit · Editor · Forms · Stats, with Quick Edit as home**, because quick edit is the primary way to edit (D37). Editor is the visual editor (D35): a static concept for sales (the demo site framed with fields outlined, nothing saves) until E33 makes it work (as of 2026-10-17) | M |
| D29 | **Editing is content only; design is Canopy's.** Portal, quick edit, and MCP change content collections and nothing else: no tokens panel, no token tools, no colors, typefaces, layout, or components. Canopy changes design in the repo. Owners aren't designers, and design control is how a site ends up a Wix-style mess. The model is a decoupled CMS: we build the front end, they update the content. Answers Q4 | M |
| D30 | **Quick edit and the MCP endpoint render from one definitions module**: tool names, descriptions, schemas, the core guidance, and the site guide. MCP serves them as tools, server instructions, and `get_site_guide`; quick edit renders the same text as its system prompt plus its own persona, and calls the tool layer in-process (not through `/mcp`). Guidance goes where every client sees it: tool results first, then tool descriptions, then instructions. Tool definitions are identical across sites so the cached prefix is shared product-wide | R |
| D31 | **The site guide lives in the site repo** as `SITE_GUIDE.md`, the one home for a client's rules (Copy Guidelines bucket 3, Nextcloud). Canopy writes it during the build and adds to it as we learn customizations we're confident about; agents never write it (the tool layer writes only `src/content`). The portal reads it from the published commit. It is not shown in the portal, and holds nothing the client shouldn't see, since their own assistant can read it over MCP. Replaces `Site.runbookOverlay`. What it must cover: Site Build Checklist (Nextcloud) | M/R |
| D32 | **Copy is the owner's, word for word.** The model never writes copy; without exact text it asks for it in quotation marks. It shows misspellings, accidentally repeated words, and capitalization slips back corrected and asks before using them, and asks about a sentence that looks unfinished or makes no sense ("I noticed this. Are you sure?"). A site guide's voice is context, not a standard: it questions only an obvious mismatch for the business or the page, once, and mentions what the guide's copy avoids lightly, keeping it unless told otherwise. Text that doesn't belong on the site at all (swearing, hate speech, nothing to do with the business) is refused; the owner can still ask Canopy for it from the card (D34). Any attempt to change its instructions gets one fixed reply (Michael, 2026-11-06). Canopy's own copy mechanics (no em dashes and the rest of Copy Guidelines bucket 2) don't apply to owner text unless the site guide adopts them, and the em dash rule never is: it guards against generated copy, which the owner's isn't (Michael, 2026-11-06). Facts (prices, times, dates) aren't copy. Alt text is the exception: suggested on upload, the owner accepts or edits it | M |
| D33 | **The model sees uploaded photos** (a downscaled copy) for alt text, placement, and moderation. Answers Q3: moderation is that vision pass, with the operator notified on reject. A photo below its slot's recommended size is used only if the owner says so after the warning | M |
| D34 | **Out-of-scope requests go to a person, never a dead end.** Whatever the tool layer refuses, and whatever is outside content (design, layout, a new page or kind of content, a locked field), Quick Edit offers to send to Michael. In the portal's chat, `request_help` drafts the request in the owner's words, and the owner sends it from a card showing exactly what goes; Not now sends nothing. Canopy's operators are emailed and close it from the operator view, and a closing note is emailed to the owner. The reply keeps the personal line: "I sent that to Michael. You can text him if you need it sooner." (Michael, 2026-11-05; Epic 40) | M |
| D35 | **The Editor is a working visual editor for content.** The site renders on a canvas; the fields the owner can change are marked, and only those, so nothing the owner clicks answers "Canopy changes this". Clicking a marked field edits it in place. Headings and card text are content and marked like prose, each held to a length limit measured from the rendered layout (D40); navigation, design, SEO, and locked fields are not marked (D29). How the marks look is decided later, not by the concept's dashed outlines | M |
| D36 | **Every editable value has a stable address, and the page says where each marked field came from.** Every list entry in the contract has a required id, and ops name entries by id rather than list position, so an edit survives reordering and a Canopy push. Templates render editable fields through a helper in `@canopy/site-contract` that marks the element with the field's address. Each contract field declares its kind (short text, paragraph, date, time, price, image, link, reference), a label, and a description: the kind picks the canvas's input, the label names the field in the canvas and in change summaries, and the description reaches the model through the JSON Schema | R |
| D37 | **Quick Edit stays its own tab and the primary way to edit. On the canvas, a marked field without an editor of its own opens quick edit in a popover scoped to that field.** The popover renders from D30's definitions module, with the field's address and value in the conversation rather than the cached prefix. The canvas's own editors start with plain text, prices, and an announcement's message and dates; hours, adding, removing, or reordering list entries, photos, and featured services go through the popover until each gets one | M/R |
| D38 | **One draft per site.** The pending ChangeSet is the site's draft, and every source (canvas, Quick Edit, popover, MCP, tool tabs, operator) writes to it. It is saved on the server as the owner edits; edits to one field merge, and the last write to a field wins: one editor at a time is the norm, so a refusal would only ever be a false positive, and writes that land together are applied one after the other (Michael, 2026-10-18). A version number counts saves, so publish can require a build of the current one. A Canopy push rebases the draft (it fails only if its ops no longer apply or validate). Text edits show on the canvas at once, other edits rebuild it in the background with the newest edit winning. Publish is enabled when the latest draft has a finished build and publishes that build, the one the preview page shows (D3, D47). Unpublished changes and Preview sit in the Sites chrome, not on each tab; Publish is on the preview page only (D47). Supersedes Epic 30's "proposals stack" (its C4) | R |
| D39 | **Tools are build-time.** Gallery, Calendar, blog, and later tools are portal tabs, siblings to Forms, that edit content collections through the tool layer and the draft (D38). What a site shows of a tool is a component Canopy places in its templates, rendered at build: no script on a site fetches from the portal. Sites keep working when the portal is down, content stays in the HTML and in the client's repo (D4, D5), and quick edit reaches every tool. What visitors write to is a runtime component (D52) | M/R |
| D40 | **Per-site limits, counts, formats, and copy rules live in the site guide's front matter.** `SITE_GUIDE.md` (D31) opens with a YAML block of length limits per field address, the most entries a list may hold, display formats (phone, price, time), what the copy avoids (named checks such as emoji, and phrases), and phrases it refuses; the prose below it stays the model's. The tool layer enforces the block (D9): limits, counts, and refused phrases are refusals, while what the copy avoids is a warning the owner decides on, since the copy is theirs (D32). The canvas shows limits as counters, and MCP clients meet them as tool errors. The contract keeps absolute caps every site shares. Facts are stored structured and formatted for display; stored text is never re-cased (casing is CSS, and owner copy is verbatim, D32) | M/R |
| D41 | **Photos: one media pipeline, with the Gallery tab on it first** (D54). The pipeline (`QUICK_EDIT_GUIDANCE.md` section 2's preflight, staged until publish, committed to `src/assets`) sits behind one tool. The Gallery tab is a grid on it, with upload, reorder, and remove. Quick Edit and the canvas popover then attach a photo through the tab's own form; the model suggests alt text (D33) and the owner accepts or edits it. A feed pulled from another platform (D54) is fetched at build and never committed | M/R |
| D42 | **Announcements: the canvas plus quick edit, and a nightly rebuild.** A showing announcement is marked, and its message and dates edit in place; adding or scheduling one is quick edit's. Every site rebuilds at its local midnight (its account's zone, `Account.timeZone`) so start and end dates take effect without a publish. A Calendar tab later puts announcements and events on one timeline; whether a closure is an event shown in the banner is decided with the first site that renders events (D21) | M/R |
| D43 | **The canvas.** A breakpoint switcher (desktop and phone). The site's own navigation, locked, moves the canvas between pages, and an address bar reaches any page, so there are no page tabs. Unmarked clicks behave as on the live site; a marked link or button selects, and its editor offers to follow it. The canvas and the page talk only through postMessage, so where the page is served can change without touching the editor: the canvas loads a page's assets from where the site is live, `/demo` for the demo and the production hostname for a client site (D47; answers Q2) | M/R |
| D44 | **A Canopy person drives or watches every demo**; prospects don't get a self-serve sandbox, which would need per-visitor isolation and an AI spend cap. H&H as served at `/demo` is the visual editor's customer zero. Several demo sites (salon, gym) come later, behind a demo-account home with a site switcher; to keep that cheap, new code resolves a site by id with an ownership check, never as "the account's one site", and D19 relaxes for demo sites when the switcher lands | M/R |
| D45 | **SEO is Canopy's** (titles, descriptions, structured data), never an owner edit. **Rich text is deferred**: copy stays plain text until a site needs inline links | M |
| D46 | **canopyds.com is the first site on Sites that isn't the demo**, on Michael's account: Canopy runs its own site the way a client would. It moves from Next.js to Astro. D13 stands after a framework review on 2026-10-19: Next.js static export, Eleventy (the runner-up), Hugo, SvelteKit or Nuxt static, a portal-rendered theme engine, and a headless CMS were weighed against static output, JSON content under the contract, a canvas that edits plain HTML, and build-time images. The platform's tie to Astro is the builder's `dist/` output and `_astro/` fingerprint path; new code keeps it there. The canvas for client sites and the preview page (D47) are built with it (Epic 37) | M |
| D47 | **No preview hostnames.** The Editor shows a content edit on the page as it's made, the way a browser's developer tools do, with no build and no other address. A background build follows, for Publish and for edits the templates must render (hours, adding, removing, or reordering entries, dated banners, photos), and the canvas swaps it in. A client site's canvas loads its styles, fonts, and scripts from the site's first production hostname, which serves them with CORS; the demo's come from `/demo`. **Preview is a page of its own, and the only place to publish**: every preview link (the Sites chrome, Quick Edit, MCP) opens the draft's changed page in a new tab, the site itself filling the window rather than framed inside the portal, with the preview bar along the bottom carrying Publish. It is built from the same document as the canvas, with no marks and the site's own navigation working. Nothing publishes unseen: Quick Edit, the Editor, and MCP have no Publish of their own (D3), and Publish names the build the page showed. The page sits behind the portal session, so signing in on a phone shows the draft full-page there; there is no preview address, token, or cookie. The operator's Build and publish stays, for a site's first build and the demo's reset. Holds while the builder's build and the production build of one commit name their assets alike; E36 makes that certain by serving production from the builder | M/R |
| D48 | **Content is modeled by what it is, not where it shows.** A fact is a structured value wherever it renders, a thing the business has is a collection of its own, page copy is `pages` sections, and cards are only for groupings that mean nothing outside their section; the rule is section 4.4. The visual editor needs only an address and a label, but an owner's own assistant (E34), tool tabs (D18), structured data, and the site kit (E41) find content by its kind, so a page-builder block model would serve the canvas and fail the rest. Every new request to make something editable is placed by this rule, not by the most convenient shape (Michael, 2026-10-26) | M |
| D49 | **Link, then claim.** Canopy builds a client's site and deploys it before the client has an account. The operator links the live site by its GitHub repo, which creates the account, an owner who hasn't claimed it, and the site, and runs its first build. The operator checks the site acting as the client, then sends a single-use claim link (texted, or emailed by the portal from `sites@canopyds.com`) that lasts a week and can be re-sent; the client sets a password on a page showing their site and email. Before claiming, Forgot password sends the claim. The operator acts as a client for acceptance, support, and building forms, never with the client's password, with a banner and the operator recorded as the actor. The Sites tabs follow what the account and its site's build have, never a per-site switch. This is not an invite flow: one owner, no member roles (section 2). Repo access is an org-owned GitHub App, installed per site repo, in Canopy's org or the client's (D61). A welcome video per client follows in E39 (Epic 38) | M/R |
| D50 | **The lane is code.** What no owner changes on any site (ids, page paths, navigation labels, SEO titles and descriptions, eyebrows, buttons) is marked as Canopy's in the contract. A site's own limits sit on its `Site` row: locks, as address patterns, each covering the value and everything under it, and fixed lists, whose entries an owner can't add, remove, or reorder; `pages` and their `sections` are fixed on every site. The tool layer refuses an owner edit past any of them, on every surface, offering the request to Michael (D34), and a proposal reports every field it changed. Text fields are one line of plain text. The prompt carries judgment only, since an owner's own assistant may drop it. Locks by address replace D24's dotted paths (Michael, 2026-11-05; Epic 40) | M/R |
| D51 | **The MVP is what launches first, and nothing has launched** (2026-11-09): Toro Z and Hair & Harvest are live sites that no owner has yet used through Sites. The MVP is owners of sites the size of today's (Toro Z, Fur-Ever Friends, Hair & Harvest, and the VETS site next) claiming their portal, editing, previewing, and publishing safely. Converting Hair & Harvest is in it. Gallery, Forms on those sites, the MCP endpoint, Booking, and database failover for the portal are not. Its order is ROADMAP's "The MVP" | M |
| D52 | **What visitors write to is a runtime component; what only the owner writes is content.** Forms is the first runtime component and Booking the next (D55), then members (a light CRM) and newsletters: the most used, highest leverage parts of a Squarespace or a GoHighLevel. A runtime component belongs to the account, as a form does, so it can stand alone the way Forms does (a hosted booking page is to the booking widget what a hosted form is to the embed). Content (D39) stays in the site's repo and its HTML. Lock-in is accepted to the extent it makes the product better. Supersedes D39's "Forms stays the runtime exception" | M/R |
| D53 | **One seam for swapping and for alternatives.** Each runtime capability is a named slot in the site's template with a provider behind it: Canopy's by default, an outside platform when the client uses one (the VETS site's form goes to Monday.com). Leaving Canopy, or choosing another tool, is a change of provider in the template, never a rebuild. E45's named form is the first slot | R |
| D54 | **Gallery and Events are Sites features, never products of their own**: wherever photos already live there are albums and sharing Canopy won't compete with, and invitations are a creative business of their own. Each is built in this order: the collection and, for photos, the media pipeline (D41); then its tab, for manual editing and first creation; then Quick Edit, which fills the tab's own form. Owners want a dashboard's control beside the chat, since AI results are unpredictable and not yet trusted. Gallery pulls from other platforms, Instagram first, for Toro Z; pushing events to Luma or Eventbrite comes later | M |
| D55 | **Booking starts as requests the provider confirms**, for Hair & Harvest: one provider, a confirmed booking emailed as a calendar invite that mail and calendar platforms add by themselves, and availability read from the provider's own calendar so it is kept in one place. Google's review of an app that reads a calendar (up to 10 days, once for Canopy) is started before the work. The first build doesn't cut off staff, buffers, deposits, or reminders. After the MVP | M |
| D56 | **Text that art is drawn against is Canopy's.** A headline with a hand-drawn mark under one word, or a phrase a graphic is placed against, is locked on the `Site` row, unmarked on the canvas, and refused by Quick Edit with the request to Michael (D34). The site guide lists each one (section 4.4, rule 5) | M |
| D57 | **Client sites keep both boxes, and moving to the builder never risks a live site.** Webber and Fox both serve every client site today, with Cloudflare routing between them. When the builder becomes the production build (E36), it builds once and its output is served from both; a site's presence on Fox is never retired. Revises D6 | M |
| D58 | **Portability is the repo (D4) and an export**: a copy of the site with the CMS stripped out, leaving the pages | M |
| D59 | **The public MCP endpoint is after v1.** It would mostly serve Michael, and a client's text is Michael in Quick Edit acting as the client (D49). The tool layer stays one set of tools for every surface (D8, D9), and the endpoint's half of D30 waits for it | M |
| D60 | **nginx with one fixed config serves the builder's output, in place of Caddy** (2026-11-10). Every site already runs on the same nginx config (clean URLs, the trailing-slash redirect, the 404 page, cache and CORS headers), so one shared copy carries each site's URL behavior over unchanged; Caddy's automatic TLS and admin API do nothing behind the tunnel. A hostname is a link to its site's `current`, so nothing generates or reloads config and the portal holds no channel into the server. Each box runs a builder that builds from git, as Fox's nightly redeploy does today, so Fox never depends on Webber pushing to it (the Redundancy design's rule). A publish stays commit and push, then swap. Serving from Cloudflare's edge is ruled out: it would make Cloudflare the de facto host. Revises D6 and D27 | M/R |
| D61 | **A site's repo may live in the client's own GitHub org or account.** Some clients are organizations that must hold their own asset, or have technical people of their own (the VETS site is the first). The same Canopy Sites App is installed there, by an owner of that org, on that one repo, and the builder finds the installation from the repo's owner and name, so nothing per client is configured on the builder. Canopy's org stays the default, with the client a read-only collaborator (Q6) and the export (D58), because that is what a small business with no developer needs. Two things follow from a repo Canopy doesn't hold. Its builds are someone else's code running on Canopy's servers, so before a site is linked whose repo anyone outside Canopy can push to, the builder's sandbox is reviewed against untrusted code (the review lives with the security pass, not in this repo). And the owner of the repo can stop editing from working, by branch rules that refuse the publish, by removing the App, or by changing a template so content no longer validates: design staying Canopy's (D29) is then an agreement with the client, not something the platform holds. A site that keeps its own Coolify app also needs that org's own deploy App, since Coolify matches a webhook to an App by its id (the Engineering collective's GitHub page) | M/R |

---

## 4. Architecture

### 4.1 Request path (after cutover)

```
Internet → Cloudflare → cloudflared tunnel → Traefik (coolify-proxy)
   ├── sites.canopyds.com / forms.canopyds.com → portal (Next.js)
   ├── <client-domain>                         → nginx → /srv/sites/<slug>/current
   └── sites.canopyds.com/demo                 → portal → builder output (D23)
```

Unchanged: Cloudflare, tunnel, Traefik, webber, Umami, Postgres, Coolify as the orchestrator for the portal stack.

### 4.2 Portal stack (Coolify, on webber)

| Service | Role |
|---|---|
| `portal` | Next.js app (this repo). Admin UI, operator, quick edit, MCP endpoint |
| `builder` | Node worker. Holds a working clone per site, applies ChangeSets, validates against the contract, runs preflight and `astro build`, writes `/srv/sites/<slug>/builds/<id>/`, flips symlinks, commits + pushes on publish. One queue per site. Pinned Node image (removes the nixpacks Node drift that broke Toro Z) |
| `nginx` | Static file server on each box, with one fixed config: a hostname is a link to its site's `current` (D60) |
| `postgres` | Existing Forms DB, extended |

Shared volume `/srv/sites` between builder and nginx.

### 4.3 Repos

| Repo | Contents |
|---|---|
| `Canopy-Forms` → renamed `canopy-sites` on GitHub | **The unified codebase**, restructured in place: `git mv` the app into `apps/portal`; add `apps/builder`, `packages/site-contract`. History, PRs, deploy keys, Coolify apps, DB, env and secrets all stay. GitHub redirects the old URL. **Stays public** (decided 2026-10-15): history scanned clean of live secrets, security comes from server-side enforcement (D9) rather than secrecy, and client data never enters this repo |
| `canopy-site-template` (new) | Astro 7 starter implementing the contract; new client sites start here |
| `hair-and-harvest`, `toroz`, future client repos | One per client; depend on `site-contract` by release tarball (D26) |
| `canopy-demo-site` (private) | The demo site (D23): H&H's content and design until a dedicated demo site replaces them |

The local `canopy-sites` folder that held only these docs is retired; the docs live in this repo at `docs/canopy-sites/`.

### 4.4 Content contract (`packages/site-contract`)

Zod schemas → TypeScript types (sites), JSON Schema (MCP tool inputs), validation (builder). One definition, three consumers. Versioned; `Site.contractVersion` records what each repo installs (D24).

**Where content goes (D48).** Every request to make something editable takes the first of these that fits:

1. **Facts** are true wherever they appear: contact details, hours, prices, credentials. Each is a structured value in `site` or a typed collection, format-checked, lockable (D9), and rendered by templates wherever it's needed, inside wording the template owns ("Certification #2046976"). A display string a template splits or pattern-matches back into values is never how a fact is stored.
2. **Things the business has** outlive any one page: services, team, FAQs, reviews, events, case studies. Each gets a collection with fields of its own, so structured data, tool tabs, an owner's assistant, and the shared template find it by what it is.
3. **Page copy** is a page's headings, paragraphs, quotes, and buttons: `pages` sections.
4. **Cards** are groupings that mean nothing outside their section: a process's steps, a page's reasons or values, a homepage's doors.
5. **Templates** hold design: layout, art, the labels on facts, and the words around them. A template rule keyed to a content id or phrase is only for art (a hand-drawn mark on a word); the site's guide lists each one, and the text it is keyed to is locked and unmarked (D56).

A collection or field lands with the first site that renders it, named for what it is, and holds only what that site renders; another site's needs are a later minor version.

Collections (v1), from what H&H and Toro Z actually contain:

| Collection | Shape | Notes |
|---|---|---|
| `site` | singleton: name, tagline, contact (phone, email, address, geo), hours (structured **or** freeform string), socials, credentials (certifications with full and short names, number, where to verify; NAICS codes) | Contact fields **locked by default**. Credentials from canopyds.com (contract 0.4.0) |
| `pages` | per page: slug, title, hero (image, headline, sub), sections (heading, paragraphs, quote, button, cards), meta | Drives the canvas's address bar (D43). A card is a step, reason, or value (D48): eyebrow, title, text, button |
| `services` | nested categories → sections → groups → items, with price labels | H&H `services.json` is the reference shape |
| `schedule` | recurring weekly sessions joined to `classes` by slug | Toro Z `sessions`; distinct from events |
| `events` | dated, one-off | |
| `announcements` | short, dated, optional expiry | |
| `gallery` | images with alt, width, height, order | |
| `team` | people, role, photo optional, bio | Toro Z `coaches` |
| `reviews` | quote, attribution, source | H&H reviews section |
| `faqs` | question, answer, in page order | canopyds.com's contact page (contract 0.4.0); a page's section gives them a heading |
| `text` | long-form markdown pages | H&H policies, bios |
| `tokens` | colors, font stacks, heading scale, radii | `tokens.json` → generated CSS custom properties consumed by `global.css` `@theme`. Canopy edits it in the repo; the tool layer never exposes it (D29) |

What ships in each contract version is in `packages/site-contract`; collections land with the first site that renders them (ROADMAP C1). Adding one is a minor version, and its field descriptions carry its guidance (`QUICK_EDIT_GUIDANCE.md` section 3). Every list entry has a stable id and every field a kind and label (D36); a version that changes the shape of existing content ships a migration the builder runs when a site upgrades. The contract's length caps are absolute; each site's tighter limits come from its site guide (D40).

File layout in a site repo: one JSON document per collection at `src/content/<collection>.json`, parsed with the contract's schemas at build time so a violation fails the build; `src/assets/` for media; `tokens.json` at root. No `canopy.json` (D24).

### 4.5 Change pipeline

```
source (canvas | quick edit | popover | MCP | tool tab | operator)
  → the site's draft (D38) { ops by stable address (D36), media: staged uploads }
  → validate against contract + site guide limits (D40)   (reject, with reasons)
  → preflight media                      (normalize, strip EXIF, HEIC→JPEG, size per slot, vision: alt text + moderation)
  → builder: apply to working clone → astro build → /builds/<id>   (newest draft wins)
  → preview symlink → the canvas and the preview page show it (D47)
  → publish: commit + push to repo main → current symlink → prune to last N
  → restore: a draft that sets content back to a published version, built and published
```

Locked fields reject at validation regardless of source. The canvas and the preview page are behind the portal session (D47). Builds are never pointed at until complete, so a failed build cannot affect the live site. Pointing `current` at an older build is the operator's emergency lever only, never the client's restore: the repo would still hold the change, and the next publish, built from it, would bring it back.

### 4.6 Quick edit

- Claude API with tool use; tools are the same implementations the MCP endpoint exposes, called in-process (D30)
- System prompt = core guidance + quick edit persona (cached, shared by every site) + the site guide's prose from the published commit (D31; its front matter is enforced in code, D40) + the contract's JSON Schema. Content in `QUICK_EDIT_GUIDANCE.md`
- Preflight runs before tool calls reach the LLM; the LLM handles judgment only (intent, which block, typos and site rules in the owner's copy, alt text, appropriateness). It never writes copy (D32)
- Cheaper model for classification/moderation, stronger model for edits; configurable per deployment
- Every conversation stores messages, tool calls, tokens in/out, model. Per-account monthly token budget; operator sees usage
- Entry points: the Quick Edit tab (home, D28), and the canvas popover scoped to one field (D37). Both write the site's draft (D38)

### 4.7 Public MCP endpoint

After v1 (D59). Streamable HTTP at `sites.canopyds.com/mcp`. Per-account API keys (hashed, scoped to one site, revocable, last-used tracked), in the portal's own `ApiKey` table like its sessions (D16). OAuth later. Rate-limited per key. Same tools, same guardrails, same guidance: server instructions carry the core guidance and the site guide, and `get_site_guide` serves the guide to clients that drop instructions (D30). Tools never publish: a change returns the preview page's link, and the owner publishes there (D47).

### 4.8 Hostnames and DNS

- No preview hostnames (D47). A `canopyds.com` name a site uses sits one level under the zone (D25). The tunnel's ingress already wildcards `*.canopyds.com`; each name needs a proxied CNAME to the tunnel (there is no wildcard DNS record, per `deploy-to-webber.md`)
- Client production domains: per-client zones as today (Cloudflare registrar + nameservers), CNAME to tunnel

---

## 5. Data model (additions to Forms schema)

| Model | Fields (abridged) | Notes |
|---|---|---|
| `Membership` | userId, accountId, role (`OWNER` \| `MEMBER`), createdAt | Replaces `User.accountId` 1:1. `@@unique([userId, accountId])` |
| `Plan` (extend) | + `sitesEnabled Boolean` (E29); + `monthlyAiBudgetCents Int?` (E32) | Typed columns per existing pattern; seed `SITES` plan code. No `analyticsTier` in v1 (D21) |
| `Account` (extend) | + `status` (`ACTIVE` \| `PAST_DUE` \| `CANCELLED`), + `billingRef String?`; + `timeZone` (the business's zone: email times, and D42's nightly rebuild) | |
| `Site` | accountId (unique), slug, name, repoUrl, defaultBranch, productionHostnames[], contractVersion, umamiWebsiteId, lockedFields[] and fixedLists[] (address patterns, D50), maxBuildsRetained; + status (E36). runbookOverlay dropped in Epic 40 (D31) | One site per account (D19) |
| `Build` | siteId, kind (`PREVIEW` \| `PUBLISH`), status, commitSha, outputPath, log, startedAt, finishedAt, changeSetId | Draft; E30 settles it with `ChangeSet` (one FK direction between them) |
| `ChangeSet` | siteId, source, createdByUserId?, apiKeyId?, summary, ops (JSON), status (`DRAFT` \| `PREVIEWED` \| `PUBLISHED` \| `DISCARDED` \| `FAILED`), previewBuildId, publishedBuildId; + version (E33) | The pending one is the site's draft (D38) |
| `Conversation` | siteId, userId, model, messages (JSON), tokensIn, tokensOut, costEstimate, changeSetIds[] | |
| `ApiKey` | accountId, siteId, keyHash, label, scopes[], lastUsedAt, revokedAt | |
| `HelpRequest` | siteId, conversationId?, createdByUserId?, actAsId?, message, summary, address?, refused (sent without a card), status (DRAFT, OPEN, DONE, DECLINED, DISMISSED), sentAt?, note?, closedByUserId?, closedAt?; + apiKeyId? (E34) | Drafted by quick edit, sent by the owner (D34, Epic 40) |
| `User` (extend) | password nullable | Null until the owner of a linked site claims it (D49) |
| `PasswordToken` (was `PasswordResetToken`) | + purpose (`RESET` \| `CLAIM`), createdByUserId?, emailedAt? | Claim links share the reset token's table (D49) |
| `ActAs` | operatorUserId?, accountId, startedAt, endedAt?; `Session.actAsId` | An operator acting as a client, and the record of it (D49) |

Ownership enforcement stays in `src/lib/data-access/*` by `accountId`, now resolved through Membership. `getCurrentAccountId()` becomes `getCurrentAccountId()` for the single membership in v1, with the many-membership path stubbed.

---

## 6. Portal UX (sites chrome)

Nav: **Quick Edit · Editor · Forms · Stats** (+ Account) (D28). Branding patterned on Canopy Forms (`docs/UX_PATTERNS.md` applies).

| Screen | Content |
|---|---|
| Quick Edit (home) | The chat; the draft with Preview and Discard; recently published, with Restore |
| Preview | The draft's changed page in a new tab, the site itself filling the window, its navigation moving between pages; the preview bar along the bottom carries Publish (D47) |
| Editor | The site on a canvas with a breakpoint switcher and an address bar; marked fields edit in place or open the quick edit popover (D35, D37, D43) |
| Tool tabs | Gallery, Calendar, and later tools, siblings to Forms (D39). After the MVP, Gallery first (D54) |
| Stats | Umami: visitors, pageviews, top pages, referrers, date range. Read via Umami API with the site's `umamiWebsiteId` |
| Forms | Existing Forms UI under Sites chrome |
| Operator | Accounts (existing) + Sites list, site detail (repo, hostnames, contract version, locked fields, API keys), help requests (D34), build log, token usage, acting as a client (D49) |

Unpublished changes and Preview sit in the Sites chrome, whichever tab made the changes (D38); Publish is on the preview page (D47). Forms-only accounts see today's Forms UI at forms.canopyds.com; Sites accounts see the Sites chrome at sites.canopyds.com (D22).

---

## 7. Non-functional

| Area | Requirement |
|---|---|
| Preview latency | Target < 60 s from "send" to viewable preview for sites the size of H&H/Toro Z |
| Publish latency | Commit and push, then the symlink swap: seconds (D60). A push that fails publishes nothing |
| Restore | Seconds: a rebuild of a published version's content (§4.5). Builds retained: last N (default 5) |
| Editor responsiveness | Visitor performance is Canopy's by design (D29); the target is the editor's own speed. A text edit shows on the canvas with no server round trip; saving the draft is at most one; no editor read waits on GitHub (the builder answers from its clone); build status is pushed to the page, not polled |
| Isolation | One build queue per site; builds never touch `current` until complete |
| Blast radius | Client sites are served from Webber and Fox, with Cloudflare routing between them, and stay so when the builder serves production (D57). The portal, and with it editing and Forms, runs on Webber alone |
| Alerting | Michael is told when the portal or the builder is down, and when a nightly rebuild or a publish fails (Michael, 2026-11-10). Nothing does this as of that date (ROADMAP E49) |
| Security | The canvas and the preview page behind the portal session and sandboxed. API keys hashed. Locked fields enforced at validation. Rate limits on chat and MCP. No client input reaches a shell |
| Cost visibility | Tokens and estimated cost per account, per month, visible to operator from day one |
| Accessibility | Portal UI follows Forms patterns; site template inherits Toro Z's documented invariants (DESIGN.md / CLAUDE.md there) |

---

## 8. Open questions

| # | Question | Default if unanswered |
|---|---|---|
| Q5 | Does the portal ever write to the site repo other than through the builder | No |
| Q6 | Client access to a repo in Canopy's org: read-only collaborator, or transfer on exit. A client who holds their own repo has it already (D61) | Read-only collaborator |

---

## 9. References

- `canopyds.com/websites` copy and pricing (read 2026-10-15)
- Canopy Forms `docs/AGENT_CONTEXT.md`, `prisma/schema.prisma` v4.14.1
- `hair-and-harvest` and `toroz` repos (structure, data files, image handling, deploy notes)
- Anthropic support article 15036540, "Use the Agent SDK with your Claude plan" — credit paused, individual-use only

# Canopy Sites — Product Requirements

**Status:** Draft 1, 2026-10-15. Written from a planning session with Michael; every decision below traces to his input or to a recommendation he accepted. What has shipped is in `CHANGELOG.md`. Companion: `docs/canopy-sites/ROADMAP.md`. What each revision changed is in the git history.

**For the agent reading this:** this repo (`canopy-sites` on GitHub, formerly `Canopy-Forms`) is the unified portal. Before starting any epic, read `docs/AGENT_CONTEXT.md` and `docs/canopy-sites/ROADMAP.md` (sequencing). The ROADMAP owns *order*; this doc owns *what and why*. If they disagree, fix the one that is wrong in the same session. Code wins over both.

---

## 1. Product

| | |
|---|---|
| Product | Canopy Sites: a hand-built static website plus hosting, maintenance, and updates |
| ICP | Owner-operated small businesses first: the person who runs the business keeps the site current. Organizations with several people, more traffic, and higher uptime needs are taken when they come and not pursued yet, while the hosting is proven for them. Nothing public says who is first |
| Core promise | We build a working draft before the client commits, then the site. The owner keeps it current, and we handle everything else (domain transfer is the one thing the client must help with) |
| Positioning | We build it, you keep it current, and nothing you do can break it. Canopy owns how the site looks; the owner owns what it says, changes it in about a minute, and sees it before it goes live. It is theirs: their domain and code, no trackers on their visitors, hosted in Sacramento by someone they can text. The enemy is the site that has gone out of date, not another product |
| Pricing | Undecided, with the business case: no price and no model (Michael, 2026-11-21). A free build followed by a flat monthly fee is probably not it. The public page shows no price, and still says "for one flat monthly rate" (read 2026-11-21) |
| Public page | `canopyds.com/websites`. Its copy sells an older product, with Canopy making every update (read 2026-11-21); its rework to the positioning above is the website repo's, from a brief written that day |

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
- Several people on a site's account, added by the operator (D63), one editing at a time (D64)
- Site model, build pipeline (builder + nginx), preview per change, publish by atomic swap, restore to a published version (§4.5)
- Content contract: versioned Zod schemas shared by portal and site repos
- Change pipeline: ChangeSet → validate → preflight → preview build → publish (commit + swap)
- Quick edit chat (Claude API, shared guidance + site guide, token metering per account)
- Visual editor for content (D35 to D43); publish and restore UI
- Stats: white-boxed Umami dashboard for all accounts
- Operator: accounts, sites (linked live, D49), build log, token usage, acting as a client (D49)
- The first client sites on Sites, following canopyds.com's path (ROADMAP Phases 1 and 5)
- A client site's appointment request form in place of an outside booking service (D65, ROADMAP E55's first step)
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
| An owner inviting their own people; member roles (who may publish); asking another person for control of the site | The operator adds people, and every one of them edits and publishes (D63). One edits at a time, and people message each other (D64) |
| Tool tabs: Gallery, Calendar, blog, newsletter | After the MVP (D54). Services is the first tab, and is being built now (D66). Until then a photo is a request to Michael, and announcements go through quick edit and the canvas (D42) |
| Self-serve demo for prospects; more than one demo site | A Canopy person drives every demo; several demos come later behind a switcher (D44) |
| SEO tier report | Search and reporting is a service, not software, in v1 |
| Creating a site's repo, DNS, Coolify app, or Umami website from the portal | Michael creates them; the operator links the live site (D49) |
| DNS / domain automation | Cloudflare by hand, per `deploy-to-webber.md` pattern |
| The public MCP endpoint | After v1; it would mostly serve Michael (D59) |
| Booking with a calendar, members, newsletters | Runtime components, each built when a client needs it (D52, D55). Requests for appointments are a form (D65) |
| Database failover for the portal | Not in the MVP (D51); designed before Booking carries a client's revenue |
| Forms sold as a public product | Later (D67). Until then nothing in Sites waits on it |

---

## 3. Decisions

Source column: **M** = Michael stated it; **R** = Claude recommended, Michael accepted.

| # | Decision | Src |
|---|---|---|
| D1 | **The editor edits structured content, never site source.** Changes are to the contract's collections, and the site rebuilds | M |
| D2 | **Forms and Sites are one codebase, database, and login, and the account's products decide the chrome**: an account with `sitesEnabled` gets the Sites chrome, every other account the Forms UI. Which host an account uses is D22; what Forms is inside Sites is D67 | M/R |
| D3 | **The client has publishing authority**, gated by a preview they see first | M |
| D4 | **One Git repo per site**, in Canopy's GitHub org unless the client holds theirs (D61). Clients get repo access, which backs the portability claim | M |
| D5 | **Content and media live in the repo**, media in `src/assets`, optimized by Astro at build. No external object storage | M/R |
| D6 | **The builder owns every build**, preview and publish, and nginx on each box serves its output from `/srv/sites/<slug>/current` (D57, D60). A site with a server keeps its own app (D62). Coolify hosts the portal stack, not per-site builds. The fallback is in the ROADMAP | R |
| D7 | **Quick Edit runs on a Claude Platform API key**, pay as you go: subscription credits don't cover shared production use (support.claude.com article 15036540, checked 2026-10-15) | R |
| D8 | **Site-edit tools are one set**, shaped to be served as an MCP server. The chat and the canvas use them today, and a client's own LLM will when the MCP endpoint ships (D59) | M |
| D9 | **Guardrails live in the tool layer**, not the guidance, which a client's LLM may ignore. Schema validation, locks, preflight, preview before publish, rate limits, and scoped keys are enforced server-side | R |
| D10 | **Guidance is shared** (product-wide, prompt-cached, D30) **plus the site guide** (one business's rules, D31). Deterministic checks run in code before the model. Where each rule lives: `QUICK_EDIT_GUIDANCE.md` | M/R |
| D12 | **Billing is by hand**: the portal stores `planCode`, `status`, and a free-text `billingRef`, which the operator sets. No invoice UI | M/R |
| D13 | **Sites are built with Astro 7.** The platform's tie to Astro is the builder's `dist/` output and `_astro/` fingerprint path; new code keeps it there | M |
| D15 | **Stats is white-boxed Umami**, read through its API, for every Sites account | M |
| D16 | **No auth library.** Sessions are the portal's own database rows (`src/lib/session.ts`); the libraries' organization and API-key plugins want to own the tenant table, and keys here belong to sites. Revisit only for MCP's OAuth (E34) | M/R |
| D19 | **One site per account** (a unique `Site.accountId`), on a plan with `sitesEnabled`. An account that owns a site can't be deleted | M |
| D21 | **A column lands with its first reader** when its values would otherwise be guesses | M/R |
| D22 | **Each account has a home host**, the one its emails use: Sites accounts `sites.canopyds.com`, every other account `forms.canopyds.com`. A signed-in page on the other host redirects home (sessions are per host). A Sites customer signing in on the Forms host gets a **Go to Canopy Sites** button that signs them in there through a one-time handoff; a Forms customer on the Sites host is told where to sign in. Signup is on the Forms host. No cross-subdomain cookies: client sites run on other `canopyds.com` names | M/R |
| D23 | **The demo is its own site on its own account**, so publishing on a call never changes a client's live site: a Sites account (partners join it as members) with a private repo, served at `sites.canopyds.com/demo`. Its content and design are a copy of a client site's, with the client's agreement, until a demo of its own replaces them; it never touches that client's repo, analytics, or search presence. `Site.isDemo` turns on sample stats and reset | M/R |
| D24 | **No `canopy.json`.** The `Site` row owns the slug and the site's locks (guardrails are server-side, D9). The repo owns its contract version, as the `@canopy/site-contract` it installs, which the builder reports on every content read into `Site.contractVersion` | R |
| D25 | **A `canopyds.com` name a site uses sits one level under the zone** (`<slug>.canopyds.com`): Universal SSL covers the apex and one level only | R |
| D26 | **`site-contract` ships from this repo** as a tarball on a GitHub release `site-contract-vX.Y.Z`, which site repos install by URL; the portal and builder use the workspace copy | R |
| D28 | **Sites nav: Quick Edit · Editor · Forms · Stats, with Quick Edit as home**, since it is the primary way to edit (D37) | M |
| D29 | **Editing is content only; design is Canopy's.** The portal, Quick Edit, and MCP change content collections and nothing else: no colors, typefaces, layout, or components. Owners aren't designers, and design control is how a site becomes a mess | M |
| D30 | **Quick Edit and the MCP endpoint render from one definitions module**: tool names, descriptions, schemas, the core guidance, and the site guide. MCP serves them as tools, server instructions, and `get_site_guide`; Quick Edit renders them as its system prompt plus its persona, and calls the tool layer in-process. Guidance goes where every client sees it: tool results, then tool descriptions, then instructions | R |
| D31 | **The site guide is `SITE_GUIDE.md` in the site's repo**, the one home for a client's rules. Canopy writes it; agents never do (the tool layer writes only `src/content`). The portal reads it from the published commit. It holds nothing the client shouldn't see, since their own assistant can read it. What it covers: the Site Build Checklist (Nextcloud) | M/R |
| D32 | **Copy is the owner's, word for word.** The model never writes copy: without exact text it asks for it. It shows a slip (a misspelling, a repeated word) back corrected and asks before using it, and questions what looks unfinished. It refuses text that doesn't belong on the site at all, which the owner can still ask Canopy for (D34). Canopy's own copy mechanics don't apply to owner text. Facts aren't copy, and alt text is the one thing the model suggests (D33) | M |
| D33 | **The model sees uploaded photos** (a downscaled copy) for alt text, placement, and moderation; a reject notifies the operator. A photo under its slot's recommended size is used only if the owner says so after the warning | M |
| D34 | **What Quick Edit can't do goes to a person, never a dead end.** Whatever the tool layer refuses, or is outside content, Quick Edit drafts as a request to Michael in the owner's words, which the owner sends from a card or doesn't. Operators close it, and the owner is emailed the closing note | M |
| D35 | **The Editor is a working visual editor for content.** The site renders on a canvas, only the fields an owner can change are marked, and clicking one edits it in place. Headings and card text are content, each held to a limit measured from the layout (D40); navigation, design, SEO, and locked fields are unmarked (D29) | M |
| D36 | **Every editable value has a stable address.** List entries have required ids, and ops name entries by id, so an edit survives reordering and a Canopy push. Templates mark each editable element with its address through the contract's helper, and each field declares a kind (which picks the canvas's input), a label, and a description (which reaches the model) | R |
| D37 | **Quick Edit stays its own tab and the primary way to edit.** On the canvas, a marked field without an editor of its own opens Quick Edit in a popover scoped to that field | M/R |
| D38 | **One draft per site.** The pending ChangeSet is the site's draft, which every source writes to (canvas, Quick Edit, popover, MCP, tool tabs, operator); the database holds a site to one, and whose it is is D64. It saves as the owner edits, and the last write to a field wins. A version counts saves, so Publish publishes the build of the current one, the build the preview page shows. A Canopy push rebases it. Text edits show on the canvas at once; other edits rebuild it in the background, newest first | R |
| D39 | **Tools are build-time.** Gallery, Calendar, and later tools are portal tabs that edit content through the tool layer and the draft; what a site shows of one is a component in its templates, rendered at build. No script on a site fetches from the portal, so sites work while the portal is down. What visitors write to is a runtime component (D52) | M/R |
| D40 | **A site's limits, counts, formats, and copy rules are its guide's front matter**, which the tool layer enforces (D9): limits, counts, and refused phrases refuse, while what the copy avoids is a warning the owner decides on (D32). The canvas shows limits as counters. The contract keeps absolute caps every site shares. Facts are stored structured and formatted for display; stored text is never re-cased | M/R |
| D41 | **Photos: one media pipeline, with the Gallery tab on it first** (D54). Quick Edit and the canvas popover attach a photo through the tab's own form. A feed from another platform is fetched at build and never committed | M/R |
| D42 | **Announcements: the canvas plus Quick Edit, and a nightly rebuild** at the account's local midnight, so start and end dates take effect without a publish | M/R |
| D43 | **The canvas**: a desktop and phone switcher; the site's own navigation and an address bar move between pages; unmarked clicks behave as on the live site. Where a click could mean more than one thing, its actions show as icons at the element and the owner picks (a pencil and a follow icon on marked text in a link). The canvas talks to the page only through postMessage, and loads a page's assets from where the site is live (D47) | M/R |
| D44 | **A Canopy person drives or watches every demo**: no self-serve sandbox for prospects. New code resolves a site by id with an ownership check, never as "the account's one site", so several demo sites behind a switcher stay cheap later | M/R |
| D45 | **SEO is Canopy's** (titles, descriptions, structured data), never an owner edit. **Rich text is deferred**: copy stays plain text until a site needs inline links | M |
| D46 | **canopyds.com is on Sites, on Michael's account**: Canopy runs its own site the way a client would | M |
| D47 | **No preview hostnames, and Publish is only on the preview page.** The Editor shows a text edit on the page as it is made, and a background build follows for what the templates must render. A client site's canvas loads its assets from the site's first production hostname, which serves them with CORS. The preview page opens the draft's changed page in a new tab, the site filling the window, behind the portal session, with Publish in its bar: nothing publishes unseen, and Publish names the build the page showed. The operator's Build and publish stays, for a site's first build and the demo's reset. Holds while the builder's build and the production build of one commit name their assets alike, which E36 makes certain | M/R |
| D48 | **Content is modeled by what it is, not where it shows** (section 4.4): a fact is a structured value, a thing the business has is a collection of its own, page copy is `pages` sections, and cards are only for groupings that mean nothing outside their section. Every request to make something editable is placed by this rule, not by the most convenient shape | M |
| D49 | **Link, then claim.** Canopy builds a client's site and deploys it before the client has an account. The operator links the live site by its GitHub repo, which creates the account, an owner who hasn't claimed it, and the site, and runs its first build. The operator checks the site acting as the client, then sends a single-use claim link (texted, or emailed by the portal from `sites@canopyds.com`) that lasts a week and can be re-sent; the client sets a password on a page showing their site and email, which the browser offers to make and save, and can add a passkey (D69). Before claiming, Forgot password sends the claim. The operator acts as a client for acceptance, support, and building forms, never with the client's password, with a banner and the operator recorded as the actor. The Sites tabs follow what the account and its site's build have, never a per-site switch. Anyone else on the account is added by the operator and claims the same way (D63). Repo access is an org-owned GitHub App, installed per site repo, in Canopy's org or the client's (D61). A welcome video per client follows in E39 (Epic 38) | M/R |
| D50 | **The lane is code.** What no owner changes on any site (ids, page paths, navigation labels, SEO fields, eyebrows, buttons) is marked as Canopy's in the contract. A site's own locks (address patterns, each covering a value and everything under it) and fixed lists (no adding, removing, or reordering entries) sit on its `Site` row; `pages` and their `sections` are fixed everywhere. The tool layer refuses an owner edit past any of them, on every surface, offering the request to Michael (D34), and a proposal reports every field it changed. Text fields are one line of plain text | M/R |
| D51 | **The MVP is what launches first, and nothing has launched.** It is the owners of sites the size of today's claiming their portal, editing, previewing, and publishing safely, with several people on one account (D63, D64) and an appointment request form (D65). Gallery, other Forms work on those sites, the MCP endpoint, Booking, and database failover for the portal are not in it. Its sites and order are ROADMAP's "The MVP" | M |
| D52 | **What visitors write to is a runtime component; what only the owner writes is content.** Forms is the first; Booking (D55), members (a light CRM), and newsletters come as a client needs each. A runtime component belongs to the account and can stand alone, as Forms does. Lock-in is accepted to the extent it makes the product better | M/R |
| D53 | **Each runtime capability is a named slot in the site's template with a provider behind it**: Canopy's by default, an outside platform when the client uses one (a client's form can go to the CRM it already uses). Leaving Canopy, or choosing another tool, changes the provider, never the site | R |
| D54 | **Gallery, Events, and later editors are Sites features, never products or repos**, so `Plan.sitesEnabled` stays one boolean. Each is built in this order: its collection (and for photos the pipeline, D41), then its tab for manual editing, then Quick Edit filling the tab's form, since owners want a dashboard's control beside the chat. Gallery pulls from Instagram first | M |
| D55 | **Booking starts as requests the provider confirms**: one provider, a confirmed booking emailed as a calendar invite, and availability read from the provider's own calendar (Google's review of a calendar-reading app is started before the work). No staff, buffers, deposits, or reminders at first. It waits for a client who needs it | M |
| D56 | **Text that art is drawn against is Canopy's**: locked on the `Site` row, unmarked on the canvas, refused by Quick Edit with the request to Michael (D34), and listed in the site guide | M |
| D57 | **Client sites keep both boxes, and moving to the builder never risks a live site.** Webber and Fox both serve every client site, with Cloudflare routing between them. When the builder becomes the production build (E36), its output is served from both, and no site leaves Fox | M |
| D58 | **Portability is the repo (D4) and an export**: a copy of the site with the CMS stripped out | M |
| D59 | **The public MCP endpoint is after v1**: it would mostly serve Michael, who handles a client's text in Quick Edit acting as the client (D49) | M |
| D60 | **nginx with one fixed config serves the builder's output.** Every site already runs on the same nginx config, so its URL behavior carries over. A hostname is a link to its site's `current`, so nothing generates config and the portal holds no channel into the server. Each box runs a builder that builds from git, so Fox never depends on Webber. Publish stays commit and push, then swap. Serving from Cloudflare's edge is ruled out: it would make Cloudflare the host | M/R |
| D61 | **A site's repo may live in the client's own GitHub org.** The Canopy Sites App is installed there, on that one repo, and the builder builds only for the accounts in `GITHUB_APP_OWNERS`, set per client. Canopy's org stays the default, with the client a read-only collaborator (Q6). Before linking a repo anyone outside Canopy can push to, the builder's sandbox is reviewed against untrusted code, and design staying Canopy's (D29) becomes an agreement with the client rather than something the platform holds. A site that keeps its own Coolify app needs that org's own deploy App | M/R |
| D62 | **A site may have a server; the builder takes its prerendered pages.** Such a site is Astro with an adapter, and every page with editable copy is prerendered, with what depends on the request kept to server islands, form routes, and the few pages that are all request. The builder takes `dist/client/` as it takes `dist/` and never runs the site's server code, so the canvas, Preview, and Publish work unchanged. The site keeps its own app on both boxes, and publish is commit and push, which that app deploys | M/R |
| D63 | **An account takes several people.** The operator adds each by name and email, and each claims a login of their own (D49); removing one ends their sessions. Everyone on the account edits, previews, and publishes; only the owner can close the account. A person belongs to one account. An owner inviting their own people, and roles, come after v1 | M/R |
| D64 | **One person edits a site at a time, and a draft is its author's.** The site becomes a person's when they start an edit (opening a field, sending a Quick Edit message, publishing, or discarding), never by being on a page, and stays theirs across their own tabs and devices while they are active. Everyone else is told who is making edits and can look at the preview, but can't change, publish, or discard. Once its author has stopped, nobody else adds to the draft: anyone publishes or discards it, told whose it is and what it changes, before editing themselves. There is no asking for control. The tool layer enforces the hold and the draft's author on every write (D9). Locks on single fields were rejected: the draft and Publish are the site's | M/R |
| D65 | **An appointment can be a request the owner answers personally.** A new client asks through a form (who they are, the services they want, photos, the owner's policy agreed to, the times that suit), and the owner books the time in their own calendar; returning clients book in person, so a client fills it once. That is Forms' work, not Booking's (D55): a photo field, an Approval that keeps the text agreed to, and a Sites account's Forms tab opening on what came in, findable by name, since a request may be the owner's only record of a client. ROADMAP E55 | M/R |
| D66 | **A site's services are one list with a tab of its own.** Every place a service shows renders the list's entry, never wording of its own. The list is any business's: a service may have no price, a list no categories, and the tab's form is read from the contract and the site's guide. The canvas opens the tab's own forms, so nothing about a service changes in one place and not the other. ROADMAP E56 | M/R |
| D67 | **In Sites a form is Canopy's to build and its owner's to read; Forms is a product of its own.** Canopy builds a site's forms with the site, and Services, Booking, and members work with what they take in. Forms is to be sold publicly, not yet. The two stay one codebase, database, and login, parting in what each is sold as and in its chrome. What Sites builds on a site's forms is built for Sites and doesn't wait to be a general Forms feature | M/R |
| D68 | **A site's form is part of the site, with no embed.** It is written with the site's pages and drawn at build, so it shows while the portal is down and a choice can list the site's services. Only the sending reaches the portal, on Forms' submit route and through its checks, and the portal holds the form's fields so answers are checked and labeled. What runs in the visitor's browser is one package a site builds in. The embed stays Forms', for pages Canopy doesn't build. ROADMAP E45 | M/R |
| D69 | **Passwords stay, a passkey can sit beside one, and a Global Admin signs in only with a passkey** (Michael, 2026-11-21 and 2026-11-23). With the browser's password manager a saved password is one click, and it is what people expect to find, so it stays the way in and its reset by email the way back. A passkey is offered in the same autofill as the password, and after a password sign-in the browser saves one by itself where it can, so people move to passkeys without being asked to choose. Forms and Sites sign in the same way. **A Global Admin signs in only with a passkey**: a password, or its reset by email, would let whoever has it or reads Michael's mail into the operator console. A Global Admin who has lost every passkey is reset by Claude on the LAN, never from the web. A code emailed for every sign-in was considered and rejected: it is a trip to the mail app for someone whose browser would have filled the password. An emailed link for particular parts of a site's sign-in is not ruled out. A passkey belongs to `canopyds.com`, so one serves both hosts (D22), and the portal accepts it only from its own addresses: another service on `canopyds.com` is reached by a portal passkey only if it is built to be. The dev portal's passkeys belong to its own host. Revises D49 | M/R |

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
| `builder` | Node worker. Holds a working clone per site, applies ChangeSets, validates against the contract, runs preflight and `astro build`, writes `/srv/sites/<slug>/builds/<id>/`, flips symlinks, commits + pushes on publish. One queue per site. Pinned Node image (no nixpacks Node drift) |
| `nginx` | Static file server on each box, with one fixed config: a hostname is a link to its site's `current` (D60) |
| `postgres` | Existing Forms DB, extended |

Shared volume `/srv/sites` between builder and nginx.

### 4.3 Repos

| Repo | Contents |
|---|---|
| `canopy-sites` (formerly `Canopy-Forms`) | **The unified codebase**: `apps/portal`, `apps/builder`, `packages/site-contract`. **Public**: security comes from server-side enforcement (D9) rather than secrecy, and client data never enters it |
| `canopy-site-template` (new) | Astro 7 starter implementing the contract; new client sites start here |
| Client site repos | One per client; depend on `site-contract` by release tarball (D26) |
| `canopy-demo-site` (private) | The demo site (D23): a client site's content and design until a dedicated demo site replaces them |


### 4.4 Content contract (`packages/site-contract`)

Zod schemas → TypeScript types (sites), JSON Schema (MCP tool inputs), validation (builder). One definition, three consumers. Versioned; `Site.contractVersion` records what each repo installs (D24).

**Where content goes (D48).** Every request to make something editable takes the first of these that fits:

1. **Facts** are true wherever they appear: contact details, hours, prices, credentials. Each is a structured value in `site` or a typed collection, format-checked, lockable (D9), and rendered by templates wherever it's needed, inside wording the template owns ("Certification #2046976"). A display string a template splits or pattern-matches back into values is never how a fact is stored.
2. **Things the business has** outlive any one page: services, team, FAQs, reviews, events, case studies. Each gets a collection with fields of its own, so structured data, tool tabs, an owner's assistant, and the shared template find it by what it is.
3. **Page copy** is a page's headings, paragraphs, quotes, and buttons: `pages` sections.
4. **Cards** are groupings that mean nothing outside their section: a process's steps, a page's reasons or values, a homepage's doors.
5. **Templates** hold design: layout, art, the labels on facts, and the words around them. A template rule keyed to a content id or phrase is only for art (a hand-drawn mark on a word); the site's guide lists each one, and the text it is keyed to is locked and unmarked (D56).

A collection or field lands with the first site that renders it, named for what it is, and holds only what that site renders; another site's needs are a later minor version.

Collections (v1), from what the first client sites actually contain:

| Collection | Shape | Notes |
|---|---|---|
| `site` | singleton: name, tagline, contact (phone, email, address, geo), hours (structured **or** freeform string; optional from 0.6.0), socials, credentials (certifications with full and short names, number, where to verify; NAICS codes) | Contact fields **locked by default**. Credentials from canopyds.com (contract 0.4.0) |
| `pages` | per page: slug, title, hero (image, headline, sub), sections (heading, paragraphs, quote, button, cards), meta | Drives the canvas's address bar (D43). A card is a step, reason, or value (D48): eyebrow, title, text, button |
| `services` | nested categories → sections → groups → items, with price labels | Client 2's `services.json` was the reference shape |
| `schedule` | recurring weekly sessions joined to `classes` by slug | distinct from events |
| `events` | dated, one-off | |
| `announcements` | short, dated, optional expiry | |
| `gallery` | images with alt, width, height, order | |
| `team` | people, role, photo optional, bio; a short note shown with the role, and the group a person is shown in (Canopy's), both optional (0.7.0) | the note and group from a site with a board and a team |
| `reviews` | quote, attribution, source | |
| `faqs` | question, answer, in page order; an optional link shown after the answer, Canopy's like a button (0.7.0) | canopyds.com's contact page (contract 0.4.0); a page's section gives them a heading |
| `text` | long-form markdown pages | policies, bios |

What ships in each contract version is in `packages/site-contract`; collections land with the first site that renders them. Adding one is a minor version, and its field descriptions (`.meta()`) carry its guidance. Every list entry has a stable id and every field a kind and label (D36); a version that changes the shape of existing content ships a migration the builder runs when a site upgrades. The contract's length caps are absolute; each site's tighter limits come from its site guide (D40).

File layout in a site repo: one JSON document per collection at `src/content/<collection>.json`, parsed with the contract's schemas at build time so a violation fails the build; `src/assets/` for media. A site's design tokens are the `@theme` block in its own CSS, Canopy's to change (D29). No `canopy.json` (D24).

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
- System prompt = core guidance + quick edit persona (cached, shared by every site) + the site guide's prose from the published commit (D31; its front matter is enforced in code, D40) + the contract's JSON Schema. Where each rule goes: `QUICK_EDIT_GUIDANCE.md`
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

## 5. Data model

The schema is `apps/portal/prisma/schema.prisma`; what it doesn't show is the appendix of `docs/AGENT_CONTEXT.md`.

---

## 6. Portal UX (sites chrome)

Nav: **Quick Edit · Editor · Forms · Stats** (+ Account) (D28). Branding patterned on Canopy Forms (`docs/UX_PATTERNS.md` applies).

| Screen | Content |
|---|---|
| Quick Edit (home) | The chat; the draft with Preview and Discard; recently published, with Restore |
| Preview | The draft's changed page in a new tab, the site itself filling the window, its navigation moving between pages; the preview bar along the bottom carries Publish (D47), or who is making edits while that is someone else (D64) |
| Editor | The site on a canvas with a breakpoint switcher and an address bar; marked fields edit in place or open the quick edit popover (D35, D37, D43) |
| Tool tabs | Services first, being built now (D66). Gallery, Calendar, and later tools, siblings to Forms (D39), after the MVP (D54) |
| Stats | Umami: visitors, pageviews, top pages, referrers, date range. Read via Umami API with the site's `umamiWebsiteId` |
| Forms | What came in across the account's forms, with the forms and their builder one click away (D65, D67; ROADMAP E55). Until that is built, the Forms product's pages under Sites chrome |
| Operator | Accounts (existing) + Sites list, site detail (repo, hostnames, contract version, locked fields, API keys), the account's people (D63), help requests (D34), build log, token usage, acting as a client (D49) |

Unpublished changes and Preview sit in the Sites chrome, whichever tab made the changes (D38); Publish is on the preview page (D47). Forms-only accounts see the Forms UI at forms.canopyds.com; Sites accounts see the Sites chrome at sites.canopyds.com (D22).

---

## 7. Non-functional

| Area | Requirement |
|---|---|
| Preview latency | Target < 60 s from "send" to viewable preview for sites the size of today's client sites |
| Publish latency | Commit and push, then the symlink swap: seconds (D60). A push that fails publishes nothing |
| Restore | Seconds: a rebuild of a published version's content (§4.5). Builds retained: last N (default 5) |
| Editor responsiveness | Visitor performance is Canopy's by design (D29); the target is the editor's own speed. A text edit shows on the canvas with no server round trip; saving the draft is at most one; no editor read waits on GitHub (the builder answers from its clone); build status is pushed to the page, not polled (it is polled every 1 to 2 seconds as of 2026-11-09) |
| Isolation | One build queue per site; builds never touch `current` until complete |
| Blast radius | Client sites are served from Webber and Fox, with Cloudflare routing between them, and stay so when the builder serves production (D57). The portal, and with it editing and Forms, runs on Webber alone |
| Alerting | Michael is told when the portal or the builder is down, and when a nightly rebuild or a publish fails (Michael, 2026-11-10). Nothing does this as of that date (ROADMAP E49) |
| Security | The canvas and the preview page behind the portal session and sandboxed. API keys hashed. Locked fields enforced at validation. Rate limits on chat and MCP. No client input reaches a shell |
| Cost visibility | Tokens and estimated cost per account, per month, visible to operator from day one |
| Accessibility | Portal UI follows Forms patterns; site template inherits Client 1's documented invariants (its DESIGN.md and CLAUDE.md) |

---

## 8. Open questions

| # | Question | Default if unanswered |
|---|---|---|
| Q5 | Does the portal ever write to the site repo other than through the builder | No |
| Q6 | Client access to a repo in Canopy's org: read-only collaborator, or transfer on exit. A client who holds their own repo has it already (D61) | Read-only collaborator |


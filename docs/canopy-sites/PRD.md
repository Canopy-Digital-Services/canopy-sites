# Canopy Sites — Product Requirements

**Status:** Draft 1, 2026-10-15. Written from a planning session with Michael; every decision below traces to his input or to a recommendation he accepted. Nothing here is implemented yet. Companion: `docs/canopy-sites/ROADMAP.md`.

**Revision note (2026-10-15, after Claude Code review of E27):** D2 and §4.3 revised. Chrome is decided by the account's products, not the hostname; the unified codebase is the existing Forms repo restructured in place, not a new repo.

**For the agent reading this:** this repo (`canopy-sites` on GitHub, formerly `Canopy-Forms`) is the unified portal. Before starting any epic, read `docs/AGENT_CONTEXT.md` and `docs/canopy-sites/ROADMAP.md` (sequencing). The ROADMAP owns *order*; this doc owns *what and why*. If they disagree, fix the one that is wrong in the same session. Code wins over both.

---

## 1. Product

| | |
|---|---|
| Product | Canopy Sites: a hand-built static website plus hosting, maintenance, and updates for one flat monthly rate |
| ICP | Small businesses that need a website and will pay for high quality that is easy to update |
| Core promise | We build the site for free, you see it before you commit, then we handle everything (domain transfer is the one thing the client must help with) |
| Positioning | Local, reachable, we run our own stack. Not a template platform; not a WordPress shop |
| Pricing | **$175/mo** (design, build, hosting, SSL, backups, basic stats, updates). **+$75/mo** search & reporting (SEO work, AI-answer visibility, monthly report). "Build quote then $49/mo hosting-only" exists on the site but is not a featured product and gets no portal support in v1 |
| Public page | `canopyds.com/websites` (currently `dev.canopyds.com/websites`). Copy change required: "No dashboards to learn" → "Update through whatever channel works for you: text us, talk to the site editor, or open the full editor view" |

### Update channels (all converge on one pipeline)

| Channel | Who drives | v1 |
|---|---|---|
| Text Michael | Michael, using operator tooling (Claude Code + MCP on his subscription) | Yes — human process, no SMS automation |
| **Quick edit** (chat on the portal) | Client ↔ Claude API, running a per-client runbook | Yes — primary product surface |
| Portal editor view | Client, page tiles + design tokens + publish/rollback | Yes — "moderately featured", not WYSIWYG |
| Public MCP endpoint | Client's own LLM, per-account API key | Yes — same tools, guardrails enforced server-side |

"Quick edit" is the user-facing name. Do not market it as an AI chatbot or assistant.

---

## 2. Scope

### In v1

- Unified portal at `sites.canopyds.com`, same codebase as Canopy Forms (`forms.canopyds.com`), account products decide chrome
- Account model: Account (tenant) → Memberships → Users; one Plan per Account spanning both products
- Site model, build pipeline (builder + Caddy), preview per change, publish by atomic swap, rollback to last N builds
- Content contract: versioned Zod schemas shared by portal and site repos
- Change pipeline: ChangeSet → validate → preflight → preview build → publish (commit + swap)
- Quick edit chat (Claude API, base runbook + client overlay, token metering per account)
- Page tiles view; global design-token editing (colors, typefaces, heading sizes, radii); publish/rollback UI
- Public MCP endpoint with per-account API keys
- Stats: white-boxed Umami dashboard for all accounts
- Operator: accounts, sites, build log, token usage, edit-as-client
- Client 2 migrated to the template as testbed and client demo

### Out of v1 (explicit)

| Not building | Why / when |
|---|---|
| Full visual editor ("Figma meets WordPress") | Push users to quick edit instead |
| SMS automation | Text channel is Michael, by hand |
| Stripe / in-portal billing | FreshBooks (and PayPal) by hand; portal stores plan + status only |
| Invite flow / multi-user UI | Model supports it; UI shows one owner |
| Gallery management tool | Post-v1 nav item; data model already in the contract |
| SEO tier report | +$75 tier is a service, not software, in v1 |
| New-site onboarding automation | Michael creates sites in operator by hand |
| DNS / domain automation | Cloudflare by hand, per `deploy-to-webber.md` pattern |
| Client 1 migration | Fast-follow after Client 2 is stable on the new path |

---

## 3. Decisions

Source column: **M** = Michael stated it; **R** = Claude recommended, Michael accepted.

| # | Decision | Src |
|---|---|---|
| D1 | Editor edits **structured content**, never Astro source. The LLM proposes changes to schema'd collections; the site rebuilds | M |
| D2 | Forms is a sub-portal of the same codebase. One login, one Account, same data on both hosts, no redirects. **The account's products decide the chrome**, not the hostname: an account with `sitesEnabled` gets Editor · Forms · Stats on either host; every other account gets today's Forms UI exactly. The hostname only brands logged-out pages (login, signup, password reset; `/docs` requires sign-in, so it follows the account). Reason: Forms notification emails link to `forms.canopyds.com`, and NextAuth routes auth through one `NEXTAUTH_URL`, so a host-carried meaning strands users | M/R |
| D3 | Client has **publishing authority**, gated by a preview they can see first | M |
| D4 | Per-site Git repos on the GitHub org. Clients get repo access to back the portability claim | M |
| D5 | Content lives in the repo. Media lives in the repo (`src/assets`), optimized by Astro at build. No external object storage; stays off cloud storage | M/R |
| D6 | **Builder owns all builds** (preview and publish). One Caddy container serves every site from `/srv/sites/<slug>/current`. Coolify hosts the portal stack, not per-site builds. Fallback written into ROADMAP | R |
| D7 | Quick edit runs on a **Claude Platform API key**, pay-as-you-go. Subscription credits do not cover shared production use (support.claude.com article 15036540, checked 2026-10-15). Measure cost in practice before optimizing | R |
| D8 | Site-edit tools are an **MCP server**. Portal chat, operator Claude Code, and client LLMs all use the same tools | M |
| D9 | **Guardrails live in the tool layer**, not the runbook. A client's LLM never sees the runbook. Schema validation, locked fields, preflight, preview-before-publish, rate limits, scoped keys are enforced server-side | R |
| D10 | Runbook = **base** (per update type, product-wide, prompt-cached) + **client overlay** (schema, business facts, voice, constraints). Deterministic checks (dimensions, HEIC, type) run in code before the LLM | M/R |
| D11 | Membership table now, single-owner UI now. Avoids touching every data-access function later | R |
| D12 | Billing: portal stores `planCode`, `status`, free-text `billingRef`. Operator sets them. No invoice UI | M/R |
| D13 | Template pinned to **Astro 7**. Client 2 upgraded as part of migration | M |
| D14 | Client 2 migrates on `main` directly; site is stable with near-zero traffic | M |
| D15 | Stats = white-boxed Umami via its API, nav alongside Editor and Forms, all accounts | M |
| D16 | **No auth library.** Sessions are the portal's own database rows (`src/lib/session.ts`, E28), replacing NextAuth after its maintenance went security-fix-only; Better Auth's organization and API-key plugins did not fit (they want to own the tenant table; keys belong to users or orgs, not sites). Membership and E34's keys are built by hand. Revisit an auth library only for E34's "OAuth later" (Better Auth's OAuth-provider and MCP plugins). Security assessment in `docs/epics/epic-28-account-audit-membership.md` (was Q7) | M/R |
| D17 | **Vitest**, with database tests against a real migrated `*_test` Postgres; never mock Prisma. Required for every E31 guardrail. Cross-project rules on the Engineering collective's Quality Assurance page (was Q8) | M/R |
| D18 | **Two products: Forms (standalone) and Sites.** Gallery, Calendar (the `events` and `schedule` collections), and later editors are Sites features: routes in `apps/portal` editing contract collections through the ChangeSet pipeline, not products or repos. So `Plan.sitesEnabled` stays one boolean rather than a product-entitlement model | M |

---

## 4. Architecture

### 4.1 Request path (after cutover)

```
Internet → Cloudflare → cloudflared tunnel → Traefik (coolify-proxy)
   ├── sites.canopyds.com / forms.canopyds.com → portal (Next.js)
   ├── <client-domain>                         → Caddy → /srv/sites/<slug>/current
   └── preview-<slug>.sites.canopyds.com       → Caddy → /srv/sites/<slug>/preview   (auth-gated)
```

Unchanged: Cloudflare, tunnel, Traefik, webber, Umami, Postgres, Coolify as the orchestrator for the portal stack.

### 4.2 Portal stack (Coolify, on webber)

| Service | Role |
|---|---|
| `portal` | Next.js app (this repo). Admin UI, operator, quick edit, MCP endpoint, Caddy config writer |
| `builder` | Node worker. Holds a working clone per site, applies ChangeSets, validates against the contract, runs preflight and `astro build`, writes `/srv/sites/<slug>/builds/<id>/`, flips symlinks, commits + pushes on publish. One queue per site. Pinned Node image (removes the nixpacks Node drift that broke Client 1) |
| `caddy` | Static file server, hostname → folder. Config generated by the portal from the `Site` table, reloaded via Caddy admin API |
| `postgres` | Existing Forms DB, extended |

Shared volume `/srv/sites` between builder and caddy.

### 4.3 Repos

| Repo | Contents |
|---|---|
| `Canopy-Forms` → renamed `canopy-sites` on GitHub | **The unified codebase**, restructured in place: `git mv` the app into `apps/portal`; add `apps/builder`, `packages/site-contract`. History, PRs, deploy keys, Coolify apps, DB, env and secrets all stay. GitHub redirects the old URL. **Stays public** (decided 2026-10-15): history scanned clean of live secrets, security comes from server-side enforcement (D9) rather than secrecy, and client data never enters this repo |
| `canopy-site-template` (new) | Astro 7 starter implementing the contract; new client sites start here |
| `client2`, `client1`, future client repos | One per client; depend on `site-contract` by git tag |

The local `canopy-sites` folder that held only these docs is retired; the docs live in this repo at `docs/canopy-sites/`.

`site-contract` packaging is the one open structural question — see §8.

### 4.4 Content contract (`packages/site-contract`)

Zod schemas → TypeScript types (sites), JSON Schema (MCP tool inputs), validation (builder). One definition, three consumers. Versioned; `Site.contractVersion` pins what each repo implements.

Collections (v1), from what Client 2 and Client 1 actually contain:

| Collection | Shape | Notes |
|---|---|---|
| `site` | singleton: name, tagline, contact (phone, email, address, geo), hours (structured **or** freeform string), socials | Contact fields **locked by default** |
| `pages` | per page: slug, title, hero (image, headline, sub), copy blocks, meta | Drives the page tiles |
| `services` | nested categories → sections → groups → items, with price labels | Client 2 `services.json` is the reference shape |
| `schedule` | recurring weekly sessions joined to `classes` by slug | Client 1 `sessions`; distinct from events |
| `events` | dated, one-off | |
| `announcements` | short, dated, optional expiry | |
| `gallery` | images with alt, width, height, order | |
| `team` | people, role, photo optional, bio | Client 1 `coaches` |
| `reviews` | quote, attribution, source | Client 2 reviews section |
| `text` | long-form markdown pages | Client 2 policies, bios |
| `tokens` | colors, font stacks, heading scale, radii | `tokens.json` → generated CSS custom properties consumed by `global.css` `@theme` |

File layout in a site repo: `src/content/<collection>/…` via Astro content-layer `file()`/`glob()` loaders; `src/assets/` for media; `tokens.json` at root; `canopy.json` with slug, contract version, locked fields.

### 4.5 Change pipeline

```
source (chat | editor UI | MCP | operator)
  → ChangeSet { ops: JSON patch on collections, media: staged uploads }
  → validate against contract            (reject, with reasons)
  → preflight media                      (resize ≤ max edge, strip EXIF, HEIC→JPEG, size cap, moderation)
  → builder: apply to working clone → astro build → /builds/<id>
  → preview symlink → client reviews at preview hostname
  → publish: commit + push to repo main → current symlink → prune to last N
  → rollback: current symlink → previous build (no rebuild)
```

Locked fields reject at validation regardless of source. Preview is auth-gated (portal session or signed URL). Builds are never pointed at until complete, so a failed build cannot affect the live site.

### 4.6 Quick edit

- Claude API with tool use; tools are the same implementations the MCP endpoint exposes, called in-process
- System prompt = base runbook (cached) + client overlay (stored on `Site`, operator-editable) + contract excerpt for the collections in play
- Preflight runs before tool calls reach the LLM; the LLM handles judgment only (intent, voice, which block, appropriateness)
- Cheaper model for classification/moderation, stronger model for edits; configurable per deployment
- Every conversation stores messages, tool calls, tokens in/out, model. Per-account monthly token budget; operator sees usage
- Entry points: one global chat on the site's editor home, and the same chat scoped to a page from its tile

### 4.7 Public MCP endpoint

Streamable HTTP at `sites.canopyds.com/mcp`. Per-account API keys (hashed, scoped to one site, revocable, last-used tracked), in the portal's own `ApiKey` table like its sessions (D16). OAuth later. Rate-limited per key. Same tools, same guardrails. Tools never publish without an explicit `publish` call, and `publish` requires a previewed ChangeSet.

### 4.8 Hostnames and DNS

- `*.sites.canopyds.com` wildcard proxied CNAME → tunnel, plus wildcard ingress rule, so preview hostnames need no per-site DNS. Verify once on webber; `deploy-to-webber.md` documents that bare `*.canopyds.com` ingress without a DNS record does not resolve
- Client production domains: per-client zones as today (Cloudflare registrar + nameservers), CNAME to tunnel

---

## 5. Data model (additions to Forms schema)

| Model | Fields (abridged) | Notes |
|---|---|---|
| `Membership` | userId, accountId, role (`OWNER` \| `MEMBER`), createdAt | Replaces `User.accountId` 1:1. `@@unique([userId, accountId])` |
| `Plan` (extend) | + `sitesEnabled Boolean`, + `analyticsTier` enum, + `monthlyTokenBudget Int?` | Typed columns per existing pattern; seed `SITES` plan code |
| `Account` (extend) | + `status` (`ACTIVE` \| `PAST_DUE` \| `CANCELLED`), + `billingRef String?` | |
| `Site` | accountId, slug, name, repoUrl, defaultBranch, productionHostnames[], contractVersion, status, umamiWebsiteId, runbookOverlay (text), lockedFields[], maxBuildsRetained | One account may own several sites |
| `Build` | siteId, kind (`PREVIEW` \| `PUBLISH`), status, commitSha, outputPath, log, startedAt, finishedAt, changeSetId | |
| `ChangeSet` | siteId, source, createdByUserId?, apiKeyId?, summary, ops (JSON), status (`DRAFT` \| `PREVIEWED` \| `PUBLISHED` \| `DISCARDED` \| `FAILED`), previewBuildId, publishedBuildId | |
| `Conversation` | siteId, userId, model, messages (JSON), tokensIn, tokensOut, costEstimate, changeSetIds[] | |
| `ApiKey` | accountId, siteId, keyHash, label, scopes[], lastUsedAt, revokedAt | |

Ownership enforcement stays in `src/lib/data-access/*` by `accountId`, now resolved through Membership. `getCurrentAccountId()` becomes `getCurrentAccountId()` for the single membership in v1, with the many-membership path stubbed.

---

## 6. Portal UX (sites chrome)

Nav: **Editor · Forms · Stats** (+ Account). Branding patterned on Canopy Forms (`docs/UX_PATTERNS.md` applies).

| Screen | Content |
|---|---|
| Editor home | Page tiles (thumbnail, title, last published). Global quick-edit chat. Design tokens panel. Pending ChangeSets with Preview / Publish / Discard. Build history with Rollback |
| Page view | Tile expanded: quick-edit chat scoped to that page; structured view of its blocks (read-mostly in v1) |
| Tokens panel | Colors, typefaces (from an allowed font list), heading scale, radii. Changes are a ChangeSet like any other |
| Stats | Umami: visitors, pageviews, top pages, referrers, date range. Read via Umami API with the site's `umamiWebsiteId` |
| Forms | Existing Forms UI under Sites chrome |
| Operator | Accounts (existing) + Sites list, site detail (repo, hostnames, contract version, overlay editor, locked fields, API keys), build log, token usage, "edit as client" |

Forms-only accounts see today's Forms UI on either hostname. Sites accounts see the Sites chrome on either hostname.

---

## 7. Non-functional

| Area | Requirement |
|---|---|
| Preview latency | Target < 60 s from "send" to viewable preview for sites the size of Client 2/Client 1 |
| Publish latency | Symlink swap: seconds. Commit + push async, failure surfaces in operator but does not un-publish |
| Rollback | Instant, to any of last N retained builds (default 5) |
| Isolation | One build queue per site; builds never touch `current` until complete |
| Blast radius | Caddy down = all sites down. Same as Traefik/tunnel today; not widened |
| Security | Preview hostnames auth-gated. API keys hashed. Locked fields enforced at validation. Rate limits on chat and MCP. No client input reaches a shell |
| Cost visibility | Tokens and estimated cost per account, per month, visible to operator from day one |
| Accessibility | Portal UI follows Forms patterns; site template inherits Client 1's documented invariants (DESIGN.md / CLAUDE.md there) |

---

## 8. Open questions

| # | Question | Default if unanswered |
|---|---|---|
| Q1 | `site-contract` packaging: separate repo with git tags, or a tarball published from the portal monorepo | Separate repo, git tags |
| Q2 | Preview auth: portal session cookie on `*.sites.canopyds.com`, or signed URL per build | Signed URL per build, 7-day expiry |
| Q3 | Image moderation: vision call per upload, or defer to operator review for v1 | Vision call via cheaper model; operator notified on reject |
| Q4 | Allowed font list for the tokens panel | Fontsource-hosted families only (no external font requests, per Client 1 pattern) |
| Q5 | Does the portal ever write to the site repo other than through the builder | No |
| Q6 | Client access to the GitHub repo: read-only collaborator, or transfer on exit | Read-only collaborator |
| Q9 | E30 hosting: builder + Caddy (D6), or Cloudflare Pages direct upload (atomic deploys, previews, instant rollback built in; trades against "we run our own stack") | D6 stands; revisit before E30 |

---

## 9. References

- `canopyds.com/websites` copy and pricing (read 2026-10-15)
- Canopy Forms `docs/AGENT_CONTEXT.md`, `prisma/schema.prisma` v4.14.1
- `client2` and `client1` repos (structure, data files, image handling, deploy notes)
- Anthropic support article 15036540, "Use the Agent SDK with your Claude plan" — credit paused, individual-use only

# Canopy Portal Agent Context

Authoritative reference for coding agents working in this repo.

**Layout.** npm workspaces. The Next.js app that serves Canopy Forms and the Canopy Sites portal is `apps/portal/`; `apps/builder/` is the site build service (its own README) and `packages/site-contract/` the content contract every site repo installs (its own README; PRD D26). **Code paths in this doc are relative to `apps/portal/`.** Paths under `docs/`, plus `package.json`, `package-lock.json`, `CHANGELOG.md`, and the compose files, are at the repo root. Canopy Sites is specified in `docs/canopy-sites/PRD.md` and sequenced in `docs/canopy-sites/ROADMAP.md`.

**Code wins over docs.** Verify anything here against the file before relying on it. Source-of-truth order: code > `prisma/schema.prisma` > `prisma/migrations/` > `CHANGELOG.md` > docs.

Current version: root `package.json` → `version`. Release history: `CHANGELOG.md`. Epic table: `docs/epics/README.md`.

**Editing this doc.** It is written for agents, so density matters more than flow. Follow the rules in `docs/DOC_MAINTENANCE.md` before adding to it.

---

## 1. Product & stack

Privacy-first embedded forms for static websites. Users build forms in a visual editor, embed them with two lines of HTML, and manage submissions in a dashboard with email notifications. Audience: small business owners and freelancers running static sites with no backend.

The same app is the portal for Canopy Sites clients (hand-built sites maintained for a monthly rate), who get an Editor and Stats alongside Forms. See "Products and chrome" in section 2.

Next.js 16 · React 19 · Prisma 7 · TypeScript 5 · Tailwind v4 · Vitest 4 · Node 20. No auth library: sessions are ours (`src/lib/session.ts`, Epic 28).

**Read the matching `docs/tools/*.md` before writing code against any of these.** All are recent majors with breaking changes from older patterns: `prisma-7.md`, `nextjs-16.md`, `react-19.md`, `tailwindcss-v4.md`, `docker.md`. Index: `docs/tools/README.md`.

If outdated training data led you to a wrong command, flag, or API, correct the relevant tool doc in the same session. The same rule covers live systems: when direct observation contradicts a claim in any doc (this one included), fix that doc in the same session per `docs/DOC_MAINTENANCE.md`.

---

## 2. Architecture & invariants

### Layers

Identify which layer a change touches before starting.

| Layer | Purpose | Location |
|-------|---------|----------|
| Admin UI | Editor, submissions, settings | `src/app/(admin)/*` |
| Embed script | Client-side renderer | `embed/src/*` → `public/embed.js` |
| Hosted forms | Public pages at `/f/[formId]` | `src/app/f/[formId]/page.tsx` |
| Embed API | Serve definitions, accept submissions | `src/app/api/embed/[formId]/route.ts` |
| Submit API | Accept submissions (white-box HTML) | `src/app/api/submit/[formId]/route.ts` |
| Single-field submit | One field per request | `src/app/api/submit/[formId]/[fieldName]/route.ts` |
| Operator console | Platform admin, metadata only | `src/app/operator/*` |

### Data model

- **Form-first**: `Account → Form → Field / Submission`. A Sites account also has at most one `Site` (unique `accountId`, PRD D19), allowed only on a plan with `sitesEnabled`; an account that owns a site cannot be deleted (`onDelete: Restrict`), so reassign the site first.
- Forms own `allowedOrigins[]`. Origin control is per form, not per account.
- Uniqueness: `@@unique([accountId, slug])` on Form, `@@unique([formId, name])` on Field.
- Fields are **relational rows** with an explicit `order` and enum `FieldType`. Never JSON blobs.
- Publishing needs at least one field: `toggleFormPublished` refuses without one, since a submission stores only fields. The editor's Fields step and the Publish tab's button hold until there is one.
- Every Account has a `Plan` (FK on `planCode`). Entitlements are typed columns on `Plan` (`maxPublishedForms`, `sitesEnabled`), and the catalog is seeded by migration, not editable at runtime. Enforce through `getAccountEntitlements` (`src/lib/data-access/entitlements.ts`). Never re-implement the comparison at a call site, and never compare plan codes.
- `Account.requiresPlanResolution` is set when a plan change drops the cap below the account's live published count. While set, the admin layout renders `PlanResolutionDialog` as a non-dismissible blocker, cleared only by a successful `resolvePlan`.

### Auth & ownership

- Email and password sign-in, self-service signup, server-side sessions in the `sessions` table (`src/lib/session.ts`; behavior in `docs/ACCOUNT_OPERATIONS.md`). Get the session through `requireAuth`, `getCurrentAccountId`, or `requireGlobalAdmin`, or `getSession` where signed-out is a normal answer. Never read the cookie or query `sessions` anywhere else, and never add a second way to authenticate a request without a database test for it. Credential endpoints (sign-in, signup, reset request, password change, claim) are throttled in `src/lib/auth-throttle.ts`; a new one gets a throttle there. A user's password is null until the owner of an account the operator linked claims it (PRD D49, `src/lib/claim.ts`); sign-in treats null as a wrong password.
- Account is the tenant and is never surfaced in the UI. Users reach it through `Membership` (`OWNER | MEMBER`); v1 gives each user exactly one, as `OWNER`. Resolve a user's account only through `src/lib/data-access/memberships.ts` (`getCurrentAccountId` for the session user; `sessionAccountId` and `sessionCanUseAccount` where signed-out or another account is a normal answer), and delete accounts only through `deleteAccountAndSoleMembers`: an Account delete does not cascade to Users. Never query `memberships` for a session anywhere else: a Global Admin acting as a client (PRD D49, `session.actingAs`) resolves to the client's account only through those, and a direct query would miss it. Anything only the owner may do checks `isActing` (`src/lib/act-as.ts`); behavior in `docs/ACCOUNT_OPERATIONS.md`.
- **Ownership is enforced server-side** by direct `accountId` comparison in `src/lib/data-access/*` and `src/actions/*`. Never trust client-side ownership logic.
- Sessions are per host: auth cookies are host-only, so signing in on `forms.` does not sign you in on `sites.`.
- **Each account has a home host**, the one its emails use (`appUrlFor`): Sites accounts on `SITES_URL`, every other account on `NEXTAUTH_URL` (PRD D22). `requireHomeHost` (`src/lib/product.ts`) in the admin and operator layouts sends a signed-in account on the other configured host home, so a new signed-in layout outside `(admin)` calls it too; `signInAction` on the other host checks the password and starts no session there: a Forms account gets `homeUrl` (the login page links to it), a Sites account gets a one-time handoff (`createSessionHandoff` in `src/lib/session.ts`) that the login page's "Go to Canopy Sites" modal posts to `/auth/handoff` on the Sites host, which accepts only the configured Forms origin. Signup lives on the Forms host. With `SITES_URL` unset or equal to `NEXTAUTH_URL` nothing routes.
- **Every other redirect after sign-in, sign-out, and account deletion is a relative path** (`/`, `/login`). The home-host redirect is the only absolute one, and its destination comes from configuration. Never build a redirect or a post-auth destination from the request's `Host`.
- **Links emailed to an account come from `appUrlFor(entitlements)`** (`src/lib/product.ts`): `SITES_URL` for Sites accounts, `NEXTAUTH_URL` otherwise, with `productNameFor` for the product name in the copy. Never build an emailed link from request headers: a reset link built from `Host` would hand a victim's token to whatever domain the requester sent.

### Products and chrome

- **The account's products decide the signed-in UI, never the hostname.** `productFor(entitlements)` (`src/lib/product.ts`, from `sitesEnabled`) picks the chrome in `src/app/(admin)/layout.tsx` and the browser title and favicon (`productMetadata`) there and in the operator layout: Sites accounts get the Sites wordmark, `SitesNav` (Quick Edit · Editor · Forms · Stats), and the Sites title and favicon on every page, `/forms` and `/docs` included; every other account gets the Forms chrome, title, and favicon. Copy that names the product (docs page titles, the submission email footer) uses `productNameFor`. `sitesEnabled` is the plan's column, true only on `SITES`.
- Sites-only routes (`/quick-edit`, `/editor`, `/stats`) live in `src/app/(admin)/(sites)/`, whose layout 404s for accounts without Sites.
- Apart from routing an account to its home host, the hostname only brands logged-out pages (login, signup, password reset): `getHostProduct()` in `src/lib/product.ts` maps `sites.*` and `sites-*.*` to Sites, and the auth layout passes it to `AuthBrandMark` through `HostProductProvider` and to `productMetadata` for the title. It is branding, not access control.

### Validation

Three layers, all required:

1. HTML `maxLength` on inputs, from `MAX_LENGTHS`.
2. Per-field rules, written once in `validateField` (`embed/src/validation.ts`): the embed runs them before it submits, and `src/lib/public-submit.ts` runs the same function on every submission. A type's rules and length caps go there, never in `public-submit.ts` or a route file.
3. Server-only guardrails in `src/lib/public-submit.ts`, shared by the embed and submit routes: the 64KB payload cap, the gate order below, and the body's keys. The body must be a JSON object whose every key is a field's name or `form.honeypotField`; any other key is a 400 with the key in `fields`, beside the fields' own errors. It stores only the fields' answers (never the honeypot, which is read from the body first), rewritten as checked: an email trimmed, a phone's number as E.164.

Every answer has one shape, so no part of a submission can carry more than its cap: one string (Number a number too), an Approval `true`, `false`, or `"on"` (what a checked HTML checkbox sends), Choose several a list of strings naming each option once, and a Name, Address or Phone an object of only the field's parts, each a string (a Phone's are its number and, when it asks for one, its extension). A new type gets a shape and a cap in `validateField`, or anything up to 64KB gets stored through it.

Length caps (`MAX_LENGTHS` beside `validateField`): every type that takes one piece of text is held to its cap whatever the field stores. The one length setting is a Paragraph's character limit (`characterLimit`), taken only as a whole number from 1 to the Paragraph cap; the form counts it down rather than stopping typing at it, and `validateField` refuses an answer past it. Name and Address parts are capped per part beside their rules (`embed/src/name.ts`, `embed/src/address.ts`), and an "Other" answer in `embed/src/choices.ts`. The embed sets each cap as the input's `maxlength` (number and date inputs ignore it), so a visitor can't type past what the server would refuse.

Dates compare as `YYYY-MM-DD` strings, never through `new Date` (a date-only string parses as UTC midnight, the previous day west of UTC). A bound of `"today"` is the visitor's own date in the embed; the server can't know the visitor's zone, so it accepts any date that is today somewhere (`anywhereToday`, UTC-12 to UTC+14).

**Two validation dialects. Do not cross them.** Embed forms use native HTML5 popups via `setCustomValidity()`, one error at a time. Admin and auth forms use custom inline validation with the touched/submitted pattern and `noValidate` on the form.

### Public API contracts

`handlePublicSubmit` in `src/lib/public-submit.ts` is the full gate order, shared by the **embed and submit routes only**: type gate → published gate → origin → rate limit → `stopAt` → `maxSubmissions` → payload size → keys and field validation → honeypot → store the fields → queue email. Add a new submission-side rule here so both routes get it. The embed route's GET carries its own copies of the type and published gates.

- **Embed API**: GET returns the embed-safe definition plus ordered fields. POST runs the full gate order. Rate limits: GET 60/min, POST 10/min per hashed IP. The IP comes from `clientIPFromHeaders` (`src/lib/validation.ts`), which trusts Cloudflare's `CF-Connecting-IP` first because the origin is reachable only through the tunnel; never put a client-controlled header such as the first `X-Forwarded-For` entry ahead of it, or every rate limit becomes bypassable.
- **Submit API**: POST only, for white-box HTML forms that never fetch a schema.
- **Single-field submit** (`/api/submit/[formId]/[fieldName]`): does **not** use the shared module. It reimplements only origin, rate limit, and honeypot, validates nothing but required-presence on the one field, and has no type, published, `stopAt`, or `maxSubmissions` gate. Treat its stored values as unvalidated: `src/lib/submission-email.ts` re-runs `isValidEmail()` before using a submitted address as `Reply-To`, which is what blocks CRLF header injection. Any new gate added to `public-submit.ts` has to be added here separately or it does not apply to this route.
- Origin: `validateOrigin(origin, form.allowedOrigins, referer)`. Localhost is always allowed.
- **Framing.** `next.config.ts` sends `X-Frame-Options: DENY` and `frame-ancestors 'none'` on every path except `/f/*`, `/api/embed/*`, `/api/submit/*`, and `/embed.js`, which other sites use, and `/demo` and `/canvas/*`, which send their own. A new route meant to be loaded by other sites must be added to that exclusion; everything else stays unframeable (clickjacking). A config header replaces a route's header of the same name, so a route that needs its own CSP must be excluded there too.
- **`/demo`** (`src/app/demo/[[...path]]/route.ts`) serves the demo site's published build (PRD D23) from the builder. It is client-editable content on the portal's origin, so every response carries `Content-Security-Policy: sandbox ...` (an opaque origin that can't use the portal session) plus CORS for its fonts and module scripts. Never drop the sandbox or add `allow-same-origin`. A fingerprinted `_astro/` asset only the draft's build has is served from it, because the canvas's requests carry no session.
- **`/canvas/[siteId]/...`** (`src/app/canvas/[siteId]/[[...path]]/route.ts`) is a page of any site as the Editor's canvas and the preview page show it (PRD D47), for members of the site's account only (`previewableSite`; 404 for anyone else). With a draft, the newest build of the draft; with none, the live page. It injects a `<base>` at the page's live address (`src/lib/site-live.ts`: `/demo` for the demo, `https://` plus the first production hostname for a client site, never the request's host), so the page's styles, fonts, and scripts load from where the site is live, plus a flag on `<html>` and the bridge (`src/lib/canvas-bridge.ts`): `data-canopy-editor` and edit mode, or with `?view=preview` `data-canopy-preview` and view mode (no marks). Every response carries the same sandbox CSP as `/demo`. The portal fetches the HTML with the session and shows it in a sandboxed srcdoc frame; `X-Canopy-Build` names the draft build shown. The bridge only reports, navigates, and edits text in place; every write is a server action through the tool layer.
- **`/preview/[siteId]/...`** (`src/app/preview/[siteId]/[[...path]]/`) is the preview page (PRD D47): the site filling a tab of its own, outside `(admin)` so with no Sites chrome, and the preview bar holding the only Publish. Publish sends the build the page showed (`publishPreview`), and the tool layer refuses any other (`publishChange`). Signed-in members only, behind `requireHomeHost`. Every preview link (the Sites chrome, Quick Edit, later MCP) is this page.
- **403 codes**: `published === false` returns `code: "FORM_INACTIVE"`. A HOSTED form returns `code: "FORM_HOSTED_ONLY"` from the embed GET always, and from a POST unless the request comes from the portal's own origin (`isAppOrigin` in `src/lib/validation.ts`: Origin, else Referer, equal to `NEXT_PUBLIC_APP_URL`'s origin). The hosted page submits through the embed route like any embed, so a POST gate without that exception refuses every hosted form. The embed script pattern-matches these codes to render dedicated states, so changing a code breaks the embed.
- A filled honeypot **does not reject**. It stores the submission with `isSpam: true`, which is why `maxSubmissions` counts non-spam rows only and spam skips the notification email.
- Submission limits return 403 and raise a `LIMIT_DEADLINE_REACHED` or `LIMIT_MAX_REACHED` notification.
- Notification emails: one per address in `form.notifyEmails[]` (max 5). `form.emailIncludeResponses` off (default) sends metadata only; on lists every submitted value and sets `Reply-To`. Content lives in `src/lib/submission-email.ts`, not `email.ts`. The dashboard link is per recipient, included only for addresses belonging to a `User` on the form's account.

### Env vars in client components

Client components cannot reliably read runtime env vars. Server component reads env, passes props (see the `apiUrl` prop in `src/app/(admin)/forms/[formId]/edit/page.tsx`). `NEXT_PUBLIC_*` is baked into the bundle at **build time** and cannot change without a rebuild. `validateOrigin()` uses `NEXT_PUBLIC_APP_URL` to identify the dashboard host.

---

## 3. Paths with rules attached

Everything else is discoverable with `ls`. These carry constraints:

| Path | Rule |
|------|------|
| `embed/src/*` | Source of truth for the embed. **Never edit `public/embed.js` by hand.** |
| `src/lib/field-types.ts` | Field type registry. The `Record<FieldType, string>` map fails the build if a type is missing. |
| `src/lib/public-submit.ts` | Where submission gates and server-only guardrails belong; per-field rules live in `embed/src/validation.ts`. Note the single-field route's divergence in section 2. |
| `src/lib/data-access/*` | Ownership checks live here. Queries bypassing these lose enforcement. |
| `src/lib/site-tools/*` | The only path for edits to a site's content (PRD D8, D9): ownership, the lane (the contract's `laneViolations`: Canopy's fields, the site's locks and fixed lists as address patterns, PRD D50), the contract with the site guide's limits, counts, and refused phrases, and rate limits are enforced here for every source (Editor, quick edit, later MCP). A lock or fixed list that isn't an address refuses every edit rather than letting one through. Every write returns what it changed, field by field (`changes.ts`), and what the guide's `avoid` flags in text it changed; quick edit's tool result carries both to the model. A refusal that is Canopy's call (the lane, a refused phrase) is a `ToolError` with `outOfLane`, on which quick edit tells the model to draft a request instead of trying another way. Help requests (`help-requests.ts`, PRD D34): quick edit's `request_help` drafts one, the owner sends or dismisses it from a card (`HelpRequestCard`), a sent one emails every Global Admin from the Sites sender with the owner as Reply-To, and the operator closes it with an optional note emailed back; one sent while acting emails nobody. Text quick edit won't put on the site is drafted with `refused` set, and reaches Canopy, marked Refused, only if the owner sends it. Quick edit's prompt is `BASE_RUNBOOK` (`src/lib/quick-edit/runbook.ts`) plus the prose of the site's `SITE_GUIDE.md`, from the draft view. Each guard has a database test that fails without it. |
| `src/actions/*` | Server actions, each enforcing ownership internally. |
| `src/components/ui/` | shadcn primitives. Extend, do not fork. |
| `src/components/patterns/` | Layout patterns (`page-header`, `data-table`, `settings-section`, `right-panel`, ...). Compose these before writing new layout. |
| `prisma/migrations/` | Append only. See section 5. |
| `content/docs/*.md` | User-facing help served at `/docs`. Registered in `content/docs/meta.ts`. |

Routes: `/` redirects to the account's home or `/login`. Admin lives under `/forms`, `/account`, `/docs`, plus `/quick-edit`, `/editor`, and `/stats` for Sites accounts. `/editor` is the visual editor (Epic 33): the account's site on a canvas, marked fields edited in place or through the quick edit popover, saved to the site's draft (`saveCanvasEdits`); a site with no live address (no production hostname) sees an empty state. `/preview/[siteId]` is where a draft is previewed and published, and `/demo` is the public demo site (section 2, Public API contracts). Operator console is `/operator/accounts`, `/operator/sites`, and `/operator/requests` (what owners sent Canopy from Quick Edit, open first, `?site=` for one site; PRD D34); a site arrives by Link a site (PRD D49). `/claim` is where a linked site's owner sets their first password, and `/claim/image/[file]` draws the picture in its link preview, named by site and cached by Cloudflare (`src/lib/claim-image.tsx`). Public form pages are `/f/[formId]`. **Home is per account: resolve it with `getHomePath(accountId)` or `homePathFor(entitlements)` (`/quick-edit` for Sites, `/forms` otherwise). Never hardcode `/forms` as home, and never link to `/`.** Client components that cannot resolve it (login, signup) navigate to `/` and let the server redirect. Links back to the forms list are still `/forms`.

### When to read which doc

| Document | Read it when |
|----------|--------------|
| `docs/VERIFICATION_CHECKLIST.md` | **Before committing.** Which checks to run per change type, and when to escalate to the user for manual verification. |
| `docs/tools/*.md` | Before writing code against Prisma, Next.js, React, Tailwind, or Docker. |
| `docs/UX_PATTERNS.md` | Before building or modifying any UI. |
| `docs/ACCOUNT_OPERATIONS.md` | Touching auth flows, account lifecycle, sessions, or deletion. |
| `docs/PRISMA_MIGRATIONS.md` | Deployment, migration failures, or Dockerfile changes. |
| `docs/epics/README.md` | What shipped in which version. |

When writing a plan, task list, or subagent brief, include the line "Before starting, read `docs/AGENT_CONTEXT.md`" so the agent picking it up gets this context.

---

## 4. Commands & verification

Root `package.json` scripts delegate to the portal workspace (`npm run build`, `lint`, `test`, `embed:build`, `db:generate`, `db:migrate -- --name x`, `db:seed`); the portal's own scripts are in `apps/portal/package.json`. Dependencies are added to the workspace that uses them (`npm install <pkg> -w @canopy/portal`); npm `overrides` only work in the root `package.json`. The non-obvious scripts:

- `npm run embed:build` rebuilds `public/embed.js` from `embed/src/*`. Required after any embed change.
- `npm run fonts:sync` downloads the self-hosted font set from Fontsource (`npm pack`, not installed) into `public/fonts/`, `src/lib/self-hosted-fonts.json`, and the admin fonts in `src/app/fonts/`. Output is committed. The catalog is the curated picker lists plus `EXTRA_FAMILIES` in `scripts/sync-fonts.ts`; to self-host a new font, add it there and rerun. `-- --update` refetches everything.
- `npm run db:push` exists. **Never run it.** It mutates the database without creating a migration, so the change never reaches deployed environments.

`npm run build`, `npm run lint`, and `npm test` must pass before committing. **`docs/VERIFICATION_CHECKLIST.md` is the quality gate** and specifies which further checks apply to which change type.

**Tests.** `npm test` runs Vitest in `apps/portal` (config `vitest.config.mts`). `*.test.ts` beside the code are unit tests with no I/O. `*.db.test.ts` run against a `*_test` database that `test/db-global-setup.ts` creates and migrates with `prisma migrate deploy`; `test/db.ts` has `resetDatabase` and factories, and every helper refuses a database whose name does not end in `_test`. Run tests in the container (`docker exec canopy-portal npm test`), where the Postgres host resolves. Never mock Prisma: the bugs worth catching are in queries, constraints, and cascades. What must have a test: session and sign-in decisions, account resolution and membership, entitlements, deletion cascades, and from E31 every guardrail. A bug fix in those areas lands with the test that reproduces it. Vitest stays on 4.x while the containers run Node 20 (5.x needs 22.12+); bump it with the Node 24 move.

Local dev: the root `docker-compose.dev.yml` (project `canopy-sites`) runs `postgres:17-alpine` (container `canopy-portal-db`) plus the portal (container `canopy-portal`) on `http://localhost:3006`, using `apps/portal/Dockerfile.dev` with the repo root mounted for hot reload and `apps/portal` as the working directory, so `docker exec canopy-portal <cmd>` runs in the app. `http://sites.localhost:3006` resolves to the same app with the Sites host branding. `DATABASE_URL` is hardcoded in the compose file's `environment:` block, which overrides dotenv files; SMTP and the other optional vars load from `.env` (via `env_file`). Copy `.env.example` to `.env` for the template. The container flow does not read `.env.local`. The same compose file runs the site builder (container `canopy-builder`), which builds from bare repos under `~/repos/.canopy-local-remotes` (a Site's `repoUrl` is then `/remotes/<name>.git`; pushes from a local publish stop there). Its image copies the source with no mount, so after builder or contract changes run `docker compose -f docker-compose.dev.yml build builder` and `up -d --no-deps builder`: until then it validates with the contract it was built with and refuses content a newer one allows (an image from 2026-10-18 on 0.2.0 refused canopyds.com's 0.4.0 content, 2026-11-05).

---

## 5. Change protocols

### Before you start

1. Identify the layer (section 2).
2. Read the relevant `docs/tools/*.md`.
3. Search for the route, component, or action that already handles it.
4. Extend the established pattern. Do not add a parallel one.
5. Ownership checks, origin validation, and rate limits are non-negotiable.

### Schema changes

**Every `prisma/schema.prisma` change that touches the database MUST ship with a migration file, in the same commit.**

Migrations apply via `prisma migrate deploy` in `scripts/start.sh` at container start, against the deployed database, which is in a different state than yours. A migration that passes locally can still fail there, and `set -e` means a failure takes the app down. A missing migration file is worse: the deployed schema never changes while the Prisma client expects the new columns, producing `P2022: column does not exist`.

Procedure:

1. Edit `prisma/schema.prisma`.
2. Run `npm run db:migrate -- --name descriptive_name`, then `npm run db:generate`: Prisma 7's `migrate dev` no longer regenerates the client.
3. **Read the generated SQL** and confirm it does what you intended, not just that it exists.
4. Commit schema and migration together.
5. Tell the user to check the Coolify logs for `Applied migration: <name>` followed by `Migrations complete. Starting application...`.

Rules:

- **Never** modify or delete a migration under `prisma/migrations/`. Deployed databases have already applied them. The one historical exception, the `0_baseline` squash at v4.6.0, is done and not a precedent.
- Multiple related schema changes in one session get one migration per logical change, each independently safe to apply.
- If `prisma migrate dev` fails on the shadow DB, fall back to `prisma migrate deploy`, or write the SQL by hand and mark it with `prisma migrate resolve --applied <name>`.

### Embed changes

Change `embed/src/*`, run `npm run embed:build`, commit the rebuilt `public/embed.js` with the source. The embed is browser-cached, so users may need a hard refresh to see a change.

### Adding a field type

1. Add to the `FieldType` enum in `prisma/schema.prisma` (with a migration).
2. Add it to `FIELD_TYPE_OPTIONS` in `src/lib/field-types.ts`; the build fails if you skip it. Its label there is also a new field's default label, and its traits there (`choice`, `composite`) decide where its config is stored and which boxes its settings show. Its place there is its place in the Add field menu: specific before general, so a type that would also catch a narrower need comes after it. If a new field can't save without config (as Choose one can't without options), give it defaults in `newFieldDefaults` (`src/lib/field-rules.ts`, with the save rules the editor and the field server actions both apply).
3. Give it an icon in `FIELD_TYPE_ICONS` (`src/components/forms/field-type-icons.ts`) for the Add field menu; the build fails without one.
4. Render it in `embed/src/form.ts`.
5. Add its rules to `validateField` in `embed/src/validation.ts`, and any length cap to the tables beside it. The embed and the server both run them.
6. Only what the server alone may do (a guardrail beyond the field's rules, rewriting the stored value) goes in `src/lib/public-submit.ts`, after `validateSubmission`.
7. Add a config panel in `src/components/field-config/` if it has options.
8. Run `npm run embed:build` and commit `public/embed.js`.

---

## 6. Git & deployment

`dev` is the integration branch: commit directly to it for routine work. `main` is production, updated only by PR merge from `dev`, never pushed to directly. Use a feature branch only for large or experimental work.

### Commits

**Atomic commits as you work, not one commit at the end.** A schema change plus its migration is one commit. The UI consuming it is another. An embed change plus its rebuilt `public/embed.js` is another.

Format: `feat(scope): description`, also `fix`, `docs`, `refactor`. Scope is the feature area (`embed`, `auth`, `migrations`, `epic-N`). Subject under ~72 characters, body when the "why" is not obvious.

**Never rewrite pushed history.** No force push, no amending pushed commits.

### Push

Confirm `git status` is clean (committing anything outstanding as proper atomic commits first), `git push origin dev`, then report which commits went up.

### Release (dev → main)

1. `git log main..dev --oneline` for the full set.
2. Push any unpushed commits to `origin/dev`.
3. `gh pr create --base main`.
4. Title summarizes the release, e.g. `v4.5.0: Field validation overhaul + embed theme fixes`.
5. Body groups key changes by category (features, fixes, docs), written as a summary rather than a dump of commit messages.
6. Once dev has deployed the pushed commits, run the release smoke (`docs/VERIFICATION_CHECKLIST.md` section 9) and report it in the PR.
7. When the user asks to release or deploy prod, merge the PR (`gh pr merge --merge`). The user does not merge release PRs. Merging `main` triggers the prod deploy; confirm it landed before reporting done.

### After a merge to main

GitHub's merge commit lands on `main` only, so the branches diverge by exactly one commit after every release. Left alone it skews the next `git log main..dev`. Resync: `git fetch origin`, `git merge origin/main` on `dev`, `git push origin dev`.

### Environments

| Environment | URL | Branch | Coolify app UUID |
|-------------|-----|--------|------------------|
| Local | `http://localhost:3006` | working copy | — |
| Dev | `https://forms-dev.canopyds.com`, `https://sites-dev.canopyds.com` | `dev` | `wogw0skcsgck80cs4gscs0c0` |
| Prod | `https://forms.canopyds.com`, `https://sites.canopyds.com` | `main` | `j80s80ow8ss4444kk40cscsc` |

Deployment is Coolify's, not this repo's: no deploy commands here. On push it builds `apps/portal/Dockerfile` with the repo root as context and runs `scripts/start.sh` (migrations, then `node server.js`). Details in `docs/PRISMA_MIGRATIONS.md`; Coolify's own API and behavior are documented in the Nextcloud Engineering collective (see `CLAUDE.md`).

- `NEXT_PUBLIC_APP_URL` must be set as a Coolify **build arg**, since it is baked into the bundle.
- Both apps build `/apps/portal/Dockerfile` from base directory `/`, with auto-deploy watch paths `apps/portal/**`, `packages/site-contract/**`, `package.json`, `package-lock.json`. Changes to `docs/**` or other files outside those paths do not trigger a deploy.
- **The builder** (`apps/builder`) is its own Coolify app, production only as of 2026-10-16: `canopy-builder`, UUID `p7tvlgubddrucz9mnppbhabt`, branch `main`, Dockerfile `/apps/builder/Dockerfile` from `/`, no domain (internal), network alias `canopy-builder` (the portal's `BUILDER_URL` is `http://canopy-builder:4100`; container names change on every deploy), persistent volume at `/srv/sites`, watch paths `apps/builder/**`, `packages/site-contract/**`, `package-lock.json`. Its variables are in `apps/builder/README.md`. forms-dev has no builder, so its Editor shows the empty state. Each app serves its Forms and Sites hostnames (both are Coolify domains on the one app).
- **Fox's Coolify holds stopped copies of both apps** (same UUIDs) from the manual Forms failover design (`fox-activate`). As of 2026-10-15 Fox is not standing by for Forms (no database sync until one is designed before the Forms beta), so those copies need no upkeep. If Forms failover is revived, mirror build settings and domains onto them first: the start path builds from git with Fox's copy of the settings. The same `$COOLIFY_TOKEN` works against Fox's API (`ssh fox`, `localhost:8000`).
- **An env var change is inert until the container is recreated.** Coolify injects env at container creation, so a var added through the UI or API does nothing to the running app until it is redeployed. Confirm with the runtime probe in section 7 rather than the Coolify UI, which shows the stored value, not what the Node process holds.

---

## 7. Environment variables

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Required. PostgreSQL connection string. |
| `NEXTAUTH_URL` | Required. Public Forms URL: base for emailed links (`appUrlFor`), and when it starts with `https://` the session cookie is `Secure` with the `__Host-` prefix. The name predates Epic 28's removal of NextAuth. |
| `NEXT_PUBLIC_APP_URL` | Build-time. Falls back to `NEXTAUTH_URL`. Must match the deployed public URL. |
| `SITES_URL` | Optional. Public URL of this environment's Sites host (`https://sites.canopyds.com`, `https://sites-dev.canopyds.com`, local `http://sites.localhost:3006`). Base for password-reset and notification links sent to Sites accounts. Unset means those links use `NEXTAUTH_URL`. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Required if email is enabled. |
| `SMTP_FROM` | Optional, defaults to `SMTP_USER`. |
| `SMTP_FROM_SITES` | Optional. The From for every email to a Sites account (`senderFor` in `src/lib/product.ts`), `Canopy Sites <sites@canopyds.com>` in production: a send-as identity on the same SMTP login. Unset means `SMTP_FROM`. |
| `FEEDBACK_RECIPIENT_EMAIL` | Optional. Recipient for the help bubble's "Give feedback". Unset means the submission returns a friendly error and sends nothing. |
| `SUPPORT_RECIPIENT_EMAIL` | Optional. Recipient for the help bubble's "Contact support", falling back to `FEEDBACK_RECIPIENT_EMAIL` so existing deployments keep working. With both unset the submission returns a friendly error and sends nothing. Both are read in `src/actions/contact.ts`. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap only, read by `prisma/seed.ts` and `scripts/backfill-global-admin.mjs` (every boot) to promote a user to `GLOBAL_ADMIN`, moving a capped plan to `PAID`. Never consulted at auth-check time. Removable once a Global Admin exists. |
| `GOOGLE_FONTS_API_KEY` | Only to regenerate `src/lib/google-fonts.ts` via `scripts/fetch-google-fonts.ts`. |
| `BUILDER_URL` / `BUILDER_TOKEN` | The builder's internal URL and the shared token (same value on the builder). Unset means the Editor shows its empty state and `/demo` 404s. |
| `SITE_ASSET_ORIGIN_<SLUG>` | Development only, ignored in production: where a client site's canvas and preview load its assets (slug uppercased, hyphens as underscores). Unset, they load from its production hostname, which works when the local repo's branch is what production serves, since the build names its asset files the same (canopyds.com from a local copy of `main`, verified 2026-11-05); set it for a branch or site that isn't live. Both the browser (assets) and the portal container (the live page, when there is no draft) fetch it, so use an address both reach: with the dev stack in Docker, `http://host.docker.internal:<port>`, and a browser on the WSL host started with that name mapped to `127.0.0.1` (verified 2026-10-19). |
| `ANTHROPIC_API_KEY` | Quick edit (PRD D7, a Claude Platform key). Unset means quick edit says it isn't set up. |
| `QUICK_EDIT_MODEL` | Optional, default `claude-opus-5-5`. Costs per model are estimated in `src/lib/quick-edit/index.ts`. |

`.env` and `.env.local` are git-ignored. `.env.example` is tracked and holds placeholders only.

**This repo is public.** Never commit secrets, real credentials, or client data (site guides, business facts, content, media). Client data lives in the database or in the client's own private site repo; secrets live in Coolify env and gitignored `.env` files.

Verifying env inside a Coolify container: ask the runtime what the app actually sees (plain `printenv | grep` also works; verified 2026-08-14):

```sh
node -e 'console.log({NEXTAUTH_URL:process.env.NEXTAUTH_URL,NEXT_PUBLIC_APP_URL:process.env.NEXT_PUBLIC_APP_URL,SMTP_HOST:process.env.SMTP_HOST})'
```

---

## 8. Debugging

1. Reproduce, and name the layer (embed, API, admin, DB).
2. Find the first wrong assumption, not just the thrown error.
3. Fix at the right boundary: validation issues need the client *and* server layer; URL and env issues get fixed in a server component and passed down as props.
4. Verify end to end: configure in admin → embed renders → submit → stored → email queued.

**Works locally but fails on forms-dev or forms.canopyds.com: suspect infrastructure first, and fix it in Coolify config rather than in code.** Usual causes: wrong `Host` header from the proxy, `NEXTAUTH_URL` not matching the public URL, `NEXT_PUBLIC_APP_URL` missing or wrong at build time, or env vars visible in the Coolify UI but not reaching the Node process.

Migration failures and `P2022` in production: the migration did not run. Confirm the file exists under `prisma/migrations/` and that `start.sh` runs before `node server.js`. Troubleshooting details in `docs/PRISMA_MIGRATIONS.md`.

Embed change not appearing: browser cache, or `npm run embed:build` was never run and `public/embed.js` is stale. Embed 403s: check `form.allowedOrigins`, or test from localhost.

---

## 9. UI/UX

**`docs/UX_PATTERNS.md` is the canonical UI reference. Read its section 1 before building or modifying any UI**: that section is the complete rule set, and the sections after it hold the detail per topic (color, motion, typography, copy, components, lists, layout, embed theming, brand assets). Do not introduce alternate UI systems, icon packs, or color patterns.

Hard rules:

- **Colors**: semantic tokens from `src/app/globals.css` (`bg-primary`, `text-destructive`, `text-success`). Brand is `--canopy-teal` `#005f6a`, `--canopy-green` `#5fd48c`, `--canopy-coral` `#ff6b5a`. Brand-carrying tokens reference the variable (`var(--canopy-teal)`). Never hand-convert a brand hex to oklch.
- **Motion**: the four flow tokens only (`--ease-flow-in/out`, `--duration-flow-in/out`). No bespoke durations, no bounce, no rotation.
- **Dialogs**: never `alert()`, `confirm()`, or `prompt()`. Use `toast` and `ConfirmDialog` (`src/components/confirm-dialog.tsx`).
- **Reordering**: `SortableList` (`src/components/ui/sortable-list.tsx`) with drag and drop. Never Up/Down buttons.
- **Icon buttons**: always wrapped in `Tooltip`. `GripVertical` drag, `Trash2` delete, `Pencil` edit.
- **Typography**: three families. `font-heading` is Urbanist (all semantic headings), `font-sans` is Inter (body default, buttons, labels, tables), `font-mono` is Geist Mono (code, IDs, embed snippets). Headings are a single weight (600); hierarchy comes from size.
- **Branding**: the `BrandMark` component (`src/components/brand-mark.tsx`), assets in `public/brand/`. Each product has the same asset pair, `<product>-logo-combined.svg` (icon and wordmark, nav and auth cards) and `<product>-logo-full.svg` (adds the "By Canopy" rule and tagline, login only), and `BrandMark` / `AuthBrandMark` pick by `product`. Auth card headers use `AuthBrandMark`, which brands by host.
- **Validation**: admin and auth use inline touched/submitted with `noValidate`. The embed uses native popups. See section 2.

---

## 10. Release checklist

After completing an epic or cutting a release, in order:

1. Root `package.json`: bump `version`.
2. `CHANGELOG.md`: new entry at the top with date and changes.
3. `docs/epics/epic-N-name.md`: completion report.
4. `docs/epics/README.md`: table row with version, date, link.
5. `content/docs/*.md`: update every help page the release invalidates. New features need a page or a new section, renamed menu items need relabeling, removed flows need their steps deleted, screenshots of changed areas need refreshing. Register new pages in `content/docs/meta.ts`. Skip only if the release is purely internal.
6. `prisma/schema.prisma`: a column documented as "Dropped by a migration in the next production release" is retired and no longer read. Before the release PR, remove it with its migration (section 5), so a running container never loses a column its code still selects.

If a future change adds another file holding version-specific information, add it to this list at the same time.

---

## Appendix. Data model

Canonical source: `prisma/schema.prisma`.

```
Plan (code PK, displayName, description?, maxPublishedForms?, sitesEnabled, isPublic,
      sortOrder)
Role (code PK, displayName, description?, isPublic, sortOrder)

Account (id, createdAt, planCode→Plan.code, requiresPlanResolution,
         status:AccountStatus, billingRef?)
  └─ Membership (userId→User, role:MembershipRole), @@unique([userId, accountId])
  └─ ActAs (operatorUserId?→User, startedAt, endedAt?), a Global Admin acting
  │        as the account (PRD D49); deleting the operator keeps the row
  └─ Form (name, title?, description?, slug, type:FormType, allowedOrigins[],
  │        notifyEmails[], emailNotificationsEnabled, emailIncludeResponses,
  │        honeypotField?, successMessage?, redirectUrl?, defaultTheme?,
  │        stopAt?, maxSubmissions?, published, thumbnail?, createdByUserId?)
  │    └─ Field (name, type:FieldType, label, order, required, options?,
  │    │         validation?, helpText?)
  │    └─ Submission (data:Json, meta:Json, isSpam, status:SubmissionStatus)
  └─ Notification (formId, type:NotificationType, count, updatedAt)
  └─ Site? (slug unique, name, repoUrl?, defaultBranch, productionHostnames[],
           contractVersion?, umamiWebsiteId?, lockedFields[],
           fixedLists[], maxBuildsRetained, isDemo, timeZone), one per account,
           onDelete Restrict; lockedFields and fixedLists are address patterns
           (site/contact/phone, classes), PRD D50
       └─ ChangeSet (source:ChangeSetSource, createdByUserId?, conversationId?,
       │             summary, ops:Json, baseCommit, status:ChangeSetStatus,
       │             version, error?, publishedCommit?, publishedAt?); the pending
       │             one is the site's draft (PRD D38)
       └─ Build (changeSetId?, status:BuildStatus, draftVersion?, baseCommit?,
       │         error?, log?, startedAt?, finishedAt?)
       └─ Conversation (userId?, model, messages:Json, input/output/cacheRead/
       │                cacheWriteTokens, costUsd)
       └─ HelpRequest (conversationId?, createdByUserId?, actAsId?, message,
                       summary, address?, refused, status:HelpRequestStatus (DRAFT, OPEN,
                       DONE, DECLINED, DISMISSED), sentAt?, note?, closedByUserId?,
                       closedAt?), PRD D34

User (email, password? (null until the owner claims, PRD D49),
      roleCode→Role.code, passwordChangedAt?, lastLoginAt?,
      failedLoginCount, lastFailedLoginAt?)
  └─ Session (id = SHA-256 of the cookie token, rememberMe, expiresAt,
  │           absoluteExpiresAt, actAsId?→ActAs)
  └─ SessionHandoff (id = SHA-256 of a one-time token, rememberMe, targetHost,
  │                  expiresAt), Forms-host sign-in to a Sites-host session
  └─ PasswordToken (purpose:PasswordTokenPurpose, tokenHash, expiresAt, usedAt?,
                    createdByUserId?→User, emailedAt?), table password_reset_tokens
```

Enums:

- `FieldType`: `TEXT | EMAIL | TEXTAREA | CHOOSE_ONE | APPROVAL | CHOOSE_SEVERAL | PHONE | DATE | NAME | NUMBER | ADDRESS | DATE_OF_BIRTH | WEBSITE`. Display labels in `src/lib/field-types.ts`.
- `FormType`: `HOSTED | EMBEDDED`, locked at creation. Drives editor branching (Appearance Page subsection, the "Inherit from host page" font option, preview mode), publish surfaces (Share Link vs Allowed Origins plus Embed Code), and the public endpoints (the embed and submit APIs take a HOSTED form only from its hosted page, section 2 "403 codes"; `/f/[formId]` rejects EMBEDDED with Form Not Available).
- `SubmissionStatus`: `NEW | READ | ARCHIVED`.
- `NotificationType`: `NEW_SUBMISSION | LIMIT_MAX_REACHED | LIMIT_DEADLINE_REACHED`.
- `MembershipRole`: `OWNER | MEMBER`. Account-level; the platform role is `User.roleCode`.
- `PasswordTokenPurpose`: `RESET | CLAIM`. A claim link sets an unclaimed owner's first password (PRD D49); `/reset-password` accepts only `RESET`.
- `ChangeSetSource`: `QUICK_EDIT | OPERATOR | EDITOR`. `ChangeSetStatus`: `DRAFT | PREVIEWED | PUBLISHED | DISCARDED | FAILED`. `BuildStatus`: `QUEUED | RUNNING | SUCCEEDED | FAILED | SUPERSEDED`.
- `AccountStatus`: `ACTIVE | PAST_DUE | CANCELLED`, default `ACTIVE`. Operator-set billing state with free-text `billingRef` (PRD D12); gates nothing yet.

Seeded plans, one per entitlement level: `FREE` (maxPublishedForms 1, the signup default), `PAID` (null, shown as "Unlimited"), `SITES` (null, `sitesEnabled`, `isPublic: false`). `PAID` and `SITES` are operator-assigned until billing ships. Whether an account pays, is comped, or is a sandbox is its billing state (`status`, `billingRef`), never a plan; `HOSTING` and `UNLOCKED` were retired for that reason in v5.2.1.

Seeded roles: `USER` (default), `GLOBAL_ADMIN` (`isPublic: false`, admin-granted only). Operator console access is gated on `GLOBAL_ADMIN`, and promotion moves an account on a capped plan to `PAID` (an uncapped plan such as `SITES` stays).

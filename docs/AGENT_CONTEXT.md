# Canopy Portal Agent Context

Authoritative reference for coding agents working in this repo.

**Layout.** npm workspaces. The Next.js app that serves Canopy Forms and the Canopy Sites portal is `apps/portal/`; `apps/builder/` is the site build service (its own README) and `packages/site-contract/` the content contract every site repo installs (its own README; PRD D26). **Code paths in this doc are relative to `apps/portal/`.** Paths under `docs/`, plus `package.json`, `package-lock.json`, `CHANGELOG.md`, and `docker-compose.dev.yml`, are at the repo root. Canopy Sites is specified in `docs/canopy-sites/PRD.md` and sequenced in `docs/canopy-sites/ROADMAP.md`.

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
- **An account has one time zone**, `Account.timeZone` (an IANA name, checked by `isTimeZone` in `src/lib/time-zone.ts`): the business's. Emails state times in it, and its site's dates follow it (quick edit's "today", the builder's nightly rebuild). Signup records the browser's, Link a site sets Pacific, and `UTC` is an account nobody has given one. The Account page changes it (`setAccountTimeZone`, for the owner or an operator acting as them), which also tells the builder (`sendSiteTimeZone`). A site has no zone of its own.
- Uniqueness: `@@unique([accountId, slug])` on Form, `@@unique([formId, name])` on Field.
- Fields are **relational rows** with an explicit `order` and enum `FieldType`. Never JSON blobs.
- Publishing needs at least one field: `toggleFormPublished` refuses without one, since a submission stores only fields. The editor's Fields step and the Publish tab's button hold until there is one.
- Every Account has a `Plan` (FK on `planCode`). Entitlements are typed columns on `Plan` (`maxPublishedForms`, `sitesEnabled`), and the catalog is seeded by migration, not editable at runtime. Enforce through `getAccountEntitlements` (`src/lib/data-access/entitlements.ts`). Never re-implement the comparison at a call site, and never compare plan codes.
- `Account.requiresPlanResolution` is set when a plan change drops the cap below the account's live published count. While set, the admin layout renders `PlanResolutionDialog` as a non-dismissible blocker, cleared only by a successful `resolvePlan`.

### Auth & ownership

- Email and password sign-in, self-service signup, server-side sessions in the `sessions` table (`src/lib/session.ts`; behavior in `docs/ACCOUNT_OPERATIONS.md`). Get the session through `requireAuth`, `getCurrentAccountId`, or `requireGlobalAdmin`, or `getSession` where signed-out is a normal answer. Never read the cookie or query `sessions` anywhere else, and never add a second way to authenticate a request without a database test for it. Credential endpoints (sign-in, signup, reset request, password change, claim) are throttled in `src/lib/auth-throttle.ts`; a new one gets a throttle there. A user's password is null until they claim it (PRD D49, `src/lib/claim.ts`): the owner of an account the operator linked, or a person the operator added to one (PRD D63). Sign-in treats null as a wrong password.
- Account is the tenant and is never surfaced in the UI. Users reach it through `Membership` (`OWNER | MEMBER`). A user has exactly one; an account has one `OWNER` and any number of `MEMBER`s, added and removed by the operator only (PRD D63, `src/actions/admin/members.ts`, behavior in `docs/ACCOUNT_OPERATIONS.md`). A member does everything but delete the account, so never write a check that assumes the session's user is the account's only one. Whatever names a person to someone else calls `personName` (`src/lib/person.ts`): the name the operator typed, else the email. Resolve a user's account only through `src/lib/data-access/memberships.ts` (`getCurrentAccountId` for the session user; `sessionAccountId` and `sessionCanUseAccount` where signed-out or another account is a normal answer), and delete accounts only through `deleteAccountAndSoleMembers`: an Account delete does not cascade to Users. Never query `memberships` for a session anywhere else: a Global Admin acting as a client (PRD D49, `session.actingAs`) resolves to the client's account only through those, and a direct query would miss it. Anything only the owner may do checks `isActing` (`src/lib/act-as.ts`); behavior in `docs/ACCOUNT_OPERATIONS.md`.
- **Ownership is enforced server-side** by direct `accountId` comparison in `src/lib/data-access/*` and `src/actions/*`. Never trust client-side ownership logic.
- **A server action's arguments are whatever the client sent**, whatever their TypeScript types say. Every id an action takes goes through `requireId` or `requireIds` (`src/lib/ids.ts`), or `String(...)` where the action answers with `{ error }`, before any query; the ownership helpers check it again. What an action does after its ownership check goes by the id of the row the check returned (`form.id`, `field.id`), never the caller's value, and a query on a child row names its parent (`{ id, formId }`).
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
- **`/demo`** (`src/app/demo/[[...path]]/route.ts`) serves the demo site's published build (PRD D23) from the builder. It is client-editable content on the portal's origin, so every response carries `Content-Security-Policy: sandbox ...` (an opaque origin that can't use the portal session) plus CORS for its fonts and module scripts. Never drop the sandbox or add `allow-same-origin`. A fingerprinted `_astro/` asset only the draft's build has is served from it, because the canvas's requests carry no session. Its request path, like `/canvas`'s, reaches the builder only through `fetchSiteFile` (`src/lib/builder-client.ts`), as the route's params: Next has decoded each segment once, `isSiteFilePath` refuses one that isn't a name (`.`, `..`, a separator, a NUL, or any of those still percent-encoded) before anything is fetched, and nothing decodes them again. A new route that hands a request path to the builder does the same, and never builds a builder URL from a path itself.
- **`/canvas/[siteId]/...`** (`src/app/canvas/[siteId]/[[...path]]/route.ts`) is a page of any site as the Editor's canvas and the preview page show it (PRD D47), for members of the site's account only (`previewableSite`; 404 for anyone else). With a draft, the newest build of the draft; with none, the live page. It injects a `<base>` at the page's live address (`src/lib/site-live.ts`: `/demo` for the demo, `https://` plus the first production hostname for a client site, never the request's host), so the page's styles, fonts, and scripts load from where the site is live, plus a flag on `<html>` and the bridge (`src/lib/canvas-bridge.ts`): `data-canopy-editor` and edit mode, or with `?view=preview` `data-canopy-preview` and view mode (no marks). Every response carries the same sandbox CSP as `/demo`. The portal fetches the HTML with the session and shows it in a sandboxed srcdoc frame; `X-Canopy-Build` names the draft build shown. The bridge only reports, navigates, and edits text in place; every write is a server action through the tool layer.
- **`/preview/[siteId]/...`** (`src/app/preview/[siteId]/[[...path]]/`) is the preview page (PRD D47): the site filling a tab of its own, outside `(admin)` so with no Sites chrome, and the preview bar holding the only Publish. Publish sends the build the page showed (`publishPreview`), and the tool layer refuses any other (`publishChange`). Signed-in members only, behind `requireHomeHost`. Every preview link (the Sites chrome, Quick Edit, later MCP) is this page.
- **`/welcome/[siteId]/[file]`** (`src/app/welcome/[siteId]/[file]/route.ts`) is one of a site's welcome videos or its captions (ROADMAP E39), for the people on the site's account and an operator acting as it; 404 for anyone else and for any name but a tab's current video. Its addresses are `/welcome/<siteId>/<tab>-<key>-video` and `-captions`. **Never give one a file extension**: Cloudflare treats a `.mp4` address as one it could cache, and on such a request's miss it fetches the whole file without the player's byte range, so the player gets a 200 and can't seek (seen on sites-dev 2026-11-18, where a `.vtt` address passed ranges every time); an address it can't cache passes them, and can never be cached at the edge either. The file still goes out `Cache-Control: private` and every 404 `no-store`, in case that changes: the edge would otherwise hand the video to whoever asks next, or a signed-out 404 to the person who may see it. A site has at most one video for each tab of its portal (`WelcomeVideo`; the tab is an id from `src/lib/sites-tabs.ts`, which the nav also reads), and its files live under `MEDIA_DIR` as `welcome/<siteId>/<tab>-<key>.mp4` and `.vtt` (`src/lib/welcome-video.ts`); the path is built from the site's own id and the parts of a name matched against a fixed pattern, never from the request. They are client media: never in the repo or the image. A tab's video opens by itself once per person, on their first visit to one of the tab's pages: the admin layout hands the help bubble every video with whether it still opens for this person, and the bubble opens the one for the tab it is on, since a layout does not render again when the tab changes. That showing is a `WelcomeView` row, which also holds the furthest point the person has played (`welcomeVideoWatched`; dragging along a paused video is not playing), shown on the operator's people card. An acting operator's viewing records nothing (`ownMembershipId` in `memberships.ts`), and the help bubble reopens a tab's video on its pages.
- **`POST /operator/sites/[siteId]/welcome-video/[tab]`** (`route.ts` beside the operator's site page) is the upload of a tab's video, from the page's Welcome videos card: the body is the captions file and then the MP4, with the captions' byte count in `X-Captions-Length`, so the MP4 streams to the disk (`storeWelcomeVideo`). A different video clears what each person had watched of the tab's and does not open by itself again for someone already shown one; the same video with new captions changes neither. **Remove** on the tab's row (`removeSiteWelcomeVideo`, a server action) deletes the files and the row, and each person's `WelcomeView` goes with the row, so the next video uploaded for the tab opens once for each person, as a first one does: removing and uploading is how the operator shows a new video to everyone again. A Global Admin only, answered with a 403 where a page would redirect. **A route handler that acts on the session checks the request's `Origin` against its own host, as this one does**: server actions get that check from Next and route handlers get none, and the session cookie (`SameSite=Lax`) goes with a request from any other canopyds.com page. The limits and the two file checks are in `src/lib/welcome-video-limits.ts`, shared with the card, which checks before it sends. The pair is made from a recording on the operator's workstation by `scripts/prepare-welcome-video.py` (its docstring says how; it needs ffmpeg and uv, never runs in the container, and ships in the image only because the image copies `scripts/` whole).
- **403 codes**: `published === false` returns `code: "FORM_INACTIVE"`. A HOSTED form returns `code: "FORM_HOSTED_ONLY"` from the embed GET always, and from a POST unless the request comes from the portal's own origin (`isAppOrigin` in `src/lib/validation.ts`: Origin, else Referer, equal to `NEXT_PUBLIC_APP_URL`'s origin). The hosted page submits through the embed route like any embed, so a POST gate without that exception refuses every hosted form. The embed script pattern-matches these codes to render dedicated states, so changing a code breaks the embed.
- **A client component's props are sent to the browser whole**, declared in its type or not. A public page never passes a database row to one: `/f/[formId]` reads the form through `getPublishedForm`, which selects only columns a visitor may hold, and passes `HostedFormPage` its fields by name. A column added to that select, or a new public page, gets the same treatment and a test on what the page passes (`src/app/f/[formId]/page.db.test.ts`).
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
| `src/lib/site-tools/*` | The only path for edits to a site's content (PRD D8, D9): ownership, the lane (the contract's `laneViolations`: Canopy's fields, the site's locks and fixed lists as address patterns, PRD D50), the contract with the site guide's limits, counts, and refused phrases, and rate limits are enforced here for every source (Editor, quick edit, later MCP). One person edits a site at a time (PRD D64): every write first takes or keeps the site's hold for its caller (`requireHold`, over `hold.ts`, the only code that touches `site_holds`), ahead of its rate limit, and is refused with a `ToolError` carrying `heldBy` while someone else's hold is live. A hold starts with an edit and never with a page: a person's own, not a browser's, it is given up by a publish or a discard that leaves no draft (`doneEditing`) and at sign-out, and otherwise runs out (`HOLD_TTL_MS`). The draft is its author's (`ChangeSet.updatedByUserId`): a write that adds to it (`saveDraft`, `proposeChange`, Quick Edit's `holdSite`) calls `requireEdit`, which refuses anyone else with a `ToolError` carrying `draftBy`, before taking any hold, while publish and discard stay open to everyone on the account under `requireHold`. A draft with no author recorded (they were taken off the account) is anyone's to carry on. Reads stay open to everyone on the account. A new write to a site's content starts with the same call. Between writes the editing pages follow the hold through `SiteHoldProvider` (`src/components/sites/site-hold.tsx`): it asks the `keepHold` action about every 25 seconds while its person is active and stops after ten quiet minutes (`src/lib/site-hold-policy.ts`), which keeps a hold its person has and takes none. Only `begin()`, which the Editor calls when a field is opened, asks to take it before a write. While someone else has the site, Quick Edit shows `SiteNotice` in place of the chat, the Editor puts its canvas behind `BehindGlass`, the preview bar says who where Publish would be, and the Sites chrome's `DraftStatus` leaves out Discard (from `getDraftState`'s `heldBy`, looked up again on the provider's `HOLD_CHANGED`), all worded by `editingNotice`. While the draft is someone else's and they have stopped, the same two places say so (`draftNotice`, with what it changes), Publish and Discard are offered, and discarding asks first and names its author. The preview page passes `reload={false}`: it follows the draft itself, and a refresh from the provider would remount it. Every answer carries a marker of where the draft and the published list stand. When it moves without the page's own doing, the provider fires `SITE_MOVED` and the editing surface mounts again, so nothing edits on top of content it never saw; a page's own write adopts its marker (`wrote`, or the `DRAFT_CHANGED` event). The Editor's unsent edits (`src/lib/unsaved-edits.ts`) are kept with the marker they were typed at and dropped, with a message, once it has moved. A draft is named to anyone but its last editor (`theirChanges`, from `getEditorChanges`' `by`). A page renders from `getSiteEditing`, which takes nothing; a new page that edits a site's content follows the hold the same way, and never takes it for being open. A lock or fixed list that isn't an address refuses every edit rather than letting one through. Every write returns what it changed, field by field (`changes.ts`), and what the guide's `avoid` flags in text it changed; quick edit's tool result carries both to the model. A refusal that is Canopy's call (the lane, a refused phrase) is a `ToolError` with `outOfLane`, on which quick edit tells the model to draft a request instead of trying another way. Help requests (`help-requests.ts`, PRD D34): quick edit's `request_help` drafts one, the owner sends or dismisses it from a card (`HelpRequestCard`), a sent one emails every Global Admin from the Sites sender with the owner as Reply-To, and the operator closes it with an optional note emailed back; one sent while acting emails nobody. Text quick edit won't put on the site is drafted with `refused` set, and reaches Canopy, marked Refused, only if the owner sends it. Quick edit's prompt is `BASE_RUNBOOK` (`src/lib/quick-edit/runbook.ts`) plus the prose of the site's `SITE_GUIDE.md`, from the draft view. A failed builder call reaches the owner, and quick edit's model, only as a plain sentence from `builder-failure.ts`, which logs the builder's message with the site's slug; a preview that won't start keeps the builder's message on its `Build` row for the operator. Publish's "changed since" refusal is the one builder message passed on as written: never put any other `BuilderError`'s message in a `ToolError`. Each guard has a database test that fails without it. |
| `src/actions/*` | Server actions, each enforcing ownership internally. |
| `src/components/ui/` | shadcn primitives. Extend, do not fork. |
| `src/components/patterns/` | Layout patterns (`page-header`, `data-table`, `settings-section`, `right-panel`, ...). Compose these before writing new layout. |
| `prisma/migrations/` | Append only. See section 5. |
| `content/docs/*.md` | User-facing help served at `/docs`. Registered in `content/docs/meta.ts`, where a group marked `sites` is shown, and its pages open, only for accounts with Canopy Sites (`docsNavFor` in `src/lib/docs.ts`): a page about a website goes in such a group, never in one every Forms account sees. |

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

`npm run build`, `npm run lint`, and `npm test` must pass before committing. **`docs/VERIFICATION_CHECKLIST.md` is the quality gate** and specifies which further checks apply to which change type.

**Tests.** `npm test` runs Vitest in `apps/portal` (config `vitest.config.mts`). `*.test.ts` beside the code are unit tests with no database or network. `*.db.test.ts` run against a `*_test` database that `test/db-global-setup.ts` creates and migrates with `prisma migrate deploy`; `test/db.ts` has `resetDatabase` and factories, and every helper refuses a database whose name does not end in `_test`. Run tests in the container (`docker exec canopy-portal npm test`), where the Postgres host resolves. Never mock Prisma: the bugs worth catching are in queries, constraints, and cascades. What must have a test: session and sign-in decisions, account resolution and membership, entitlements, deletion cascades, and from E31 every guardrail. A bug fix in those areas lands with the test that reproduces it. Vitest stays on 4.x while the containers run Node 20 (5.x needs 22.12+); bump it with the Node 24 move.

Local dev: the root `docker-compose.dev.yml` (project `canopy-sites`) runs `postgres:17-alpine` (container `canopy-portal-db`) plus the portal (container `canopy-portal`) on `http://localhost:3006`, using `apps/portal/Dockerfile.dev` with the repo root mounted for hot reload and `apps/portal` as the working directory, so `docker exec canopy-portal <cmd>` runs in the app, as the image's `node` user (uid 1000, the host user's, so what it writes on the mount is yours to edit and delete). `http://sites.localhost:3006` resolves to the same app with the Sites host branding. `DATABASE_URL` is hardcoded in the compose file's `environment:` block, which overrides dotenv files; SMTP and the other optional vars load from `.env` (via `env_file`). Copy `.env.example` to `.env` for the template. The container flow does not read `.env.local`. The same compose file runs the site builder (container `canopy-builder`), which builds from bare repos under `~/repos/.canopy-local-remotes` (a Site's `repoUrl` is then `/remotes/<name>.git`; pushes from a local publish stop there). Its image copies the source with no mount, so after builder or contract changes run `docker compose -f docker-compose.dev.yml build builder` and `up -d --no-deps builder`: until then it validates with the contract it was built with and refuses content a newer one allows (an image from 2026-10-18 on 0.2.0 refused canopyds.com's 0.4.0 content, 2026-11-05).

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
2. Run `npm run db:migrate -- --name descriptive_name`. Its `postdb:migrate` hook regenerates the client, which Prisma 7's `migrate dev` no longer does; `prisma migrate dev` called directly skips the hook.
3. **Read the generated SQL** and confirm it does what you intended, not just that it exists.
4. Commit schema and migration together.
5. Tell the user to check the Coolify logs for `Applied migration: <name>` followed by `Migrations complete. Starting application...`.

Rules:

- **Never** modify or delete a migration under `prisma/migrations/`. Deployed databases have already applied them. The one historical exception, the `0_baseline` squash at v4.6.0, is done and not a precedent.
- Multiple related schema changes in one session get one migration per logical change, each independently safe to apply.
- If `prisma migrate dev` cannot make the migration (it fails on the shadow DB, or the change loses data and there is no TTY to confirm it on), write the SQL by hand and apply it with `prisma migrate deploy`. The steps, and how to name the directory, are in `docs/tools/prisma-7.md` ("Hand-Written Migration").
- **Dropping a column takes two production releases.** Prisma names every column the schema declares, whatever the code reads: in every query without a `select` (an `include` and the row an `update` returns count), and in every `create`, which inserts a field's `@default` by name. A container whose schema still declares a dropped column fails all of those with `P2022`, and a rollback to that release does too. The first release stops using the field and marks it `@ignore`, with a `///` note giving the date it retired: that leaves the table alone, so it has no migration, and the build fails on any code still using the field. The drop (the field's removal with its migration) goes in a later release, once `main`'s schema carries the `@ignore`. A global `omit` on the client is no substitute, since creates still insert the column (all of this tested 2026-11-14 on Prisma 7.3.0, against a copy of the schema with `sites."timeZone"` dropped). No insert names an ignored column, so a required one needs a database default before it is ignored.

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
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` must be set as a Coolify **build arg** on each app (base64 of 32 random bytes, one key per environment, never changed without a reason). Next salts every server action's id with it. Without it each build makes a new key, so a page open across a deploy can't call the server until it is reloaded: on 2026-11-13 a release restarted the portal under an open Editor and its saves were refused. With the key fixed, an action keeps its id while its file and export name stay the same (checked: two builds with one key gave the same 56 ids; a build without it gave different ones). A page from before a deploy still fails on an action that deploy renamed, moved or removed, which is why the Editor keeps unsent edits (`src/lib/unsaved-edits.ts`).
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
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Build-time. Keeps server action ids the same across builds, so open pages survive a deploy. See Deployment. |
| `SITES_URL` | Optional. Public URL of this environment's Sites host (`https://sites.canopyds.com`, `https://sites-dev.canopyds.com`, local `http://sites.localhost:3006`). Base for password-reset and notification links sent to Sites accounts. Unset means those links use `NEXTAUTH_URL`. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Required if email is enabled. |
| `SMTP_FROM` | Optional, defaults to `SMTP_USER`. |
| `SMTP_FROM_SITES` | Optional. The From for every email to a Sites account (`senderFor` in `src/lib/product.ts`), `Canopy Sites <sites@canopyds.com>` in production: a send-as identity on the same SMTP login. Unset means `SMTP_FROM`. |
| `FEEDBACK_RECIPIENT_EMAIL` | Optional. Recipient for the help bubble's "Give feedback". Unset means the submission returns a friendly error and sends nothing. |
| `SUPPORT_RECIPIENT_EMAIL` | Optional. Recipient for the help bubble's "Contact support", falling back to `FEEDBACK_RECIPIENT_EMAIL` so existing deployments keep working. With both unset the submission returns a friendly error and sends nothing. Both are read in `src/actions/contact.ts`. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap only, read by `prisma/seed.ts` and `scripts/backfill-global-admin.mjs` (every boot) to promote a user to `GLOBAL_ADMIN`, moving a capped plan to `PAID`. Never consulted at auth-check time. Set them only to bootstrap an environment's first Global Admin, and remove them once one exists: neither is set on the prod or dev apps (removed 2026-11-10; production's running container drops them at its next deploy). |
| `GOOGLE_FONTS_API_KEY` | Only to regenerate `src/lib/google-fonts.ts` via `scripts/fetch-google-fonts.ts`. |
| `BUILDER_URL` / `BUILDER_TOKEN` | The builder's internal URL and the shared token (same value on the builder). Unset means the Editor shows its empty state and `/demo` 404s. |
| `SITE_ASSET_ORIGIN_<SLUG>` | Development only, ignored in production: where a client site's canvas and preview load its assets (slug uppercased, hyphens as underscores). Unset, they load from its production hostname, which works when the local repo's branch is what production serves, since the build names its asset files the same (canopyds.com from a local copy of `main`, verified 2026-11-05); set it for a branch or site that isn't live. Both the browser (assets) and the portal container (the live page, when there is no draft) fetch it, so use an address both reach: with the dev stack in Docker, `http://host.docker.internal:<port>`, and a browser on the WSL host started with that name mapped to `127.0.0.1` (verified 2026-10-19). |
| `UMAMI_URL` / `UMAMI_API_KEY` | Stats (Epic 35): Umami's address (`https://analytics.canopyds.com`) and the key of its `canopy-portal` user, view-only in the Umami team holding the client websites, so it reads them and changes nothing. A site's own `umamiWebsiteId` is the only id `src/lib/stats/umami.ts` asks about. Unset, or Umami unreachable, means a site with an Umami id shows "Stats can't load right now" and the log has `stats_unavailable`. The operator's site page checks the site's website with the same key (`src/lib/stats/health.ts`), and Link a site and the site settings refuse a website it can't read. No test reaches Umami: `test/db-env.ts` clears both for database tests, and a test that needs Umami stubs them and `fetch`. |
| `ANTHROPIC_API_KEY` | Quick edit (PRD D7, a Claude Platform key). Unset means quick edit says it isn't set up. |
| `QUICK_EDIT_MODEL` | Optional, default `claude-opus-5-5`. Costs per model are estimated in `src/lib/quick-edit/index.ts`. |
| `MEDIA_DIR` | Optional. The directory that holds welcome videos (ROADMAP E39). Unset means no site has one. Locally `/srv/media`, the `portal_media` volume in `docker-compose.dev.yml`. Not set on the dev or prod apps as of 2026-11-14: their volume comes with the rest of E39. |

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

**A deploy that fails in the install step with `npm ci left out ... optional packages`** lost a package in `npm ci`: redeploy, and the install runs again. npm skips an optional package that fails to install, a failed download as much as a wrong platform, and exits 0; npm 10.8.2 reports it only at `--loglevel verbose`, as `failed optional dependency` (checked 2026-11-15 with one package's tarball URL broken: the install exited 0, its `added N packages` line one short). Every binary built for the platform is an optional package (Next's compiler, Tailwind's, lightningcss, esbuild, sharp), and an install without one is a layer Docker caches as good, so every plain redeploy builds on it: on 2026-11-15 the dev app lost `@next/swc-linux-x64-musl` on the first build after `apps/portal/package.json` changed, and failed in `next build` with `... was not installed` until a redeploy without the cache (what failed for that package is not known). So `apps/portal/Dockerfile` and `Dockerfile.dev` run `scripts/check-optional-packages.mjs` in the same `RUN` as `npm ci`, and Docker caches no layer whose `RUN` failed (checked 2026-11-15 on a local build of the image with one package's download broken: it stopped there twice, installing both times). The script wants every package that `package-lock.json` marks `optional` with an `os` or `cpu` and that npm's own test accepts for the machine; the lockfile records no `libc`, so on Alpine that is the glibc build of each beside the musl one. An optional package that names no platform is not checked: whether npm installs it depends on what else was skipped. The old container serves throughout.

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
6. `prisma/schema.prisma`: a field marked `@ignore` is a retired column. Before the release PR, remove each one that `main`'s schema already marks `@ignore` (`git show origin/main:apps/portal/prisma/schema.prisma`), with its migration. One that this release is the first to ignore waits for the next (section 5, dropping a column).

If a future change adds another file holding version-specific information, add it to this list at the same time.

---

## Appendix. Data model

Canonical source: `prisma/schema.prisma`.

```
Plan (code PK, displayName, description?, maxPublishedForms?, sitesEnabled, isPublic,
      sortOrder)
Role (code PK, displayName, description?, isPublic, sortOrder)

Account (id, createdAt, planCode→Plan.code, requiresPlanResolution,
         status:AccountStatus, billingRef?, timeZone)
  └─ Membership (userId→User, role:MembershipRole),
  │              @@unique([userId, accountId])
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
           fixedLists[], maxBuildsRetained, isDemo), one per
           account, onDelete Restrict; lockedFields and fixedLists are address
           patterns (site/contact/phone, classes), PRD D50
       └─ ChangeSet (source:ChangeSetSource, createdByUserId?, updatedByUserId?
       │             (who last changed it), publishedByUserId?, conversationId?,
       │             summary, ops:Json, baseCommit, status:ChangeSetStatus,
       │             version, error?, publishedCommit?, publishedAt?); the pending
       │             one is the site's draft (PRD D38), one per site by a partial
       │             unique index that only its migration states
       └─ Build (changeSetId?, status:BuildStatus, draftVersion?, baseCommit?,
       │         error?, log?, startedAt?, finishedAt?)
       └─ Conversation (userId?, model, messages:Json, input/output/cacheRead/
       │                cacheWriteTokens, costUsd)
       └─ HelpRequest (conversationId?, createdByUserId?, actAsId?, message,
       │               summary, address?, refused, status:HelpRequestStatus (DRAFT, OPEN,
       │               DONE, DECLINED, DISMISSED), sentAt?, note?, closedByUserId?,
       │               closedAt?), PRD D34
       └─ SiteHold? (userId, takenAt, expiresAt), who is editing the site now
       │            (PRD D64); deleting the user frees it
       └─ WelcomeVideo (tab, key), @@unique([siteId, tab]): the site's welcome
           │           video for one tab of its portal (ROADMAP E39); key names
           │           its two files under MEDIA_DIR
           └─ WelcomeView (membershipId→Membership, shownAt, watchedSeconds?,
                          videoSeconds?), @@id([videoId, membershipId]): one
                          person's viewing of it; the row means it has opened
                          by itself for them

User (email, name? (what others see them called, PRD D63),
      password? (null until they claim, PRD D49),
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

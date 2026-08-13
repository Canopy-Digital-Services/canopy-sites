# Canopy Forms Agent Context

Authoritative reference for coding agents working in this repo.

**Code wins over docs.** Verify anything here against the file before relying on it. Source-of-truth order: code > `prisma/schema.prisma` > `prisma/migrations/` > `CHANGELOG.md` > docs.

Current version: `package.json` → `version`. Release history: `CHANGELOG.md`. Epic table: `docs/epics/README.md`.

---

## 1. Product & stack

Privacy-first embedded forms for static websites. Users build forms in a visual editor, embed them with two lines of HTML, and manage submissions in a dashboard with email notifications. Audience: small business owners and freelancers running static sites with no backend.

Next.js 16 · React 19 · NextAuth v5 (beta) · Prisma 7 · TypeScript 5 · Tailwind v4 · Node 20

**Read the matching `docs/tools/*.md` before writing code against any of these.** All are recent majors with breaking changes from older patterns: `prisma-7.md`, `nextjs-16.md`, `nextauth-v5.md`, `react-19.md`, `tailwindcss-v4.md`, `docker.md`. Index: `docs/tools/README.md`.

If outdated training data led you to a wrong command, flag, or API, correct the relevant tool doc in the same session.

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

- **Form-first**: `Account → Form → Field / Submission`. There is no Site model.
- Forms own `allowedOrigins[]`. Origin control is per form, not per account.
- Uniqueness: `@@unique([accountId, slug])` on Form, `@@unique([formId, name])` on Field.
- Fields are **relational rows** with an explicit `order` and enum `FieldType`. Never JSON blobs.
- Every Account has a `Plan` (FK on `planCode`). `Plan.maxPublishedForms` is the only entitlement today, and the catalog is seeded by migration, not editable at runtime. Enforce through `getAccountEntitlements` (`src/lib/data-access/entitlements.ts`). Never re-implement the comparison at a call site.
- `Account.requiresPlanResolution` is set when a plan change drops the cap below the account's live published count. While set, the admin layout renders `PlanResolutionDialog` as a non-dismissible blocker, cleared only by a successful `resolvePlan`.

### Auth & ownership

- NextAuth v5 credentials provider, self-service signup.
- Account is internal (one per user) and never surfaced in the UI.
- **Ownership is enforced server-side** by direct `accountId` comparison in `src/lib/data-access/*` and `src/actions/*`. Never trust client-side ownership logic.

### Validation

Three layers, all required:

1. HTML `maxLength` on inputs.
2. Client-side in the embed: `embed/src/validation.ts`.
3. Server-side in `src/lib/public-submit.ts`, shared by the embed and submit routes. Per-type rules and length caps live here, not in the route files.

Payload cap: 64KB. Length caps are three-tier (default applies when the field sets no `maxLength`; a configured `maxLength` is clamped to the absolute):

| Type | Default | Absolute |
|------|---------|----------|
| TEXT | 200 | 500 |
| EMAIL | 254 | 320 |
| TEXTAREA | 2000 | 10000 |

**Two validation dialects. Do not cross them.** Embed forms use native HTML5 popups via `setCustomValidity()`, one error at a time. Admin and auth forms use custom inline validation with the touched/submitted pattern and `noValidate` on the form.

### Public API contracts

`handlePublicSubmit` in `src/lib/public-submit.ts` is the full gate order, shared by the **embed and submit routes only**: type gate → published gate → origin → rate limit → `stopAt` → `maxSubmissions` → payload size → field validation → honeypot → store → queue email. Add a new submission-side rule here so both routes get it. The embed route's GET carries its own copies of the type and published gates.

- **Embed API**: GET returns the embed-safe definition plus ordered fields. POST runs the full gate order. Rate limits: GET 60/min, POST 10/min per hashed IP.
- **Submit API**: POST only, for white-box HTML forms that never fetch a schema.
- **Single-field submit** (`/api/submit/[formId]/[fieldName]`): does **not** use the shared module. It reimplements only origin, rate limit, and honeypot, validates nothing but required-presence on the one field, and has no type, published, `stopAt`, or `maxSubmissions` gate. Treat its stored values as unvalidated: `src/lib/submission-email.ts` re-runs `isValidEmail()` before using a submitted address as `Reply-To`, which is what blocks CRLF header injection. Any new gate added to `public-submit.ts` has to be added here separately or it does not apply to this route.
- Origin: `validateOrigin(origin, form.allowedOrigins, referer)`. Localhost is always allowed.
- **403 codes**: `published === false` returns `code: "FORM_INACTIVE"`; `type === "HOSTED"` returns `code: "FORM_HOSTED_ONLY"`. The embed script pattern-matches these codes to render dedicated states, so changing a code breaks the embed.
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
| `src/lib/public-submit.ts` | Where server-side submission validation and gates belong. Note the single-field route's divergence in section 2. |
| `src/lib/data-access/*` | Ownership checks live here. Queries bypassing these lose enforcement. |
| `src/actions/*` | Server actions, each enforcing ownership internally. |
| `src/components/ui/` | shadcn primitives. Extend, do not fork. |
| `src/components/patterns/` | Layout patterns (`page-header`, `data-table`, `settings-section`, `right-panel`, ...). Compose these before writing new layout. |
| `prisma/migrations/` | Append only. See section 5. |
| `content/docs/*.md` | User-facing help served at `/docs`. Registered in `content/docs/meta.ts`. |

Routes: `/` redirects to `/forms` or `/login`. Admin lives under `/forms`, `/account`, `/docs`. Operator console is `/operator/accounts`. Public form pages are `/f/[formId]`. **A "home" link for an admin or operator points to `/forms`, never `/`.**

### When to read which doc

| Document | Read it when |
|----------|--------------|
| `docs/VERIFICATION_CHECKLIST.md` | **Before committing.** Which checks to run per change type, and when to escalate to the user for manual verification. |
| `docs/tools/*.md` | Before writing code against Prisma, Next.js, NextAuth, React, Tailwind, or Docker. |
| `docs/UX_PATTERNS.md` | Before building or modifying any UI. |
| `docs/ACCOUNT_OPERATIONS.md` | Touching auth flows, account lifecycle, sessions, or deletion. |
| `docs/PRISMA_MIGRATIONS.md` | Deployment, migration failures, or Dockerfile changes. |
| `docs/epics/README.md` | What shipped in which version. |

When writing a plan, task list, or subagent brief, include the line "Before starting, read `docs/AGENT_CONTEXT.md`" so the agent picking it up gets this context.

---

## 4. Commands & verification

Scripts are in `package.json`. The two non-obvious ones:

- `npm run embed:build` rebuilds `public/embed.js` from `embed/src/*`. Required after any embed change.
- `npm run db:push` exists. **Never run it.** It mutates the database without creating a migration, so the change never reaches deployed environments.

`npm run build` and `npm run lint` must both pass before committing.

There is no automated test suite. **`docs/VERIFICATION_CHECKLIST.md` is the quality gate** and specifies which checks apply to which change type.

Local dev: `docker-compose.dev.yml` runs `postgres:17-alpine` plus the app on `http://localhost:3006`, using `Dockerfile.dev` with a source mount for hot reload. Point `DATABASE_URL` in `.env.local` at your database; copy `.env.example` for the template.

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
2. Run `npm run db:migrate -- --name descriptive_name`.
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
2. Update `src/lib/field-types.ts`: both `FIELD_TYPE_OPTIONS` and `FIELD_TYPE_LABEL_PLACEHOLDERS`. The build fails if you skip the second.
3. Render it in `embed/src/form.ts`.
4. Add client validation in `embed/src/validation.ts` if it has input constraints.
5. Add server validation and any length cap in `src/lib/public-submit.ts`.
6. Add a config panel in `src/components/field-config/` if it has options.
7. Run `npm run embed:build` and commit `public/embed.js`.

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
5. Body groups key changes by category (features, fixes, docs), written as a summary for review rather than a dump of commit messages.

Do not merge unless explicitly asked.

### After a merge to main

GitHub's merge commit lands on `main` only, so the branches diverge by exactly one commit after every release. Left alone it skews the next `git log main..dev`. Resync: `git fetch origin`, `git merge origin/main` on `dev`, `git push origin dev`.

### Environments

| Environment | URL | Branch |
|-------------|-----|--------|
| Local | `http://localhost:3006` | working copy |
| Dev | `https://forms-dev.canopyds.com` | `dev` |
| Prod | `https://forms.canopyds.com` | `main` |

Deployment is Coolify's, not this repo's: no deploy commands here. On push it builds an image and runs `scripts/start.sh` (migrations, then `node server.js`). Details in `docs/PRISMA_MIGRATIONS.md`.

- `NEXT_PUBLIC_APP_URL` must be set as a Coolify **build arg**, since it is baked into the bundle.
- Auto-deploy watch paths are `src/**`, `embed/**`, `prisma/**`. Changes to `docs/**` or config files outside those paths do not trigger a deploy.

---

## 7. Environment variables

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Required. PostgreSQL connection string. |
| `NEXTAUTH_SECRET` | Required. Signing and encryption key. |
| `NEXTAUTH_URL` | Required. Public URL, used for auth callbacks and email links. |
| `NEXT_PUBLIC_APP_URL` | Build-time. Falls back to `NEXTAUTH_URL`. Must match the deployed public URL. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Required if email is enabled. |
| `SMTP_FROM` | Optional, defaults to `SMTP_USER`. |
| `FEEDBACK_RECIPIENT_EMAIL` | Optional. Recipient for the in-app feedback form. Unset means feedback submissions return a friendly error and send nothing. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap only, read by `prisma/seed.ts` and `scripts/backfill-global-admin.mjs` to promote a user to `GLOBAL_ADMIN` on `UNLOCKED`. Never consulted at auth-check time. Removable once a Global Admin exists. |
| `GOOGLE_FONTS_API_KEY` | Only to regenerate `src/lib/google-fonts.ts` via `scripts/fetch-google-fonts.ts`. |

`.env` and `.env.local` are git-ignored. `.env.example` is tracked and holds placeholders only.

Verifying env inside a Coolify container: `printenv | grep` is unreliable there. Probe the names directly, or better, ask the runtime what the app actually sees:

```sh
node -e 'console.log({NEXTAUTH_URL:process.env.NEXTAUTH_URL,NEXTAUTH_SECRET:!!process.env.NEXTAUTH_SECRET,NEXT_PUBLIC_APP_URL:process.env.NEXT_PUBLIC_APP_URL,SMTP_HOST:process.env.SMTP_HOST})'
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

**`docs/UX_PATTERNS.md` is the canonical UI reference. Read it before building or modifying any UI.** It covers the component library, color system, motion, typography, layout patterns, validation, and anti-patterns. Do not introduce alternate UI systems, icon packs, or color patterns.

Hard rules:

- **Colors**: semantic tokens from `src/app/globals.css` (`bg-primary`, `text-destructive`, `text-success`). Brand is `--canopy-teal` `#005f6a`, `--canopy-green` `#5fd48c`, `--canopy-coral` `#ff6b5a`. Brand-carrying tokens reference the variable (`var(--canopy-teal)`). Never hand-convert a brand hex to oklch.
- **Motion**: the four flow tokens only (`--ease-flow-in/out`, `--duration-flow-in/out`). No bespoke durations, no bounce, no rotation.
- **Dialogs**: never `alert()`, `confirm()`, or `prompt()`. Use `toast` and `ConfirmDialog` (`src/components/confirm-dialog.tsx`).
- **Reordering**: `SortableList` (`src/components/ui/sortable-list.tsx`) with drag and drop. Never Up/Down buttons.
- **Icon buttons**: always wrapped in `Tooltip`. `GripVertical` drag, `Trash2` delete, `Pencil` edit.
- **Typography**: three families. `font-heading` is Urbanist (all semantic headings), `font-sans` is Inter (body default, buttons, labels, tables), `font-mono` is Geist Mono (code, IDs, embed snippets). Headings are a single weight (600); hierarchy comes from size.
- **Branding**: the `BrandMark` component (`src/components/brand-mark.tsx`), assets in `public/brand/`.
- **Validation**: admin and auth use inline touched/submitted with `noValidate`. The embed uses native popups. See section 2.

---

## 10. Release checklist

After completing an epic or cutting a release, in order:

1. `package.json`: bump `version`.
2. `CHANGELOG.md`: new entry at the top with date and changes.
3. `docs/epics/epic-N-name.md`: completion report.
4. `docs/epics/README.md`: table row with version, date, link.
5. `content/docs/*.md`: update every help page the release invalidates. New features need a page or a new section, renamed menu items need relabeling, removed flows need their steps deleted, screenshots of changed areas need refreshing. Register new pages in `content/docs/meta.ts`. Skip only if the release is purely internal.

If a future change adds another file holding version-specific information, add it to this list at the same time.

---

## Appendix. Data model

Canonical source: `prisma/schema.prisma`.

```
Plan (code PK, displayName, description?, maxPublishedForms?, isPublic, sortOrder)
Role (code PK, displayName, description?, isPublic, sortOrder)

Account (id, createdAt, planCode→Plan.code, requiresPlanResolution)
  └─ User (email, password, accountId, roleCode→Role.code, passwordChangedAt?,
  │        lastLoginAt?, failedLoginCount, lastFailedLoginAt?)
  └─ Form (name, title?, description?, slug, type:FormType, allowedOrigins[],
  │        notifyEmails[], emailNotificationsEnabled, emailIncludeResponses,
  │        honeypotField?, successMessage?, redirectUrl?, defaultTheme?,
  │        stopAt?, maxSubmissions?, published, thumbnail?, createdByUserId)
  │    └─ Field (name, type:FieldType, label, placeholder?, order, required,
  │    │         options?, validation?, helpText?)
  │    └─ Submission (data:Json, meta:Json, isSpam, status:SubmissionStatus)
  └─ Notification (formId, type:NotificationType, count, updatedAt)

PasswordResetToken (userId, token, expiresAt, usedAt?)
```

Enums:

- `FieldType`: `TEXT | EMAIL | TEXTAREA | DROPDOWN | CHECKBOX | CHECKBOXES | PHONE | DATE | NAME | NUMBER | ADDRESS`. Display labels in `src/lib/field-types.ts`.
- `FormType`: `HOSTED | EMBEDDED`, locked at creation. Drives editor branching (Appearance Page subsection, the "Inherit from host page" font option, preview mode), publish surfaces (Share Link vs Allowed Origins plus Embed Code), and the public endpoints (embed API rejects HOSTED with `FORM_HOSTED_ONLY`; `/f/[formId]` rejects EMBEDDED with Form Not Available).
- `SubmissionStatus`: `NEW | READ | ARCHIVED`.
- `NotificationType`: `NEW_SUBMISSION | LIMIT_MAX_REACHED | LIMIT_DEADLINE_REACHED`.

Seeded plans: `FREE` (maxPublishedForms 1), `HOSTING` (10), `PAID` (null, unlimited), `UNLOCKED` (null, `isPublic: false`, admin-granted only). `HOSTING` and `PAID` are placeholders and unreachable until billing ships.

Seeded roles: `USER` (default), `GLOBAL_ADMIN` (`isPublic: false`, admin-granted only). Operator console access is gated on `GLOBAL_ADMIN`, and promotion moves the account to `UNLOCKED`.

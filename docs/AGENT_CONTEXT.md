# Canopy Forms — Agent Context

**For coding agents. You are in the repo. This is the authoritative reference.**

---

## 0. Orientation

Canopy Forms is a privacy-first embedded forms platform for static websites. Users create forms in a visual builder, embed them with two lines of HTML, and manage submissions via a dashboard with email notifications. Target audience: small business owners and freelancers who build static sites and need form handling without a backend.

### Your role

- Implement features safely and completely.
- Preserve architectural invariants (section #1).
- Investigate before guessing — you have shell access, so search code, run builds, and check call sites rather than assuming.
- When requirements are ambiguous: restate the goal in one sentence, identify the affected layer, and confirm invariants before writing code.

### Stack (use idioms matching these versions — not older patterns)

| Tool | Version |
|------|---------|
| Next.js | 16 |
| React | 19 |
| NextAuth | v5 (beta) |
| Prisma | 7 |
| TypeScript | 5 |
| Tailwind CSS | v4 |
| Node | 20 |

Version-specific documentation for each of these lives in `docs/tools/*.md`. **Read the relevant tool doc before writing code that uses that tool** — these versions have breaking changes from what may be in your training data. See `docs/tools/README.md` for the index.

### Source of truth hierarchy

1. **Code** — if docs disagree with code, code wins
2. Prisma schema (`prisma/schema.prisma`)
3. Migrations (`prisma/migrations/`)
4. `CHANGELOG.md`
5. Docs (these may lag)

### Current status

See `package.json` → `version` for the current version number. See `CHANGELOG.md` for detailed release history. See `docs/epics/README.md` for the epic completion table.

---

## 1. Architecture & invariants

### System layers

| Layer | Purpose | Location |
|-------|---------|----------|
| Admin UI | Form builder, submission viewer, settings | `src/app/(admin)/*` |
| Embed script | Client-side form renderer | `embed/src/*` → `public/embed.js` |
| Public Embed API | Serve form definitions, accept submissions | `src/app/api/embed/[formId]/route.ts` |
| Public Submit API | Accept submissions (white-box HTML forms) | `src/app/api/submit/[formId]/route.ts` |
| Operator Console | Platform admin (metadata-only) | `src/app/operator/*` |

Always identify which layer a change touches before starting work.

### Data model (non-negotiable)

- **Form-first**: `Account → Form → Field / Submission`. No Site model.
- Forms own `allowedOrigins[]` for per-form origin control.
- Slug uniqueness: `@@unique([accountId, slug])`.
- Fields are **relational rows** with explicit `order` and enum `FieldType`, not JSON blobs.
- Field uniqueness: `@@unique([formId, name])`.

### Auth & ownership (non-negotiable)

- NextAuth v5 credentials provider with self-service signup.
- Account model is internal (one per user), not exposed in UI.
- **Ownership is enforced server-side** in data access helpers and server actions via direct `accountId` comparison. Never trust client-side ownership logic.
- Server actions live in `src/actions/` and enforce ownership internally.

### Validation (defense in depth)

Three layers — all must be maintained:

1. HTML `maxLength` attributes on inputs
2. Client-side validation in embed (`embed/src/validation.ts`)
3. Server-side validation in API routes

Payload limits: 64KB max per submission. Field limits: TEXT 500, EMAIL 320, TEXTAREA 10000.

Embed forms use native HTML5 validation popups via `setCustomValidity()` (one error at a time). Admin/auth forms use custom inline validation with touched/submitted pattern. These are deliberately different — don't cross the patterns.

### Public APIs

**Embed API** (`src/app/api/embed/[formId]/route.ts`):
- GET returns embed-safe form definition + ordered fields.
- POST validates, spam-checks (honeypot), stores submission, queues email notifications.
- Rate limit: GET 60/min, POST 10/min per hashed IP.
- Origin validation: `validateOrigin(origin, form.allowedOrigins, referer)`. Localhost always allowed.
- Email notifications: individual emails to all addresses in `form.notifyEmails[]` (max 5).

**Submit API** (`src/app/api/submit/[formId]/route.ts`):
- POST only. Same validation/storage as embed. For white-box HTML forms (no schema fetch).

### Env vars in client components

Client components cannot reliably read runtime env vars. Pattern: server component reads env → passes as props. Example: `src/app/(admin)/forms/[formId]/edit/page.tsx` passes `apiUrl` prop.

`NEXT_PUBLIC_*` variables are baked into the browser bundle at **build time**. They cannot change at runtime without rebuilding.

---

## 2. Repo map & documentation guide

### Directory layout

| Area | Location |
|------|----------|
| Admin routes | `src/app/(admin)/*` |
| Auth pages | `src/app/(auth)/*` |
| Public APIs | `src/app/api/embed/*`, `src/app/api/submit/*` |
| Server actions | `src/actions/auth.ts`, `src/actions/forms.ts` |
| Data access helpers | `src/lib/data-access/forms.ts` |
| Validation utilities | `src/lib/validation.ts`, `src/lib/rate-limit.ts` |
| Field type registry | `src/lib/field-types.ts` |
| Embed source | `embed/src/*` (never edit `public/embed.js` directly) |
| Embed themes/styles | `embed/src/theme.ts`, `embed/src/styles.ts` |
| Schema | `prisma/schema.prisma` |
| Migrations | `prisma/migrations/` |
| UI components (shadcn) | `src/components/ui/` |
| Layout patterns | `src/components/patterns/` |
| Feature components | `src/components/` |
| Field config panels | `src/components/field-config/` |
| Brand assets | `public/brand/` |

### Documentation — when to read what

| Document | Read it when... |
|----------|----------------|
| `docs/VERIFICATION_CHECKLIST.md` | **Before committing.** Specifies which checks to run per change type and when to escalate to the user for manual verification. |
| `docs/tools/*.md` | Writing code that uses Prisma, Next.js, NextAuth, React, Tailwind, dnd-kit, or Docker. **These cover breaking changes from recent major versions.** |
| `docs/UX_PATTERNS.md` | Building or modifying any UI component. Covers colors, typography, dialogs, toasts, sortable lists, layout patterns, form validation, and anti-patterns. |
| `docs/ACCOUNT_OPERATIONS.md` | Modifying any auth flow, account lifecycle, session behavior, or deletion logic. Covers signup, login, JWT sessions, password flows, hard-delete strategy, and future billing considerations. |
| `docs/PRISMA_MIGRATIONS.md` | Troubleshooting deployment, migration failures, or Dockerfile changes. Covers the entrypoint script, Prisma 7 config, and the full Coolify setup. |
| `docs/epics/README.md` | Understanding version history and what shipped when. |
| `CHANGELOG.md` | Detailed change log per version. |

---

## 3. Stack, scripts & tooling

### npm scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Start Next.js dev server (binds `0.0.0.0:3000`) |
| `npm run build` | Production build |
| `npm run lint` | ESLint (next core-web-vitals + typescript) |
| `npm run embed:build` | Rebuild `public/embed.js` from `embed/src/*` via esbuild |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | `prisma migrate dev` (creates migration + applies) |
| `npm run db:seed` | Seed database via `prisma/seed.ts` |

`npm run db:push` exists in package.json but **never use it** — always use migrations.

### Linting

ESLint 9 flat config (`eslint.config.mjs`) with `eslint-config-next` core-web-vitals and TypeScript rules. No Prettier, no Husky, no pre-commit hooks.

### Verification

No automated test suite exists. **Read `docs/VERIFICATION_CHECKLIST.md` for the quality gate.** It specifies which checks to run based on what you changed (build, lint, migration verify, browser smoke test, API curl, etc.) and when to escalate to the user with specific manual verification steps.

### Local database

Docker Compose provides a local PostgreSQL instance:

```bash
# docker-compose.dev.yml spins up postgres:17-alpine + the app
# App available at http://localhost:3006
# Uses Dockerfile.dev with hot-reload via source mount
```

`DATABASE_URL` in `.env.local` should point to your database. See `.env.example` for the template.

---

## 4. Change protocols

### Before making changes

1. **Identify the layer**: admin UI, embed, public API, schema, or infrastructure?
2. **Search first**: find existing routes, components, and actions that already handle it.
3. **Validate against code**: if a doc says X, confirm in the file before implementing.
4. **Don't bypass security**: ownership checks, origin validation, and rate limits are non-negotiable.
5. **Don't introduce parallel patterns**: if a pattern is established, extend it rather than adding an alternative.

### Schema changes (high risk — understand the full pipeline)

**Every `prisma/schema.prisma` change that affects the database MUST include a migration file.**

#### What happens to your migration after you commit it

Your migration file travels through a pipeline. Understanding this prevents the P2022 column-not-found errors that have broken deployments before:

1. You commit the schema + migration files and push to GitHub.
2. Coolify detects the push (watch path: `prisma/**`) and builds a new Docker image.
3. The container starts and `scripts/start.sh` runs `prisma migrate deploy` against the **deployed database** (dev or prod — a different database than your local one).
4. If the migration succeeds, the app starts. If it fails, `set -e` kills the container — the app is down until it's fixed.
5. When dev merges to main, the same migration runs against the **production database**.

This means: a migration that works locally can still fail in deployment if the deployed database is in a different state. And a missing migration file means the deployed database never gets the schema change, even though the Prisma client expects the new columns.

#### Procedure

1. Edit `prisma/schema.prisma`.
2. Run: `npx prisma migrate dev --name descriptive_name`
3. Confirm a new directory appears under `prisma/migrations/`.
4. **Read the generated SQL file** and verify it does what you intended — not just that it exists.
5. Commit the schema change and all migration files as one atomic commit.

#### Rules

- **Never** run `prisma db push` — it changes the database without creating a migration file, which means Coolify will never apply the change.
- **Never** modify or delete existing migration files — the deployed databases have already applied them.
- If `prisma migrate dev` fails (shadow DB, missing tables), use `prisma migrate deploy` or `prisma migrate resolve --applied <name>` as appropriate.
- If you're making multiple related schema changes in one session, create one migration per logical change — not one giant migration at the end. Each migration should be independently safe to apply.

#### After pushing

Tell the user to check the Coolify container logs for:
```
[canopy-forms] Running database migrations...
Applied migration: 20260219000000_your_migration_name
[canopy-forms] Migrations complete. Starting application...
```

If the container fails to start after a schema change, the migration likely failed. See `docs/PRISMA_MIGRATIONS.md` troubleshooting section.

### Embed changes (high risk)

If you modify anything in `embed/src/*`:

1. Make your changes.
2. Run `npm run embed:build`.
3. Commit the updated `public/embed.js` along with your source changes.

Never manually edit `public/embed.js`. The embed is cached in browsers — users may need a hard refresh.

### Adding or modifying a field type

1. Add/update the `FieldType` enum in `prisma/schema.prisma`.
2. **Update `src/lib/field-types.ts`** — add to both `FIELD_TYPE_OPTIONS` and `FIELD_TYPE_LABEL_PLACEHOLDERS`. The build will fail if you skip this (compile-time assertion).
3. Update embed rendering in `embed/src/form.ts`.
4. Update embed validation in `embed/src/validation.ts` if the type has input constraints.
5. Update server validation in `src/app/api/embed/[formId]/route.ts`.
6. If the field has configuration options, add a config component in `src/components/field-config/`.
7. Run `npm run embed:build` and commit `public/embed.js`.

### Changing env/URL behavior

1. Make changes in a **server component** (not a client component).
2. Pass values down as props (see the `apiUrl` pattern in `src/app/(admin)/forms/[formId]/edit/page.tsx`).
3. Remember: `validateOrigin()` uses `NEXT_PUBLIC_APP_URL` to identify the dashboard host.

---

## 5. Git & deployment

### Branching

- **`dev`** is the integration branch. All work happens here (or on feature branches that merge to `dev`).
- **`main`** is production. It is only updated via PR merges from `dev` — never pushed to directly.

Feature branches are optional. For routine work, commit directly to `dev`. Use a feature branch when the work is large, experimental, or you want to isolate it.

### Commit discipline

**Make atomic commits as you work, not one big commit at the end.** Each commit should be a single logical unit that could stand on its own:

- A schema change + its migration = one commit.
- The UI that consumes that schema change = a separate commit.
- An embed update + the rebuilt `public/embed.js` = a separate commit.

Use conventional commit messages:

```
feat(scope): description
fix(scope): description
docs(scope): description
refactor(scope): description
```

Scope is typically the feature area: `embed`, `auth`, `migrations`, `epic-N`, etc. Keep the subject line under ~72 characters. Add a body if the "why" isn't obvious from the subject.

**Once commits are pushed, never rewrite history.** No `--force`, no amending pushed commits.

### Push workflow

When the user says "push to dev" (or equivalent):

1. Verify all changes are committed (`git status` clean).
2. Run `git push origin dev`.
3. Confirm the push succeeded and note which commits were pushed.

If there are uncommitted changes, commit them with proper atomic commits first — don't lump everything into one commit.

### Release workflow (dev → main PR)

When the user says "create a PR to main" or "I want to release" (or equivalent):

1. Run `git log main..dev --oneline` to see all commits that will be included.
2. Push any unpushed local commits to `origin/dev` first.
3. Create a PR from `dev` → `main` using `gh pr create --base main`.
4. The PR title should summarize the release (e.g., "v4.5.0: Field validation overhaul + embed theme fixes").
5. The PR body should list the key changes grouped by category (features, fixes, docs), derived from the commits. This is a summary for the user to review, not a dump of commit messages.

The user will review the PR and decide whether to merge. Do not merge it unless explicitly asked.

### Environments

| Environment | URL | Branch | Host |
|-------------|-----|--------|------|
| Local | `http://localhost:3006` | working copy | dev machine |
| Dev | `https://forms-dev.canopyds.com` | `dev` | Coolify on webber |
| Prod | `https://forms.canopyds.com` | `main` | Coolify on webber |

### Deployment behavior (Coolify)

- No deploy commands in this repo. Deployment is managed by Coolify.
- On push to the tracked branch, Coolify builds a Docker image, runs `scripts/start.sh` as the entrypoint (which runs `prisma migrate deploy` then `node server.js`). See `docs/PRISMA_MIGRATIONS.md` for full details.
- `NEXT_PUBLIC_APP_URL` must be set as a **build arg** in Coolify (it's baked into the bundle).

**Auto-deploy watch paths** (Coolify dev):
- `src/**`, `embed/**`, `prisma/**`
- Changes outside these paths (e.g., `docs/**`, config files) may **not** trigger auto-deploy.

### Infrastructure vs code issues

If something works locally but fails on forms-dev or forms.canopyds.com, suspect infrastructure first — proxy config, `Host` header, `NEXTAUTH_URL` mismatch, or missing env vars. These are fixed in Coolify config, not in repo code.

---

## 6. Environment variables

### Required at runtime (server)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth signing/encryption key |
| `NEXTAUTH_URL` | Public URL of the app (used for auth callbacks, email links) |

### Required if email is enabled

| Variable | Purpose |
|----------|---------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Optional; defaults to `SMTP_USER` |

### Build-time (browser bundle)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | API base URL used by admin edit page and validation helpers. Falls back to `NEXTAUTH_URL` if unset. Must match the deployed public URL. |

### Optional

| Variable | Purpose |
|----------|---------|
| `ADMIN_EMAIL` | Bootstrap admin user (used in `prisma/seed.ts`) |
| `ADMIN_PASSWORD` | Bootstrap admin password (used in `prisma/seed.ts`) |

### Local env files

- `.env` / `.env.local` — developer-local, git-ignored.
- `.env.example` — tracked, contains placeholders only. Copy to `.env.local` and fill in real values.

### Verifying env in Coolify containers

`printenv | grep` can be unreliable in Coolify containers. Use one of these instead:

**Direct probe (no regex):**
```sh
printenv DATABASE_URL NEXTAUTH_URL NEXTAUTH_SECRET NEXT_PUBLIC_APP_URL SMTP_HOST SMTP_USER
```

**Node runtime probe (authoritative — tests what the app actually sees):**
```sh
node -e 'console.log({NEXTAUTH_URL:process.env.NEXTAUTH_URL,NEXTAUTH_SECRET:!!process.env.NEXTAUTH_SECRET,NEXT_PUBLIC_APP_URL:process.env.NEXT_PUBLIC_APP_URL,SMTP_HOST:process.env.SMTP_HOST})'
```

---

## 7. Debugging & troubleshooting

### Framework

1. **Reproduce** the failure. Identify the layer (embed, API, admin, DB).
2. **Locate the first wrong assumption** — not just the thrown error.
3. **Fix at the correct boundary**: validation issues → fix in client *and* server; URL/env issues → fix in server component, pass props down.
4. **Verify end-to-end**: admin configure → embed renders → submit → stored → email queued.

### Deployed-environment issues

Failures on forms-dev or forms.canopyds.com are often infrastructure:
- Wrong `Host` header from the proxy
- `NEXTAUTH_URL` not matching the public URL
- `NEXT_PUBLIC_APP_URL` missing or wrong at build time
- Env vars present in Coolify UI but not reaching the Node process

These are fixed in Coolify config, not in code. Suggest the user check `docs/PRISMA_MIGRATIONS.md` and Coolify's environment settings.

### Migration failures

- `prisma migrate dev` fails on shadow DB: try `prisma migrate deploy` or `prisma migrate resolve --applied <name>`.
- `P2022: column does not exist` in production: migration didn't run. Check that `start.sh` runs before `node server.js` and that the migration file exists under `prisma/migrations/`.
- See `docs/PRISMA_MIGRATIONS.md` troubleshooting section for full details.

### Embed issues

- Changes not appearing: browser cache. Hard refresh or clear cache.
- Did you run `npm run embed:build` and commit `public/embed.js`?
- Origin errors (403): check `form.allowedOrigins` includes the host domain, or test from localhost.

---

## 8. UI/UX conventions

**Read `docs/UX_PATTERNS.md` before building or modifying any UI.** It is the canonical reference (~1200 lines) covering the full component library, color system, typography, layout patterns, validation patterns, and anti-patterns.

Key rules (quick reference):

- **Colors**: Use semantic tokens (`bg-primary`, `text-destructive`, `text-success`) from `src/app/globals.css`. Brand: Teal `#005F6A`, Green `#5FD48C`, Coral `#FF6B5A`.
- **Dialogs**: Never use `alert()`, `confirm()`, or `prompt()`. Use `toast` and `ConfirmDialog`.
- **Reordering**: Never use Up/Down buttons. Use `SortableList` with drag-and-drop.
- **Icon buttons**: Always wrap in `Tooltip`. Standard icons: `GripVertical` (drag), `Trash2` (delete), `Pencil` (edit).
- **Typography**: `font-heading` (Urbanist) for all headings/titles. Body text uses Inter by default.
- **Branding**: Use `BrandMark` component (`src/components/brand-mark.tsx`). Assets in `public/brand/`.
- **Admin validation**: Custom inline validation with touched/submitted pattern, `noValidate` on forms. Never use native HTML5 validation in admin/auth pages.
- **Embed validation**: Native HTML5 popups via `setCustomValidity()`. Never use custom inline validation in embed.

Don't introduce alternate UI systems, icon packs, or color patterns.

---

## 9. Documentation & versioning

### Epic/release update checklist

Run these steps in order after completing an epic or cutting a release. These are the **only four files that need updating** — no other file contains version-specific information.

1. **`package.json`** — bump `version` (e.g., `4.4.0` → `4.5.0`).
2. **`CHANGELOG.md`** — add a new version entry at the top with date and changes.
3. **`docs/epics/epic-N-name.md`** — create a completion report for the epic.
4. **`docs/epics/README.md`** — add a row to the epic table with version, date, and link.

If any future change requires storing version-specific information in a fifth file, update this checklist at the same time.

---

## Appendix A. FieldType enum (current)

```
TEXT | EMAIL | TEXTAREA | SELECT | CHECKBOX | HIDDEN | PHONE | DATE | NAME
```

See `prisma/schema.prisma` for the canonical definition and `src/lib/field-types.ts` for display labels.

---

## Appendix B. Data model (Prisma schema summary)

```
Account (id, createdAt)
  └─ User (email, password, accountId, passwordChangedAt?, lastLoginAt?, ...)
  └─ Form[] (name, slug, allowedOrigins[], notifyEmails[], honeypotField?, defaultTheme?, ...)
       └─ Field[] (name, type:FieldType, label, order, required, options?, validation?, helpText?)
       └─ Submission[] (data:Json, meta:Json, isSpam, status:SubmissionStatus)

PasswordResetToken (userId, token, expiresAt, usedAt?)
```

Canonical source: `prisma/schema.prisma`.

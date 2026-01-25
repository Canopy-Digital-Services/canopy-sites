## Can-O-Forms v3 — Agent Context (read before coding)

### Project point (what you’re building)

Can-O-Forms is a **complete SaaS forms management platform** for static sites.

- **Admin UI**: Web interface where users create Sites → Forms → Fields; view Submissions; generate embed/integration snippets.
- **Embed script**: a single `<script>` renders a form into a `<div data-can-o-form="...">`, validates client-side, submits to the public embed API, then shows success message or redirects.
- **Operator Console**: Platform operator interface for account management (metadata-only, privacy-first design).
- **Manual submit API**: direct POST endpoint for whiteboxed HTML forms (no schema fetch).

When requirements are unclear: **start by restating the goal in one sentence** and mapping it to the correct layer(s): admin UI vs API vs embed script vs DB.

**Status**: v3.0.0 — All planned features complete and production-ready.

### Source of truth

- Treat `README.md` and `content/docs/*` as **hints** (they may lag behind).
- **Code wins**. If docs disagree with code, follow the code and (optionally) update the docs.
- **Version history**: `CHANGELOG.md` tracks all releases; `docs/epics/` contains detailed completion reports for each epic.

### Development workflow (critical for agents)

**This project runs in Docker** and is routed through Caddy (also in Docker) on port 3006 for Cloudflare integration.

**Making code changes:**
1. Edit files as needed
2. Rebuild and restart: `docker compose build && docker compose up -d`
3. Build takes ~2 minutes but is reliable and production-ready

**Why Docker for development:**
- Caddy proxy requires Docker networking (`canoforms:3000`)
- Keeps setup identical to production (Coolify will deploy the same way)
- No environment differences or surprises

**When agents make changes:**
- Code changes → rebuild Docker: `docker compose build && docker compose up -d`
- Embed changes → `npm run embed:build` (before Docker rebuild)
- Schema changes → run `db:*` commands, then rebuild Docker
- Check logs: `docker logs canoforms -f`
- **Testing embed changes:** Users need hard refresh (Ctrl+Shift+R) to clear browser cache of embed.js

**Port 3006** is mapped to container's port 3000 for Caddy/Cloudflare routing.

### Key architecture + invariants (validated in code)

- **Multi-tenant model**: `Account → Form/Site → Field/Submission` (v2.3.0+)
  - **Primary ownership**: Forms owned directly by `accountId` (v2.3.0+)
  - **Legacy chain**: `Form → Site → User → Account` still exists for backward compatibility
  - Ownership checks use **direct accountId comparison** (simplified from JOIN chain)
- **Fields are relational rows**, not a JSON blob:
  - `Field` has explicit `order` and enum `FieldType`.
  - Form uniqueness: `@@unique([siteId, slug])`; Field uniqueness: `@@unique([formId, name])`.
- **Public embed API**: `src/app/api/embed/[siteApiKey]/[formSlug]/route.ts`
  - `GET`: returns embed-safe form definition + ordered fields
  - `POST`: validates, spam-checks (honeypot), stores submission, queues email
  - **Rate limit**: GET \(60/min\), POST \(10/min\) per hashed IP
  - **Origin validation**: `validateOrigin(origin, site.domain, referer)`; dashboard hostname is allowed via `NEXT_PUBLIC_APP_URL`
  - **CORS**: headers set on responses + OPTIONS handler
- **Manual submit API**: `src/app/api/submit/[siteApiKey]/[formSlug]/route.ts`
  - `POST` only: validates fields, spam-checks, stores submission, queues email
  - **Rate limit**: POST \(10/min\) per hashed IP
  - **Origin validation**: same rules as embed
  - **CORS**: headers set on responses + OPTIONS handler
- **Email notifications** (v2.5.0+):
  - **Per-form toggle**: `emailNotificationsEnabled` boolean on Form model
  - **Account owner notifications**: Automatic email to account owner when enabled
  - **Minimal content**: Form name, timestamp, dashboard link only (no submission data)
  - **Event hook**: Direct function call in `handlePublicSubmit()` after submission persistence
  - **Fire-and-forget**: Non-blocking queue pattern, logs errors without failing submission
  - **Spam filtering**: Notifications skipped for spam submissions
- **Embed script**: `embed/src/*` → built to `public/embed.js` via `npm run embed:build`
  - Container: `[data-can-o-form]`
  - API key sources: `data-site-key`/`data-api-key` on container (or on `<script>` tag)
  - Base URL: `data-base-url` (if empty, uses relative URLs)
  - Theme overrides: `data-theme` JSON (merged with server-provided `defaultTheme`)
- **Validation & guardrails** (defense in depth):
  - **Payload size limit**: 64KB maximum per submission (v2.4.0+)
  - **Default limits**: TEXT \(200\), EMAIL \(254\), TEXTAREA \(2000\) chars
  - **Absolute maximums**: TEXT \(500\), EMAIL \(320\), TEXTAREA \(10000\) chars (enforced server-side in `src/lib/public-submit.ts`)
  - **Three-layer enforcement**: HTML maxLength attribute → client validation (`embed/src/validation.ts`) → server validation
  - **Textarea behavior**: Auto-sized based on maxLength (~60 chars/row), resize disabled (`resize: none`)
  - These limits apply even if user doesn't configure maxLength validation
- **Next.js env vars rule** (important):
  - Client components cannot reliably read runtime env vars.
  - Pattern used here: server page reads env → passes `apiUrl` prop into client components (e.g. `src/app/(admin)/forms/[formId]/edit/page.tsx`).
- **Mutations live in server actions**: `src/actions/forms.ts` and `src/actions/auth.ts`
  - Actions **must** enforce ownership internally (they do via `getOwned*` helpers with `accountId`).
  - Actions are responsible for `revalidatePath(...)` on affected routes.
- **Auth**: NextAuth v5 credentials provider with self-service signup (v2.2.0+)
  - **Signup**: `/signup` page creates Account + User automatically, logs in user
  - **Password Reset**: `/forgot-password` and `/reset-password` using email infrastructure
  - **Login Telemetry**: Tracks `lastLoginAt`, `failedLoginCount`, `lastFailedLoginAt`
  - **Account Model**: Internal construct (one per user in v3, not exposed in UI)
  - Admin user created via `prisma/seed.ts` using `ADMIN_EMAIL` / `ADMIN_PASSWORD`
  - Server actions in `src/actions/auth.ts`: `signUp()`, `requestPasswordReset()`, `resetPassword()`
- **Form Ownership (v2.3.0+)**: Direct account-based ownership
  - Forms have `accountId` foreign key to Account (no JOIN through Site table)
  - Forms track `createdByUserId` for attribution
  - Data access helpers in `src/lib/data-access/forms.ts` use `accountId` for filtering
  - Helper: `getCurrentAccountId()` in `src/lib/auth-utils.ts` fetches accountId from session

### Repo map (where to look first)

- **Admin routes**: `src/app/(admin)/*`
- **Auth pages**: `src/app/(auth)/*` (login, signup, password reset)
- **Public APIs**: `src/app/api/embed/*` (embed) and `src/app/api/submit/*` (manual HTML)
- **Server actions**: `src/actions/auth.ts` (signup, password reset) and `src/actions/forms.ts` (form mutations)
- **Ownership/data access helpers**: `src/lib/data-access/forms.ts`
- **Embed runtime source**: `embed/src/*` (do not hand-edit `public/embed.js`)
- **Schema**: `prisma/schema.prisma`
- **Version history**: `CHANGELOG.md` (concise) and `docs/epics/` (detailed reports)

### Before making changes (anti-“LLM bolt-on” checklist)

- **Clarify the layer**: is this admin UX, embed UX, public API behavior, or schema?
- **Search first**: find existing route/component/action that already does it.
- **Validate against code**: if a doc says X, confirm in the relevant file before implementing X.
- **Prefer fixing root causes** over silencing symptoms:
  - Don’t “just catch and ignore” unless you can justify why it’s safe.
  - Don’t bypass ownership checks, origin validation, or rate limits to “make it work”.
- **Keep changes cohesive**: avoid adding new parallel patterns when an existing one is clearly established.

### Debugging playbook (don’t bandaid)

- **Reproduce** the failure and identify which layer is failing (embed vs API vs admin vs DB).
- **Locate the source** (the first wrong assumption), not just the thrown error.
- **Fix at the right boundary**:
  - Validation errors: decide client vs server vs both (this project does both).
  - URL/env issues: fix server-side env resolution and pass props; don’t sprinkle `process.env` in client components.
- **Verify end-to-end**: after a fix, ensure the full flow works (admin configure → embed renders → submit → submission stored → email queued).

### Common change workflows (things agents often miss)

- **Adding/modifying a field type**
  - Update `FieldType` enum in `prisma/schema.prisma`
  - Update admin editor UI options (`src/components/field-editor-modal.tsx`)
  - Update embed rendering (`embed/src/form.ts`)
  - Update embed validation (`embed/src/validation.ts`) if needed
  - Update server-side validation for v2 embed POST (`src/app/api/embed/.../route.ts`)
  - Rebuild embed: `npm run embed:build`
- **Changing embed behavior/styles**
  - Edit `embed/src/*`
  - Rebuild: `npm run embed:build` (never edit `public/embed.js` directly)
- **Changing env/url behavior**
  - Make the change in a **server component** and pass it down as props (pattern already used for `apiUrl`).
  - Remember `validateOrigin()` allows the dashboard host via `NEXT_PUBLIC_APP_URL`—changing that env var changes what’s allowed.
- **Schema changes**
  - **Recommended**: Manual SQL migration (see `docs/tools/prisma-7.md`)
    - Create migration file in `prisma/migrations/TIMESTAMP_name/migration.sql`
    - Apply: `cat migration.sql | docker exec -i canoforms-db psql -U user -d canoforms`
    - Regenerate: `docker exec canoforms npx prisma generate`
  - Alternative (may not work): `npm run db:migrate` or `npm run db:push`
  - After schema changes: regenerate client and update any affected API payload shapes + UI.

### Commands

**Development workflow:**
```bash
# Make code changes, then rebuild:
docker compose build && docker compose up -d

# View logs:
docker logs canoforms -f

# Rebuild embed script (do this before docker compose build):
npm run embed:build
```

**Docker management:**
```bash
docker compose up -d             # Start containers
docker compose down              # Stop containers
docker compose restart canoforms # Restart app only
docker compose logs canoforms -f # Follow logs
```

**Database commands (run on host):**
```bash
docker exec canoforms npm run db:generate  # Regenerate Prisma Client
docker exec canoforms npm run db:migrate   # Apply migrations
docker exec canoforms npm run db:push      # Quick schema sync (dev only)
docker exec canoforms npm run db:seed      # Seed admin user
```

**Direct npm scripts (for reference):**
```bash
npm run lint                     # Run linter
npm run build                    # Build Next.js (used in Docker build)
```

### Completing an epic (documentation pattern)

After completing an epic:
1. Update `CHANGELOG.md` with new version entry
2. Create detailed report at `docs/epics/epic-N-name.md`
3. Update `docs/epics/README.md` to mark epic as complete
4. Bump version in `package.json` (v2.2.0, v2.3.0, v3.0.0, etc.)

**Note**: All v3 epics (0-6) are now complete. This pattern remains for reference.


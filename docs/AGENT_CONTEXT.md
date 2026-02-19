# Canopy Forms — Agent Context

**Read this document before making any code changes.** This is the authoritative guide for understanding and working on this codebase.

## Who uses this and why

**Target users**: Small business owners and freelance developers who build static sites (Jekyll, Hugo, hand-coded HTML) and need form handling without setting up a backend.

**The problem**: Static sites can't process form submissions. Users either pay for expensive form SaaS, build a backend, or use clunky third-party widgets.

**Our solution**: A self-hostable forms platform where users:
1. Create forms in a visual builder (admin UI)
2. Embed with two lines of HTML (script tag)
3. Get submissions via dashboard and email notifications

**Key value props**: Simple embed, visual builder, self-hostable, privacy-first (no tracking), clean UI.

## System layers

| Layer | Purpose | Location |
|-------|---------|----------|
| **Admin UI** | Form builder, submission viewer, settings | `src/app/(admin)/*` |
| **Embed script** | Renders forms on client sites, handles validation/submit | `embed/src/*` → `public/embed.js` |
| **Public APIs** | Serve form definitions, accept submissions | `src/app/api/embed/*`, `src/app/api/submit/*` |
| **Operator Console** | Platform admin (account management, metadata-only) | `src/app/operator/*` |

When requirements are unclear: **restate the goal in one sentence** and identify which layer(s) it touches.

**Status**: v4.0.0 — Form-first model (Site removed, allowedOrigins per form)

## Source of truth

- **Code wins**. If docs disagree with code, follow the code and (optionally) update the docs.
- Treat `README.md` and `content/docs/*` as **hints** (they may lag behind).
- **Version history**: `CHANGELOG.md` tracks releases; `docs/epics/` has detailed completion reports.

---

## Environments

| Environment | URL | How it runs |
|-------------|-----|-------------|
| **Local dev** | `http://localhost:3006` | `docker-compose.dev.yml` with hot reload |
| **Dev/staging** | `https://forms-dev.canopyds.com` | Coolify, builds from `Dockerfile`, env vars in Coolify UI |
| **Production** | `https://forms.canopyds.com` | Coolify, builds from `Dockerfile`, env vars in Coolify UI |

### Deployment flow

1. Develop locally → push to GitHub
2. Coolify pulls from GitHub, builds from `Dockerfile`
3. Container entrypoint (`scripts/start.sh`) runs `prisma migrate deploy` before starting the app — see [`docs/coolify-prisma-migrations.md`](coolify-prisma-migrations.md)
4. Env vars (`NEXTAUTH_URL`, `DATABASE_URL`, `SMTP_*`, etc.) are configured per-environment in the Coolify UI — **not** in committed files

### What each file is for

| File | Used by | Notes |
|------|---------|-------|
| `docker-compose.dev.yml` | Local dev only | Hot reload, localhost URLs, local Postgres |
| `Dockerfile` | Coolify (dev + prod) | Production build |
| `Dockerfile.dev` | Local dev (via compose) | Dev build with hot reload |
| `docker-compose.yml` | **Not used** | Legacy from old Caddy setup, kept for reference |

---

## Development workflow

**This project runs in Docker** with hot reload for local development.

### Starting development

```bash
docker compose -f docker-compose.dev.yml up -d
```

Access at **http://localhost:3006** (port 3006 on the host maps to the container’s 3000).

### Making changes

| Change type | What to do |
|-------------|------------|
| **Code changes** | Just save — hot reload picks them up automatically |
| **Embed changes** | Run `npm run embed:build`, then hard refresh browser (Ctrl+Shift+R) |
| **Schema changes** | See "Schema changes" below, then restart container |

### Common commands

```bash
# Development
docker compose -f docker-compose.dev.yml up -d      # Start
docker compose -f docker-compose.dev.yml down       # Stop
docker compose -f docker-compose.dev.yml restart canopy-forms  # Restart app
docker compose -f docker-compose.dev.yml build --no-cache  # Force rebuild
docker logs canopy-forms -f                            # View logs

# Embed script
npm run embed:build                                 # Rebuild after embed/* changes

# Database
docker exec canopy-forms npm run db:seed               # Seed admin user
```

### Schema changes

**Every `prisma/schema.prisma` change MUST include a migration file.**

1. Edit `prisma/schema.prisma`
2. Generate and apply the migration inside the container:
   ```bash
   docker compose -f docker-compose.dev.yml exec canopy-forms npx prisma migrate dev --name descriptive_name
   ```
3. Verify the migration file was created in `prisma/migrations/`
4. Commit both the schema change AND the migration files

**Rules:**
- Never run `prisma db push` — always use migrations
- Never modify existing migration files — create new ones
- If `prisma migrate dev` fails with shadow DB errors (missing tables from removed models), use `prisma migrate deploy` or `prisma migrate resolve --applied <migration_name>`
- Migration files are SQL and must be committed to git
- The container entrypoint runs `prisma migrate deploy` automatically on startup (not a Coolify hook)

---

## Architecture invariants

### Data model (v4.0.0+)

- **Form-first model**: `Account → Form → Field/Submission`
  - Forms owned directly by `accountId` (no Site model)
  - Forms have `allowedOrigins` array for origin validation
  - Form slugs unique per account: `@@unique([accountId, slug])`
- **Fields are relational rows**, not JSON blob
  - `Field` has explicit `order` and enum `FieldType`
  - Field uniqueness: `@@unique([formId, name])`

### Public APIs

- **Embed API** (`src/app/api/embed/[formId]/route.ts`)
  - GET: returns embed-safe form definition + ordered fields
  - POST: validates, spam-checks (honeypot), stores submission, queues email notifications
  - Rate limit: GET 60/min, POST 10/min per hashed IP
  - Origin validation: `validateOrigin(origin, form.allowedOrigins, referer)`; localhost always allowed
  - Email notifications: Sends individual emails to all addresses in `form.notifyEmails[]` (max 5)

- **Manual submit API** (`src/app/api/submit/[formId]/route.ts`)
  - POST only: same validation/storage as embed
  - For whiteboxed HTML forms (no schema fetch)
  - Also supports multi-recipient email notifications

### Validation (defense in depth)

- **Payload limit**: 64KB max per submission
- **Field limits**: TEXT (500 max), EMAIL (320 max), TEXTAREA (10000 max)
- **Three layers**: HTML maxLength → client validation → server validation
- **Embed UI**: Native HTML5 popups via `setCustomValidity()` (shows one error at a time)

### Auth & ownership

- **NextAuth v5** credentials provider with self-service signup
- **Account model**: Internal (one per user), not exposed in UI
- **Ownership checks**: Direct `accountId` comparison in data access helpers
- **Mutations**: Server actions in `src/actions/` enforce ownership internally

### Env vars rule

Client components cannot reliably read runtime env vars. Pattern: server component reads env → passes as props to client components.

Example: `src/app/(admin)/forms/[formId]/edit/page.tsx` passes `apiUrl` prop.

---

## UI/UX patterns

**See [`UX_PATTERNS.md`](UX_PATTERNS.md) for comprehensive guidelines.**

Key rules:
- **Colors**: Use semantic color tokens (`bg-primary`, `text-destructive`, `text-success`) defined in `src/app/globals.css`. Brand colors: Main Teal (#005F6A) for primary, Highlight Green (#5FD48C) for success, Pop Coral (#FF6B5A) for destructive/errors.
- **Never use browser dialogs** (`alert()`, `confirm()`) — use `toast` and `ConfirmDialog`
- **Never use Up/Down buttons** for reordering — use `SortableList` with drag-and-drop
- **Always add tooltips** to icon-only buttons
- **Standard icons**: `GripVertical` (drag), `Trash2` (delete), `Pencil` (edit)
- **Typography**: Use `font-heading` for all headings/titles (Urbanist); body text uses Inter by default
- **Branding**: Use `BrandMark` (`src/components/brand-mark.tsx`) + assets in `public/brand/` for logo/wordmark consistency. App icons live in `src/app/icon.svg` and `src/app/favicon.ico`.

---

## Repo map

| Area | Location |
|------|----------|
| Admin routes | `src/app/(admin)/*` |
| Auth pages | `src/app/(auth)/*` |
| Public APIs | `src/app/api/embed/*`, `src/app/api/submit/*` |
| Server actions | `src/actions/auth.ts`, `src/actions/forms.ts` |
| Data access helpers | `src/lib/data-access/forms.ts` |
| Embed source | `embed/src/*` (never edit `public/embed.js` directly) |
| Schema | `prisma/schema.prisma` |

---

## Before making changes

- **Clarify the layer**: admin UX, embed UX, public API, or schema?
- **Search first**: find existing route/component/action that already does it
- **Validate against code**: if a doc says X, confirm in the file before implementing
- **Fix root causes**: don't "catch and ignore" or bypass security (ownership, origin validation, rate limits)
- **Keep changes cohesive**: don't add parallel patterns when one is established

---

## Debugging playbook

1. **Reproduce** the failure and identify the layer (embed vs API vs admin vs DB)
2. **Locate the source** (first wrong assumption), not just the thrown error
3. **Fix at the right boundary**:
   - Validation: decide client vs server vs both (this project does both)
   - URL/env issues: fix in server component, pass props down
4. **Verify end-to-end**: admin configure → embed renders → submit → stored → email queued

### Common Docker issues

**Container won't start or crashes**:
```bash
# 1. Check if containers are running
docker ps --filter name=canopy-forms

# 2. If no containers, they were stopped. Restart:
docker compose -f docker-compose.dev.yml up -d

# 3. If containers exist but failing, check logs:
docker logs canopy-forms --tail 50
```

**Hot reload not working**: Force rebuild with `docker compose -f docker-compose.dev.yml build --no-cache`, then `up -d`.

---

## Common change workflows

### Adding/modifying a field type

1. Update `FieldType` enum in `prisma/schema.prisma`
2. **Update `src/lib/field-types.ts`** (required - build will fail if skipped): add the type to `FIELD_TYPE_OPTIONS` (labels for dropdown/display) and to `FIELD_TYPE_LABEL_PLACEHOLDERS` (example hint for the field editor Label input)
3. Update embed rendering (`embed/src/form.ts`)
4. Update embed validation (`embed/src/validation.ts`) if needed
5. Update server validation (`src/app/api/embed/.../route.ts`)
6. If the field has configuration options, add a config component in `src/components/field-config/`
7. Rebuild embed: `npm run embed:build`

### Changing embed behavior/styles

1. Edit `embed/src/*` (form rendering, validation, styles, or theme defaults)
2. Rebuild: `npm run embed:build`
3. Hard refresh browser to clear cache (Ctrl+Shift+R)

**Note**: Embed color defaults are in `embed/src/theme.ts` and `embed/src/styles.ts`. Changes to these require rebuild.

### Changing env/url behavior

1. Make changes in a **server component**
2. Pass values down as props (see `apiUrl` pattern)
3. Remember `validateOrigin()` uses `NEXT_PUBLIC_APP_URL` for dashboard host

---

## Documentation pattern (for epics)

After completing an epic:
1. Update `CHANGELOG.md` with new version entry
2. Create report at `docs/epics/epic-N-name.md`
3. Update `docs/epics/README.md` to mark complete
4. Bump version in `package.json`

All v3 epics (0-6) are complete. This pattern remains for reference.

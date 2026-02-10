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

## Development workflow

**This project runs in Docker** with hot reload for development.

### Dev in prod

**We develop against the production domain.** The app is run in **dev mode** (hot reload) but accessed at **https://forms.canopyds.com**. Always use `docker-compose.dev.yml` so the site stays in dev mode at that URL; do not use production compose during development.

### Starting development

```bash
docker compose -f docker-compose.dev.yml up -d
```

Access at **https://forms.canopyds.com** (Caddy/Cloudflare route the domain to the dev container; port 3006 is mapped from the container’s 3000).

### Making changes

| Change type | What to do |
|-------------|------------|
| **Code changes** | Just save — hot reload picks them up automatically |
| **Embed changes** | Run `npm run embed:build`, then hard refresh browser (Ctrl+Shift+R) |
| **Schema changes** | See "Schema changes" below, then restart container |

### ⚠️ Critical: Development mode only

**NEVER use `docker compose build` or `docker compose up` (without `-f docker-compose.dev.yml`) during development.**

This switches to production mode, disabling hot reload. If you accidentally do this, you MUST rebuild:

```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

**Why rebuild is required**: Building with production compose creates a production image. Simply starting with dev compose won't work because it tries to use the existing production image instead of the dev Dockerfile.

### Common commands

```bash
# Development
docker compose -f docker-compose.dev.yml up -d      # Start
docker compose -f docker-compose.dev.yml down       # Stop
docker compose -f docker-compose.dev.yml restart canopy-forms  # Restart app
docker compose -f docker-compose.dev.yml build --no-cache  # Force rebuild (if switching modes)
docker logs canopy-forms -f                            # View logs

# Embed script
npm run embed:build                                 # Rebuild after embed/* changes

# Database
docker exec canopy-forms npm run db:seed               # Seed admin user
```

### Schema changes

**Recommended**: Manual SQL migration (see `docs/tools/prisma-7.md`)

1. Edit `prisma/schema.prisma`
2. Create migration in `prisma/migrations/TIMESTAMP_name/migration.sql`
3. Apply: `cat migration.sql | docker exec -i canopy-forms-db psql -U user -d canopy-forms`
4. Rebuild: `docker compose build && docker compose up -d` (regenerates Prisma client)

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
  - POST: validates, spam-checks (honeypot), stores submission, queues email
  - Rate limit: GET 60/min, POST 10/min per hashed IP
  - Origin validation: `validateOrigin(origin, form.allowedOrigins, referer)`; localhost always allowed

- **Manual submit API** (`src/app/api/submit/[formId]/route.ts`)
  - POST only: same validation/storage as embed
  - For whiteboxed HTML forms (no schema fetch)

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

**Bad Gateway / Site down**:
```bash
# 1. Check if containers are running
docker ps --filter name=canopy-forms

# 2. If no containers, they were stopped. Restart:
docker compose -f docker-compose.dev.yml up -d

# 3. If containers exist but failing, check logs:
docker logs canopy-forms --tail 50

# 4. If logs show "Cannot find module '/app/server.js'":
# This means production image is running. Rebuild with dev:
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

**Hot reload not working**: Rebuild is required - see "Critical: Development mode only" section above.

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

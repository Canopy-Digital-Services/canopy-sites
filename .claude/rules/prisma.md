---
paths:
  - "apps/portal/prisma/**"
  - "apps/portal/prisma.config.ts"
  - "apps/portal/src/lib/db.ts"
  - "apps/portal/src/lib/data-access/**"
---

# Database, schema, and Prisma 7

Code paths are relative to `apps/portal/`.

## Data model

- **Form-first**: `Account → Form → Field / Submission`. A Sites account also has at most one `Site` (unique `accountId`, PRD D19), allowed only on a plan with `sitesEnabled`; an account that owns a site cannot be deleted (`onDelete: Restrict`), so reassign the site first.
- Forms own `allowedOrigins[]`. Origin control is per form, not per account.
- **An account has one time zone**, `Account.timeZone` (an IANA name, checked by `isTimeZone` in `src/lib/time-zone.ts`): the business's. Emails state times in it, and its site's dates follow it (quick edit's "today", the builder's nightly rebuild). Signup records the browser's, Link a site sets Pacific, and `UTC` is an account nobody has given one. The Account page changes it (`setAccountTimeZone`, for the owner or an operator acting as them), which also tells the builder (`sendSiteTimeZone`). A site has no zone of its own.
- Uniqueness: `@@unique([accountId, slug])` on Form, `@@unique([formId, name])` on Field.
- Fields are **relational rows** with an explicit `order` and enum `FieldType`. Never JSON blobs.
- Publishing needs at least one field: `toggleFormPublished` refuses without one, since a submission stores only fields. The editor's Fields step and the Publish tab's button hold until there is one.
- Every Account has a `Plan` (FK on `planCode`). Entitlements are typed columns on `Plan` (`maxPublishedForms`, `sitesEnabled`), and the catalog is seeded by migration, not editable at runtime. Enforce through `getAccountEntitlements` (`src/lib/data-access/entitlements.ts`). Never re-implement the comparison at a call site, and never compare plan codes. `maxPublishedForms` caps published forms only, and publishing is its one gate (`canPublishAnother` in `src/actions/forms.ts`): creating and deleting a form are never gated, and the public routes check `published`, not the plan.
- `Account.requiresPlanResolution` is set when a plan change drops the cap below the account's live published count. While set, the admin layout renders `PlanResolutionDialog` as a non-dismissible blocker, cleared only by a successful `resolvePlan`.

Models, fields, relations, and enums are in `prisma/schema.prisma`; read them there. What the schema doesn't show:

- **One draft per site**: the pending `ChangeSet` is the site's draft (PRD D38), held to one per site by a partial unique index that only its migration states (`20261114180000_one_pending_change_per_site`).
- **`FormType` is locked at creation.** Drives editor branching (Appearance Page subsection, the "Inherit from host page" font option, preview mode), publish surfaces (Share Link vs Allowed Origins plus Embed Code), and the public endpoints (the embed and submit APIs take a HOSTED form only from its hosted page, `.claude/rules/public-api.md`, "403 codes"; `/f/[formId]` rejects EMBEDDED with Form Not Available).
- **`PasswordTokenPurpose`**: a `CLAIM` token sets an unclaimed owner's first password (PRD D49); `/reset-password` accepts only `RESET`.
- **`AccountStatus`** is operator-set billing state with a free-text `billingRef` (PRD D12); it gates nothing yet.
- **A `WelcomeView` row** means the tab's video has opened by itself for that person.

Seeded plans, one per entitlement level: `FREE` (maxPublishedForms 1, the signup default), `PAID` (null, shown as "Unlimited"), `SITES` (null, `sitesEnabled`, `isPublic: false`). `PAID` and `SITES` are operator-assigned until billing ships. Whether an account pays, is comped, or is a sandbox is its billing state (`status`, `billingRef`), never a plan.

Seeded roles: `USER` (default), `GLOBAL_ADMIN` (`isPublic: false`, admin-granted only). Operator console access is gated on `GLOBAL_ADMIN`, and promotion moves an account on a capped plan to `PAID` (an uncapped plan such as `SITES` stays).

## Schema changes

`prisma/migrations/` is append only.

**Every `prisma/schema.prisma` change that touches the database MUST ship with a migration file, in the same commit.**

Migrations apply via `prisma migrate deploy` in `scripts/start.sh` at container start, against the deployed database, which is in a different state than yours. A migration that passes locally can still fail there, and `set -e` means a failure takes the app down. A missing migration file is worse: the deployed schema never changes while the Prisma client expects the new columns, producing `P2022: column does not exist`.

Procedure:

1. Edit `prisma/schema.prisma`.
2. Run `docker exec canopy-portal npm run db:migrate -- --name descriptive_name` (`DATABASE_URL` exists only in the container). Its `postdb:migrate` hook regenerates the client, which Prisma 7's `migrate dev` no longer does; `prisma migrate dev` called directly skips the hook. Then `docker restart canopy-portal`: the dev server loads a client only when it starts.
3. **Read the generated SQL** and confirm it does what you intended, not just that it exists.
4. Commit schema and migration together.
5. Tell the user to check the Coolify logs for `Applied migration: <name>` followed by `Migrations complete. Starting application...`.

Rules:

- **Never** modify or delete a migration under `prisma/migrations/`. Deployed databases have already applied them. The one historical exception, the `0_baseline` squash at v4.6.0, is done and not a precedent.
- Multiple related schema changes in one session get one migration per logical change, each independently safe to apply.
- If `prisma migrate dev` cannot make the migration (it fails on the shadow DB, or the change loses data and there is no TTY to confirm it on), write the SQL by hand and apply it with `prisma migrate deploy`. The steps, and how to name the directory, are in "Hand-written migration" below.
- **Dropping a column takes two production releases.** Prisma names every column the schema declares, whatever the code reads: in every query without a `select` (an `include` and the row an `update` returns count), and in every `create`, which inserts a field's `@default` by name. A container whose schema still declares a dropped column fails all of those with `P2022`, and a rollback to that release does too. The first release stops using the field and marks it `@ignore`, with a `///` note giving the date it retired: that leaves the table alone, so it has no migration, and the build fails on any code still using the field. The drop (the field's removal with its migration) goes in a later release, once `main`'s schema carries the `@ignore`. A global `omit` on the client is no substitute, since creates still insert the column (all of this tested 2026-11-14 on Prisma 7.3.0, against a copy of the schema with `sites."timeZone"` dropped). No insert names an ignored column, so a required one needs a database default before it is ignored.

Migration failures and `P2022` in production: the migration did not run. Confirm the file exists under `prisma/migrations/` and that `start.sh` runs before `node server.js`. Recovering from a failed migration: "When a migration fails on deploy", below.

## Prisma 7

**Installed version:** `prisma`, `@prisma/client`, and `@prisma/adapter-pg` in `apps/portal/package.json`, resolved in the root `package-lock.json` (7.3.0 as of 2026-11-14). Upgrade guide: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7

What Prisma 7 changed that older habits get wrong, and how this repo uses it.

### The client

- **This repo stays on the `prisma-client-js` generator, with no `output`.** Prisma 7's docs show `provider = "prisma-client"` with an `output` path; 7.3.0 still accepts the old generator, which generates into `node_modules/.prisma/client`, so every import is from `@prisma/client` (verified 2026-11-14). Don't paste the new block into the schema: it moves the client and breaks every import. Switching is its own piece of work.
- **No `"type": "module"`** in `apps/portal/package.json`, though the upgrade guide says to add one: `prisma-client-js` still emits CommonJS (read 2026-11-15).
- **A driver adapter is required.** The one client is created in `apps/portal/src/lib/db.ts` (`@prisma/adapter-pg` over a `pg` pool, kept on `globalThis` outside production): import `prisma` from there and never construct a second. The pool has node-postgres's defaults, since `db.ts` passes only the connection string: 10 connections, no connection timeout (Prisma 6 had 5 seconds), so a request waits for a connection as long as it takes (read from `pg` 8.17.2, 2026-11-15).
- **Client middleware (`prisma.$use`) is gone**; `$extends` replaces it. The portal uses neither (as of 2026-11-15).
- A query without `select` names every column the schema declares, and a `create` inserts every `@default`. Retiring or dropping a column follows "Schema changes" above ("Dropping a column takes two production releases").

### Configuration

The schema's `datasource` has a `provider` and no `url`. The database URL and the seed command live in `apps/portal/prisma.config.ts` (`defineConfig` from `prisma/config`, with `schema`, `migrations.seed`, and `datasource.url`); the only other datasource key 7.3.0 accepts is `shadowDatabaseUrl`. The CLI loads no `.env`: `DATABASE_URL` exists only in the container, so every Prisma command runs through `docker exec canopy-portal`.

### The CLI

- **`migrate dev` and `db push` no longer run `prisma generate`.** `npm run db:migrate` regenerates through its `postdb:migrate` hook; `npx prisma migrate dev` called directly skips it.
- **Nothing seeds automatically** after `migrate dev` or `migrate reset`: run `docker exec canopy-portal npm run db:seed`.
- **`migrate diff` flags changed**: `--to-schema` and `--from-schema` replace `--to-schema-datamodel` and `--from-schema-datamodel`, and the URL flags are gone; the database side is `--from-config-datasource` or `--to-config-datasource`, which reads `prisma.config.ts`.

### Hand-written migration

Write the migration by hand when `migrate dev` can't make it:

- A change that loses data (dropping a column or table that holds values): `migrate dev` asks for confirmation, `docker exec` gives it no TTY, and it stops with `Prisma Migrate has detected that the environment is non-interactive` (verified 2026-11-14).
- An enum value rename: Prisma generates a drop and recreate, which fails while values are in use. The SQL wanted is `ALTER TYPE ... RENAME VALUE`.
- SQL that has to be exact, such as a change that keeps or rewrites existing data.

```bash
## From the repo root; `docker exec canopy-portal` runs in apps/portal.
## 1. Edit apps/portal/prisma/schema.prisma
## 2. Name the directory in UTC (-u), so it sorts after every existing migration
DIR=apps/portal/prisma/migrations/$(date -u +%Y%m%d%H%M%S)_your_migration_name
mkdir -p "$DIR"
## 3. Write the SQL in "$DIR/migration.sql"
## 4. Apply it to the dev database and record it, as production will
docker exec canopy-portal npx prisma migrate deploy
docker exec canopy-portal npx prisma migrate status
## 5. Restart: the start regenerates the client and the dev server loads it
docker restart canopy-portal
```

- **The name's order matters on every database built from scratch** (the shadow database, the `*_test` database, a new environment), where migrations apply in name order. One named earlier than a migration it depends on applies cleanly to dev, and the next `migrate dev` fails with `P3006` (verified 2026-11-15). Plain `date` on this machine's Pacific clock gives such a name.
- If the SQL has already been run by hand, record it instead: `docker exec canopy-portal npx prisma migrate resolve --applied <directory name>`.
- `psql` is in the db container only: `docker exec -it canopy-portal-db psql -U user -d canopy-forms`.

### When a migration fails on deploy

`apps/portal/scripts/start.sh` runs `prisma migrate deploy` at container start, after Coolify has swapped containers, so a failed migration leaves the portal down until it is fixed. The container's log shows `Applied migration: <name>` and then `Migrations complete. Starting application...` when it worked.

- **`P3018`, then `P3009` on every restart**: the first attempt's real error is `P3018`; after it, each restart logs "found failed migrations" and applies nothing. Read the first attempt with `docker logs <container> 2>&1 | head -60`. Postgres runs a migration file as one transaction, so nothing is half-applied; confirm in the database. Then, after a `pg_dump`: make the database what the migration expects (never edit the migration file, which every other environment has applied); mark the attempt rolled back with `prisma migrate resolve --rolled-back <name>`, or `UPDATE "_prisma_migrations" SET "rolled_back_at" = now() WHERE "migration_name" = '<name>' AND "finished_at" IS NULL` when the container restarts too fast to exec into; then `docker restart <container>`. Production's database predates the `0_baseline` squash, and some of its uniques are constraints where the baseline has indexes (this failed the v5.1.0 deploy), so check a migration that drops an old index against a copy of production first.
- **`P2022: The column does not exist`** in a running app: the migration didn't run, or doesn't exist. Check that the migration directory is committed and that the Dockerfile's `CMD` is `start.sh`. `SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at` shows what the database has applied.
- **`Error: The datasource.url property is required`**: the container lacks `prisma.config.ts` or `DATABASE_URL`.
- **`npm warn exec ... will be installed: prisma@X.Y.Z`**: the runner image has no Prisma CLI, and `npx` is downloading one; the Dockerfile must copy the full root `node_modules`.

# Prisma 7

**Installed version:** `prisma`, `@prisma/client`, and `@prisma/adapter-pg` in `apps/portal/package.json`, resolved in the root `package-lock.json` (7.3.0 as of 2026-11-14).  
**Official Docs:** https://www.prisma.io/docs

## Overview

Prisma 7 replaced the Rust query engine with a TypeScript client that reaches the database through a driver adapter, and moved connection settings out of the schema into `prisma.config.ts`.

The statements below were checked on 2026-11-15 against the official upgrade guide, the 7.3.0 release notes, and the installed CLI and packages.

## Critical Changes from Prisma 6

### Architecture Shift

- **Rust-free**: The client is TypeScript; there is no query engine binary
- **ESM**: Prisma 7 ships as an ES module and its upgrade guide says to set `"type": "module"`. `apps/portal/package.json` has no such line and must not get one: the `prisma-client-js` generator this repo is on still emits CommonJS (`node_modules/.prisma/client/default.js`, read 2026-11-15)
- **New generator**: `prisma-client` replaces deprecated `prisma-client-js`
- **Configuration separation**: Database URLs now in `prisma.config.ts`, not schema file
- **Adapter-based**: A driver adapter is required for every database (`@prisma/adapter-pg` here)
- **No `.env` loading**: The CLI reads only the process environment. `prisma.config.ts` takes `process.env.DATABASE_URL` as is, which only the container has

### Minimum Requirements

- **Node.js**: 20.19.0+ (22.x recommended)
- **TypeScript**: 5.4.0+ (5.9.x recommended)

## Schema Configuration

### Generator Block (Breaking Change)

**Old (Prisma 6):**
```prisma
generator client {
  provider = "prisma-client-js"
  engineType = "binary"
}
```

**New (Prisma 7):**
```prisma
generator client {
  provider = "prisma-client"  // Required: prisma-client-js is deprecated
  output = "./generated/prisma"  // Required: no longer generates to node_modules
  compilerBuild = "fast"  // Optional, since 7.3.0: "fast" (default, built for speed) or "small" (built for size)
}
```

**This repo has not switched generators.** `apps/portal/prisma/schema.prisma` keeps `provider = "prisma-client-js"` with no `output`, which Prisma 7.3.0 still accepts: the client generates into `node_modules/.prisma/client` and every import is from `@prisma/client` (verified 2026-11-14). Do not paste the block above into the schema: switching generators moves the client and breaks those imports.

### Datasource Block (Breaking Change)

**Old (Prisma 6):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ❌ Removed in v7
  directUrl = env("DIRECT_URL")   // ❌ Removed in v7
}
```

**New (Prisma 7):**
```prisma
datasource db {
  provider = "postgresql"
  // Connection URLs moved to prisma.config.ts
}
```

## Configuration File: prisma.config.ts

The database URL and the seed command live in `apps/portal/prisma.config.ts`, not in the schema or `package.json`. It calls `defineConfig` from `prisma/config` with `schema`, `migrations.seed`, and `datasource.url`. The only other datasource key Prisma 7.3.0 accepts is `shadowDatabaseUrl`: there is no `databaseUrl` or `directUrl`. What fails when the file is missing is in `docs/PRISMA_MIGRATIONS.md`.

## Database Adapters (Required)

`new PrismaClient()` without an adapter no longer works. The portal uses `@prisma/adapter-pg` over a `pg` pool, created once in `apps/portal/src/lib/db.ts`: import `prisma` from there, and never construct a second client.

**The pool is node-postgres's, with its defaults.** `db.ts` passes only the connection string, so (read from the installed `pg` 8.17.2, 2026-11-15):
- Pool size (`max`): 10
- Connection timeout: none, where Prisma 6 used 5 seconds (per the upgrade guide). A request waits for a connection for as long as it takes
- Idle timeout: 10 seconds
- Connection lifetime: unlimited

## Import Paths (Breaking Change)

After generating with the new `output` path, update imports:

**Old (Prisma 6):**
```typescript
import { PrismaClient } from '@prisma/client';
```

**New (Prisma 7):**
```typescript
// If output = "./generated/prisma"
import { PrismaClient } from './generated/prisma';
// or
import { PrismaClient } from '../generated/prisma';  // depending on file location
```

**Note:** This repo is on `prisma-client-js` (see Generator Block above), so its imports stay `@prisma/client`. A move to `prisma-client` means updating every one.

## Removed or Deprecated in Prisma 7

- **Client middleware (`prisma.$use`)**: removed. Client Extensions (`$extends`) replace it. The portal uses neither (as of 2026-11-15).
- **Metrics**: removed.
- **MongoDB**: not supported in Prisma 7.
- **`prisma-client-js`**: deprecated, to be removed in a later release. This repo is still on it; moving to `prisma-client` is its own piece of work (see Generator Block above), not something to do in passing.

Since 7.3.0, `$queryRaw` and `$executeRaw` skip the query compiler and go straight to the driver adapter. No code change is involved.

## CLI Changes in Prisma 7

- **`migrate dev` and `db push` no longer run `prisma generate`**, and their `--skip-generate` flag is gone. Here `npm run db:migrate` regenerates through its `postdb:migrate` hook (Migration Workflow below).
- **Nothing seeds automatically** after `migrate dev` or `migrate reset`, and `--skip-seed` is gone. Run `docker exec canopy-portal npm run db:seed`.
- **`migrate diff` lost its URL flags** (`--from-url`, `--to-url`, `--from-schema-datasource`, `--to-schema-datasource`, `--shadow-database-url`). The database side is now `--from-config-datasource` or `--to-config-datasource`, which reads `prisma.config.ts`.

### `migrate diff`: `--to-schema-datamodel` renamed to `--to-schema`

The `--to-schema-datamodel` and `--from-schema-datamodel` flags were renamed (the installed CLI's `migrate diff --help` lists only the new names):

| Old (Prisma 6) | New (Prisma 7) |
|-----------------|----------------|
| `--to-schema-datamodel` | `--to-schema` |
| `--from-schema-datamodel` | `--from-schema` |

Example, generating baseline SQL from the current schema:
```bash
# Old (Prisma 6):
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script

# New (Prisma 7):
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
```

---

## Project-Specific Notes

- The client is created once in `apps/portal/src/lib/db.ts`: a `pg` pool, the `@prisma/adapter-pg` adapter, and one `PrismaClient` kept on `globalThis` outside production.
- A query without `select` names every column the schema declares, and a `create` inserts every `@default`. Retiring or dropping a column follows `docs/AGENT_CONTEXT.md` section 5 ("Dropping a column takes two production releases").

### Migration Workflow for This Project

All migration commands run **inside the Docker container** (DATABASE_URL is only available there). See `docs/PRISMA_MIGRATIONS.md` for the full deployment strategy.

#### Creating Migrations (Development)

```bash
# 1. Edit schema
#    apps/portal/prisma/schema.prisma

# 2. Create the migration inside the container. The script's `postdb:migrate`
#    hook then regenerates the client (verified 2026-11-14): in Prisma 7,
#    migrate dev no longer runs generate (2026-10-18: tests failed with
#    PrismaClientValidationError on the new column until it ran).
#    `npx prisma migrate dev` called directly skips the hook.
docker exec canopy-portal npm run db:migrate -- --name your_migration_name

# 3. Restart the dev server: it loads a client only when it starts
docker restart canopy-portal
```

#### Hand-Written Migration

Write the migration by hand when `migrate dev` cannot make it:

| Case | Why |
|------|-----|
| A change that loses data (dropping a column or table that holds values) | `migrate dev` asks for confirmation and `docker exec` gives it no TTY to ask on, so it stops with `Prisma Migrate has detected that the environment is non-interactive`. A change that loses nothing runs through `docker exec` as usual (both verified 2026-11-14 on 7.3.0: adding a nullable column, then dropping a column that held values) |
| An enum value rename | Prisma generates a drop and recreate, which fails while values are in use. The SQL wanted is `ALTER TYPE ... RENAME VALUE` |
| The exact SQL matters | For example a change that has to keep or rewrite existing data |

```bash
# Host paths below are from the repo root; `docker exec canopy-portal` runs in apps/portal.

# 1. Edit apps/portal/prisma/schema.prisma

# 2. Create the migration directory. Its name must sort after every existing
#    migration, and `migrate dev` names them in UTC: keep the -u.
DIR=apps/portal/prisma/migrations/$(date -u +%Y%m%d%H%M%S)_your_migration_name
mkdir -p "$DIR"

# 3. Write the SQL in "$DIR/migration.sql"

# 4. Apply the file to the dev database and record it, as production will
docker exec canopy-portal npx prisma migrate deploy

# 5. Confirm nothing is pending
docker exec canopy-portal npx prisma migrate status

# 6. Restart the dev server: its start regenerates the client and loads it
docker restart canopy-portal
```

- **The name's place in the order matters on every database built from scratch**: the shadow database `migrate dev` replays history in, the `*_test` database, a new environment. Migrations apply in name order there. A hand-written migration named earlier than one it depends on applies cleanly to the dev database, and the next `migrate dev` then fails with `P3006` (verified 2026-11-15 on 7.3.0). Plain `date` on a host clock behind UTC (this machine's is Pacific) gives such a name whenever a migration was made in the last few hours.
- If the SQL has already been run by hand, record it instead of applying it twice: `docker exec canopy-portal npx prisma migrate resolve --applied <directory name>`. `psql` is in the db container only (Accessing Database Directly, below).
- Production applies the file through `prisma migrate deploy` in `scripts/start.sh` (`docs/PRISMA_MIGRATIONS.md`).

#### Accessing Database Directly

```bash
# Connect to PostgreSQL shell
docker exec -it canopy-portal-db psql -U user -d canopy-forms

# Execute SQL file
docker exec -i canopy-portal-db psql -U user -d canopy-forms < file.sql

# View logs
docker logs canopy-portal -f
docker logs canopy-portal-db -f
```

## Resources

- **Official Documentation**: https://www.prisma.io/docs
- **Upgrade Guide**: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- **Config Reference**: https://www.prisma.io/docs/orm/reference/prisma-config-reference
- **Connection Management**: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
- **Changelog**: https://www.prisma.io/changelog

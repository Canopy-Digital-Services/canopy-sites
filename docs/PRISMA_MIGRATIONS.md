# Coolify + Prisma Migration Strategy

How database migrations work in this project, why they work this way, and how to set this up in new projects.

---

## The problem

When deploying a containerized Prisma app on Coolify, the database schema must be updated **before** the app starts serving traffic. If the Prisma Client expects columns that don't exist yet, every query fails with `P2022: The column does not exist`.

Coolify offers pre/post-deployment hooks, but neither is suitable for migrations:

| Hook | Runs in | Problem |
|------|---------|---------|
| **Pre-deployment** | Old (existing) container | Old container has old migration files — new migrations are invisible |
| **Post-deployment** | New container | If the command fails, the container **keeps running anyway** (no rollback) |

The correct approach is a **container entrypoint script** that runs `prisma migrate deploy` before `node server.js`. If migrations fail, the container exits and the app is down until the migration is fixed: health checks are not enabled on either portal app (both are named `canopy-forms` in Coolify; `health_check_enabled=false` and no Dockerfile `HEALTHCHECK`, checked 2026-11-15), so there is no routing gate to catch it. A failed **build**, by contrast, is safe; Coolify only swaps containers after a successful build, so the old container keeps serving.

---

## How it works in this project

### Entrypoint script (`apps/portal/scripts/start.sh`)

```sh
#!/bin/sh
set -e

# Runs from apps/portal; workspace dependencies are hoisted to the repo root.
echo "[portal] Running database migrations..."
node ../../node_modules/prisma/build/index.js migrate deploy

echo "[portal] Running post-migration backfills..."
node ./scripts/backfill-global-admin.mjs

echo "[portal] Migrations complete. Starting application..."
exec node server.js
```

Key details:
- `set -e` — exit immediately if any command fails
- `node ../../node_modules/prisma/build/index.js` — invokes the Prisma CLI directly (the runner's working directory is `apps/portal`; npm workspaces hoist `node_modules` to the repo root) without relying on `npx` (which might download the wrong version)
- `exec` — replaces the shell process with `node`, so signals (SIGTERM) reach the app correctly
- `prisma migrate deploy` is idempotent — if all migrations are already applied, it's a sub-second no-op

### Dockerfile (runner stage)

[`apps/portal/Dockerfile`](../apps/portal/Dockerfile) builds with the repo root as context (npm workspaces). Its runner stage copies, at minimum, what migrations need: the standalone output (which places `server.js` in `apps/portal/`), `apps/portal/prisma/`, `apps/portal/prisma.config.ts`, the **full** root `node_modules` from the deps stage (Prisma CLI and engines included), and `apps/portal/scripts/`. It then sets `WORKDIR /app/apps/portal` and runs `CMD ["./scripts/start.sh"]` as the `nextjs` user. It also creates `/app/media` owned by `nextjs`, where each app mounts its welcome-video volume (Coolify settings, below): a new named volume takes the owner of the directory it is first mounted over, so the app can write to it (checked 2026-11-18 with a fresh volume over a uid 1001 directory).

What each piece does:
- `prisma/`: contains `schema.prisma` and `migrations/` directory with SQL files
- `prisma.config.ts`: tells Prisma where to find the database (`DATABASE_URL` env var)
- `node_modules/.prisma`: the generated client (for the app at runtime)
- `node_modules/prisma`: CLI + bundled WASM schema engine (for `migrate deploy` at startup)
- `node_modules/@prisma`: runtime packages the CLI depends on (`@prisma/engines`, `@prisma/config`, etc.)
- `start.sh`: runs migrations, then starts the app

### Prisma configuration (`prisma.config.ts`)

Prisma 7 requires a config file. The `datasource.url` field is no longer in `schema.prisma` — it lives here:

```typescript
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
```

Note: the `seed` property is only used when manually running `npx prisma db seed` (e.g., initial setup). It is never invoked automatically during deployment.

### Coolify settings

| Setting | Value |
|---------|-------|
| Pre-deployment command | *(empty)* |
| Post-deployment command | *(empty)* |

Migrations are handled by the container entrypoint. Coolify hooks are not needed.

---

## Prisma 7 migration notes

### Breaking changes from Prisma 5/6

These are relevant to the migration setup:

1. **`prisma.config.ts` is required.** The `datasource.url` was removed from `schema.prisma`. If `prisma.config.ts` is missing, `prisma migrate deploy` fails with: `Error: The datasource.url property is required in your Prisma config file`.

2. **`package.json` seed config removed.** The old `"prisma": {"seed": "tsx prisma/seed.ts"}` block in `package.json` no longer works. Seeding is now configured in `prisma.config.ts` under `migrations.seed`.

3. **Auto-seeding on `migrate dev` removed.** In Prisma 6 and earlier, `prisma migrate dev` automatically ran the seed script. In Prisma 7, you must run `npx prisma db seed` explicitly.

### `migration_lock.toml`

The file `prisma/migrations/migration_lock.toml` records the database provider. It should be committed to version control:

```toml
# Please do not edit this file manually
# It should be added in your version-control system (i.e. Git)
provider = "postgresql"
```

---

## Verification

### Confirm migrations run on deploy

After deploying, check the container logs. You should see:

```
[portal] Running database migrations...
Prisma schema loaded from prisma/schema.prisma.
Datasource "db": PostgreSQL database "postgres", schema "public" at "hostname:5432"
N migrations found in prisma/migrations

No pending migrations to apply.      ← (or) Applied migration: 20260219000000_add_password_changed_at

[portal] Running post-migration backfills...
[portal] Migrations complete. Starting application...
```

### Confirm a failed migration blocks startup

To test this safely in dev: create a migration with intentionally invalid SQL (e.g., `ALTER TABLE nonexistent ADD COLUMN x TEXT;`), deploy, and confirm the container fails to start. Then delete the bad migration and redeploy.

### Confirm schema is in sync

Connect to the database and check the `_prisma_migrations` table:

```sql
SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at;
```

Every migration in `prisma/migrations/` should appear with a non-null `finished_at`.

---

## Troubleshooting

### `Error: The datasource.url property is required`

`prisma.config.ts` is missing from the container or `DATABASE_URL` is not set. Check:
- The Dockerfile copies `prisma.config.ts` to the runner stage
- The `DATABASE_URL` environment variable is configured in Coolify

### `npm warn exec The following package was not found and will be installed: prisma@X.Y.Z`

The Prisma CLI was not found in the container and `npx` is downloading it. This means `node_modules/prisma` is not in the runner. The runner stage copies the whole root `node_modules` from the deps stage (`COPY --from=deps /app/node_modules ./node_modules` in `apps/portal/Dockerfile`); check that line.

### `P2022: The column does not exist`

The app started but migrations did not run. Check:
- Is `CMD ["./scripts/start.sh"]` in the Dockerfile (not `CMD ["node", "server.js"]`)?
- Is `start.sh` calling `prisma migrate deploy` before `node server.js`?
- Is there a migration file in `prisma/migrations/` for the missing column?

### `P3018` then `P3009`: a migration failed and the container restart-loops

`P3018` is the first attempt's real error; every restart after it logs `P3009` ("found failed migrations") and applies nothing. Coolify has already swapped containers, so the site is down until it is fixed. Read the first attempt with `docker logs <container> 2>&1 | head -60`. Postgres runs the migration file as one implicit transaction, so a failed one leaves nothing half-applied; confirm in the database before changing anything. Then, after a `pg_dump`:

1. Make the database what the migration expects (never edit the migration file: every other environment has applied it).
2. Mark the failed attempt rolled back: `prisma migrate resolve --rolled-back <name>`, or the equivalent `UPDATE "_prisma_migrations" SET "rolled_back_at" = now() WHERE "migration_name" = '<name>' AND "finished_at" IS NULL` when the container is too busy restarting to exec into.
3. `docker restart <container>`: the unchanged migration and everything after it apply on start.

This happened on the v5.1.0 production deploy (2026-10-16): production's database predates the `0_baseline` squash, and three uniques there were constraints where the baseline has plain unique indexes, so `DROP INDEX "users_accountId_key"` failed. They were converted to unique indexes of the same names, and production's index set matched the migration history afterwards. Other uniques created before v4.6.0 and changed since would fail the same way, which is why a migration that drops an old index deserves a check against a copy of production first.

### Migrations applied but app still fails

Check if the migration SQL actually creates the column the Prisma Client expects. Run `npx prisma migrate status` in the container to compare migration state vs. schema.

---

## Hand-written migrations

When `prisma migrate dev` cannot produce the migration (a change that loses data, an enum value rename, SQL that has to be exact), the migration is written by hand. The cases and the steps are in `docs/tools/prisma-7.md` ("Hand-Written Migration"). Nothing differs on deploy: `start.sh` applies the SQL file like any other migration.

---

## Setting up a new Coolify + Prisma project

Checklist for starting a new project on the right foot:

### 1. Prisma configuration

- [ ] Create `prisma.config.ts` with `defineConfig`, `datasource.url`, and `migrations.seed`
- [ ] `schema.prisma` datasource block has `provider` but **no `url`** (url comes from config)
- [ ] `prisma/migrations/migration_lock.toml` exists and is committed
- [ ] No `"prisma": {"seed": "..."}` in `package.json` (Prisma 7 removed this)

### 2. Entrypoint script

- [ ] Create `scripts/start.sh` (see template above)
- [ ] Script uses `set -e` so failures are fatal
- [ ] Script runs `prisma migrate deploy` before starting the app
- [ ] Script uses `exec` for the final `node server.js`

### 3. Dockerfile

- [ ] Multi-stage build: `deps` → `builder` → `runner`
- [ ] Runner copies these from builder:
  - `prisma/` (schema + migrations)
  - `prisma.config.ts`
  - `node_modules/.prisma` (generated client)
  - `node_modules/prisma` (CLI for migrate deploy)
  - `node_modules/@prisma` (CLI runtime dependencies)
- [ ] Runner copies `scripts/start.sh` and `chmod +x`
- [ ] `CMD ["./start.sh"]` (not `CMD ["node", "server.js"]`)

### 4. `.dockerignore`

- [ ] `scripts/` is **not** in `.dockerignore` (it needs to be in the build context)

### 5. Coolify

- [ ] `DATABASE_URL` is set in the environment variables
- [ ] Pre-deployment command: **empty**
- [ ] Post-deployment command: **empty**
- [ ] Seeding (if needed) is a one-time manual operation: `docker exec <container> npx prisma db seed`

### 6. First deploy

- [ ] Run initial migration locally: `npx prisma migrate dev --name init`
- [ ] Commit `prisma/schema.prisma`, `prisma/migrations/`, and `prisma/migrations/migration_lock.toml`
- [ ] Deploy — container entrypoint applies the migration automatically
- [ ] Seed manually if needed: `docker exec <container> npx prisma db seed`

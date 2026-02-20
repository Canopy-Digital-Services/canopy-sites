# Prisma 7.3 Documentation

**Last Updated:** January 2025  
**Current Version:** 7.3.0  
**Official Docs:** https://www.prisma.io/docs

## Overview

Prisma 7 is a major rewrite of Prisma ORM, moving from a Rust-based architecture to pure TypeScript. This results in faster queries, 90% smaller bundle sizes, and simplified deployment. Version 7.3.0 (released January 21, 2025) introduces new query compiler optimization options.

## Critical Changes from Prisma 6

### Architecture Shift

- **Rust-free**: Completely rewritten in TypeScript
- **ESM-only**: Ships as ES modules (requires `"type": "module"` in package.json)
- **New generator**: `prisma-client` replaces deprecated `prisma-client-js`
- **Configuration separation**: Database URLs now in `prisma.config.ts`, not schema file
- **Adapter-based**: Database adapters required (e.g., `@prisma/adapter-pg`)

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
  compilerBuild = "fast"  // Optional: "fast" (default) or "small"
}
```

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

### New: compilerBuild Option (v7.3.0)

Introduced in 7.3.0, this allows optimization based on your needs:

```prisma
generator client {
  provider = "prisma-client"
  output = "./generated/prisma"
  compilerBuild = "fast"  // or "small"
}
```

- **`fast`** (default): Optimized for query speed, larger bundle size
- **`small`**: Optimized for bundle size, slightly slower performance

Use `small` for serverless deployments with size constraints. Use `fast` for applications prioritizing query performance.

## Configuration File: prisma.config.ts

Prisma 7 introduces a separate configuration file for database connections:

```typescript
// prisma/prisma.config.ts
import { defineConfig } from "prisma";

export default defineConfig({
  datasource: {
    databaseUrl: process.env.DATABASE_URL,
    // Optional: directUrl, shadowDatabaseUrl
  },
});
```

**Key Points:**
- Created automatically when running `prisma init`
- Database URLs are configured here, not in schema
- Supports environment variables and direct configuration

## Database Adapters (Required)

Prisma 7 requires explicit database adapters. Install the appropriate one:

```bash
# PostgreSQL
npm install @prisma/adapter-pg pg

# SQLite
npm install @prisma/adapter-better-sqlite3 better-sqlite3

# MySQL/MariaDB
npm install @prisma/adapter-mariadb mariadb
```

### Using Adapters with Connection Pools

**Best Practice Pattern:**
```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional: Configure pool settings
  max: 10,  // Default pool size
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 300000,
});

// Create adapter
const adapter = new PrismaPg(pool);

// Global PrismaClient instance (reuse across app)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Connection Pool Defaults (pg adapter):**
- Pool size (`max`): 10 (was `num_cpus * 2 + 1` in v6)
- Connection timeout: 0 (no timeout, was 5s in v6)
- Idle timeout: 10s (was 300s in v6)
- Connection lifetime: 0 (no timeout)

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

**Note:** The project may still use `@prisma/client` if using `prisma-client-js` (deprecated), but migration to `prisma-client` requires updating imports.

## New Features in 7.3.0

### Raw Query Performance

Raw queries (`$executeRaw`, `$queryRaw`) now bypass the Query Compiler for improved performance:

```typescript
// Automatically optimized in v7.3.0
await prisma.$executeRaw`SELECT * FROM users WHERE id = ${userId}`;
```

No code changes needed—performance improvement is automatic.

## Migration Checklist

When upgrading from Prisma 6 to 7:

1. ✅ Update packages: `npm install @prisma/client@7 prisma@7`
2. ✅ Install database adapter: `npm install @prisma/adapter-pg pg`
3. ✅ Update `package.json`: Add `"type": "module"` (if not already ESM)
4. ✅ Update `tsconfig.json`: Ensure ESM-compatible settings
5. ✅ Update schema generator: Change `prisma-client-js` → `prisma-client`
6. ✅ Add `output` field to generator block
7. ✅ Create/update `prisma.config.ts` with database URL
8. ✅ Remove `url` from datasource block in schema
9. ✅ Update PrismaClient instantiation to use adapter
10. ✅ Update import paths if using new `output` location
11. ✅ Run `prisma generate` to regenerate client
12. ✅ Test all database operations

## TypeScript Configuration

Ensure your `tsconfig.json` supports ESM:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023"
  }
}
```

## Common Patterns

### Global PrismaClient Instance

Always create a single global instance and reuse it:

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Connection Pool Sizing

For multiple application instances:
- Recommended pool size: `num_physical_cpus * 2 + 1`
- Divide by number of instances if running multiple app servers
- Example: 4 CPUs, 2 instances → `(4 * 2 + 1) / 2 = 4.5` → use `max: 5`

## Limitations

- **MongoDB**: Not supported in Prisma 7. Continue using Prisma 6 for MongoDB projects.
- **prisma-client-js**: Deprecated and will be removed in future releases. Migrate to `prisma-client`.

## Performance Improvements

Prisma 7 provides:
- **3x faster** queries for large result sets
- **90% smaller** bundle sizes
- **Reduced** system resource requirements
- **Faster** production builds

Note: There's a known regression in microbenchmark scenarios with many repeated tiny queries, but real-world performance is significantly improved.

## CLI Flag Changes in Prisma 7

### `migrate diff`: `--to-schema-datamodel` renamed to `--to-schema`

The `--to-schema-datamodel` and `--from-schema-datamodel` flags were renamed:

| Old (Prisma 6) | New (Prisma 7) |
|-----------------|----------------|
| `--to-schema-datamodel` | `--to-schema` |
| `--from-schema-datamodel` | `--from-schema` |

Example — generating baseline SQL from current schema:
```bash
# Old (Prisma 6):
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script

# New (Prisma 7):
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
```

---

## Project-Specific Notes

This project (Canopy Forms) currently:
- ✅ Uses Prisma 7.3.0
- ✅ Has `prisma.config.ts` with datasource URL and seed config
- ✅ Uses `@prisma/adapter-pg` with connection pool
- ⚠️ Still uses `prisma-client-js` in schema (deprecated but functional)
- ✅ Implements global PrismaClient pattern correctly
- ⚠️ DATABASE_URL is only defined in Docker container environment
- ✅ Migrations squashed into single `0_baseline` — shadow database works
- ✅ `prisma migrate dev` works inside the container

### Migration Workflow for This Project

All migration commands run **inside the Docker container** (DATABASE_URL is only available there). See `docs/PRISMA_MIGRATIONS.md` for the full deployment strategy.

#### Creating Migrations (Development)

```bash
# 1. Edit schema
#    prisma/schema.prisma

# 2. Create migration inside the container
docker.exe exec canopy-forms npx prisma migrate dev --name your_migration_name

# NOTE: If the dev server has a stale Prisma client after schema changes,
# restart the container:
docker.exe restart canopy-forms
```

#### Manual SQL Migration (Alternative / Production)

```bash
# 1. Create migration directory
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_your_migration_name

# 2. Write migration SQL in migration.sql

# 3. Apply SQL directly to database
docker.exe exec -i canopy-forms-db psql -U user -d canopy-forms < prisma/migrations/MIGRATION_DIR/migration.sql

# 4. Mark as applied in Prisma's tracking table
docker.exe exec canopy-forms npx prisma migrate resolve --applied MIGRATION_DIR_NAME

# 5. Regenerate Prisma client
docker.exe exec canopy-forms npx prisma generate

# 6. Restart dev server to pick up regenerated client
docker.exe restart canopy-forms
```

#### Docker File Permissions Gotcha (WSL2)

Files created by `prisma migrate dev` inside the container are owned by the container's user (root). From the WSL2 host, you **cannot delete** these files directly — `rm` will fail with permission denied.

To remove container-created files:
```bash
# ✅ Works — delete from inside the container
docker.exe exec canopy-forms rm -rf prisma/migrations/20260220_test_migration

# ❌ Fails — host user doesn't own the files
rm -rf prisma/migrations/20260220_test_migration
```

This applies to any files created by `docker exec` commands, not just migrations.

#### Database Commands Reference

```bash
# After schema changes, rebuild container (regenerates Prisma client):
docker.exe compose build && docker.exe compose up -d

# Apply schema changes without creating migration files (dev only):
docker.exe exec canopy-forms npm run db:push

# Seed the database (create admin user):
docker.exe exec canopy-forms npm run db:seed
```

**Important:** After running `prisma generate` inside a running container, the dev server's hot-reload does NOT pick up the regenerated Prisma client. You must restart the container: `docker.exe restart canopy-forms`.

#### Accessing Database Directly

```bash
# Connect to PostgreSQL shell
docker.exe exec -it canopy-forms-db psql -U user -d canopy-forms

# Execute SQL file
docker.exe exec -i canopy-forms-db psql -U user -d canopy-forms < file.sql

# View logs
docker.exe logs canopy-forms -f
docker.exe logs canopy-forms-db -f
```

## Resources

- **Official Documentation**: https://www.prisma.io/docs
- **Upgrade Guide**: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- **Config Reference**: https://www.prisma.io/docs/orm/reference/prisma-config-reference
- **Connection Management**: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
- **Changelog**: https://www.prisma.io/changelog

## Quick Reference

### Commands (This Project — Docker + WSL2)

```bash
# Create migration from schema changes
docker.exe exec canopy-forms npx prisma migrate dev --name migration_name

# Regenerate Prisma client (after manual schema edits)
docker.exe exec canopy-forms npx prisma generate

# Push schema without migration file (dev only, quick iteration)
docker.exe exec canopy-forms npm run db:push

# Seed database
docker.exe exec canopy-forms npm run db:seed

# Restart dev server (required after prisma generate)
docker.exe restart canopy-forms

# Rebuild container from scratch
docker.exe compose -f docker-compose.dev.yml build && docker.exe compose -f docker-compose.dev.yml up -d

# View logs
docker.exe logs canopy-forms -f
```

### Schema Template

```prisma
generator client {
  provider = "prisma-client"
  output = "./generated/prisma"
  compilerBuild = "fast"
}

datasource db {
  provider = "postgresql"
}

model Example {
  id   String @id @default(cuid())
  name String
}
```

---

**For AI Agents:** This project uses `prisma-client-js` (deprecated but functional) and imports from `@prisma/client`. The adapter pattern with connection pools is the correct Prisma 7 approach and is already in place. All `docker compose` / `docker exec` commands must use the `docker.exe` prefix (WSL2 environment). After `prisma generate`, restart the container — hot-reload does not pick up regenerated client code.

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

## Project-Specific Notes

This project (Can-O-Forms) currently:
- ✅ Uses Prisma 7.3.0
- ❌ Does NOT have `prisma.config.ts` (not needed - hybrid state works)
- ❌ Does NOT have `url` in datasource block (hybrid state)
- ✅ Uses `@prisma/adapter-pg` with connection pool
- ⚠️ Still uses `prisma-client-js` in schema (deprecated but functional)
- ✅ Implements global PrismaClient pattern correctly
- ⚠️ DATABASE_URL is only defined in Docker container environment
- ✅ Manual SQL migrations work successfully (verified with Epic 2)

### Migration Workflow for This Project

**CRITICAL:** This project runs in Docker and uses a hybrid Prisma 7 setup without `prisma.config.ts`. Standard migration commands will fail.

#### For Schema Changes & Migrations

**Option 1: Use db:push (Recommended for Development)**
```bash
# Make schema changes in prisma/schema.prisma
# Then push directly to database (creates schema without migration files)
docker exec canoforms npm run db:push
```

**Option 2: Manual SQL Migration (Recommended for Production) ✅ VERIFIED WORKING**
```bash
# 1. Create migration directory manually
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_your_migration_name

# 2. Write migration SQL manually in migration.sql file

# 3. Apply SQL directly to database using pipe to docker exec
cat prisma/migrations/MIGRATION_DIR/migration.sql | docker exec -i canoforms-db psql -U user -d canoforms

# 4. Regenerate Prisma Client
docker exec canoforms npx prisma generate
```

**Example output when successful:**
```
ALTER TABLE
UPDATE 1
ALTER TABLE
CREATE INDEX
ALTER TABLE
```

**Option 3: Use Prisma Migrate Dev (May Require Workarounds)**
```bash
# This may fail due to missing prisma.config.ts
docker exec canoforms npm run db:migrate

# If it fails with "datasource.url property is required", you need to:
# 1. Temporarily add url to schema.prisma datasource block, OR
# 2. Create prisma.config.ts with DATABASE_URL, OR  
# 3. Use Option 1 or 2 instead
```

#### Why Standard Commands Don't Work

This project has a **hybrid Prisma 7 setup**:
- Uses Prisma 7 packages (`@prisma/client@7`, `prisma@7`)
- Uses runtime adapter pattern correctly (`@prisma/adapter-pg`)
- BUT: Still uses deprecated `prisma-client-js` generator
- BUT: No `url` field in datasource block (removed for Prisma 7)
- BUT: No `prisma.config.ts` file (where URLs should be in Prisma 7)

The `DATABASE_URL` is defined ONLY in the Docker container environment, not on the host machine. This means:
- ❌ `npx prisma migrate dev` on host → fails (no DATABASE_URL)
- ❌ `docker exec canoforms npx prisma migrate deploy` → fails (no url in schema)
- ✅ `docker exec canoforms npm run db:push` → works (bypasses migration system)
- ✅ Manual SQL execution → works (direct database access)

#### Database Commands Reference

Always run these inside the Docker container:

```bash
# Regenerate Prisma Client after schema changes
docker exec canoforms npm run db:generate

# Apply schema changes without creating migration files (dev only)
docker exec canoforms npm run db:push

# Seed the database (create admin user)
docker exec canoforms npm run db:seed
```

#### Accessing Database Directly

```bash
# Connect to PostgreSQL shell
docker exec -it canoforms-db psql -U user -d canoforms

# Execute SQL file
docker exec -i canoforms-db psql -U user -d canoforms < file.sql

# View logs
docker logs canoforms -f
docker logs canoforms-db -f
```

## Resources

- **Official Documentation**: https://www.prisma.io/docs
- **Upgrade Guide**: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- **Config Reference**: https://www.prisma.io/docs/orm/reference/prisma-config-reference
- **Connection Management**: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
- **Changelog**: https://www.prisma.io/changelog

## Quick Reference

### Commands

**Standard Prisma Commands (may not work in this project):**
```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev

# Push schema (dev only)
npx prisma db push

# View database
npx prisma studio
```

**For This Project (Docker-based):**
```bash
# Generate Prisma Client
docker exec canoforms npm run db:generate

# Push schema changes (RECOMMENDED)
docker exec canoforms npm run db:push

# Seed database
docker exec canoforms npm run db:seed

# View logs
docker logs canoforms -f
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

**For AI Agents:** If you encounter code using `prisma-client-js` or imports from `@prisma/client` in a Prisma 7 context, note that migration to `prisma-client` with explicit `output` paths is recommended. The adapter pattern with connection pools is the correct approach for Prisma 7.

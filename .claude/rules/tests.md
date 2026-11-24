---
paths:
  - "apps/portal/**/*.test.ts"
  - "apps/portal/test/**"
  - "apps/portal/vitest.config.mts"
---

# Tests

`npm test` runs Vitest in `apps/portal` (config `vitest.config.mts`). `*.test.ts` beside the code are unit tests with no database or network. `*.db.test.ts` run against a `*_test` database that `test/db-global-setup.ts` creates and migrates with `prisma migrate deploy`; `test/db.ts` has `resetDatabase` and factories, and every helper refuses a database whose name does not end in `_test`. Run tests in the container (`docker exec canopy-portal npm test`), where the Postgres host resolves. Never mock Prisma: the bugs worth catching are in queries, constraints, and cascades. What must have a test: session and sign-in decisions, account resolution and membership, entitlements, deletion cascades, and every guardrail in the tool layer. A bug fix in those areas lands with the test that reproduces it. Vitest stays on 4.x while the containers run Node 20 (5.x needs 22.12+); bump it with the Node 24 move.

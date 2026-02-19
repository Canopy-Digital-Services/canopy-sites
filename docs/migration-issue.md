## Production Migration Failure – Root Cause & Permanent Fix Required

You introduced a new Prisma migration:

20260219000000_add_password_changed_at

The production/dev database running on Coolify does NOT have this migration applied.

Current `_prisma_migrations` table stops at:

20260217000000_add_form_title_description

However, the deployed container filesystem DOES include the new migration directory.

The app is running Prisma Client 7.3.0, which expects the new column added in that migration. Because the database schema is behind the Prisma client, the app throws:

PrismaClientKnownRequestError (P2022)
The column `(not available)` does not exist in the current database.

This confirms:

* Code deployed successfully
* Migration files deployed successfully
* Migrations were NOT executed
* Deployment process allows schema drift

This has happened multiple times. We need a permanent fix.

---

# Your Task

## 1. Root Cause Analysis

Audit the repository and determine:

* How migrations are currently expected to run in production
* Why `prisma migrate deploy` is not being executed during Coolify deployments
* Whether the Dockerfile, entrypoint, or start script omits migration execution
* Whether the build/runtime separation prevents migrations from running

Be precise and explicit.

---

## 2. Design a Production-Safe Migration Strategy

We need a single, opinionated solution that:

* Runs automatically during Coolify deploys
* Is fully non-interactive
* Fails deployment if migrations fail
* Prevents schema drift permanently
* Never uses `prisma db push` in production
* Is safe for concurrent deploys
* Does not wipe data
* Works with Prisma 7.x
* Works in containerized environments

Do NOT give multiple options. Choose one approach and commit to it.

---

## 3. Implement the Fix

Provide:

* Exact Dockerfile changes
* Exact entrypoint or startup script changes
* Any required package.json script changes
* Any Coolify configuration adjustments
* How migration execution is enforced before app startup

The deployment must:

1. Run `prisma migrate deploy`
2. Exit with non-zero status if it fails
3. Only start the app if migrations succeed

---

## 4. Verification Steps

Provide:

* How to confirm migrations are applied
* How to confirm schema drift cannot happen again
* What logs should show during a successful deploy
* How to simulate a failing migration safely

---

# Goal

Eliminate schema drift permanently.

The system must guarantee:

If Prisma schema changes are deployed, the database schema is migrated before the application starts — every time.

#!/bin/sh
# The portal container's entrypoint. Migrations run here, before the app
# serves, and not in Coolify's pre- or post-deployment commands, which stay
# empty: the pre command runs in the old container, which can't see new
# migration files, and a failing post command leaves the new container
# running anyway. With set -e a failed migration stops the container, so the
# portal is down until it is fixed (recovery: .claude/rules/prisma.md, "When a
# migration fails on deploy"); a failed build never swaps containers.
set -e

# Runs from apps/portal; workspace dependencies are hoisted to the repo root.
# The CLI is called by path so npx never downloads another version.
echo "[portal] Running database migrations..."
node ../../node_modules/prisma/build/index.js migrate deploy

echo "[portal] Running post-migration backfills..."
node ./scripts/backfill-global-admin.mjs

echo "[portal] Migrations complete. Starting application..."
# exec, so SIGTERM reaches node.
exec node server.js

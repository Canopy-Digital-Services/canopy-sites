#!/bin/sh
set -e

# Runs from apps/portal; workspace dependencies are hoisted to the repo root.
echo "[portal] Running database migrations..."
node ../../node_modules/prisma/build/index.js migrate deploy

echo "[portal] Running post-migration backfills..."
node ./scripts/backfill-global-admin.mjs

echo "[portal] Migrations complete. Starting application..."
exec node server.js

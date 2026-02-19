#!/bin/sh
set -e

echo "[canopy-forms] Running database migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

echo "[canopy-forms] Migrations complete. Starting application..."
exec node server.js

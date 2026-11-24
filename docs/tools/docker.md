# Docker

The dev stack's layout and the gotchas it has cost us. Its services, containers, and ports are in `docs/AGENT_CONTEXT.md` section 4. Deployed environments use no compose file: Coolify builds `apps/portal/Dockerfile` (section 6 there).

## The dev stack

- **Every compose command takes `-f docker-compose.dev.yml`.** It is the repo's only compose file, and without `-f` Compose stops with `no configuration file provided: not found`.
- **Never add `-v` to `down`.** It deletes the named volumes: the dev database, the container's `node_modules`, the builder's sites, and the welcome videos.
- **The container's dependencies and its generated Prisma client live in the `node_modules` named volume, not in the image.** Docker fills a named volume from the image only when the volume is new, so rebuilding the image changes nothing the container runs. The host's `node_modules` is another install again, which the app never runs on (`next` 16.1.6 there against 16.4.5 in the volume, 2026-11-23).
- **`apps/portal/.next` rides the bind mount.** Never build on the host; the reason and the fix for a corrupted cache are in `docs/VERIFICATION_CHECKLIST.md` section 1.
- **A command that needs root takes `docker exec --user root canopy-portal ...`.** The container otherwise runs as `node` (AGENT_CONTEXT section 4). What a root command writes is root's; the same form with `chown -R node:node <path>` gives it back.
- **Each start installs dependencies only when the volume has no `next`, and generates the Prisma client every time.** The entrypoint and why it works that way are in `apps/portal/Dockerfile.dev`.
- **An environment change needs the container recreated:** `docker compose -f docker-compose.dev.yml up -d portal`. `restart` keeps the environment the container was created with.

## After a change in dev

- **Source code:** nothing. The bind mount and hot reload carry it.
- **Prisma schema:** `docker restart canopy-portal`, after `npm run db:migrate` too. The start regenerates the client, and the dev server loads a client only when it starts.
- **Dependencies** (`package-lock.json`): install into the volume from a one-off container, with the dev server stopped. An `npm ci` under a running `next dev` killed the container mid-install and left the tree broken (2026-11-09).

  ```bash
  docker compose -f docker-compose.dev.yml stop portal
  docker compose -f docker-compose.dev.yml run --rm --no-deps portal sh -c 'cd /app && npm ci && node apps/portal/scripts/check-optional-packages.mjs'
  docker compose -f docker-compose.dev.yml start portal
  ```

  If the install fails with `npm ci left out ... optional packages`, run it again before the start: npm exits 0 when a platform binary's download fails (AGENT_CONTEXT section 8), and a start installs nothing into a volume that has `next`.
- **`apps/portal/Dockerfile.dev`:** `docker compose -f docker-compose.dev.yml build portal`, then `up -d portal`. This is the one portal change that needs an image rebuild. The builder copies its source with no mount, so its image is rebuilt after builder or contract changes (AGENT_CONTEXT section 4).

## Errors in dev

- **`next: not found`:** the volume has no `next`, as after an install that stopped partway. Restart the container; the entrypoint installs, and the log shows `Installing dependencies...`.
- **The container keeps restarting with `Attempted to load @next/swc-linux-x64-musl, but it was not installed`:** the volume has `next` but lost a platform package. Install again with the Dependencies recipe above.

## The production image

`apps/portal/Dockerfile`, built with the repo root as context (the command is in the file's header). What each stage and each runner-stage copy is for is in its comments; what runs at start is `apps/portal/scripts/start.sh`.

- A new workspace's `package.json` goes into the manifest `COPY` lines of both `Dockerfile` and `Dockerfile.dev`.
- The runner stage runs as `nextjs` (uid 1001), which cannot write `node_modules`. Never run `prisma generate` in a deployed container: a schema change ships as a new image.

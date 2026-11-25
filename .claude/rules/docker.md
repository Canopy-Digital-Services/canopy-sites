---
paths:
  - "**/Dockerfile*"
  - "docker-compose*.yml"
  - "package.json"
  - "package-lock.json"
  - "apps/*/package.json"
  - "apps/portal/scripts/start.sh"
  - "apps/portal/scripts/check-optional-packages.mjs"
---

# Docker

The dev stack's layout and the gotchas it has cost us. Its services, containers, and ports are in "The dev stack in full" below. Deployed environments use no compose file: Coolify builds `apps/portal/Dockerfile` (CLAUDE.md, Git and deployment).

## The dev stack

- **Every compose command takes `-f docker-compose.dev.yml`.** It is the repo's only compose file, and without `-f` Compose stops with `no configuration file provided: not found`.
- **Never add `-v` to `down`.** It deletes the named volumes: the dev database, the container's `node_modules`, the builder's sites, and the welcome videos.
- **The container's dependencies and its generated Prisma client live in the `node_modules` named volume, not in the image.** Docker fills a named volume from the image only when the volume is new, so rebuilding the image changes nothing the container runs. The host's `node_modules` is another install again, which the app never runs on (`next` 16.1.6 there against 16.4.5 in the volume, 2026-11-23).
- **`apps/portal/.next` rides the bind mount.** Never build on the host; the reason and the fix for a corrupted cache are in `docs/VERIFICATION_CHECKLIST.md` section 1.
- **A command that needs root takes `docker exec --user root canopy-portal ...`.** The container otherwise runs as `node` ("The dev stack in full", below). What a root command writes is root's; the same form with `chown -R node:node <path>` gives it back.
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

  If the install fails with `npm ci left out ... optional packages`, run it again before the start: npm exits 0 when a platform binary's download fails ("Deployed apps", below), and a start installs nothing into a volume that has `next`.
- **`apps/portal/Dockerfile.dev`:** `docker compose -f docker-compose.dev.yml build portal`, then `up -d portal`. This is the one portal change that needs an image rebuild. The builder copies its source with no mount, so its image is rebuilt after builder or contract changes ("The dev stack in full", below).

## Errors in dev

- **`next: not found`:** the volume has no `next`, as after an install that stopped partway. Restart the container; the entrypoint installs, and the log shows `Installing dependencies...`.
- **The container keeps restarting with `Attempted to load @next/swc-linux-x64-musl, but it was not installed`:** the volume has `next` but lost a platform package. Install again with the Dependencies recipe above.

## The production image

`apps/portal/Dockerfile`, built with the repo root as context (the command is in the file's header). What each stage and each runner-stage copy is for is in its comments; what runs at start is `apps/portal/scripts/start.sh`.

- A new workspace's `package.json` goes into the manifest `COPY` lines of both `Dockerfile` and `Dockerfile.dev`.
- The runner stage runs as `nextjs` (uid 1001), which cannot write `node_modules`. Never run `prisma generate` in a deployed container: a schema change ships as a new image.

## The dev stack in full

Local dev: the root `docker-compose.dev.yml` (project `canopy-sites`) runs `postgres:17-alpine` (container `canopy-portal-db`) plus the portal (container `canopy-portal`) on `http://localhost:3006`, using `apps/portal/Dockerfile.dev` with the repo root mounted for hot reload and `apps/portal` as the working directory, so `docker exec canopy-portal <cmd>` runs in the app, as the image's `node` user (uid 1000, the host user's, so what it writes on the mount is yours to edit and delete). `http://sites.localhost:3006` resolves to the same app with the Sites host branding. `DATABASE_URL` is hardcoded in the compose file's `environment:` block, which overrides dotenv files; SMTP and the other optional vars load from `.env` (via `env_file`). Copy `.env.example` to `.env` for the template. The container flow does not read `.env.local`. The same compose file runs the site builder (container `canopy-builder`), which builds from bare repos under `~/repos/.canopy-local-remotes` (a Site's `repoUrl` is then `/remotes/<name>.git`; pushes from a local publish stop there). Its image copies the source with no mount, so after builder or contract changes run `docker compose -f docker-compose.dev.yml build builder` and `up -d --no-deps builder`: until then it validates with the contract it was built with and refuses content a newer one allows (an image from 2026-10-18 on 0.2.0 refused canopyds.com's 0.4.0 content, 2026-11-05).

## Deployed apps

- **The builder** (`apps/builder`) is its own Coolify app, production only as of 2026-10-16: `canopy-builder`, UUID `p7tvlgubddrucz9mnppbhabt`, branch `main`, Dockerfile `/apps/builder/Dockerfile` from `/`, no domain (internal), network alias `canopy-builder` (the portal's `BUILDER_URL` is `http://canopy-builder:4100`; container names change on every deploy), persistent volume at `/srv/sites`, watch paths `apps/builder/**`, `packages/site-contract/**`, `package-lock.json`. Its variables are in `apps/builder/README.md`. forms-dev has no builder, so its Editor shows the empty state. Each app serves its Forms and Sites hostnames (both are Coolify domains on the one app).
- **Fox's Coolify holds stopped copies of both apps** (same UUIDs) from the manual Forms failover design (`fox-activate`). As of 2026-10-15 Fox is not standing by for Forms (no database sync until one is designed before the Forms beta), so those copies need no upkeep. If Forms failover is revived, mirror build settings and domains onto them first: the start path builds from git with Fox's copy of the settings. The same `$COOLIFY_TOKEN` works against Fox's API (`ssh fox`, `localhost:8000`).
- **An env var change is inert until the container is recreated.** Coolify injects env at container creation, so a var added through the UI or API does nothing to the running app until it is redeployed. Confirm with the runtime probe in `.claude/rules/env.md` rather than the Coolify UI, which shows the stored value, not what the Node process holds.

**A deploy that fails in the install step with `npm ci left out ... optional packages`** lost a package in `npm ci`: redeploy, and the install runs again. npm skips an optional package that fails to install, a failed download as much as a wrong platform, and exits 0; npm 10.8.2 reports it only at `--loglevel verbose`, as `failed optional dependency` (checked 2026-11-15 with one package's tarball URL broken: the install exited 0, its `added N packages` line one short). Every binary built for the platform is an optional package (Next's compiler, Tailwind's, lightningcss, esbuild, sharp), and an install without one is a layer Docker caches as good, so every plain redeploy builds on it: on 2026-11-15 the dev app lost `@next/swc-linux-x64-musl` on the first build after `apps/portal/package.json` changed, and failed in `next build` with `... was not installed` until a redeploy without the cache (what failed for that package is not known). So `apps/portal/Dockerfile` and `Dockerfile.dev` run `scripts/check-optional-packages.mjs` in the same `RUN` as `npm ci`, and Docker caches no layer whose `RUN` failed (checked 2026-11-15 on a local build of the image with one package's download broken: it stopped there twice, installing both times). The script wants every package that `package-lock.json` marks `optional` with an `os` or `cpu` and that npm's own test accepts for the machine; the lockfile records no `libc`, so on Alpine that is the glibc build of each beside the musl one. An optional package that names no platform is not checked: whether npm installs it depends on what else was skipped. The old container serves throughout.

# Docker & Docker Compose Documentation

**Official Docs:** https://docs.docker.com/compose/

## Overview

Compose is the `docker compose` subcommand, a plugin of the Docker CLI that Docker Desktop provides. The standalone `docker-compose` (Compose v1) stopped receiving updates in July 2023.

### Write `docker compose` (space), not `docker-compose` (hyphen)

```bash
docker compose up
docker compose build
docker compose down
```

On this machine `docker-compose` still runs, as Docker Desktop's alias for the same plugin (both report v5.6.1, 2026-11-15). Scripts and docs here use the space form, which is the one that exists wherever the plugin does.

## Common Commands

These show the syntax. In this repo each one also takes `-f docker-compose.dev.yml` (see Development Workflow below).

**Never add `-v` to `down`.** It removes the named volumes, which here are the dev database (`pgdata`), the container's `node_modules`, the builder's sites, and the welcome videos.

### Basic Operations

```bash
# Build and start services
docker compose up -d

# Build a specific service
docker compose build portal

# Start services (without rebuilding)
docker compose start

# Stop services
docker compose stop

# Stop and remove containers
docker compose down

# View logs
docker compose logs -f portal

# Execute command in running container
docker compose exec portal sh
```

### Build Commands

```bash
# Build without cache
docker compose build --no-cache portal

# Build with build arguments
docker compose build --build-arg NEXT_PUBLIC_APP_URL=https://example.com

# Rebuild and restart
docker compose up -d --build portal
```

### Development Workflow (with Hot Reload)

**Every compose command in this repo takes `-f docker-compose.dev.yml`.** It is the only compose file, and without `-f` Compose stops with `no configuration file provided: not found`.

```bash
# Start development environment (with hot reload)
docker compose -f docker-compose.dev.yml up -d

# Code changes are automatically picked up - no rebuild needed!
# Next.js Fast Refresh updates the UI immediately

# View real-time logs
docker compose -f docker-compose.dev.yml logs -f portal

# Restart the dev server (a start regenerates the Prisma client, and only a start loads it)
docker compose -f docker-compose.dev.yml restart portal

# Check service status
docker compose -f docker-compose.dev.yml ps
```

**How Dev Mode Works:**
- Uses `Dockerfile.dev` which runs `npm run dev` (Next.js dev server)
- Volume mounts source code: `.:/app` (a named volume preserves `node_modules`; `.next` is NOT excluded and rides the bind mount)
- Hot reload enabled - code changes appear immediately in browser
- No rebuilds needed for code changes

What to run after a schema change, a dependency change, or a `Dockerfile.dev` change is under "After a change in dev" below.

**To test the production image**, build `apps/portal/Dockerfile` directly with the repo root as context; the command is in that file's header.

## Compose File Syntax

### Version Field (Obsolete)

**Important:** Compose **ignores** the `version` field. It's obsolete and causes warnings:

```yaml
version: "3.8"  # ❌ Causes warning: "the attribute 'version' is obsolete"
```

**Recommended:** Remove the `version` field entirely to eliminate warnings:

```yaml
# No version field needed
services:
  my-app:
    # ...
```

The `version` field was used in Compose v1 to determine schema compatibility. The plugin always uses the latest schema and ignores this field, showing a warning each time you run a command.

### Service Naming

Container names should use hyphens (`-`) instead of underscores (`_`) for proper DNS hostname compatibility:

```yaml
services:
  portal:  # ✅ Good
    container_name: canopy-portal  # ✅ Good
  
  # Avoid:
  can_o_forms:  # ❌ Not recommended
```

### Environment Variables

Use `${VARIABLE:-default}` syntax for optional variables with defaults to prevent warnings:

```yaml
environment:
  # ✅ Good: Provides default for optional variables (no warning)
  SMTP_PORT: "${SMTP_PORT:-587}"
  SMTP_HOST: "${SMTP_HOST:-}"  # Empty default (no warning if not set)
  ADMIN_EMAIL: "${ADMIN_EMAIL:-admin@example.com}"
  
  # ❌ Bad: No default for optional variable (shows warning if not set)
  SMTP_USER: "${SMTP_USER}"  # Warning: "SMTP_USER variable is not set. Defaulting to a blank string."
```

**Explanation:**
- `${VAR:-default}` - Uses `default` if `VAR` is unset or empty
- `${VAR:-}` - Uses empty string if `VAR` is unset (prevents warning)
- `${VAR}` - Shows warning if `VAR` is not set in environment

**Best Practice:** Always provide defaults for optional variables to keep compose commands clean and warning-free.

### Build Arguments

Pass build-time arguments in the `build.args` section:

```yaml
services:
  portal:
    build:
      context: .
      args:
        NEXT_PUBLIC_APP_URL: "https://forms.canopyds.com"
```

## Dockerfile Best Practices

### Multi-Stage Builds

The portal's production image (`apps/portal/Dockerfile`) is a multi-stage build:

1. **Base Stage**: Minimal Node.js Alpine image
2. **Deps Stage**: Install dependencies only
3. **Builder Stage**: Build application and generate Prisma client
4. **Runner Stage**: Production image

### Next.js Standalone Mode

The portal builds with Next.js standalone output (`output: "standalone"` in `apps/portal/next.config.ts`), and the container starts the `server.js` that build produces. The image still carries the full root `node_modules`: the entrypoint runs the Prisma CLI to apply migrations before the app starts (`docs/PRISMA_MIGRATIONS.md`).

### Key Dockerfile Patterns

`apps/portal/Dockerfile` is the reference for each:

- **Layer caching:** the deps stage copies only the lockfile and every workspace's `package.json` before `npm ci`, so the install layer is rebuilt only when a manifest changes. A new workspace needs its manifest added there (and in `Dockerfile.dev`).
- **Build arguments:** `NEXT_PUBLIC_APP_URL` and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` are `ARG`s, because Next bakes them in at build time.
- **Non-root:** the runner stage runs as `nextjs` (UID 1001).
- **Standalone output copying:** the runner stage's paths sit under `apps/portal/` because the standalone output mirrors the workspace layout; what each copied piece is for is in `docs/PRISMA_MIGRATIONS.md` ("Dockerfile (runner stage)").

## Project-Specific Configuration

### Portal Docker Setup

**Dockerfiles** (build context is always the repo root, because npm workspaces need the root manifest and lockfile):
- `apps/portal/Dockerfile`: Production build (standalone Next.js output, `server.js` under `apps/portal/`)
- `apps/portal/Dockerfile.dev`: Development mode (runs `npm run dev` with hot reload)

**Compose:** `/docker-compose.dev.yml` (project name `canopy-sites`) is the dev stack. Its services, containers, and ports are described in `docs/AGENT_CONTEXT.md` section 4. Deployed environments use no compose file: Coolify builds the Dockerfiles (section 6 there).

### Development Mode Configuration

**Dev Mode Volume Mounts** (`docker-compose.dev.yml`, verified against the actual file 2026-10-15):
```yaml
working_dir: /app/apps/portal
volumes:
  - .:/app                    # Mount the repo root for hot reload
  - node_modules:/app/node_modules   # Named volume preserves container-installed (hoisted) deps
```

**Consequences of this layout:**
- The named `node_modules` volume keeps container-installed dependencies from being overwritten by the host mount
- **The container's dependencies and its generated Prisma client (`node_modules/.prisma`) live in that volume, not in the image.** Docker fills a named volume from the image only when the volume is new; after that, rebuilding the image changes nothing in it (verified 2026-11-14: the image built 2026-10-16 holds `next` 16.1.6 and its own Prisma client, while the container runs 16.4.5 from the volume)
- There is **no `.next` volume**: the container writes `apps/portal/.next` onto the bind mount. Build in the container, never on the host: a host `node_modules` is not what the app runs on (`next` 16.1.6 there against 16.4.5 in the volume, 2026-11-15), and mixing host and container builds corrupts the Turbopack cache (blank pages). Fix: `docker exec canopy-portal rm -rf .next && docker restart canopy-portal`
- **The container runs as the image's `node` user (uid 1000), not root** (`USER node` in `Dockerfile.dev`). That is the host user's uid, so what the container writes on the bind mount (`.next`, a migration, `dist`) is yours to edit and delete from the host, and the named volumes belong to `node` too. A command that needs root takes `--user root` (`docker exec --user root canopy-portal ...`); what it writes is root-owned, and the same form with `chown -R node:node <path>` gives it back

**Dockerfile.dev Entrypoint Pattern:**
The dev Dockerfile uses an entrypoint script that:
1. Checks whether `/app/node_modules/.bin/next` exists
2. Only if it is missing, runs `npm ci` and `embed:build`
3. Runs `prisma generate`, on every start
4. Starts the Next.js dev server

With dependencies in place, a start or restart installs nothing.

### After a change in dev

- **Source code:** nothing. The bind mount and hot reload carry it.
- **Prisma schema:** `docker restart canopy-portal`. The start regenerates the client from the schema on disk, and the dev server loads a client only when it starts, so the restart is needed after `npm run db:migrate` too. An image rebuild changes nothing. The full migration procedure is in [`prisma-7.md`](./prisma-7.md) ("Migration Workflow for This Project") and `docs/AGENT_CONTEXT.md` section 5.
- **Dependencies** (`package-lock.json`): install into the volume from a one-off container with the dev server stopped. `npm ci` deletes the Prisma client along with the rest of `node_modules`, and the start generates it again:

  ```bash
  docker compose -f docker-compose.dev.yml stop portal
  docker compose -f docker-compose.dev.yml run --rm --no-deps portal sh -c 'cd /app && npm ci'
  docker compose -f docker-compose.dev.yml start portal
  ```

  Checked 2026-11-15 on a copy of that volume: the install ran in a one-off and removed the client, and `npm run db:generate`, the entrypoint's own step, made it again. An `npm ci` under a running `next dev` killed the container mid-install and left the tree broken (seen 2026-11-09). Rebuilding the image installs nothing the container sees.
- **`apps/portal/Dockerfile.dev`** (the base image or the entrypoint): rebuild the image, the one change that needs it:

  ```bash
  docker compose -f docker-compose.dev.yml build portal
  docker compose -f docker-compose.dev.yml up -d portal
  ```

### Environment Variables

The variables are listed in `docs/AGENT_CONTEXT.md` section 7, and where the dev stack reads each from is in its section 4. `NEXT_PUBLIC_APP_URL` and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` are build args (`ARG` in `apps/portal/Dockerfile`): setting them on a running container changes nothing.

## Troubleshooting

### Common Issues

**Issue: Warning about `version` field being obsolete**

**Solution:** Remove the `version` field from the compose file to eliminate this warning. It is not needed:

```yaml
# Remove this line:
version: "3.8"

# Start directly with services:
services:
  # ...
```

**Issue: Warnings about environment variables not being set**

**Solution:** Add default values to optional environment variables in the compose file:

```yaml
environment:
  SMTP_HOST: "${SMTP_HOST:-}"       # Empty default (no warning)
  SMTP_USER: "${SMTP_USER:-}"
  SMTP_PASS: "${SMTP_PASS:-}"
  SMTP_FROM: "${SMTP_FROM:-}"
```

**Issue: Permission denied when running `npx prisma generate` in a production container**

**Root Cause:** The production image generates the Prisma client at build time (`RUN npx prisma generate` in the builder stage of `apps/portal/Dockerfile`) and runs as the non-root user `nextjs` (UID 1001), which cannot write to `node_modules`.

**Solution:** Never run `npx prisma generate` inside a production container. A schema change reaches production as a new image, which Coolify builds on push.

The dev container is the opposite case: its user owns the `node_modules` volume, and the client is generated there on every start ("After a change in dev" above).

**Issue: Dev container shows "next: not found" or missing node_modules**

**Root Cause:** The `node_modules` volume has no `next` binary, for example after an install that stopped partway.

**Solution:** The entrypoint installs dependencies when `/app/node_modules/.bin/next` is missing, so restart the container and watch the log for `Installing dependencies...`:

```bash
docker compose -f docker-compose.dev.yml restart portal
docker compose -f docker-compose.dev.yml logs -f portal
```

Rebuilding the image does not repair the volume ("Development Mode Configuration" above).

**Issue: Container exits immediately after start**

**Solution:**
```bash
# Check logs for errors
docker compose -f docker-compose.dev.yml logs portal

# Verify environment variables are set
docker compose -f docker-compose.dev.yml config

# Check if port is already in use
docker compose -f docker-compose.dev.yml ps
```

**Issue: An environment variable change has no effect**

**Solution:**
- A container's environment is fixed when it is created. After changing the compose file or `.env`, recreate it with `docker compose -f docker-compose.dev.yml up -d portal`: `restart` keeps the old values.
- A value in the compose file's `environment:` block wins over the same key in `.env` (`docs/AGENT_CONTEXT.md` section 4).
- In the production image, `NEXT_PUBLIC_*` values are build args and need a new build.

**Issue: Can't connect to database**

**Solution:**
- Verify `depends_on` is set correctly
- Check network configuration
- Ensure `DATABASE_URL` uses service name (`postgres`) not `localhost`

### Debugging Commands

```bash
# Inspect running container
docker compose -f docker-compose.dev.yml exec portal sh

# Check environment variables
docker compose -f docker-compose.dev.yml exec portal env

# View container resource usage
docker stats canopy-portal

# Inspect network configuration
docker network inspect canopy-sites_canopy-sites-network

# Validate compose file
docker compose -f docker-compose.dev.yml config
```

## Related Documentation

- [Docker Compose Official Docs](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/build/building/best-practices/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Prisma with Docker](./prisma-7.md)

# Docker & Docker Compose Documentation

**Official Docs:** https://docs.docker.com/compose/

## Overview

Docker Compose v2 is the modern, recommended approach for managing multi-container Docker applications. The CLI plugin (`docker compose`) replaced the legacy standalone tool (`docker-compose`) and is now the standard. Compose v1 support ended in July 2023, and Compose v2 became generally available in April 2022.

## Critical: Command Syntax Change

### ⚠️ Use `docker compose` (space), NOT `docker-compose` (hyphen)

**Legacy (Deprecated):**
```bash
docker-compose up
docker-compose build
docker-compose down
```

**Current:**
```bash
docker compose up
docker compose build
docker compose down
```

The CLI plugin (`docker compose`) is integrated into the Docker CLI as a subcommand, providing better integration with Docker contexts, improved performance, and consistent command-line options.

## Docker Compose v2 Features

### Key Improvements

- **Integrated CLI**: Part of Docker CLI, not a separate binary
- **Better Performance**: Faster command execution
- **Context Support**: Works with Docker contexts and remote hosts
- **Consistent Flags**: Uses standard Docker CLI flags (`--context`, `DOCKER_HOST`, etc.)
- **Version Field**: The `version` field in a compose file is now **obsolete** (ignored by v2)

### Installation

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

**Linux (RPM-based):**
```bash
sudo yum install docker-compose-plugin
```

**Verify Installation:**
```bash
docker compose version
```

**Note:** Docker Desktop includes the Compose plugin automatically. The standalone `docker-compose` binary is deprecated and only maintained for backward compatibility.

## Common Commands

These show the syntax. In this repo each one also takes `-f docker-compose.dev.yml` (see Development Workflow below).

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

# Restart the dev server (it keeps the old Prisma client after `prisma generate` until restarted)
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

**Important:** Docker Compose v2 **ignores** the `version` field. It's obsolete and causes warnings:

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

The `version` field was used in Compose v1 to determine schema compatibility. Compose v2 automatically uses the latest schema and ignores this field, showing a warning each time you run a command.

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

**Layer Caching Optimization:**
```dockerfile
# Copy package files first (changes less frequently)
COPY package*.json ./
RUN npm ci

# Copy source code last (changes frequently)
COPY . .
```

**Build Arguments:**
```dockerfile
# NEXT_PUBLIC_* vars must be set at build time
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
```

**Security:**
```dockerfile
# Run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
```

**Standalone Output Copying:** the runner stage of `apps/portal/Dockerfile` is the reference. Its paths sit under `apps/portal/` because the standalone output mirrors the workspace layout; what each copied piece is for is in `docs/PRISMA_MIGRATIONS.md` ("Dockerfile (runner stage)").

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
- There is **no `.next` volume**: the container writes `apps/portal/.next` onto the bind mount **as root**. Never run `next build` on the host while the container shares this directory: the host build hits EACCES on the root-owned files, and mixing host and container builds corrupts the Turbopack cache (blank pages). Fix: `docker exec canopy-portal rm -rf .next && docker restart canopy-portal`

**Dockerfile.dev Entrypoint Pattern:**
The dev Dockerfile uses an entrypoint script that:
1. Checks whether `/app/node_modules/.bin/next` exists
2. Only if it is missing, runs `npm ci`, `prisma generate`, and `embed:build`
3. Starts the Next.js dev server

With dependencies in place, a start or restart installs nothing and generates nothing.

### After a change in dev

- **Source code:** nothing. The bind mount and hot reload carry it.
- **Prisma schema:** regenerate the client, then `docker restart canopy-portal`. `npm run db:migrate` regenerates it by itself; after a hand-written migration, or a schema change that arrived with a pull, run `docker exec canopy-portal npx prisma generate`. A restart alone keeps the old client, and so does an image rebuild. The full migration procedure is in [`prisma-7.md`](./prisma-7.md) ("Migration Workflow for This Project") and `docs/AGENT_CONTEXT.md` section 5.
- **Dependencies** (`package-lock.json`): install into the volume from a one-off container with the dev server stopped, then generate the Prisma client, which `npm ci` deletes along with the rest of `node_modules`:

  ```bash
  docker compose -f docker-compose.dev.yml stop portal
  docker compose -f docker-compose.dev.yml run --rm --no-deps portal sh -c 'cd /app && npm ci && cd apps/portal && npx prisma generate'
  docker compose -f docker-compose.dev.yml start portal
  ```

  Checked 2026-11-14 in two parts: a `run` one-off mounts the same volume, and the install and generate ran against a copy of that volume. An `npm ci` under a running `next dev` killed the container mid-install and left the tree broken (seen 2026-11-09). Rebuilding the image installs nothing the container sees.
- **`apps/portal/Dockerfile.dev`** (the base image or the entrypoint): rebuild the image, the one change that needs it:

  ```bash
  docker compose -f docker-compose.dev.yml build portal
  docker compose -f docker-compose.dev.yml up -d portal
  ```

### Environment Variables

The variables are listed in `docs/AGENT_CONTEXT.md` section 7, and where the dev stack reads each from is in its section 4. `NEXT_PUBLIC_APP_URL` and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` are build args (`ARG` in `apps/portal/Dockerfile`): setting them on a running container changes nothing.

## Troubleshooting

### Common Issues

**Issue: `docker-compose: command not found`**

**Solution:** Use `docker compose` (space) instead of `docker-compose` (hyphen). The CLI plugin is the modern approach.

**Issue: Warning about `version` field being obsolete**

**Solution:** Remove the `version` field from the compose file to eliminate this warning. It's not needed in Compose v2:

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

The dev container is the opposite case: it runs as root and keeps its client in the `node_modules` volume, so there you do run `prisma generate` after a schema change ("After a change in dev" above).

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

**Issue: Build fails with Prisma errors**

**Solution:** Ensure Prisma Client is generated during build:
```dockerfile
RUN npx prisma generate
```

**Issue: Environment variables not working**

**Solution:** 
- Build-time variables (`NEXT_PUBLIC_*`) must be in `build.args`
- Runtime variables go in `environment` section
- Use `${VARIABLE:-default}` for optional variables

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

## Migration from docker-compose (Legacy)

If you're using the legacy `docker-compose` command:

1. **Install the plugin:**
   ```bash
   sudo apt-get install docker-compose-plugin  # Ubuntu/Debian
   ```

2. **Update scripts:** Replace `docker-compose` with `docker compose` in all scripts and documentation

3. **Test commands:** Verify all commands work with the new syntax

4. **Remove legacy binary** (optional):
   ```bash
   sudo rm /usr/local/bin/docker-compose
   ```

## Best Practices

### Production

- Always use `--no-cache` for production builds to ensure clean state
- Set all required environment variables explicitly
- Use Docker secrets for sensitive data (passwords, API keys)
- Run containers as non-root users (already configured in Dockerfile)
- Use health checks for services
- Set appropriate restart policies (`unless-stopped`)

### Security

- Never commit `.env` files with secrets
- Use Docker secrets or environment variable injection
- Keep base images updated (`node:20-alpine`)
- Scan images for vulnerabilities: `docker scout cves <image>` (`docker scan` no longer exists: "unknown command" on Docker 29.9.2, 2026-11-14)
- Use minimal base images (Alpine Linux)

## Related Documentation

- [Docker Compose Official Docs](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/build/building/best-practices/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Prisma with Docker](./prisma-7.md)

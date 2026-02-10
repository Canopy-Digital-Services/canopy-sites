# Docker & Docker Compose Documentation

**Last Updated:** January 2025  
**Current Version:** Docker Compose v2 (CLI Plugin)  
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

**Current (2025):**
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
- **Version Field**: The `version` field in `docker-compose.yml` is now **obsolete** (ignored by v2)

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

### Basic Operations

```bash
# Build and start services
docker compose up -d

# Build a specific service
docker compose build canopy-forms

# Start services (without rebuilding)
docker compose start

# Stop services
docker compose stop

# Stop and remove containers
docker compose down

# View logs
docker compose logs -f canopy-forms

# Execute command in running container
docker compose exec canopy-forms sh
```

### Build Commands

```bash
# Build without cache
docker compose build --no-cache canopy-forms

# Build with build arguments
docker compose build --build-arg NEXT_PUBLIC_APP_URL=https://example.com

# Rebuild and restart
docker compose up -d --build canopy-forms
```

### Development Workflow (with Hot Reload)

**⚠️ CRITICAL: This project uses `docker-compose.dev.yml` for development with hot reload enabled.**

**Development Mode (Recommended for Active Development):**

```bash
# Start development environment (with hot reload)
docker compose -f docker-compose.dev.yml up -d

# Code changes are automatically picked up - no rebuild needed!
# Next.js Fast Refresh updates the UI immediately

# View real-time logs
docker compose -f docker-compose.dev.yml logs -f canopy-forms

# Restart if needed (e.g., after schema changes)
docker compose -f docker-compose.dev.yml restart canopy-forms

# Check service status
docker compose -f docker-compose.dev.yml ps
```

**How Dev Mode Works:**
- Uses `Dockerfile.dev` which runs `npm run dev` (Next.js dev server)
- Volume mounts source code: `.:/app` (excludes `node_modules` and `.next`)
- Hot reload enabled - code changes appear immediately in browser
- No rebuilds needed for code changes (saves ~2 minutes per change)

**⚠️ DO NOT use `docker compose build` during development** - this switches to production mode and disables hot reload.

**Production Mode (for deployment testing only):**

```bash
# Only use for testing production builds
docker compose build canopy-forms
docker compose up -d canopy-forms

# Requires full rebuild (~2 minutes) for every code change
# No hot reload - changes require container rebuild
```

## docker-compose.yml Syntax

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
  canopy-forms:  # ✅ Good
    container_name: canopy-forms  # ✅ Good
  
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
  canopy-forms:
    build:
      context: .
      args:
        NEXT_PUBLIC_APP_URL: "https://canopy-forms.canopyds.com"
```

## Dockerfile Best Practices

### Multi-Stage Builds

The Canopy Forms project uses a multi-stage Dockerfile to minimize final image size:

1. **Base Stage**: Minimal Node.js Alpine image
2. **Deps Stage**: Install dependencies only
3. **Builder Stage**: Build application and generate Prisma client
4. **Runner Stage**: Production image with only runtime files

### Next.js Standalone Mode

The project uses Next.js standalone output mode (`output: "standalone"` in `next.config.ts`):

- **Dramatically reduces image size** by including only essential files
- **No full `node_modules`** in production image
- **Faster container startup** times
- **Better security** (fewer dependencies)

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

**Standalone Output Copying:**
```dockerfile
# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma client (required at runtime)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
```

## Project-Specific Configuration

### Canopy Forms Docker Setup

**Dockerfiles:**
- `/Dockerfile`: Production build (standalone Next.js output)
- `/Dockerfile.dev`: Development mode (runs `npm run dev` with hot reload)

**Compose Files:**
- `/docker-compose.yml`: Production mode (requires rebuilds for changes)
- `/docker-compose.dev.yml`: **Development mode (use this for active development)**

**Services:**
- `canopy-forms`: Next.js application (port 3000, mapped to 127.0.0.1:3006)
- `postgres`: PostgreSQL database (port 5432)

**Networks:**
- `canopy-forms-network`: Internal bridge network
- `proxy`: External network (for reverse proxy integration)

**Volumes:**
- `postgres_data`: Persistent database storage

### Development Mode Configuration

**Dev Mode Volume Mounts** (`docker-compose.dev.yml`):
```yaml
volumes:
  - .:/app                    # Mount source code for hot reload
  - /app/node_modules         # Preserve container's node_modules (anonymous volume)
  - /app/.next                # Preserve Next.js build cache (anonymous volume)
```

**Why Anonymous Volumes?**
- When mounting `.:/app`, the host directory overwrites container contents
- Anonymous volumes (`/app/node_modules`, `/app/.next`) preserve container-installed dependencies
- This allows hot reload while keeping dependencies in sync with container environment

**Dockerfile.dev Entrypoint Pattern:**
The dev Dockerfile uses an entrypoint script that:
1. Checks if `node_modules` exists and `next` binary is available
2. If missing, runs `npm ci`, `prisma generate`, and `embed:build`
3. Starts the Next.js dev server

This handles cases where volume mounts might interfere with dependencies.

### Environment Variables

Required environment variables (set in `docker-compose.yml` or `.env`):

**Database:**
- `DATABASE_URL`: PostgreSQL connection string

**NextAuth:**
- `NEXTAUTH_SECRET`: Secret for session encryption
- `NEXTAUTH_URL`: Public URL of the application
- `AUTH_TRUST_HOST`: Set to `"true"` for production

**SMTP (Email):**
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP port (default: 587)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `SMTP_FROM`: From email address

**Admin:**
- `ADMIN_EMAIL`: Operator account email
- `ADMIN_PASSWORD`: Initial admin password (change after first login)

**Build Args:**
- `NEXT_PUBLIC_APP_URL`: Public URL (must be set at build time)

### Build Process

**Production Build** (`Dockerfile`):
1. **Install dependencies** (`npm ci`)
2. **Build embed script** (`npm run embed:build`)
3. **Generate Prisma Client** (`npx prisma generate`)
4. **Build Next.js app** (`npm run build`)
5. **Copy standalone output** to runner stage

**Development Build** (`Dockerfile.dev`):
1. **Install dependencies** (`npm ci`)
2. **Generate Prisma Client** (`npx prisma generate`)
3. **Build embed script** (`npm run embed:build`)
4. **Create entrypoint script** (ensures deps exist after volume mount)
5. **Run Next.js dev server** (`npm run dev`)

### Deployment Workflow

**Development Mode (with hot reload) - ⚠️ USE THIS FOR ACTIVE DEVELOPMENT:**
```bash
# 1. Start dev environment
docker compose -f docker-compose.dev.yml up -d

# 2. Make code changes - they appear automatically!
# No rebuild needed for code changes

# 3. If you changed Prisma schema, apply migration SQL:
cat prisma/migrations/TIMESTAMP_name/migration.sql | docker exec -i canopy-forms-db psql -U user -d canopy-forms

# 4. Restart container (if needed):
docker compose -f docker-compose.dev.yml restart canopy-forms

# 5. View logs
docker compose -f docker-compose.dev.yml logs -f canopy-forms
```

**Production Mode (for deployment testing only):**
```bash
# 1. Make code changes
# 2. If you changed Prisma schema, apply migration SQL to database first:
cat prisma/migrations/TIMESTAMP_name/migration.sql | docker exec -i canopy-forms-db psql -U user -d canopy-forms

# 3. Rebuild the image (runs prisma generate automatically)
docker compose build canopy-forms

# 4. Restart the service
docker compose up -d canopy-forms

# 5. Verify logs
docker compose logs -f canopy-forms
```

**Important:** 
- **For development**: Always use `docker compose -f docker-compose.dev.yml` to keep hot reload enabled
- **For production builds**: The Dockerfile automatically runs `npx prisma generate` during build (line 24). Never run it manually inside a running container—the container runs as a non-root user and doesn't have write permissions.

## Troubleshooting

### Common Issues

**Issue: `docker-compose: command not found`**

**Solution:** Use `docker compose` (space) instead of `docker-compose` (hyphen). The CLI plugin is the modern approach.

**Issue: Warning about `version` field being obsolete**

**Solution:** Remove the `version` field from `docker-compose.yml` to eliminate this warning. It's not needed in Compose v2:

```yaml
# Remove this line:
version: "3.8"

# Start directly with services:
services:
  # ...
```

**Issue: Warnings about environment variables not being set**

**Solution:** Add default values to optional environment variables in `docker-compose.yml`:

```yaml
environment:
  SMTP_HOST: "${SMTP_HOST:-}"       # Empty default (no warning)
  SMTP_USER: "${SMTP_USER:-}"
  SMTP_PASS: "${SMTP_PASS:-}"
  SMTP_FROM: "${SMTP_FROM:-}"
```

**Issue: Permission denied when running `docker exec canopy-forms npx prisma generate`**

**Root Cause:** The production container runs as non-root user (`nextjs` UID 1001) and doesn't have write permissions to `node_modules/.prisma`. The Prisma client is generated during the Docker build process (Dockerfile line 24), not at runtime.

**Solution:** Never run `npx prisma generate` inside a running production container. After schema changes:

**For Development Mode:**
```bash
# ✅ Correct: Restart dev container (entrypoint script handles Prisma generation)
docker compose -f docker-compose.dev.yml restart canopy-forms
```

**For Production Mode:**
```bash
# ✅ Correct: Rebuild container (runs prisma generate during build)
docker compose build && docker compose up -d
```

**Why this is correct:**
- Production Dockerfile runs `RUN npx prisma generate` at build time (line 24)
- Dev Dockerfile entrypoint script runs `npx prisma generate` if needed on startup
- The builder stage has full permissions, runner stage is read-only
- This matches the immutable infrastructure pattern (containers should not modify themselves)

**Issue: Dev container shows "next: not found" or missing node_modules**

**Root Cause:** Volume mount `.:/app` overwrites container's `node_modules` directory.

**Solution:** The `Dockerfile.dev` includes an entrypoint script that automatically installs dependencies if they're missing. If issues persist:

```bash
# Rebuild dev container to ensure entrypoint script is current
docker compose -f docker-compose.dev.yml build canopy-forms
docker compose -f docker-compose.dev.yml up -d canopy-forms

# Check logs to see if dependencies are being installed
docker compose -f docker-compose.dev.yml logs -f canopy-forms
```

The anonymous volume `/app/node_modules` in `docker-compose.dev.yml` should preserve dependencies, but the entrypoint script provides a fallback.

**Issue: Container exits immediately after start**

**Solution:**
```bash
# Check logs for errors
docker compose logs canopy-forms

# Verify environment variables are set
docker compose config

# Check if port is already in use
docker compose ps
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

**For Development Mode:**
```bash
# Inspect running container
docker compose -f docker-compose.dev.yml exec canopy-forms sh

# Check environment variables
docker compose -f docker-compose.dev.yml exec canopy-forms env

# View container resource usage
docker stats canopy-forms

# Inspect network configuration
docker network inspect canopy-forms_canopy-forms-network

# Validate compose file
docker compose -f docker-compose.dev.yml config
```

**For Production Mode:**
```bash
# Inspect running container
docker compose exec canopy-forms sh

# Check environment variables
docker compose exec canopy-forms env

# Validate compose file
docker compose config
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

### Development

**⚠️ Use Development Mode for Active Development:**
- **Always use**: `docker compose -f docker-compose.dev.yml up -d` (enables hot reload)
- **Never use**: `docker compose build` during development (switches to production mode)
- Use `docker compose -f docker-compose.dev.yml logs -f` to monitor logs
- Code changes appear automatically - no rebuilds needed
- Rebuild dev container only if `Dockerfile.dev` or `package.json` changes: `docker compose -f docker-compose.dev.yml build`
- Use `.env` file for local development (not committed to git)
- Remove `version` field from compose files to prevent warnings
- Add defaults to all optional environment variables: `${VAR:-default}`

**When to Rebuild Dev Container:**
- `Dockerfile.dev` changes
- `package.json` dependencies change
- Need to regenerate Prisma client manually
- Container won't start (dependency issues)

**When NOT to Rebuild:**
- Source code changes (hot reload handles this)
- Component changes (Fast Refresh handles this)
- Config file changes (hot reload handles this)

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
- Scan images for vulnerabilities: `docker scan <image>`
- Use minimal base images (Alpine Linux)

## Related Documentation

- [Docker Compose Official Docs](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/build/building/best-practices/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Prisma with Docker](../prisma-7.md)

---

**Remember:** Always use `docker compose` (space) not `docker-compose` (hyphen). The legacy standalone tool is deprecated.

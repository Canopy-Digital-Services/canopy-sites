# syntax=docker/dockerfile:1
# Build context is the repo root (npm workspaces):
#   docker build -f apps/portal/Dockerfile .

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Workspace manifests only, so the install layer caches until a manifest changes
COPY package.json package-lock.json ./
COPY apps/portal/package.json ./apps/portal/
COPY apps/builder/package.json ./apps/builder/
COPY packages/site-contract/package.json ./packages/site-contract/
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Workspace packages the portal imports ship compiled (exports point at dist/)
RUN npm run build -w @canopy/site-contract
WORKDIR /app/apps/portal

# Build embed script first (uses the workspace's node_modules)
RUN npm run embed:build

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
# NEXT_PUBLIC_* vars must be set at build time
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Standalone output mirrors the workspace layout: server.js lands in apps/portal/
COPY --from=builder /app/apps/portal/.next/standalone ./
COPY --from=builder /app/apps/portal/.next/static ./apps/portal/.next/static
COPY --from=builder /app/apps/portal/public ./apps/portal/public
COPY --from=builder /app/apps/portal/prisma ./apps/portal/prisma
COPY --from=builder /app/apps/portal/prisma.config.ts ./apps/portal/prisma.config.ts

# Copy FULL node_modules
COPY --from=deps /app/node_modules ./node_modules
# Workspace packages, which node_modules links to (built in the builder stage)
COPY --from=builder /app/packages/site-contract ./packages/site-contract

# Entrypoint + post-migration backfills
COPY apps/portal/scripts ./apps/portal/scripts
RUN chmod +x ./apps/portal/scripts/start.sh

USER nextjs
WORKDIR /app/apps/portal

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./scripts/start.sh"]

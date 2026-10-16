# syntax=docker/dockerfile:1
# Build context is the repo root (npm workspaces):
#   docker build -f apps/builder/Dockerfile .
# Node pinned: Astro 7 needs Node >= 22.12, and every site builds with this one.
FROM node:24-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends git openssh-client ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/portal/package.json ./apps/portal/
COPY apps/builder/package.json ./apps/builder/
COPY packages/site-contract/package.json ./packages/site-contract/
RUN npm ci --no-audit --no-fund -w @canopy/builder -w @canopy/site-contract --include-workspace-root=false

COPY packages/site-contract ./packages/site-contract
COPY apps/builder ./apps/builder
RUN npm run build -w @canopy/site-contract

# Site builds run as the unprivileged node user; /srv/sites is the volume.
RUN mkdir -p /srv/sites && chown node:node /srv/sites
USER node
ENV SITES_ROOT=/srv/sites PORT=4100
WORKDIR /app/apps/builder
EXPOSE 4100
CMD ["node", "src/server.ts"]

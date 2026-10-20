# syntax=docker/dockerfile:1
# Build context is the repo root (npm workspaces):
#   docker build -f apps/builder/Dockerfile .
# Node pinned: Astro 7 needs Node >= 22.12, and every site builds with this one.
FROM node:24-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates tini \
  && rm -rf /var/lib/apt/lists/*
# Only the builder runs git, on directories it names, so ownership checks
# would only get in its way (a local bare remote in development is owned by
# another user). Git 2.39 honors safe.directory from system config only.
RUN git config --system --add safe.directory '*'

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/portal/package.json ./apps/portal/
COPY apps/builder/package.json ./apps/builder/
COPY packages/site-contract/package.json ./packages/site-contract/
RUN npm ci --no-audit --no-fund -w @canopy/builder -w @canopy/site-contract --include-workspace-root=false

COPY packages/site-contract ./packages/site-contract
COPY apps/builder ./apps/builder
RUN npm run build -w @canopy/site-contract

# The builder runs as root so it can give each site's install and build a
# user of their own (src/sandbox.ts); /srv/sites is the volume.
RUN mkdir -p /srv/sites && chmod 755 /srv/sites
ENV SITES_ROOT=/srv/sites PORT=4100
WORKDIR /app/apps/builder
EXPOSE 4100
# tini reaps what a site's build leaves behind once the builder stops it.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "src/server.ts"]

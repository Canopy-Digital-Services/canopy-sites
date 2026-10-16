# Builder

The site build worker (PRD section 4.2, Epic 30). An internal HTTP service for the portal: it keeps a working clone of each site's repo under `/srv/sites/<slug>/repo`, reads content, builds previews, and publishes.

- `POST /v1/sites/:slug/content` returns the branch's content and commit.
- `POST /v1/sites/:slug/previews` queues a build of HEAD plus a ChangeSet's ops; a failed build never moves `preview`.
- `GET /v1/sites/:slug/builds/:id` reports a build's status, log tail, and content issues.
- `POST /v1/sites/:slug/publish` re-applies the same ops to the same base commit, commits and pushes, then points `current` at the previewed build (no rebuild). If the branch moved since the preview, it refuses.
- `GET /v1/sites/:slug/files/(current|preview)/<path>` serves a built file (the portal proxies `/demo` through this).

One job at a time per site, two sites at most. Every route but `/healthz` needs `Authorization: Bearer $BUILDER_TOKEN`. Commands run with argument arrays, never a shell, and site builds get an environment without the builder's secrets.

## Environment

| Variable | Notes |
|---|---|
| `BUILDER_TOKEN` | Required, at least 32 characters; the portal sends the same value |
| `DEPLOY_KEY_<SLUG>` | Per site, the write deploy key for its repo (PEM, or base64 of it); slug uppercased, hyphens as underscores |
| `SITES_ROOT` | Default `/srv/sites`, a persistent volume |
| `BUILDS_RETAINED` | Default 5; `current` and `preview` targets are always kept |
| `BUILDER_ALLOW_LOCAL_REPOS` | `1` only in development, to build from a local bare repo path |

Runs on Node 24 with type stripping (`node src/server.ts`), so there is no build step; `npm run typecheck` checks types.

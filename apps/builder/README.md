# Builder

The site build worker (PRD section 4.2, Epic 30). An internal HTTP service for the portal: it keeps a working clone of each site's repo under `/srv/sites/<slug>/repo`, reads content, builds previews, and publishes.

- `POST /v1/sites/:slug/content` returns the branch's content, commit, site guide (`SITE_GUIDE.md`, or null), and installed contract version. It reads git's objects in the clone, never the working tree, so it never waits behind a build, and fetches only when its copy is older than `FETCH_TTL_SECONDS` or the body says `refresh: true`.
- `POST /v1/sites/:slug/previews` queues a build of HEAD plus a ChangeSet's ops; a failed build never moves `preview`. Newest wins: a queued preview that a newer one for the same site overtakes ends as `superseded` without running.
- `GET /v1/sites/:slug/builds/:id` reports a build's status, log tail, and content issues.
- `POST /v1/sites/:slug/publish` re-applies the same ops to the same base commit, commits and pushes, then points `current` at the previewed build (no rebuild). If the branch moved since the preview, it refuses.
- `GET /v1/sites/:slug/files/(current|preview)/<path>` serves a built file (the portal proxies `/demo` through this).

One job at a time per site, two sites at most. Every request names the site's `timeZone`: site builds run with it as `TZ`, so a page showing what's current on the build date uses the site's calendar, and it registers the site in `schedule.json` on the volume for the nightly rebuild, which rebuilds each published site from its branch at local midnight (PRD D42). Every route but `/healthz` needs `Authorization: Bearer $BUILDER_TOKEN`. Commands run with argument arrays, never a shell; site builds get an environment without the builder's secrets, and dependencies install without their install scripts (`npm ci --ignore-scripts`), so a site that needs one fails to build.

## Environment

| Variable | Notes |
|---|---|
| `BUILDER_TOKEN` | Required, at least 32 characters; the portal sends the same value |
| `GIT_TOKEN_<SLUG>` | Per site, a fine-grained GitHub token limited to its repo with Contents read and write; slug uppercased, hyphens as underscores. The org disables deploy keys, so this is the only way in |
| `SITES_ROOT` | Default `/srv/sites`, a persistent volume |
| `BUILDS_RETAINED` | Default 5; `current` and `preview` targets are always kept |
| `FETCH_TTL_SECONDS` | Default 60: how stale a content read may be before it fetches the branch |
| `BUILDER_ALLOW_LOCAL_REPOS` | `1` only in development, to build from a local bare repo path |

Runs on Node 24 with type stripping (`node src/server.ts`), so there is no build step; `npm run typecheck` checks types.

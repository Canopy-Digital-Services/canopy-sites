# Builder

The site build worker (PRD section 4.2, Epic 30). An internal HTTP service for the portal: it keeps a working clone of each site's repo under `/srv/sites/<slug>/repo`, reads content, builds previews, and publishes.

- `POST /v1/sites/:slug/content` returns the branch's content, commit, site guide (`SITE_GUIDE.md`, or null), and installed contract version. It reads git's objects in the clone, never the working tree, so it never waits behind a build, and fetches only when its copy is older than `FETCH_TTL_SECONDS` or the body says `refresh: true`.
- `POST /v1/sites/:slug/previews` queues a build of HEAD plus a ChangeSet's ops; a failed build never moves `preview`. Newest wins: a queued preview that a newer one for the same site overtakes ends as `superseded` without running.
- `GET /v1/sites/:slug/builds/:id` reports a build's status, log tail, and content issues.
- `POST /v1/sites/:slug/publish` re-applies the same ops to the same base commit, commits and pushes, then points `current` at the previewed build (no rebuild). If the branch moved since the preview, it refuses.
- `GET /v1/sites/:slug/files/(current|preview)/<path>` serves a built file (the portal proxies `/demo` and `/canvas` through this). A path with a `.` or `..` segment is a missing file, not a resolved one.
- `GET /v1/repos` lists the repos the Canopy Sites GitHub App is installed on, across every installation (Canopy's org and each client's; a suspended installation is left out), for the portal's Link a site picker; 404 when the App isn't configured.

**Repo access** is the Canopy Sites GitHub App (`src/github-app.ts`, Epic 38 section 4.2): owned by Canopy's org, installed on site repos only, Contents read and write. A site's repo is in Canopy's org or in the client's own org or account (PRD D61), and each of those is its own installation of the App. So the builder holds no installation id: for each job it signs a JWT with the App's key, asks GitHub which installation covers the repo by its owner and name, and trades the JWT for a token of that installation limited to that one repo, cached until a few minutes before its hour ends. A repo of the same name under another owner is another repo and gets no token. git gets the token through its environment, never argv, the remote URL, or a log, and site build steps get no secret. The per-site step is adding the repo to an installation: Canopy's for a repo in its org; for a client's, an owner of their org installs the App on that one repo (the App must be installable on any account). A site whose repo the App can't reach falls back to its `GIT_TOKEN_<SLUG>`, if one is set.

One job at a time per site, two sites at most. Every request names the site's `timeZone` (the portal sends its account's, `Account.timeZone`): site builds run with it as `TZ`, so a page showing what's current on the build date uses the site's calendar, and it registers the site in `schedule.json` on the volume for the nightly rebuild, which rebuilds each published site from its branch at local midnight (PRD D42). Every route but `/healthz` needs `Authorization: Bearer $BUILDER_TOKEN`. Commands run with argument arrays, never a shell.

A site's install and build run as that site's own unprivileged user (`src/sandbox.ts`; ids are allocated from 20001 and recorded in `uids.json` on the volume), with an environment holding none of the builder's secrets and a home of its own. The builder runs as root to do that, under `tini`. The user owns only the site's working tree (`<slug>/repo`) and home (`<slug>/home`). Git's directory (`<slug>/git`, kept outside the tree, so the tree has no `.git`), the builds, and the volume's records stay root's. After each step, every process of that user is stopped before the builder touches the tree again. A build's `dist` must be a real directory, and it belongs to root once moved under `builds/`. Dependencies install without their install scripts (`npm ci --ignore-scripts`), so a site that needs one fails to build.

## Environment

| Variable | Notes |
|---|---|
| `BUILDER_TOKEN` | Required, at least 32 characters; the portal sends the same value |
| `GITHUB_APP_ID` | The Canopy Sites GitHub App. No installation id: the builder asks GitHub for the installation that covers each repo (`GITHUB_APP_INSTALLATION_ID`, read before 5.15.0, is ignored and can be removed) |
| `GITHUB_APP_PRIVATE_KEY` | The App's private key, PEM or base64 of it on one line. Runtime only; no expiry (rotate by generating a new key on the App and replacing this) |
| `GIT_TOKEN_<SLUG>` | Optional fallback for a site whose repo the App can't reach: a fine-grained token limited to that repo (Contents read and write); slug uppercased, hyphens as underscores. The org disables deploy keys, so a token is the only other way in |
| `SITES_ROOT` | Default `/srv/sites`, a persistent volume |
| `BUILDS_RETAINED` | Default 5; `current` and `preview` targets are always kept |
| `FETCH_TTL_SECONDS` | Default 60: how stale a content read may be before it fetches the branch |
| `BUILDER_ALLOW_LOCAL_REPOS` | `1` only in development, to build from a local bare repo path |

Runs on Node 24 with type stripping (`node src/server.ts`), so there is no build step; `npm run typecheck` checks types, and `npm test -w @canopy/builder` runs its unit tests (Vitest, in the dev container like the portal's).

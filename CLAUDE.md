# CLAUDE.md

Guidance for Claude Code in this repo. This file holds what every task needs. The rules for each part of the code are in `.claude/rules/`, and each loads by itself when you read or edit a file its `paths:` cover: the database and Prisma, auth and sessions, the public routes, the embed and field types, the tool layer and Quick Edit, UI, Next.js, React, Tailwind, Docker and deploys, env vars, tests, the in-app help, and the docs themselves.

This repo is the unified Canopy portal (npm workspaces): `apps/portal/` is the Next.js app serving Canopy Forms and the Canopy Sites portal, `apps/builder/` the site build service (its own README), and `packages/site-contract/` the content contract every site repo installs (its own README). Code paths here are relative to `apps/portal/`; `docs/`, `package.json`, `package-lock.json`, `CHANGELOG.md`, and `docker-compose.dev.yml` are at the repo root. Canopy Sites is specified in `docs/canopy-sites/PRD.md` (what and why) and sequenced in `docs/canopy-sites/ROADMAP.md` (order, epic briefs, known gaps).

**Code wins over docs.** Verify a claim against the file before relying on it: code > `prisma/schema.prisma` > `prisma/migrations/` > `CHANGELOG.md` > docs. When the code or a live system contradicts a doc or a rule, fix that doc in the same session.

## Client information

**This repo is public, and nothing in it identifies a client.** That covers files, code comments, tests, commit messages, branch names, and pull request titles and bodies, and it means a client's business name, the names of their people, their domains and repo names, what their site uses, and anything they told us (plans, dates, vendors). Canopy's own sites (canopyds.com, the demo) are fine to name.

- Name a client site by its label: "the test site", "Client 1", "Client 2", "Client 3". The key, with each site's repo and domain, is the Nextcloud page "Client Sites" in the Canopy Sites collective, read with `nextcloud_read_file` at `/.Collectives/Canopy Sites/Client Sites/Readme.md`. Otherwise describe the capability ("a site that takes appointment requests").
- Client-specific work (a site's onboarding epic, its evals, a client's decisions and dates) lives under that page, not here. Tests and examples use made-up businesses.
- The git hooks in `scripts/git-hooks/` refuse a commit that adds a name from the private list, and a push that would publish one, at `~/.config/canopy/private-terms.txt` (the list's master copy is on "Client Sites"). A clone turns them on once with `git config core.hooksPath scripts/git-hooks`. When the check fires, rewrite the text; never bypass it.
- History was rewritten on 2026-11-23 to take client information out, so every commit ID before then changed (the old-to-new map is `~/backups/canopy-sites-commit-map-2026-11-23.txt`). A branch or worktree started before the rewrite still carries the old history: move its own commits onto `dev` with `git rebase --onto`, since the pre-push hook refuses any push that would publish old commits.

## Product and stack

Canopy Forms: embedded forms for static websites, built in a visual editor, embedded with two lines of HTML, and managed in a dashboard with email notifications. The same app is the portal for Canopy Sites clients, who get Quick Edit, an Editor, and Stats beside Forms.

Next.js 16 · React 19 · Prisma 7 · TypeScript 5 · Tailwind v4 · Vitest 4 · Node 20. No auth library: sessions are ours (`src/lib/session.ts`, PRD D16). Each is a recent major with breaking changes from what older training data knows; its rule loads with the files that use it. When training data led you to a wrong command, flag, or API, correct that rule in the same session.

Identify which layer a change touches before starting.

| Layer | Purpose | Location |
|-------|---------|----------|
| Admin UI | Editor, submissions, settings | `src/app/(admin)/*` |
| Embed script | Client-side renderer | `embed/src/*` → `public/embed.js` |
| Hosted forms | Public pages at `/f/[formId]` | `src/app/f/[formId]/page.tsx` |
| Embed API | Serve definitions, accept submissions | `src/app/api/embed/[formId]/route.ts` |
| Submit API | Accept submissions (white-box HTML) | `src/app/api/submit/[formId]/route.ts` |
| Single-field submit | One field per request | `src/app/api/submit/[formId]/[fieldName]/route.ts` |
| Operator console | Platform admin, metadata only | `src/app/operator/*` |

### Products and chrome

- **The account's products decide the signed-in UI, never the hostname.** `productFor(entitlements)` (`src/lib/product.ts`, from `sitesEnabled`) picks the chrome in `src/app/(admin)/layout.tsx` and the browser title and favicon (`productMetadata`) there and in the operator layout: Sites accounts get the Sites wordmark, `SitesNav` (Quick Edit · Editor · Forms · Stats), and the Sites title and favicon on every page, `/forms` and `/docs` included; every other account gets the Forms chrome, title, and favicon. Copy that names the product (docs page titles, the submission email footer) uses `productNameFor`. `sitesEnabled` is the plan's column, true only on `SITES`.
- Sites-only routes (`/quick-edit`, `/editor`, `/stats`) live in `src/app/(admin)/(sites)/`, whose layout 404s for accounts without Sites.
- Apart from routing an account to its home host, the hostname only brands logged-out pages (login, signup, password reset): `getHostProduct()` in `src/lib/product.ts` maps `sites.*` and `sites-*.*` to Sites, and the auth layout passes it to `AuthBrandMark` through `HostProductProvider` and to `productMetadata` for the title. It is branding, not access control.

## Rules every change follows

- Search for the route, component, or action that already handles it, and extend the established pattern rather than adding a parallel one.
- **Ownership is enforced server-side** by direct `accountId` comparison in `src/lib/data-access/*` and `src/actions/*`. Never trust client-side ownership logic.
- `src/lib/data-access/*`: Ownership checks live here. Queries bypassing these lose enforcement. `src/actions/*`: Server actions, each enforcing ownership internally.
- **A server action's arguments are whatever the client sent**, whatever their TypeScript types say. Every id an action takes goes through `requireId` or `requireIds` (`src/lib/ids.ts`), or `String(...)` where the action answers with `{ error }`, before any query; the ownership helpers check it again. What an action does after its ownership check goes by the id of the row the check returned (`form.id`, `field.id`), never the caller's value, and a query on a child row names its parent (`{ id, formId }`).
- Ownership checks, origin validation, and rate limits are non-negotiable.
- **Home is per account**: resolve it with `getHomePath(accountId)` or `homePathFor(entitlements)` (`/quick-edit` for Sites, `/forms` otherwise). Never hardcode `/forms` as home, and never link to `/`.
- **This repo is public.** Never commit secrets, real credentials, or client data (site guides, business facts, content, media). Client data lives in the database or in the client's own private site repo; secrets live in Coolify env and gitignored `.env` files.

## Commands

Run from the repo root; they delegate to the portal workspace.

```bash
npm run build          # Production build (must pass before committing)
npm run lint           # ESLint (must pass before committing)
npm test               # Vitest, unit + database tests (must pass; run in the dev container)
npm run embed:build    # Rebuild public/embed.js from embed/src/* (required after embed changes)
npm run db:generate    # Regenerate Prisma client
npm run db:migrate -- --name x  # prisma migrate dev (creates + applies migration), then prisma generate
```

The portal's own scripts are in `apps/portal/package.json`. Dependencies go to the workspace that uses them (`npm install <pkg> -w @canopy/portal`); npm `overrides` only work in the root `package.json`. `npm run fonts:sync` downloads the self-hosted font set from Fontsource (`npm pack`, not installed) into `public/fonts/`, `src/lib/self-hosted-fonts.json`, and the admin fonts in `src/app/fonts/`. Output is committed. The catalog is the curated picker lists plus `EXTRA_FAMILIES` in `scripts/sync-fonts.ts`; to self-host a new font, add it there and rerun. `-- --update` refetches everything.

`npm run build`, `npm run lint`, and `npm test` must pass before committing, and `docs/VERIFICATION_CHECKLIST.md` says which further checks a change needs. Tests run in the container (`docker exec canopy-portal npm test`); never mock Prisma. The local stack is `docker-compose.dev.yml`: the portal at `http://localhost:3006` (Sites branding at `http://sites.localhost:3006`), and `docker exec canopy-portal <cmd>` runs in `apps/portal`. Never run `next build` on the host while the container's dev server shares `.next`.

This repo is developed in **WSL2 on Windows** with Docker Desktop. Plain `docker` / `docker compose` works here (verified 2026-08-14) and either form is fine for every command here. The Windows binary `docker.exe` drives the same daemon and is the fallback when WSL integration breaks (the symptom is plain `docker` vanishing from PATH after a Docker Desktop restart; full path `/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe`).

## Git and deployment

`dev` is the integration branch: commit directly to it for routine work, and push to `origin/dev` when the user asks. `main` is production, updated only by PR merge from `dev`, never pushed to directly. Use a feature branch only for large or experimental work.

### Commits

**Atomic commits as you work, not one commit at the end.** A schema change plus its migration is one commit. The UI consuming it is another. An embed change plus its rebuilt `public/embed.js` is another.

Format: `feat(scope): description`, also `fix`, `docs`, `refactor`. Scope is the feature area (`embed`, `auth`, `migrations`, `epic-N`). Subject under ~72 characters, body when the "why" is not obvious.

**Never rewrite pushed history.** No force push, no amending pushed commits.

### Push

Confirm `git status` is clean (committing anything outstanding as proper atomic commits first), `git push origin dev`, then report which commits went up.

### Release (dev → main)

1. `git log main..dev --oneline` for the full set.
2. Push any unpushed commits to `origin/dev`.
3. `gh pr create --base main`.
4. Title summarizes the release, e.g. `v4.5.0: Field validation overhaul + embed theme fixes`.
5. Body groups key changes by category (features, fixes, docs), written as a summary rather than a dump of commit messages.
6. Once dev has deployed the pushed commits, run the release smoke (`docs/VERIFICATION_CHECKLIST.md` section 9) and report it in the PR.
7. When the user asks to release or deploy prod, merge the PR (`gh pr merge --merge`). The user does not merge release PRs. Merging `main` triggers the prod deploy; confirm it landed before reporting done.

### After a merge to main

GitHub's merge commit lands on `main` only, so the branches diverge by exactly one commit after every release. Left alone it skews the next `git log main..dev`. Resync: `git fetch origin`, `git merge origin/main` on `dev`, `git push origin dev`.

### Environments

| Environment | URL | Branch | Coolify app UUID |
|-------------|-----|--------|------------------|
| Local | `http://localhost:3006` | working copy | none |
| Dev | `https://forms-dev.canopyds.com`, `https://sites-dev.canopyds.com` | `dev` | `wogw0skcsgck80cs4gscs0c0` |
| Prod | `https://forms.canopyds.com`, `https://sites.canopyds.com` | `main` | `j80s80ow8ss4444kk40cscsc` |

Deployment is Coolify's, not this repo's: no deploy commands here. On push it builds `apps/portal/Dockerfile` with the repo root as context and runs `scripts/start.sh` (migrations, then `node server.js`; why there is in its header comment). Coolify's own API and behavior are documented in the Nextcloud Engineering collective (below).

- `NEXT_PUBLIC_APP_URL` must be set as a Coolify **build arg**, since it is baked into the bundle.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` must be set as a Coolify **build arg** on each app (base64 of 32 random bytes, one key per environment, never changed without a reason). Next salts every server action's id with it. Without it each build makes a new key, so a page open across a deploy can't call the server until it is reloaded: on 2026-11-13 a release restarted the portal under an open Editor and its saves were refused. With the key fixed, an action keeps its id while its file and export name stay the same (checked: two builds with one key gave the same 56 ids; a build without it gave different ones). A page from before a deploy still fails on an action that deploy renamed, moved or removed, which is why the Editor keeps unsent edits (`src/lib/unsaved-edits.ts`).
- Both apps build `/apps/portal/Dockerfile` from base directory `/`, with auto-deploy watch paths `apps/portal/**`, `packages/site-contract/**`, `package.json`, `package-lock.json`. Changes to `docs/**` or other files outside those paths do not trigger a deploy.

Runs on Coolify on **`webber`** (`ssh webber`, via Cloudflare Zero Trust); the builder app, Fox's copies, and env behavior are in the Docker rule. **Platform runbooks live in the Nextcloud Engineering collective, not this repo.** Read the relevant page before any infrastructure operation, via the canopy-mcp server's `nextcloud_read_file` tool (`mcp.canopyds.com`; named "Canopy MCP" on claude.ai and `nextcloud` in Claude Code, verified 2026-10-15; if one is unauthenticated, use whichever answers `nextcloud_collectives_list`) with these paths:

- `/.Collectives/Engineering/Platforms/Coolify.md`: API shape and quirks, token locations and scopes, deploy and container behavior
- `/.Collectives/Engineering/Servers/Readme.md` (SSH access section): access model, tunnel and key setup
- `/.Collectives/Engineering/Servers/Webber/Readme.md`: host inventory and what else runs there
- `/.Collectives/Engineering/Quality Assurance.md`: testing and verification rules shared by every Canopy repo
- `/.Collectives/Canopy Sites/Sites Onboarding Runbook.md`: putting a site onto Canopy Sites, from its repo to the owner editing it, ending in acceptance

## Debugging

1. Reproduce, and name the layer (embed, API, admin, DB).
2. Find the first wrong assumption, not just the thrown error.
3. Fix at the right boundary: validation issues need the client *and* server layer; URL and env issues get fixed in a server component and passed down as props.
4. Verify end to end: configure in admin → embed renders → submit → stored → email queued.

**Works locally but fails on forms-dev or forms.canopyds.com: suspect infrastructure first, and fix it in Coolify config rather than in code.** Usual causes: wrong `Host` header from the proxy, `NEXTAUTH_URL` not matching the public URL, `NEXT_PUBLIC_APP_URL` missing or wrong at build time, or env vars visible in the Coolify UI but not reaching the Node process.

## Release checklist

After completing an epic or cutting a release, in order:

1. Root `package.json`: bump `version`.
2. `CHANGELOG.md`: new entry at the top with date and changes.
3. An epic that shipped: write its completion report, copy its doc to the Nextcloud Epic Archive (`docs/epics/README.md` says where), then delete it from `docs/epics/`, its line from `docs/epics/README.md`, and its brief from the ROADMAP. Code comments and docs that cite it are reworded to say what they mean.
4. `content/docs/*.md`: update every help page the release invalidates. New features need a page or a new section, renamed menu items need relabeling, removed flows need their steps deleted, screenshots of changed areas need refreshing. Register new pages in `content/docs/meta.ts`. Skip only if the release is purely internal.
5. `prisma/schema.prisma`: a field marked `@ignore` is a retired column. Before the release PR, remove each one that `main`'s schema already marks `@ignore` (`git show origin/main:apps/portal/prisma/schema.prisma`), with its migration. One that this release is the first to ignore waits for the next (the Prisma rule, dropping a column).
6. The editor demo on canopyds.com/websites: a release that changes what an owner sees in the Editor, Quick Edit, the Sites chrome, or the preview page is mirrored there (`.claude/rules/canopyds-demo.md`). Skip only if the release changes none of those.

If a future change adds another file holding version-specific information, add it to this list at the same time.

## Documentation maintenance

After substantive work, check whether it changed what a doc or rule says. How to write them, and where a fact goes, is `.claude/rules/docs.md` (it loads when you edit a doc).

- **Schema changes** → `.claude/rules/prisma.md`, only for what the schema can't show (an index only a migration states, seeded rows, a rule about a value).
- **UI patterns** → `.claude/rules/ui.md` for a rule, and `docs/UX_PATTERNS.md` for the topic's detail; embed theming is its section 11 and embed validation its section 8.
- **API routes, auth, or sessions** → `.claude/rules/public-api.md` or `.claude/rules/auth.md`.
- **Env vars** → `.claude/rules/env.md`.
- **A non-obvious npm script** → this file's Commands; a new dependency or a major version bump → its tool's rule.
- **Coolify, Docker, or infra** → `.claude/rules/docker.md`; `apps/portal/Dockerfile` and `scripts/start.sh` carry their own rules as comments.
- **User-visible feature or flow changes** → review `apps/portal/content/docs/*.md` (the in-app help at `/docs`) and update any page whose steps, labels, or copy no longer match. A feature with no home gets a page, registered in `apps/portal/content/docs/meta.ts`.
- **Epic completion or version bump** → the release checklist above.

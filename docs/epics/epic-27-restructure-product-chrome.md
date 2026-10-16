# Epic 27: Restructure In Place; Product-Based Chrome

**Status:** In progress (live on dev; production release pending)
**Version:** v5.0.0 (release prepared; root `package.json` bumped)
**Started:** 2026-10-15
**Phase:** 0, Portal foundation (`docs/canopy-sites/ROADMAP.md`)
**Predecessors:** Epic 23 (Plans & Entitlements), Epic 24 (Roles & Global Admin)
**Successor:** E28 (Account audit and Membership model)

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work**, plus `docs/canopy-sites/PRD.md` and `docs/canopy-sites/ROADMAP.md`.

---

## 1. Goal

This repo becomes the unified Canopy portal. One deploy serves `forms.canopyds.com` and `sites.canopyds.com`, and the account's products, not the hostname, decide what a signed-in user sees: Sites accounts get Editor · Forms · Stats on either host, every other account gets today's Forms UI exactly.

## 2. How the plan changed

The first brief (ROADMAP draft 1) imported Forms into a new `canopy-sites` repo with `git filter-repo`, gave the Sites host its own chrome, and cut production over to new Coolify apps. Reviewed before any code moved and reversed with Michael on 2026-10-15 (PRD D2 and §4.3 revised the same day):

- **Restructure in place.** The new repo existed only because a July 2026 attempt had left a `canopy-sites` folder; by October it held two docs and root-owned build leftovers. Moving the app inside this repo keeps history, PRs, deploy keys, both Coolify apps, their database, env, and secrets. The import, migration-parity gate, cutover, and Forms freeze all disappear.
- **Account products pick the chrome.** Host-based chrome stranded users: form notification emails link to the Forms host, so a Sites client clicking one would lose the Editor, and NextAuth resolves redirects against a single `NEXTAUTH_URL`. With chrome by account, the hostname only brands logged-out pages.

## 3. Scope

### In

- `git mv` the Next.js app into `apps/portal`; npm workspaces with stub `apps/builder` and `packages/site-contract`.
- Docker and Coolify build from the repo root as context.
- `sitesEnabled` entitlement, Sites chrome, per-account home, Sites-only routes, host branding on logged-out pages.
- Fix every place the hostname carried meaning (§5).
- Rename the GitHub repo to `canopy-sites` (it stays public, D11), point the Coolify apps at the new paths, add the Sites hostnames.

### Out

| Not here | Goes to |
|---|---|
| `Plan.sitesEnabled` column (E27 derives it, no schema change) | E29 |
| Host-aware links in password-reset and support emails | E28 (added to its brief) |
| Auth library decision, test runner | PRD Q7 and Q8, decided at the start of E28 |
| Real Editor and Stats content | E29+, E35 |
| Canopy Sites logo files | Done 2026-10-15: Michael supplied the icon; `sites-logo-combined.svg` and `sites-logo-full.svg` were built to the Forms layouts (same Urbanist wordmark metrics, rule, and tagline) |

## 4. Decisions

**D1. Pure-rename commit first.** `4846d1a` only moves files, so every file keeps 100% rename similarity and `git log --follow` crosses the move. The tree does not build at that one commit; the next commit makes it build.

**D2. What stays at the root.** `docs/`, `CLAUDE.md`, `README.md`, `CHANGELOG.md`, `LICENSE`, `.env.example`, `.dockerignore`, `.gitignore`, compose files, and `package-lock.json`. The repo's docs describe the whole repo, so there is one `docs/` tree and one epic index; code paths in `docs/AGENT_CONTEXT.md` and `docs/UX_PATTERNS.md` are stated once to be relative to `apps/portal/`.

**D3. Lockfile kept, not regenerated.** `npm install --package-lock-only` against the existing lockfile: all 959 locked packages keep their resolved versions; only the three workspace links are new. npm `overrides` moved to the root `package.json`, the only place npm honors them.

**D4. Version at the root.** The root `package.json` carries the release version; workspace manifests are private and unversioned.

**D5. Docker.** Both Dockerfiles stay in `apps/portal/` and build with the repo root as context. Next's `outputFileTracingRoot` and `turbopack.root` point at the repo root, so standalone output nests `server.js` under `apps/portal/` and the runner's working directory is `/app/apps/portal`; `start.sh` reaches the hoisted Prisma CLI at `../../node_modules`. Compose files stay at the root (builder and Caddy join them in E30) under project `canopy-sites`, containers `canopy-portal` and `canopy-portal-db`, port 3006 unchanged. The Postgres volume is `pgdata`; it was named to avoid the abandoned July `canopy-sites_postgres_data` volume, which Michael deleted on 2026-10-15 along with the July containers, network, and image.

**D6. `sitesEnabled` without a schema change.** `getAccountEntitlements` returns `sitesEnabled`, derived from `planCode === "UNLOCKED"` until E29 adds the column. E29's seed enables `UNLOCKED` and no other existing plan, so the switch is invisible. Keeping E27 schema-free keeps the restructure deploy behavior-neutral for the database.

**D7. Host branding by naming convention, no env var.** `getHostProduct()` maps `sites.*` and `sites-*.*` (`sites.canopyds.com`, `sites-dev.canopyds.com`, `sites.localhost`) to Sites. It only picks a logo on logged-out pages, so a convention is enough and one image serves every environment without config.

**D8. Sites-only routes 404 for other accounts.** `/editor` and `/stats` live in `(admin)/(sites)/`. The first brief's "not on your account" gate page existed for Forms users on the Sites host; with chrome by account, nothing links a Forms-only account there.

**D9. `NEXTAUTH_URL` stays the Forms URL.** Removing it and relying on `AUTH_TRUST_HOST` would make NextAuth fully per host, but it would also derive cookie security from proxy headers that have not been checked on webber, risking a one-time logout or non-`Secure` cookies. Instead, no code lets NextAuth choose a destination: sign-in already used `redirect: false`; sign-out and account deletion now do too, then navigate to a relative path.

**D10. `validateOrigin` unchanged.** The editor preview renders the embed from the definition it already holds and intercepts submit, so the dashboard never calls the embed API from the Sites host. Embed snippets keep `NEXT_PUBLIC_APP_URL` (the Forms host) on both hosts, which is correct.

**D11. The repo stays public.** The first revision of the PRD made it private because it will hold the quick-edit runbook and Sites internals. Reversed the same day: Canopy is FOSS-friendly and its value is the operated platform, not the source. A scan of the full history found no live credentials (one local-dev `NEXTAUTH_SECRET` literal and placeholder passwords). Nothing planned depends on secrecy: guardrails are enforced server-side (PRD D9), so a public runbook weakens nothing, and per-client overlays and business facts live in the database while client sites live in their own private repos. Going private would not have withdrawn what is already published anyway. Standing rule in `docs/AGENT_CONTEXT.md` §7.

## 5. Survey: where the hostname carried meaning (2026-10-15)

| Where | Problem on the Sites host | Resolution |
|---|---|---|
| `/`, `(auth)/layout.tsx`, `requireGlobalAdmin`, operator back link, brand link | Home hardcoded to `/forms` | `getHomePath` / `homePathFor`, per account |
| `login/page.tsx`, `signup/page.tsx` | `router.push("/forms")` | Push `/`; the server resolves home |
| `signOutAction` | `next-auth/lib/env.js` rewrites auth requests to `NEXTAUTH_URL`'s origin, so `signOut({ redirectTo: "/login" })` sent Sites users to the Forms host | `redirect: false`, then `redirect("/login")` |
| Account deletion (`account-dashboard.tsx`) | Client `signOut({ callbackUrl })` got `{"url":"http://localhost:3007/login?deleted=1"}` from `sites.localhost:3007` (reproduced) | `redirect: false`, then `window.location.assign` |
| Reset and support emails | Links built from `NEXTAUTH_URL` land on Forms-branded pages | E28 |
| `validateOrigin`, editor `apiUrl` | None in practice (D10) | Unchanged |

Also fixed while here: `/` and the auth layout treated an expired token, which keeps an empty `session.user` object, as signed in. They now check `session.user.id`. Other `session?.user` checks are for E28's audit.

## 6. What is done

Branch `epic-27`, worked in a separate worktree at `../canopy-forms-e27` so the main checkout, its running dev container, and the uncommitted field-preview work there were not touched.

| Commit | Content |
|---|---|
| `4846d1a` | Pure rename into `apps/portal` |
| `a0c031c` | Workspace root, stubs, lockfile, Next tracing root, Dockerfiles, `start.sh`, compose, ignore files |
| `dab5989` | `sitesEnabled`, `product.ts`, Sites chrome and nav, `(sites)` routes, host-branded auth pages, sign-out fix |
| `2439abb` | Account deletion stays on the current host |
| (docs commit) | AGENT_CONTEXT, UX_PATTERNS, VERIFICATION_CHECKLIST, PRISMA_MIGRATIONS, tools docs, CLAUDE.md, README, PRD, ROADMAP, this epic |

## 7. Verification (2026-10-15)

Run against an isolated stack (`-p canopy-e27`, port 3007) seeded from a dump of the local Forms dev DB, with two throwaway accounts added to that copy: `FREE` and `UNLOCKED`.

- `prisma migrate deploy` from `apps/portal`: 13 migrations found, none pending.
- `npm run build` in the container passes; route table includes `/editor` and `/stats`. Standalone output has `apps/portal/server.js`, the traced `content/docs`, and the generated Prisma client.
- `npm run lint`: one pre-existing warning (`form-card.tsx`), no errors.
- Over HTTP on `localhost:3007` and `sites.localhost:3007`, for both accounts: credentials sign-in stays on its host; `/` and `/login` redirect to `/forms` (FREE) or `/editor` (UNLOCKED); Sites nav and wordmark render only for UNLOCKED, on both hosts; `/editor` and `/stats` 404 for FREE; the operator console bounces each to its own home; logged-out `/login`, `/signup`, `/forgot-password` show the Sites wordmark only on the Sites host.
- Sign-out action invoked on the Sites host: `x-action-redirect: /login`, session cookie cleared, next request lands on `sites.localhost:3007/login`.
- Production image: `docker build -f apps/portal/Dockerfile .` from the repo root succeeds (the first attempt failed fetching Google Fonts inside `next build`; the retry passed unchanged). Run against the same DB copy, `start.sh` logged `No pending migrations to apply`, the backfill, and `[portal] Migrations complete`, then served `/login`, `/embed.js`, `/brand/*`, and the help docs at `/docs/forms` (traced `content/docs`); the Sites wordmark appeared only on `sites.localhost`.

**Not yet verified:** visual review in a browser (wordmark, nav spacing, active state, mobile sheet). No browser tool was available in this session; needed before merge.

## 8. Deploy steps

1. **Visual review.** ✅ Michael, 2026-10-15: "the look is right" (a click-around, not a full UAT).
2. **Field-preview work.** ✅ Committed by Michael on `dev` (`dee6330`, `ee17ced`) and merged into `epic-27` (`554f47c`). The one conflict, a new file at the old path, resolved into `apps/portal/`.
3. **GitHub.** ✅ Renamed to `Canopy-Digital-Services/canopy-sites` (public); local remote updated. The first push afterwards auto-deployed, so webhook delivery survived the rename.
4. **DNS.** ✅ Proxied CNAMEs `sites-dev.canopyds.com` and `sites.canopyds.com` to Webber's tunnel. No ingress change: Webber and Fox both route `*.canopyds.com` to Traefik. (`deploy-to-webber.md` said new names need no DNS; that holds for ingress only.)
5. **Coolify dev app.** ✅ `wogw0skcsgck80cs4gscs0c0`: new repo name, `/apps/portal/Dockerfile`, new watch paths, domains `forms-dev` and `sites-dev`. Coolify regenerated the Traefik labels with a router per host. `epic-27` fast-forwarded onto `dev` (`61d7550`) and deployed in about 165 s; the log shows `No pending migrations to apply` then `[portal] Migrations complete`. Both hosts return 200 with the right branding, and a CSRF plus wrong-credentials sign-in on `sites-dev` reaches the credentials check over HTTPS.
6. **Prod and Fox.** Webber's prod app `j80s80ow8ss4444kk40cscsc` and Fox's copies of both apps get the same settings (prod domains `forms` and `sites`), then the release PR `dev` → `main` merges. Fox matters because `fox-activate` starts Forms through Coolify, which builds from git with whatever settings Fox holds.
7. **Local switchover.** Stop the `canopy-forms` compose project, restore its DB into the new `canopy-sites_pgdata` volume, bring up the root `docker-compose.dev.yml`, tear down the `canopy-e27` stack and remove the worktree (its `apps/portal/.next` is root-owned, written by the container, so remove that inside the container first).
8. **Release bookkeeping.** ✅ Version 5.0.0 and CHANGELOG (`88da96a`). After production is verified: status Complete, index row, and the Nextcloud runbooks (Outage Response moves `sites.canopyds.com` with `forms.canopyds.com`; Webber's domain table).

## 9. Acceptance

- [x] App under `apps/portal`, workspaces resolve with unchanged dependency versions
- [x] `npm run build` and `npm run lint` pass
- [x] Forms-only account: unchanged behavior on both hosts; `/editor`, `/stats` 404
- [x] Sites account: Sites nav on both hosts, reaches its forms, home is `/editor`
- [x] Sign-in, sign-out, account deletion stay on the current host
- [x] Visual review (click-around, 2026-10-15)
- [ ] Both hostnames served from one deploy, dev and prod
- [x] Repo renamed

## 10. Follow-ups found

- **Node 20 reached end of life on 2026-04-30.** Both Dockerfiles use `node:20-alpine`. Move to Node 24 in its own change, not mixed into this one.
- **`docker-compose.yml` committed a literal `NEXTAUTH_SECRET`** (public in history). Michael believes production uses a different value; the file now requires the secret from the environment instead.
- Root layout `<title>` is "CANOPY FORMS" for every account and host.
- Signup on the Sites host creates a Forms-only account under Sites branding. Decide whether Sites login should offer signup at all.

## 11. Key files

Created: root `package.json`, `apps/builder/*`, `packages/site-contract/*`, `apps/portal/src/lib/product.ts`, `apps/portal/src/components/sites/sites-nav.tsx`, `apps/portal/src/components/auth-brand-mark.tsx`, `apps/portal/src/app/(admin)/(sites)/{layout,editor/page,stats/page}.tsx`, `docs/canopy-sites/{PRD,ROADMAP}.md`.

Modified (under `apps/portal/` unless noted): `next.config.ts`, `Dockerfile`, `Dockerfile.dev`, `scripts/start.sh`, `package.json`, `src/lib/data-access/entitlements.ts`, `src/lib/auth-utils.ts`, `src/actions/auth.ts`, `src/components/brand-mark.tsx`, `src/components/account/account-dashboard.tsx`, `src/app/page.tsx`, `src/app/(admin)/layout.tsx`, `src/app/(auth)/{layout,login/page,signup/page,forgot-password/page,reset-password/page}.tsx`, `src/app/operator/layout.tsx`; root `docker-compose*.yml`, `.gitignore`, `.dockerignore`, `package-lock.json`, `README.md`, `CLAUDE.md`, `docs/*`.

## 12. Progress log

- 2026-10-15: Brief reviewed and reversed (§2). Code, verification, and docs complete on `epic-27`.
- 2026-10-15: Repo renamed, DNS added, dev app repointed, `epic-27` on `dev` and live on `forms-dev` and `sites-dev`. Found Fox's failover copies of both apps; they need the same settings before or with the release.

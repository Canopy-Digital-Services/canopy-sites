# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Start with [`docs/AGENT_CONTEXT.md`](docs/AGENT_CONTEXT.md)** — the authoritative guide for architecture, development workflow, schema changes, and all commands.

This repo is the unified Canopy portal (npm workspaces): the Next.js app serving Canopy Forms and the Canopy Sites portal is `apps/portal/`. For Canopy Sites work, also read [`docs/canopy-sites/PRD.md`](docs/canopy-sites/PRD.md) (what and why) and [`docs/canopy-sites/ROADMAP.md`](docs/canopy-sites/ROADMAP.md) (order and epic briefs).

## Common Commands

Run from the repo root; they delegate to the portal workspace.

```bash
npm run build          # Production build (must pass before committing)
npm run lint           # ESLint (must pass before committing)
npm run embed:build    # Rebuild public/embed.js from embed/src/* (required after embed changes)
npm run db:generate    # Regenerate Prisma client
npm run db:migrate -- --name x  # prisma migrate dev (creates + applies migration)
```

No automated test suite — see `docs/VERIFICATION_CHECKLIST.md` for the quality gate.

## Tool Documentation (read before writing code)

The stack uses recent major versions (Next.js 16, React 19, Prisma 7, Tailwind v4, NextAuth v5) with breaking changes from older patterns. **Read the relevant `docs/tools/*.md` file before writing code that uses that tool.** See `docs/tools/README.md` for the index.

## WSL2 Environment Note

This repo is developed in **WSL2 on Windows** with Docker Desktop. Plain `docker` / `docker compose` works here (verified 2026-08-14) and either form is fine for every command in AGENT_CONTEXT.md. The Windows binary `docker.exe` drives the same daemon and is the fallback when WSL integration breaks (the symptom is plain `docker` vanishing from PATH after a Docker Desktop restart; full path `/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe`).

## Branching & PR Strategy

**All local work targets the `dev` branch.** The `main` branch is production.

### Workflow

1. **Commit atomically** → make logical, self-contained commits as you work on `dev`
2. **Push** → push to `origin/dev` when the user asks
3. **Release PR** → when the user asks to release, create a PR from `dev` → `main` with a summary of changes
4. **Merge** → user reviews the PR and decides whether to merge

See `docs/AGENT_CONTEXT.md` section 6 for full git workflow details.

## Deployment Environment

Runs on Coolify on **`webber`** (`ssh webber`, via Cloudflare Zero Trust). Both the dev and prod apps build from this repo. URLs, branches, Coolify app UUIDs, auto-deploy watch paths, and how to verify what a running container actually sees are in `docs/AGENT_CONTEXT.md` section 6.

**Platform runbooks live in the Nextcloud Engineering collective, not this repo.** Read the relevant page before any infrastructure operation, via the canopy-mcp server's `nextcloud_read_file` tool (`mcp.canopyds.com`; named "Canopy MCP" on claude.ai and `nextcloud` in Claude Code, verified 2026-10-15; if one is unauthenticated, use whichever answers `nextcloud_collectives_list`) with these paths:

- `/.Collectives/Engineering/Platforms/Coolify.md` — API shape and quirks, token locations and scopes, deploy and container behavior
- `/.Collectives/Engineering/Runbooks/SSH Access.md` — access model, tunnel and key setup
- `/.Collectives/Engineering/Servers/Webber.md` — host inventory and what else runs there

## Documentation Maintenance

After completing substantive work, check whether your changes affect documentation. **`docs/DOC_MAINTENANCE.md` defines how to write these docs** (no duplicated facts, no summary tables, delete what a change supersedes). Read it before editing `AGENT_CONTEXT.md` or `UX_PATTERNS.md`.

- **Schema changes** → update the `docs/AGENT_CONTEXT.md` appendix if the model shape or an enum changed.
- **New/changed UI patterns** → update `docs/UX_PATTERNS.md` if you introduced or modified a component pattern, validation approach, or layout convention.
- **Embed theme/behavior changes** → update `docs/UX_PATTERNS.md` section 11 (embed theming) or section 8 (embed validation).
- **New npm scripts or dependencies** → update `docs/AGENT_CONTEXT.md` section 4 (only if the script is non-obvious; the table is not a mirror of `package.json`).
- **Coolify/Docker/infra changes** → update `docs/PRISMA_MIGRATIONS.md`.
- **User-visible feature or flow changes** → review `apps/portal/content/docs/*.md` (served at `/docs` as the in-app help) and update any page whose screenshots, steps, menu labels, or copy no longer match reality. Add a new page via `apps/portal/content/docs/meta.ts` if the feature has no existing home.
- **Epic completion or version bump** → follow the release checklist in `docs/AGENT_CONTEXT.md` section 10.
- **Any doc claim the live system contradicts** → fix that doc in the same session you observed it. State claims (versions, counts, "X exists / isn't possible yet") follow `docs/DOC_MAINTENANCE.md` section on staleness.

Before committing, run the applicable checks in `docs/VERIFICATION_CHECKLIST.md`.

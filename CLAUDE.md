# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Start with [`docs/AGENT_CONTEXT.md`](docs/AGENT_CONTEXT.md)** — the authoritative guide for architecture, development workflow, schema changes, and all commands.

## Common Commands

```bash
npm run build          # Production build (must pass before committing)
npm run lint           # ESLint (must pass before committing)
npm run embed:build    # Rebuild public/embed.js from embed/src/* (required after embed changes)
npm run db:generate    # Regenerate Prisma client
npm run db:migrate     # prisma migrate dev (creates + applies migration)
```

No automated test suite — see `docs/VERIFICATION_CHECKLIST.md` for the quality gate.

## Tool Documentation (read before writing code)

The stack uses recent major versions (Next.js 16, React 19, Prisma 7, Tailwind v4, NextAuth v5) with breaking changes from older patterns. **Read the relevant `docs/tools/*.md` file before writing code that uses that tool.** See `docs/tools/README.md` for the index.

## WSL2 Environment Override

This repo is developed in **WSL2 on Windows** with Docker Desktop. All `docker compose` commands in AGENT_CONTEXT.md must be prefixed with `docker.exe`:

```bash
# AGENT_CONTEXT.md shows:
docker compose -f docker-compose.dev.yml up -d

# In this environment, use:
docker.exe compose -f docker-compose.dev.yml up -d
```

This applies to every `docker compose` command, including container exec:
```bash
docker.exe compose -f docker-compose.dev.yml exec canopy-forms <command>
```

## Branching & PR Strategy

**All local work targets the `dev` branch.** The `main` branch is production.

### Workflow

1. **Commit atomically** → make logical, self-contained commits as you work on `dev`
2. **Push** → push to `origin/dev` when the user asks
3. **Release PR** → when the user asks to release, create a PR from `dev` → `main` with a summary of changes
4. **Merge** → user reviews the PR and decides whether to merge

See `docs/AGENT_CONTEXT.md` section 5 for full git workflow details.

## Documentation Maintenance

After completing substantive work, check whether your changes affect documentation:

- **Schema changes** → update `docs/AGENT_CONTEXT.md` appendix B if the model shape changed.
- **New/changed UI patterns** → update `docs/UX_PATTERNS.md` if you introduced or modified a component pattern, validation approach, or layout convention.
- **Embed theme/behavior changes** → update embed sections in `docs/UX_PATTERNS.md`.
- **New npm scripts or dependencies** → update `docs/AGENT_CONTEXT.md` section 3.
- **Coolify/Docker/infra changes** → update `docs/PRISMA_MIGRATIONS.md`.
- **Epic completion or version bump** → follow the release checklist in `docs/AGENT_CONTEXT.md` section 9.

Before committing, run the applicable checks in `docs/VERIFICATION_CHECKLIST.md`.

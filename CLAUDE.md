# Canopy Forms — Claude Code

**Start with [`docs/AGENT_CONTEXT.md`](docs/AGENT_CONTEXT.md)** — the authoritative guide for architecture, development workflow, schema changes, and all commands.

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

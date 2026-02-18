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

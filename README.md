# Canopy portal

One codebase for two products: **Canopy Sites**, hand-built websites whose owners edit them through this portal, and **Canopy Forms**, forms for static sites. The Next.js app is `apps/portal/`, the site builder `apps/builder/`, and the content contract `packages/site-contract/`. One deploy serves https://sites.canopyds.com and https://forms.canopyds.com.

> **For developers and AI assistants:** start with [`docs/AGENT_CONTEXT.md`](docs/AGENT_CONTEXT.md). Canopy Sites' plan is in [`docs/canopy-sites/`](docs/canopy-sites/): the PRD (what and why) and the ROADMAP (in what order).

## Quick start

Prerequisites: Docker and Docker Compose.

```bash
docker compose -f docker-compose.dev.yml up -d
docker logs canopy-portal -f
```

Forms is at http://localhost:3006 and Sites at http://sites.localhost:3006.

Version history is in [CHANGELOG.md](CHANGELOG.md).

## License

MIT, in [LICENSE](LICENSE).

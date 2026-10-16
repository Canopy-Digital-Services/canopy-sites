# Canopy portal

One codebase for two products: **Canopy Forms**, a forms platform for static sites, and the client portal for **Canopy Sites**, hand-built websites with hosting and updates for a monthly rate. The Next.js app lives in `apps/portal/`; the site builder and content contract will join it under `apps/` and `packages/` (see [`docs/canopy-sites/ROADMAP.md`](docs/canopy-sites/ROADMAP.md)).

> **For Developers & AI Assistants**: Start with [`docs/AGENT_CONTEXT.md`](docs/AGENT_CONTEXT.md) — it's the authoritative guide for understanding and working on this codebase.

## What This Is

Canopy Forms lets website owners add forms to static sites without backend code:

1. **Create forms** in the admin dashboard with a visual builder
2. **Embed anywhere** with two lines of HTML
3. **Manage submissions** — view, export (CSV/JSON), get email notifications

**Platform URL**: https://forms.canopyds.com (Canopy Sites clients: https://sites.canopyds.com, same app)

### Quick Embed Example

```html
<div 
  data-can-o-form="cmkoh11z300010l1riqmz051xw"
  data-base-url="https://forms.canopyds.com"
></div>
<script src="https://forms.canopyds.com/embed.js" defer></script>
```

## Quick Start

**Prerequisites**: Docker and Docker Compose

```bash
# Start development environment (with hot reload)
docker compose -f docker-compose.dev.yml up -d

# View logs
docker logs canopy-portal -f

# Access at http://localhost:3006 (Sites branding: http://sites.localhost:3006)
```

If you are an LLM coding agent, disregard the rest of this document and see [`docs/AGENT_CONTEXT.md`](docs/AGENT_CONTEXT.md) for detailed development workflow, architecture, and commands.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth v5 (credentials) with self-service signup
- **Email**: Nodemailer (SMTP)
- **UI**: Tailwind CSS + shadcn/ui
- **Embed**: Vanilla JS (esbuild, no dependencies)

## Version History

See [CHANGELOG.md](CHANGELOG.md) for full version history and [docs/epics/](docs/epics/) for epic completion reports.

## Documentation

| Document | Purpose |
|----------|---------|
| [AGENT_CONTEXT.md](docs/AGENT_CONTEXT.md) | **Start here** — Architecture, invariants, workflows, debugging |
| [VERIFICATION_CHECKLIST.md](docs/VERIFICATION_CHECKLIST.md) | Pre-commit quality gate |
| [UX_PATTERNS.md](docs/UX_PATTERNS.md) | UI/UX conventions for the admin interface |
| [docs/tools/](docs/tools/) | Version-specific docs for Prisma, Next.js, NextAuth, React, Tailwind, etc. |
| [apps/portal/content/docs/](apps/portal/content/docs/) | User-facing documentation |
| [docs/canopy-sites/](docs/canopy-sites/) | Canopy Sites PRD and roadmap |
| [docs/epics/](docs/epics/) | Epic completion reports |

## Security Features

- IP hashing (never stores raw IPs)
- Origin validation with domain whitelisting
- Rate limiting (60 GET/min, 10 POST/min per IP)
- Payload size limits (64KB max)
- Honeypot spam protection
- bcrypt password hashing
- Secure token-based password reset

## License

MIT License — [GitHub](https://github.com/Canopy-Digital-Services/canopy-sites)

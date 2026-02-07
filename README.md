# Canopy Forms

A SaaS forms management platform for static sites. Create forms in a web UI, embed them anywhere with a single script tag.

> **For Developers & AI Assistants**: Start with [`docs/AGENT_CONTEXT.md`](docs/AGENT_CONTEXT.md) — it's the authoritative guide for understanding and working on this codebase.

## What This Is

Canopy Forms lets website owners add forms to static sites without backend code:

1. **Create forms** in the admin dashboard with a visual builder
2. **Embed anywhere** with two lines of HTML
3. **Manage submissions** — view, export (CSV/JSON), get email notifications

**Platform URL**: https://forms.canopyds.com

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
docker logs canoforms -f

# Access at http://localhost:3006
```

See [`docs/AGENT_CONTEXT.md`](docs/AGENT_CONTEXT.md) for detailed development workflow, architecture, and commands.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth v5 (credentials) with self-service signup
- **Email**: Nodemailer (SMTP)
- **UI**: Tailwind CSS + shadcn/ui
- **Embed**: Vanilla JS (esbuild, no dependencies)

## Version History

**Current**: v4.0.0 — Form-first architecture (Site model removed, per-form origin management)

See [CHANGELOG.md](CHANGELOG.md) for full version history and [docs/epics/](docs/epics/) for detailed completion reports.

## Documentation

| Document | Purpose |
|----------|---------|
| [AGENT_CONTEXT.md](docs/AGENT_CONTEXT.md) | **Start here** — Architecture, development workflow, debugging |
| [UX_PATTERNS.md](docs/UX_PATTERNS.md) | UI/UX conventions for admin interface |
| [content/docs/](content/docs/) | User-facing documentation |
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

MIT License — [GitHub](https://github.com/Skinnerbox916/Canopy-Forms)

---
paths:
  - ".env*"
  - "docker-compose*.yml"
---

# Environment variables

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Required. PostgreSQL connection string. |
| `NEXTAUTH_URL` | Required. Public Forms URL: base for emailed links (`appUrlFor`), and when it starts with `https://` the session cookie is `Secure` with the `__Host-` prefix. The name predates Epic 28's removal of NextAuth. |
| `NEXT_PUBLIC_APP_URL` | Build-time. Falls back to `NEXTAUTH_URL`. Must match the deployed public URL. |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Build-time. Keeps server action ids the same across builds, so open pages survive a deploy. See CLAUDE.md, Git and deployment. |
| `SITES_URL` | Optional. Public URL of this environment's Sites host (`https://sites.canopyds.com`, `https://sites-dev.canopyds.com`, local `http://sites.localhost:3006`). Base for password-reset and notification links sent to Sites accounts. Unset means those links use `NEXTAUTH_URL`. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Required if email is enabled. |
| `SMTP_FROM` | Optional, defaults to `SMTP_USER`. |
| `SMTP_FROM_SITES` | Optional. The From for every email to a Sites account (`senderFor` in `src/lib/product.ts`), `Canopy Sites <sites@canopyds.com>` in production: a send-as identity on the same SMTP login. Unset means `SMTP_FROM`. |
| `FEEDBACK_RECIPIENT_EMAIL` | Optional. Recipient for the help bubble's "Give feedback". Unset means the submission returns a friendly error and sends nothing. |
| `SUPPORT_RECIPIENT_EMAIL` | Optional. Recipient for the help bubble's "Contact support", falling back to `FEEDBACK_RECIPIENT_EMAIL` so existing deployments keep working. With both unset the submission returns a friendly error and sends nothing. Both are read in `src/actions/contact.ts`. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap only, read by `prisma/seed.ts` and `scripts/backfill-global-admin.mjs` (every boot) to promote a user to `GLOBAL_ADMIN`, moving a capped plan to `PAID`. Never consulted at auth-check time. Set them only to bootstrap an environment's first Global Admin, and remove them once one exists: neither is set on the prod or dev apps (removed 2026-11-10; production's running container drops them at its next deploy). |
| `GOOGLE_FONTS_API_KEY` | Only to regenerate `src/lib/google-fonts.ts` via `scripts/fetch-google-fonts.ts`. |
| `BUILDER_URL` / `BUILDER_TOKEN` | The builder's internal URL and the shared token (same value on the builder). Unset means the Editor shows its empty state and `/demo` 404s. |
| `SITE_ASSET_ORIGIN_<SLUG>` | Development only, ignored in production: where a client site's canvas and preview load its assets (slug uppercased, hyphens as underscores). Unset, they load from its production hostname, which works when the local repo's branch is what production serves, since the build names its asset files the same (canopyds.com from a local copy of `main`, verified 2026-11-05); set it for a branch or site that isn't live. Both the browser (assets) and the portal container (the live page, when there is no draft) fetch it, so use an address both reach: with the dev stack in Docker, `http://host.docker.internal:<port>`, and a browser on the WSL host started with that name mapped to `127.0.0.1` (verified 2026-10-19). |
| `UMAMI_URL` / `UMAMI_API_KEY` | Stats (Epic 35): Umami's address (`https://analytics.canopyds.com`) and the key of its `canopy-portal` user, view-only in the Umami team holding the client websites, so it reads them and changes nothing. A site's own `umamiWebsiteId` is the only id `src/lib/stats/umami.ts` asks about. Unset, or Umami unreachable, means a site with an Umami id shows "Stats can't load right now" and the log has `stats_unavailable`. The operator's site page checks the site's website with the same key (`src/lib/stats/health.ts`), and Link a site and the site settings refuse a website it can't read. No test reaches Umami: `test/db-env.ts` clears both for database tests, and a test that needs Umami stubs them and `fetch`. |
| `ANTHROPIC_API_KEY` | Quick edit (PRD D7, a Claude Platform key). Unset means quick edit says it isn't set up. |
| `QUICK_EDIT_MODEL` | Optional, default `claude-opus-5-5`. Costs per model are estimated in `src/lib/quick-edit/index.ts`. |
| `MEDIA_DIR` | Optional. The directory that holds welcome videos. Unset means no site has one. Locally `/srv/media`, the `portal_media` volume in `docker-compose.dev.yml`. On a deployed app `/app/media`, a Coolify volume on both the dev and prod apps (since 5.23.1), outside the backups by decision: a lost video is uploaded again from its original. |

`.env` and `.env.local` are git-ignored. `.env.example` is tracked and holds placeholders only.

Verifying env inside a Coolify container: ask the runtime what the app actually sees (plain `printenv | grep` also works; verified 2026-08-14):

```sh
node -e 'console.log({NEXTAUTH_URL:process.env.NEXTAUTH_URL,NEXT_PUBLIC_APP_URL:process.env.NEXT_PUBLIC_APP_URL,SMTP_HOST:process.env.SMTP_HOST})'
```

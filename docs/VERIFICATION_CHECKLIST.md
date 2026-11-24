# Verification Checklist

**For coding agents. Run the applicable checks before committing. Escalate to the user what you can't verify yourself.**

`npm test` (Vitest) covers decisions that have tests; this checklist is the quality gate for everything else. What must be tested is in `docs/AGENT_CONTEXT.md` section 4.

**Local dev:** The app runs on **port 3006** (e.g. `http://localhost:3006`). Use this base URL for browser verification, API smoke tests, and embed testing below.

---

## How to use this checklist

Not every change needs every check. Match the checks to what you changed:

| What you changed | Required checks |
|-----------------|----------------|
| Any code | Build, Lint and test, Doc impact check |
| Schema (`prisma/schema.prisma`) | Build, Lint and test, Migration, Schema sync, Doc impact check |
| Server actions / API routes | Build, Lint and test, API smoke test, Doc impact check |
| Admin UI components | Build, Lint and test, Browser: admin flow, Doc impact check |
| Embed source (`embed/src/*`) | Build, Lint and test, Embed build, Browser: embed flow, Doc impact check |
| Auth pages or session logic | Build, Lint and test, Browser: auth flow, Doc impact check |
| Environment variable usage | Build, Lint and test, Env check, Doc impact check |
| Appearance / theme changes | Build, Lint and test, Embed build, Browser: embed flow, **Escalate: visual review**, Doc impact check |
| A release (dev → main) | Release smoke, before the merge |

---

## Checks the agent runs

### 1. Build

```bash
docker exec canopy-portal npm run build
```

Must exit 0. Catches TypeScript errors, missing imports, broken server components, and compile-time assertions (like the `field-types.ts` coverage check).

The build needs no network: fonts are self-hosted (verified 2026-10-17 with `--network none`). To check types alone: `docker exec canopy-portal npx tsc --noEmit -p .`. Vitest does not type-check, so passing tests do not mean the build compiles.

**Important:** `NODE_ENV` is deliberately unset in the dev container so `next dev` and `next build` each set their own value (verified 2026-08-14: `docker exec canopy-portal env` shows no `NODE_ENV`). Do not hardcode it in `Dockerfile.dev` or `docker-compose.dev.yml`. Run the build inside the container, never on the host: the app's dependencies are in the container's volume, and a host build into the shared `.next` corrupts the dev server's Turbopack cache. The container build shares `.next` with `next dev` too: if edits stop reaching the browser afterward (seen 2026-10-19 with a `globals.css` change that survived a restart), run `docker exec canopy-portal rm -rf .next` and restart `canopy-portal`.

### 2. Lint and test

```bash
npm run lint
docker exec canopy-portal npm test
```

Lint must exit 0 (or only pre-existing warnings). Do not suppress or disable lint rules to make it pass. Tests must all pass; never skip, weaken, or delete a test to get there. Changing session, sign-in, membership, entitlement, or deletion behavior means adding or updating the test that pins it.

### 3. Migration verification (schema changes only)

After running `npm run db:migrate -- --name ...`:

- Confirm a new directory was created under `prisma/migrations/`.
- Confirm the migration SQL matches your intent (read the generated `.sql` file).
- Confirm the Prisma client reflects the new schema: `docker restart canopy-portal`. The start regenerates the client and is the only time the dev server loads one, so it follows `npm run db:migrate` and a hand-written migration alike (`docs/AGENT_CONTEXT.md` section 5).

### 4. Embed build (embed changes only)

```bash
npm run embed:build
```

Must complete without errors. Confirm `public/embed.js` was updated (check the file's modified timestamp or `git diff --stat`).

### 5. API smoke test

For changes to API routes or server actions, verify the endpoint responds correctly. Use `curl` against the running dev server (local app is on port 3006):

```bash
# Form definition endpoint (GET)
curl -s http://localhost:3006/api/embed/<formId> | head -c 200

# Submission endpoint (POST): use a test form ID
curl -s -X POST http://localhost:3006/api/embed/<formId> \
  -H "Content-Type: application/json" \
  -d '{"fields": {"email": "test@example.com"}}' | head -c 200
```

Check that responses have the expected shape (JSON with correct fields, appropriate status codes). If you don't have a test form ID, create one via the admin UI first.

### 6. Browser verification

Use the browser tools to verify UI changes. The checks below are scoped by what you changed; don't run all of them for every change.

**Auth flow** (changes to auth pages or session logic):
1. Navigate to `http://localhost:3006/login`.
2. Confirm the login page renders without errors.
3. If you changed login/signup/reset logic, test the flow end-to-end.
4. If you changed redirects, sign-in, or sign-out, repeat on `http://sites.localhost:3006`. An account stays on its home host throughout (a Forms account on `localhost:3006`, a Sites account on `sites.localhost:3006`), and on the other host sign-in links home and signed-in pages redirect there (`docs/AGENT_CONTEXT.md` section 2).

**Admin flow** (changes to admin UI):
1. Navigate to `http://localhost:3006` and log in.
2. Navigate to the area you changed (form list, form editor, settings, etc.).
3. Confirm the UI renders correctly and interactions work (save, delete, reorder, etc.).
4. Check the browser console for JavaScript errors.
5. If you changed a layout, navigation, or home redirect, check both chromes: a Forms-only account and a Sites account (plan `SITES`). The Sites account sees Editor · Forms · Stats; the Forms-only account sees today's Forms UI and gets 404 on `/editor`.

**Embed flow** (changes to embed source or appearance):
1. In the admin UI, navigate to a form's editor and use the Integrate tab to get the embed snippet.
2. Create a minimal test HTML file or use a test page that embeds the form:
   ```html
   <div data-canopy-form="<formId>" data-base-url="http://localhost:3006"></div>
   <script src="http://localhost:3006/embed.js" defer></script>
   ```
3. Open it in the browser and confirm:
   - The form renders with all fields.
   - Validation fires correctly (try submitting empty required fields).
   - Successful submission shows the success message.
   - Theme/appearance changes are visible.

### 7. Env variable check (env-related changes only)

If you added, renamed, or changed how an environment variable is used:

1. Confirm it's documented in `docs/AGENT_CONTEXT.md` section 7.
2. Confirm `.env.example` includes it with a placeholder.
3. If it's a `NEXT_PUBLIC_*` variable, confirm it's handled as build-time (not runtime).
4. Check that the code has a reasonable fallback or clear error if the variable is missing.

### 8. Schema sync check (schema changes only)

After applying a migration, verify the database matches the schema:

```bash
npx prisma migrate status
```

Should show no pending migrations and no drift.

### 9. Release smoke (every release, whatever changed)

Before merging a release PR (`docs/AGENT_CONTEXT.md` section 6), once dev has deployed the release's commits, drive a browser through these flows on dev. The scoped browser checks above follow what a change touched, and a change rarely looks like it touches these: Sign Out broke in 5.13.0 from a dropdown animation change. Use a headless browser, so the run and Michael's own clicks don't move each other's pages. Keep generated credentials in a scratchpad file, never in chat; signup allows 5 per IP per hour.

1. **Forms account:** sign up at `https://forms-dev.canopyds.com/signup`, sign out from the user menu (lands on `/login`), sign in again.
2. **A form, end to end:** create a form, add a field, publish, submit the hosted `/f/<id>` link as a signed-out visitor, and see the submission in the form's Submissions.
3. **Sites account:** move the throwaway account to the `SITES` plan in the dev database (the host in the dev app's `DATABASE_URL`; `ssh webber`, then `psql` in that container: `update accounts set "planCode"='SITES' where id = '<accountId>'`). Sign in on the Forms host: it offers "Go to Canopy Sites", which lands on `https://sites-dev.canopyds.com/quick-edit` with Quick Edit, Editor, Forms and Stats in the chrome. Sign out there. Dev has no builder, so the Editor's empty state is expected.
4. **Clean up:** sign in on the Sites host, Account, Delete Account, Confirm. It lands on `/login?deleted=1`.

Any step that fails holds the release until it is fixed, or until Michael decides to ship with it.

---

## Checks the agent escalates to the user

Some things the agent can't verify reliably. When these apply, tell the user **exactly what to check and why**, with specific steps.

### Visual / design review

**When**: Appearance changes, new UI components, layout modifications, theme changes.

**Why the agent can't fully verify**: The agent can confirm elements render and aren't broken, but can't judge whether spacing, alignment, color combinations, and overall feel meet design expectations.

**Escalation template**:
> I've verified the build passes and the component renders without errors. Please review the visual result:
> 1. [Specific page/URL to check]
> 2. [What to look at, e.g., "the new field config panel in the form editor"]
> 3. [What changed visually, e.g., "spacing between sections reduced from 24px to 16px"]

### Deployed environment verification

**When**: Schema migrations, env variable changes, or anything that could behave differently in Coolify vs. local.

**The agent verifies this itself when it has SSH access to `webber`** (the normal case in this environment). Read the Coolify runbook first (paths in `CLAUDE.md`), then check directly: container logs for the migration lines, and runtime env via `ssh webber "docker exec <container> node -e 'console.log(process.env.VAR)'"`. Escalate only when running somewhere without that access.

**Escalation template** (no-access case only):
> This change includes [a migration / an env variable change / etc.]. After it deploys to forms-dev:
> 1. Check the container logs for migration success: `[portal] Migrations complete.`
> 2. [Specific thing to verify, e.g., "confirm the new column appears in a submission response"]
> 3. If it fails, check [specific env var / Coolify setting].

### Email notification changes

**When**: Changes to email sending logic, templates, or SMTP configuration.

**Why the agent can't verify**: The agent can confirm the code path runs without errors, but can't verify that emails actually arrive in an inbox with correct formatting.

**Escalation template**:
> This change affects email notifications. After deploying (or with SMTP configured locally):
> 1. Submit a test form that has email notifications enabled.
> 2. Check that the email arrives at the configured `notifyEmails` addresses.
> 3. Verify the email content and formatting are correct.

### Cross-browser / mobile behavior

**When**: Embed styling changes, responsive layout changes, or CSS that may render differently across browsers.

**Why the agent can't verify**: Browser automation uses a single browser engine. Real-world embed forms run on user sites across many browsers and devices.

**Escalation template**:
> This embed change may render differently across browsers. Consider testing the embedded form on:
> 1. Chrome, Firefox, Safari (desktop)
> 2. Mobile viewport (or actual mobile device)
> 3. [Specific concern, e.g., "the new date picker may not be supported in older Safari"]

---

## Documentation impact check

Which doc each kind of change updates is in `CLAUDE.md`, "Documentation Maintenance". Check it before committing.

---

## Pre-push: check for uncommitted changes

Before pushing, always check for unstaged modifications that might be needed for the build:

```bash
git status
```

If there are unstaged changes (`M` files), determine whether they're needed. Coolify builds from the **remote ref**, not your working tree, so anything uncommitted locally will be missing on deploy. A build that passes locally (because your working tree has the fix) can fail on Coolify (because the committed version doesn't).

---

## Quick reference: minimum checks per commit

| Before committing... | Always run |
|---------------------|-----------|
| Any change | build, `npm run lint`, `npm test` + doc impact check |
| Schema change | + verify migration file + `npx prisma migrate status` |
| Embed change | + `npm run embed:build` + confirm `public/embed.js` updated |
| UI change | + browser check on the affected page |
| API change | + curl the endpoint |
| Epic/version bump | + follow `docs/AGENT_CONTEXT.md` section 10 release checklist |

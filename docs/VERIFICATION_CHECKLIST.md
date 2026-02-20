# Verification Checklist

**For coding agents. Run the applicable checks before committing. Escalate to the user what you can't verify yourself.**

No automated test suite exists in this repo. This checklist is the quality gate.

**Local dev:** The app runs on **port 3006** (e.g. `http://localhost:3006`). Use this base URL for browser verification, API smoke tests, and embed testing below.

---

## How to use this checklist

Not every change needs every check. Match the checks to what you changed:

| What you changed | Required checks |
|-----------------|----------------|
| Any code | Build, Lint, Doc impact check |
| Schema (`prisma/schema.prisma`) | Build, Lint, Migration, Schema sync, Doc impact check |
| Server actions / API routes | Build, Lint, API smoke test, Doc impact check |
| Admin UI components | Build, Lint, Browser: admin flow, Doc impact check |
| Embed source (`embed/src/*`) | Build, Lint, Embed build, Browser: embed flow, Doc impact check |
| Auth pages or session logic | Build, Lint, Browser: auth flow, Doc impact check |
| Environment variable usage | Build, Lint, Env check, Doc impact check |
| Appearance / theme changes | Build, Lint, Embed build, Browser: embed flow, **Escalate: visual review**, Doc impact check |

---

## Checks the agent runs

### 1. Build

```bash
npm run build
```

Must exit 0. Catches TypeScript errors, missing imports, broken server components, and compile-time assertions (like the `field-types.ts` coverage check).

### 2. Lint

```bash
npm run lint
```

Must exit 0 (or only pre-existing warnings). Do not suppress or disable lint rules to make it pass.

### 3. Migration verification (schema changes only)

After running `npx prisma migrate dev --name ...`:

- Confirm a new directory was created under `prisma/migrations/`.
- Confirm the migration SQL matches your intent (read the generated `.sql` file).
- Run `npx prisma generate` and confirm the Prisma client reflects the new schema.

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

# Submission endpoint (POST) — use a test form ID
curl -s -X POST http://localhost:3006/api/embed/<formId> \
  -H "Content-Type: application/json" \
  -d '{"fields": {"email": "test@example.com"}}' | head -c 200
```

Check that responses have the expected shape (JSON with correct fields, appropriate status codes). If you don't have a test form ID, create one via the admin UI first.

### 6. Browser verification

Use the browser tools to verify UI changes. The checks below are scoped by what you changed — don't run all of them for every change.

**Auth flow** (changes to auth pages or session logic):
1. Navigate to `http://localhost:3006/login`.
2. Confirm the login page renders without errors.
3. If you changed login/signup/reset logic, test the flow end-to-end.

**Admin flow** (changes to admin UI):
1. Navigate to `http://localhost:3006` and log in.
2. Navigate to the area you changed (form list, form editor, settings, etc.).
3. Confirm the UI renders correctly and interactions work (save, delete, reorder, etc.).
4. Check the browser console for JavaScript errors.

**Embed flow** (changes to embed source or appearance):
1. In the admin UI, navigate to a form's editor and use the Integrate tab to get the embed snippet.
2. Create a minimal test HTML file or use a test page that embeds the form:
   ```html
   <div data-can-o-form="<formId>" data-base-url="http://localhost:3006"></div>
   <script src="http://localhost:3006/embed.js" defer></script>
   ```
3. Open it in the browser and confirm:
   - The form renders with all fields.
   - Validation fires correctly (try submitting empty required fields).
   - Successful submission shows the success message.
   - Theme/appearance changes are visible.

### 7. Env variable check (env-related changes only)

If you added, renamed, or changed how an environment variable is used:

1. Confirm it's documented in `docs/AGENT_CONTEXT.md` section 6.
2. Confirm `.env.example` includes it with a placeholder.
3. If it's a `NEXT_PUBLIC_*` variable, confirm it's handled as build-time (not runtime).
4. Check that the code has a reasonable fallback or clear error if the variable is missing.

### 8. Schema sync check (schema changes only)

After applying a migration, verify the database matches the schema:

```bash
npx prisma migrate status
```

Should show no pending migrations and no drift.

---

## Checks the agent escalates to the user

Some things the agent can't verify reliably. When these apply, tell the user **exactly what to check and why**, with specific steps.

### Visual / design review

**When**: Appearance changes, new UI components, layout modifications, theme changes.

**Why the agent can't fully verify**: The agent can confirm elements render and aren't broken, but can't judge whether spacing, alignment, color combinations, and overall feel meet design expectations.

**Escalation template**:
> I've verified the build passes and the component renders without errors. Please review the visual result:
> 1. [Specific page/URL to check]
> 2. [What to look at — e.g., "the new field config panel in the form editor"]
> 3. [What changed visually — e.g., "spacing between sections reduced from 24px to 16px"]

### Deployed environment verification

**When**: Schema migrations, env variable changes, or anything that could behave differently in Coolify vs. local.

**Why the agent can't verify**: The agent doesn't have access to the Coolify container or the dev/prod environments.

**Escalation template**:
> This change includes [a migration / an env variable change / etc.]. After it deploys to forms-dev:
> 1. Check the container logs for migration success: `[canopy-forms] Migrations complete.`
> 2. [Specific thing to verify — e.g., "confirm the new column appears in a submission response"]
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
> 3. [Specific concern — e.g., "the new date picker may not be supported in older Safari"]

---

## Documentation impact check

Before committing, scan this table. If your changes match a trigger, check the listed doc and update it if needed.

| What you changed | Doc to check | What might need updating |
|-----------------|-------------|------------------------|
| `prisma/schema.prisma` (model shape) | `docs/AGENT_CONTEXT.md` appendix B | Data model summary |
| `prisma/schema.prisma` (FieldType enum) | `docs/AGENT_CONTEXT.md` appendix A | FieldType enum list |
| New/changed UI component or pattern | `docs/UX_PATTERNS.md` | Component docs, anti-patterns list, quick reference table |
| Embed theme or appearance behavior | `docs/UX_PATTERNS.md` (Embed Forms section) | Theme defaults, CSS variable list |
| Embed validation behavior | `docs/UX_PATTERNS.md` (Embed Form Validation section) | Validation approach docs |
| New npm script or changed existing one | `docs/AGENT_CONTEXT.md` section 3 | npm scripts table |
| New dependency or major version bump | `docs/tools/*.md` | Relevant tool doc |
| Dockerfile, `start.sh`, or Coolify config | `docs/PRISMA_MIGRATIONS.md` | Build/deploy docs |
| New API route or changed API behavior | `docs/AGENT_CONTEXT.md` section 1 (Public APIs) | API documentation |
| Auth or session logic | `docs/AGENT_CONTEXT.md` section 1 (Auth & ownership) | Auth rules |
| New env variable or changed env usage | `docs/AGENT_CONTEXT.md` section 6 | Env variable tables |
| Epic completion or version bump | Follow section 9 checklist | `package.json`, `CHANGELOG.md`, epic report, epic table |

If none of the triggers match, no doc update is needed. If your change introduces a new doc maintenance trigger not listed here, add it to this table.

---

## Quick reference: minimum checks per commit

| Before committing... | Always run |
|---------------------|-----------|
| Any change | `npm run build && npm run lint` + doc impact check |
| Schema change | + verify migration file + `npx prisma migrate status` |
| Embed change | + `npm run embed:build` + confirm `public/embed.js` updated |
| UI change | + browser check on the affected page |
| API change | + curl the endpoint |
| Epic/version bump | + follow `docs/AGENT_CONTEXT.md` section 9 release checklist |

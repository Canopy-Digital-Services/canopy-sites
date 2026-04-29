# Epic 25: Form Type Selection (Hosted vs Embedded)

**Status:** Complete
**Version:** v4.12.0
**Date:** 2026-04-29
**Predecessors:** Epic 18 (Hosted Forms), Epic 19 (Appearance Editor Refactor), Epic 21 (Unified Workspace)

> **Before starting, read `CLAUDE.md` and trace through `docs/AGENT_CONTEXT.md` and any referenced docs relevant to the work** — especially `docs/UX_PATTERNS.md`, `docs/tools/prisma.md`, and the predecessor epics above.

---

## 1. Goal

Force a deliberate choice between **Hosted** and **Embedded** at form creation, then propagate that choice through the editor so every screen shows only the controls that apply to that form.

Today the editor treats every form as both. The Appearance section exposes a Page submenu that only matters for hosted, the Publish view shows allowed-origins and an embed snippet on every form including hosted-only ones, the font picker offers "Inherit from host page" even when there is no host page, and the preview pane has an Embed/Page tab toggle that exists only because the system can't tell which mode the user actually cares about. User research found this dual-purpose UX confusing — users don't know which controls apply to their use case, and superfluous options dilute the workflow.

## 2. Motivation

A form is one of two things, not both:

- **Hosted** — lives at `/f/{formId}`, shared as a link, has its own page chrome (background, content width, card wrapper).
- **Embedded** — rendered inside someone else's site via `<script>`, inherits the host page's typography and layout, requires CORS allowed-origins.

Bundling both options into one editor was the original v3 design when hosted forms were a late addition (Epic 18). User research now shows that splitting at creation time and tailoring the editor to one mode is significantly less confusing.

## 3. Current State

### Form creation (`src/app/(admin)/forms/new/page.tsx`)

A single-field page: form name → Create button. The form is created with no type information and the user lands in the editor. No chooser.

### Schema (`prisma/schema.prisma`)

`Form` has no `type` field. Hosted-vs-embedded is implicit:
- `published: Boolean` controls whether `/f/{formId}` is reachable.
- `allowedOrigins: String[]` controls CORS for the embed API.
- Both APIs serve every form regardless of how the user thinks of it.

### Form editor surfaces that need to branch

Mapped from a code survey of `src/components/forms/*` and `src/components/ui/font-picker.tsx`:

| Surface | File | Line(s) | Current behavior |
|---|---|---|---|
| Preview pane Embed/Page tab toggle | `src/components/forms/form-workspace.tsx` | 120, 303–322 | Two-button toggle with state `previewMode: "embed" \| "page"`. Mobile preview hardcodes `mode="page"`. |
| Appearance → Page submenu | `src/components/forms/appearance-section.tsx` | 287–364 | Always rendered. Contains pageBackground, cardEnabled, cardShadow, contentWidth, verticalAlign — hosted-only tokens. |
| "Inherit from host page" font option | `src/components/ui/font-picker.tsx` | 11, 153–163 | Always pinned to top of font picker. Means "use host page CSS font" — meaningless for hosted forms. |
| Publish — Share Link card | `src/components/forms/publish-content.tsx` | 154–186 | Shown only when `published === true`. Rendered for embedded forms too. |
| Publish — Allowed Origins | `src/components/forms/publish-content.tsx` | 188–258 | Always shown. Only meaningful for embedded forms. |
| Publish — Embed Code card | `src/components/forms/publish-content.tsx` | 260–279 | Always shown. Only meaningful for embedded forms. |
| Form list cards | `src/components/forms/form-card.tsx` | 66–68 | Shows Published/Draft badge only. No type indicator. |

### Cross-API behavior

| Endpoint | File | Type-awareness today |
|---|---|---|
| Embed GET/POST | `src/app/api/embed/[formId]/route.ts` | Gates on `published`, validates origin. Will serve any form including hosted-only ones. |
| Hosted page | `src/app/f/[formId]/page.tsx` | Gates on `published`. Will render any form including embed-only ones. |

### Theme storage

`Form.defaultTheme` is a single flat JSON blob (`embed/src/theme.ts:23–37`) holding both embed-relevant tokens and page-only tokens (`pageBackground`, `cardEnabled`, `cardShadow`, `contentWidth`, `verticalAlign`). No split.

## 4. Design

### 4.1 `/forms/new` becomes a typed creator

Layout (top to bottom):

1. **Form name** input — same as today.
2. **Form type chooser** — two cards side by side:
   - **Hosted** — Globe icon (subdued). Subtitle: "A standalone page at a shareable URL."
   - **Embedded** — AppWindow icon (subdued). Subtitle: "Lives inside your website via a snippet."
   - Cards are a radio group. Selected card has a primary-tinted border and a check indicator.
3. **Create form** button — disabled until **both** the name has at least one non-whitespace character **and** a type card has been selected. Same validation pattern as the rest of the admin UI (touched/submitted) — the disabled button is the affordance, no inline error needed.

The cards follow the icon-card chooser style — see UX patterns; if no precedent exists this epic introduces one and `docs/UX_PATTERNS.md` gets a "Type chooser" entry.

### 4.2 Type is locked at creation

Once a form is created its type is immutable. There is no UI to switch hosted ↔ embedded. If a user wants to convert, they create a new form. This is intentional — it lets every editor surface be designed for exactly one mode without needing "this might change" hedges, and it lets us reject cross-type API access cleanly.

### 4.3 Editor UX — what each type shows

| Surface | Hosted | Embedded |
|---|---|---|
| Preview pane tab selector | **Removed.** Preview locked to page mode. | **Removed.** Preview locked to embed mode. |
| Appearance → Page submenu | Shown. | **Hidden.** |
| Font picker "Inherit from host page" option | **Hidden.** Default font becomes Inter (or first concrete option). | Shown. |
| Publish — Share Link card | Shown when published. | **Hidden** (no hosted URL for embedded forms). |
| Publish — Allowed Origins | **Hidden.** | Shown. |
| Publish — Embed Code card | **Hidden.** | Shown. |
| Form list card badge | "Hosted" badge alongside Published/Draft. | "Embedded" badge alongside Published/Draft. |

### 4.4 Cross-type API rejection

Both public endpoints become type-aware:

- **Embed API** (`/api/embed/[formId]`) — if `form.type === "HOSTED"`, return `403` with `{ error, code: "FORM_HOSTED_ONLY" }`. The embed script (`embed/src/form.ts`) recognizes this code and renders a dedicated message ("This form is only available at its hosted URL.").
- **Hosted page** (`/f/[formId]`) — if `form.type === "EMBEDDED"`, render the existing "Form Not Available" page (200 status, same component as unpublished forms today). Do not 404 — search-engine caching consideration matches Epic 18.

### 4.5 Existing forms

All existing forms default to `EMBEDDED` via migration backfill. Embedded was the original primary use case and matches what most existing forms were authored for. Hosted-published forms keep working at their hosted URL because Hosted Forms (Epic 18) didn't gate on type — they only gated on `published`. After this epic, an existing hosted-published form would be classified as `EMBEDDED` and stop rendering at `/f/{formId}`.

**Migration mitigation:** the backfill migration upgrades a form to `HOSTED` instead of `EMBEDDED` when both:
1. `published === true`, and
2. `allowedOrigins` is empty.

This heuristic captures the small subset of existing forms that are hosted-only in practice without misclassifying embedded forms that happen to be published.

## 5. Architecture

### 5.1 Schema changes

```prisma
enum FormType {
  HOSTED
  EMBEDDED
}

model Form {
  // ...existing fields...
  type FormType
  // ...
}
```

- New enum `FormType` with two values.
- Add `type FormType` to `Form` (non-nullable, no default — every row must declare).
- Migration:
  1. Add the enum.
  2. Add the column as nullable.
  3. Backfill: `UPDATE forms SET type = 'HOSTED' WHERE published = true AND cardinality(allowed_origins) = 0; UPDATE forms SET type = 'EMBEDDED' WHERE type IS NULL;`
  4. Set the column `NOT NULL`.
- Single migration file with all four steps so rollback is trivial.

### 5.2 Server action changes

- `createForm(data)` (`src/actions/forms.ts:467`) — add required `type: "HOSTED" | "EMBEDDED"` to `data`, persist to the new column. The `/forms/new` server action passes it through from the form post.
- `toggleFormPublished` (`src/actions/forms.ts:396`) — unchanged (publish state still meaningful for both types — embedded forms have an "active/inactive" semantic via the existing `FORM_INACTIVE` gate; hosted forms gate the public URL).
- `updateFormBasics`, `updateAfterSubmission`, `updateFormHeader`, `updateFormAppearance` — no signature change; type is never edited.

### 5.3 Form context

`FormState` (`src/components/forms/form-context.tsx:22–38`) gains `type: "HOSTED" | "EMBEDDED"`. It's read-only in the context — no setter, no save group, no auto-save dirty tracking. It's loaded from the server-fetched form and used for branching.

### 5.4 `/forms/new` flow

The current page is server-rendered with a server action handler. It needs client interactivity (the type chooser) and disabled-button gating. Two viable shapes:

**Option A (preferred):** Convert the page to a small client component that owns the form state and submits via the existing `handleCreateForm` server action with the type appended to `FormData`. Keeps the slug-uniqueness logic on the server.

**Option B:** Keep server-rendered, do progressive enhancement, accept that JS-disabled users see the chooser as plain radios and the button is enabled by default. Less consistent.

Pick A. Aligns with the rest of the admin UI which is already heavily client-side.

### 5.5 Editor branching

The editor reads `state.type` from `FormContext` and passes it (or branches inline) where each surface renders. No prop drilling beyond one level — components that already read context just add one more field.

- `FormWorkspace` removes `previewMode` state when type is known. The preview pane renders directly with the type's mode.
- `AppearanceSection` conditionally renders the Page subsection.
- `FontPicker` accepts a `showInherit?: boolean` prop, defaulting to `true` to preserve existing call sites; the appearance section passes `showInherit={state.type === "EMBEDDED"}`.
- `PublishContent` branches its three conditional cards (Share Link, Allowed Origins, Embed Code) on type.
- `FormCard` reads `form.type` and renders a small badge.

### 5.6 API guards

```ts
// src/app/api/embed/[formId]/route.ts (GET and POST)
if (form.type === "HOSTED") {
  return NextResponse.json(
    { error: "This form is only available at its hosted URL.", code: "FORM_HOSTED_ONLY" },
    { status: 403 }
  );
}
```

```ts
// src/app/f/[formId]/page.tsx
const form = await getPublishedForm(formId);
if (form?.type === "EMBEDDED") {
  return <FormNotAvailable />;
}
```

`embed/src/form.ts` adds a clause for `code === "FORM_HOSTED_ONLY"` mirroring the existing `FORM_INACTIVE` handling. Run `npm run embed:build`.

### 5.7 Help docs

- `content/docs/getting-started.md` (or equivalent intro) — update to describe the type choice.
- Hosted-form and embed-form pages — mention they're now distinct flows.
- Register any new pages in `content/docs/meta.ts`.

## 6. Implementation Plan

### Phase 1 — Schema + backfill
1. Add `FormType` enum and `type` column to `prisma/schema.prisma`.
2. Generate the migration via `npx prisma migrate dev --name add_form_type`.
3. Hand-edit the SQL to do the four-step backfill (add nullable → backfill heuristic → backfill default → set NOT NULL).
4. Verify the SQL by reading the generated file.
5. Regenerate the Prisma client. Restart the dev container so the new client is picked up.
6. Verify against the dev DB: every form has a non-null type; the heuristic classified the expected forms.

### Phase 2 — Type-aware form creation
1. Convert `src/app/(admin)/forms/new/page.tsx` to a client component (`"use client"`) wrapping a server action.
2. Add the type chooser cards. Use `Globe` for hosted, `AppWindow` for embedded (lucide-react, both already used elsewhere).
3. Wire the disabled-button gate.
4. Update `createForm` in `src/actions/forms.ts` to accept and persist `type`.
5. Verify: creating a form of each type lands in the editor with the correct type recorded.

### Phase 3 — Editor branching
1. Add `type` to `FormState` and load it in the workspace's server fetch path.
2. Remove the preview Embed/Page tab toggle from `FormWorkspace`. Lock preview mode to `state.type === "HOSTED" ? "page" : "embed"`. Update mobile preview to honor type instead of hardcoded `mode="page"`.
3. Update `AppearanceSection` to hide the Page subsection for embedded forms. Verify the section's chips, validation, and reset logic don't reference page-only tokens for embedded forms.
4. Update `FontPicker` to accept `showInherit`. In `AppearanceSection` pass `showInherit={state.type === "EMBEDDED"}`. For hosted forms, pre-select a concrete default (Inter) instead of the now-missing inherit option — handle the migration of existing hosted forms whose theme stores `bodyFont: "inherit"` (treat as Inter at render time, leave the stored value as-is so reverting is possible).
5. Update `PublishContent` to branch the three conditional cards.
6. Update `FormCard` to render a small "Hosted" or "Embedded" badge alongside the Published/Draft badge.

### Phase 4 — API guards + embed script
1. Add the `FORM_HOSTED_ONLY` guard to `src/app/api/embed/[formId]/route.ts` (both GET and POST).
2. Add the `EMBEDDED` rejection to `src/app/f/[formId]/page.tsx`.
3. Add `FORM_HOSTED_ONLY` handling in `embed/src/form.ts`. Run `npm run embed:build` and commit `public/embed.js`.

### Phase 5 — Docs + verification
1. Update `content/docs/*.md` per the help-docs note above. Register new pages in `content/docs/meta.ts` if needed.
2. Update `docs/AGENT_CONTEXT.md` Appendix B (data model summary) to include `type`.
3. Add a "Type chooser" pattern entry to `docs/UX_PATTERNS.md` describing the two-card selector, since this introduces a new pattern.
4. Walk `docs/VERIFICATION_CHECKLIST.md`. Manual verification at minimum:
   - Create one form of each type; confirm editor surfaces match the matrix above.
   - Publish each. Hit `/f/{formId}` for the hosted form (renders) and the embedded form (shows Form Not Available).
   - Hit the embed API for both. Hosted returns `FORM_HOSTED_ONLY`; embedded works.
   - Existing forms (pre-migration) still render correctly. Spot-check a few that were misclassified by the heuristic and confirm they're recoverable (user creates a new form of the correct type).

### Phase 6 — Release
1. Bump `package.json` version.
2. `CHANGELOG.md` entry.
3. Mark this epic complete: status, version, completion date.
4. Add row to `docs/epics/README.md`.

## 7. Acceptance Criteria

1. `/forms/new` shows form name, then a two-card hosted/embedded chooser, then Create. Create is disabled until both name and type are filled.
2. The cards each have a subdued icon (Globe for hosted, AppWindow for embedded) and a one-line description.
3. After creation, the editor for a **hosted** form:
   - Has no Embed/Page tab toggle in the preview.
   - Hides the Appearance → Page subsection (or rather, **shows** it — this is the inverted case; see #4).
   - Hides the embed-only font picker "Inherit from host page" option.
   - In the publish view, hides the Allowed Origins section and Embed Code card.
4. After creation, the editor for an **embedded** form:
   - Has no Embed/Page tab toggle in the preview.
   - Hides the Appearance → Page subsection.
   - Shows the "Inherit from host page" font option.
   - In the publish view, hides the Share Link card. Shows Allowed Origins and Embed Code.
5. `/f/{formId}` for an embedded form renders the existing "Form Not Available" page (200).
6. The embed API (`/api/embed/{formId}`) for a hosted form returns 403 with `code: "FORM_HOSTED_ONLY"`. The embed script renders a dedicated message for this code.
7. Form type is immutable — no UI exists to change it post-creation.
8. Form list cards show a "Hosted" or "Embedded" badge.
9. Existing forms before this epic are migrated: forms with `published=true` and empty `allowedOrigins` become HOSTED; all others become EMBEDDED. The migration is a single atomic file under `prisma/migrations/`.
10. `npm run build` and `npm run lint` pass. `public/embed.js` is rebuilt and committed.
11. The data model summary in `docs/AGENT_CONTEXT.md` Appendix B and the epic table in `docs/epics/README.md` reflect the change.

## 8. Out of Scope

- A "convert hosted to embedded" or vice-versa flow.
- Splitting `defaultTheme` into separate `embedTheme` and `pageTheme` JSON columns. Keeping the flat shape; embedded forms simply ignore page-only tokens at render time. Schema split is a future cleanup if the JSON gets unwieldy.
- A "preview as the other mode" toggle for hosted forms wanting to see embed mode (or vice versa). Not a current user need.
- Allowed-origins still applies to embedded forms only. No rename to "CORS Origins" in this epic — the existing label is fine when shown in the right context.
- Operator console badging (showing form type in the operator accounts table). Possible follow-up.
- Type-aware filter on the forms list (filter by hosted/embedded). Possible follow-up if the user base grows enough to warrant it.

## 9. Open Questions / Future Work

- **Default font for hosted forms when "Inherit" is removed.** Plan is Inter. Should it be configurable via plan/account, or always Inter? Defer to Phase 3 implementation feedback.
- **Migration heuristic accuracy.** The `published && empty(allowedOrigins) → HOSTED` rule is best-effort. We may discover via support requests that some hosted-only forms had non-empty allowedOrigins from earlier exploration. If that happens, surface a one-time admin tool to flip type — but only with explicit user request, not as part of this epic.
- **`FORM_HOSTED_ONLY` user-facing copy.** The exact embed-script message for this case can be tuned during implementation; coordinate with the existing `FORM_INACTIVE` copy.

## 10. Key Files

### Modified

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `FormType` enum and `Form.type` column |
| `prisma/migrations/<new>/migration.sql` | New migration with backfill heuristic |
| `src/actions/forms.ts` | `createForm` accepts and persists `type` |
| `src/app/(admin)/forms/new/page.tsx` | Two-card type chooser + disabled-button gating |
| `src/components/forms/form-context.tsx` | Add `type` to `FormState` |
| `src/components/forms/form-workspace.tsx` | Remove preview tabs; lock preview mode to type |
| `src/components/forms/appearance-section.tsx` | Hide Page subsection for embedded |
| `src/components/ui/font-picker.tsx` | Accept `showInherit` prop |
| `src/components/forms/publish-content.tsx` | Branch Share Link / Allowed Origins / Embed Code on type |
| `src/components/forms/form-card.tsx` | Add type badge |
| `src/app/api/embed/[formId]/route.ts` | Reject HOSTED forms with `FORM_HOSTED_ONLY` |
| `src/app/f/[formId]/page.tsx` | Reject EMBEDDED forms with the existing Not Available page |
| `embed/src/form.ts` | Handle `FORM_HOSTED_ONLY` error code |
| `public/embed.js` | Rebuilt artifact |
| `docs/AGENT_CONTEXT.md` | Appendix B data model summary |
| `docs/UX_PATTERNS.md` | New "Type chooser" pattern entry |
| `docs/epics/README.md` | Epic table row |
| `content/docs/*.md`, `content/docs/meta.ts` | User-facing help reflecting the new flow |
| `CHANGELOG.md`, `package.json` | Release entry + version bump |

### Created

None beyond the migration file and any new help-doc pages.

### Unchanged

| File | Note |
|---|---|
| `src/lib/data-access/forms.ts` | `getOwnedForm`, `getPublishedForm` queries return the new column for free once the schema is regenerated |
| `embed/src/theme.ts` | Theme shape unchanged; embedded forms keep ignoring page-only tokens at render time |
| `src/components/forms/integrate-panel.tsx` | If still in use after Epic 21 — same branching as `publish-content.tsx` if applicable |

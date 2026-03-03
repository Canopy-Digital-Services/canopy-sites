# Epic 17: Live Side-by-Side Form Editor

## 1. Goal

Replace the current click-to-preview workflow with an always-visible live preview that updates instantly as the user edits. This eliminates the context switch between editing and seeing results, making the form builder feel responsive and professional.

## 2. Current State

Understanding the starting point is critical — several patterns established during early development need to be replaced, not built on top of.

### What exists today

- **`EditorLayout`** (`src/components/patterns/editor-layout.tsx`): Three-slot layout (header, main, panel). The panel slot is `hidden lg:block`. Already used by `FormEditor`.
- **`FormEditor`** (`src/components/forms/form-editor.tsx`): Orchestrator component. Passes a `panelType` state (`"preview" | "integrate" | null`) to conditionally render `PreviewPanel` or `IntegratePanel` in the panel slot. User must click "Preview" to open it.
- **`PreviewPanel`** (`src/components/forms/preview-panel.tsx`): Renders inside a `RightPanel` (Radix Sheet — a slide-out drawer). Loads `embed.js`, fetches the form definition from the API (`/api/embed/{formId}`), and calls `CanopyForms.init()` to render the form.
- **Per-section state**: Each editor section (`HeaderSection`, `FormFieldsManager`, `AppearanceSection`, `AfterSubmissionSection`) independently manages its own state and auto-saves via 1-second debounced server actions. There is no unified form state.
- **Editor width**: Both header and main content already use `max-w-[640px] mx-auto`.

### Why these patterns don't support live preview

1. **No unified state** — there's no single object representing "what the form looks like right now" for a preview to consume.
2. **Preview fetches from the API** — it shows what was last saved to the database, not what the user is currently editing. Unsaved changes are invisible.
3. **Preview is modal** — user must click to open it, and it renders in a Sheet overlay rather than being always-visible alongside the editor.
4. **`CanopyForm` class always fetches** — the embed's `CanopyForm` class (in `embed/src/form.ts`) has no code path for receiving a form definition directly; it always makes a network request.

## 3. Architecture

### Phase 1: Unified FormContext

**Goal**: Single source of truth for form state that any component can read from.

Create a `FormContext` (React context + provider) at the `FormEditor` level that holds the full form state: name, title, description, fields, theme, success message, redirect URL, notification settings, etc.

**State shape** (mirrors the `form` prop currently passed to `FormEditor`):

```typescript
type FormState = {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  description: string | null;
  fields: FieldState[];
  defaultTheme: ThemeState | null;
  successMessage: string | null;
  redirectUrl: string | null;
  // ... remaining form properties
};
```

**Key design decisions**:

- **Provider lives in `FormEditor`**, initialized from the server-fetched `form` prop.
- **Sections dispatch updates** to the context instead of managing local state. Each section becomes a controlled component reading from context.
- **Auto-save moves to the context layer**. A single `useAutoSave` hook (or similar) watches for changes per logical group (basics, fields, theme, etc.) and debounces server action calls. This replaces the duplicated debounce logic in each section.
- **Optimistic by default** — context updates immediately on user input; server saves happen in the background. On save failure, show a toast (current pattern) but don't roll back the local state (the user is still editing).
- **Field mutations** (add, edit, delete, reorder) update context state and trigger a server action. The current optimistic-update-with-rollback pattern in `FormFieldsManager` should be preserved for field operations since they can fail (e.g., duplicate name).

**Refactored sections**:

| Section | Currently owns | After refactor |
|---------|---------------|----------------|
| `HeaderSection` | title, description state + auto-save | Reads from / dispatches to FormContext |
| `FormFieldsManager` | fields array + CRUD actions | Reads from / dispatches to FormContext |
| `AppearanceSection` | theme state + auto-save | Reads from / dispatches to FormContext |
| `AfterSubmissionSection` | success, redirect, notifications + auto-save | Reads from / dispatches to FormContext |
| `FormEditor` header | form name state + auto-save | Reads from / dispatches to FormContext |

### Phase 2: Embed Inline Data + Rename

**Goal**: The embed can render a form from a provided definition without fetching from the API, and the legacy class name is cleaned up.

**Rename**: `CanOForm` → `CanopyForm` in `embed/src/form.ts`. This is a class-internal rename; the public API (`window.CanopyForms.init()`) is unchanged.

**Inline data support**: Add an alternative initialization path to `CanopyForm` where a form definition object is provided directly, bypassing the API fetch. This is the bridge between React state and the vanilla JS embed renderer.

```typescript
// Current: always fetches
const form = new CanopyForm(container);
await form.load(); // fetches from /api/embed/{formId}

// New: can accept inline data
const form = new CanopyForm(container);
form.renderFromDefinition(definition); // no network request
```

**Why use the real embed, not a React duplicate**: The embed IS the product. Building a separate React preview component creates two renderers that will inevitably diverge. By feeding local state directly to the embed, the preview is always truthful — what the user sees is exactly what gets embedded on their site.

**Re-render strategy**: On form state changes, clear the embed container and call `renderFromDefinition()` with the new state. Forms are small DOM trees; full re-render is fast and avoids the complexity of incremental DOM diffing in vanilla JS. Debounce the re-render (e.g., 150ms) to avoid thrashing during rapid typing.

### Phase 3: Always-On Preview Panel

**Goal**: The preview is visible by default on desktop, with no button click required.

**Desktop (lg+)**:
- The preview panel renders in the `EditorLayout` panel slot, always visible.
- The "Preview" button is removed from the header. The "Integrate" button remains (it opens the integrate panel, which replaces the preview temporarily, or opens in a Sheet — TBD during implementation).
- The panel reads from `FormContext` and passes state to the embed via `renderFromDefinition()`.
- The preview is interactive — users can click inputs, test validation popups, interact with dropdowns, etc.

**Mobile/tablet (<lg)**:
- `EditorLayout` already hides the panel slot below `lg` breakpoint.
- A "Preview" button appears in the header (mobile only) that opens the preview in a Sheet (the existing `RightPanel` pattern). This is the current behavior and works well.

**Layout changes to `EditorLayout`**:
- The panel slot should have a sticky/fixed position so it stays visible as the user scrolls through editor sections.
- Consider giving the panel a constrained max-width or using a proportional split (e.g., `flex-1` for editor, `flex-1` for preview, with the editor's inner content capped at 640px).

## 4. Implementation Order

This ordering ensures each phase is independently shippable and testable.

### Phase 1 — FormContext (foundation)
1. Create `FormContext` with provider, types, and a `useFormContext` hook.
2. Refactor `FormEditor` to wrap children in the provider, initialized from the server-fetched form.
3. Migrate `HeaderSection` to read from / dispatch to context. Remove its local state and auto-save. Verify auto-save still works via context.
4. Migrate `FormFieldsManager` similarly. Preserve optimistic update + rollback for field CRUD.
5. Migrate `AppearanceSection`.
6. Migrate `AfterSubmissionSection` and the form name input in `FormEditor`'s header.
7. Verify: all editing workflows function identically to before. No user-visible behavior change yet.

### Phase 2 — Embed inline data + rename
1. Rename `CanOForm` → `CanopyForm` in `embed/src/form.ts`.
2. Add `renderFromDefinition(definition)` method that accepts a form definition object and renders without fetching.
3. Ensure the definition shape matches what the embed API returns (or add a thin adapter).
4. Run `npm run embed:build` and verify existing embed functionality is unchanged.
5. Verify: embed still works on test pages. The new method is available but not yet called by the admin UI.

### Phase 3 — Always-on preview panel
1. Create a new `LivePreviewPanel` component that reads from `FormContext`, converts state to an embed definition, and calls `renderFromDefinition()` on changes (debounced).
2. Replace the conditional preview rendering in `FormEditor` with the always-on `LivePreviewPanel` in the `EditorLayout` panel slot.
3. Update `EditorLayout` to support the always-visible panel with appropriate sizing and sticky behavior.
4. Remove `PreviewPanel` (the Sheet-based one) for desktop. Keep a mobile-only "Preview" button that opens the preview in a Sheet for `<lg` screens.
5. Verify: preview is visible on desktop, updates live as the user edits fields/title/theme, and is interactive.

## 5. Acceptance Criteria

1. All form state is managed through `FormContext`. No section maintains independent form state.
2. Auto-save continues to work with the same debounce behavior — no regressions in save reliability.
3. The preview is always visible on `lg+` screens without user action.
4. Editing a field label, toggling required, changing the title, or modifying theme tokens updates the preview within ~200ms.
5. The preview renders using the real embed code (`embed.js`), not a separate React component.
6. The preview is interactive — users can type in inputs, open dropdowns, and trigger validation.
7. `CanOForm` is renamed to `CanopyForm` throughout the embed source.
8. On `<lg` screens, a "Preview" button opens the preview in a Sheet/drawer.
9. The implementation passes all applicable checks in `docs/VERIFICATION_CHECKLIST.md`.

## 6. Out of Scope (future work)

- **Device switcher** (toggle between desktop/mobile viewport simulation in the preview panel)
- **Collapse/expand toggle** for the preview panel on desktop
- **Undo/redo** (the unified FormContext makes this possible later, but it's not part of this epic)
- **Draft vs. published** form states
- **Integrate panel** redesign — the Integrate panel keeps its current behavior for now

---

## Implementation Notes (completed)

### Key files
- **`src/components/forms/form-context.tsx`** — FormProvider, useFormContext, auto-save hook with 4 save groups
- **`src/components/forms/live-preview-panel.tsx`** — Always-on preview using embed's `renderFromDefinition()`
- **`embed/src/form.ts`** — Renamed `CanOForm` → `CanopyForm`, added `renderFromDefinition()` public method
- **`embed/src/index.ts`** — Exposes `CanopyForm` class on `window.CanopyForms`

### Architecture decisions
- **Granular updaters over useReducer** — each updater maps to a save group, avoiding a dispatch/reducer layer
- **Auto-save debounce** — 1s per group, tracked via refs to avoid stale closures
- **Preview debounce** — 150ms on `renderFromDefinition()` calls to avoid thrashing during rapid edits
- **Integrate panel** moved to a Sheet triggered by header button (no longer uses the panel slot)
- **Old `PreviewPanel`** deleted — replaced by `LivePreviewPanel`
- **`FormOptions.formId`** made optional in embed to allow construction for inline rendering
- **Mobile preview** — a fixed side handle tab on the right edge (`lg:hidden`) opens `LivePreviewPanel` in a `RightPanel` Sheet, satisfying AC #8

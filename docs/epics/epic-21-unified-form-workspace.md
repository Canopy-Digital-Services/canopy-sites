# Epic 21: Unified Form Workspace with Animated View/Edit Transition

## 1. Goal

Replace the separate View and Edit pages for a form with a single **Form Workspace** component that toggles between viewing and editing modes with a smooth animated transition. When the user clicks "Edit," the preview slides to the right and editor controls slide in from the left — no route change, no DOM remount, no flash.

This consolidates two pages, two preview components, and two layout components into a single cohesive workspace, reducing code surface and eliminating the jarring full-page navigation between View and Edit.

## 2. Current State

### Two separate routes

| Route | Component | Layout |
|-------|-----------|--------|
| `/forms/[formId]` | `FormViewPage` | `PageContent` (centered, max-w-5xl) |
| `/forms/[formId]/edit` | `FormEditor` → `EditorLayout` | Two-column: editor left, preview panel right |

Navigation between them is a full route change via `<Link>`. The browser unmounts one page entirely and mounts the other. There is no shared state or transition.

### Two preview components

| Component | File | Used by | Data source |
|-----------|------|---------|-------------|
| `FormPreview` | `src/components/forms/form-preview.tsx` | View page | Static form prop from server |
| `LivePreviewPanel` | `src/components/forms/live-preview-panel.tsx` | Edit page | `FormContext` (live state) |

Both use `useEmbedScript` and `renderFromDefinition()` — they do the same thing with different data sources. The View page's `FormPreview` also wraps itself in an `embed` vs `page` mode styling layer, while `LivePreviewPanel` always renders with page theme.

### Two layouts

| Component | File | Used by |
|-----------|------|---------|
| `PageContent` | `src/components/patterns/page-content.tsx` | View page (and forms list, submissions, etc.) |
| `EditorLayout` | `src/components/patterns/editor-layout.tsx` | Edit page only |

### View page elements

The View page (`form-view-page.tsx`) renders:
- `PageHeader` with form name, field count, back link to `/forms`
- Action buttons: Edit (link to edit route), Submissions (link to submissions route)
- `Tabs` for Embed vs Page mode, each rendering `FormPreview` with appropriate theme styling

### Edit page elements

The Edit page (`form-editor.tsx`) renders:
- `FormProvider` wrapping the entire editor (provides `FormContext` with auto-save)
- `EditorLayout` with three slots:
  - **Header**: back link, editable form name, save status, Publish/Unpublish, Integrate
  - **Main**: `HeaderSection`, `FieldsSection`, `AppearanceSection`, `AfterSubmissionSection` (max-w 640px)
  - **Panel**: `LivePreviewPanel` (400–480px, hidden below `lg`)
- Mobile preview: fixed side handle tab + `RightPanel` Sheet with `LivePreviewPanel`
- `IntegratePanel` (Sheet-based)

### Animation infrastructure

- No JS animation library (no framer-motion, react-spring, etc.)
- `tw-animate-css` is available (imported in `globals.css`) — provides Tailwind `animate-in`, `animate-out`, `slide-in-from-*`, `fade-in-*` utilities
- Standard Tailwind `transition-*` utilities used throughout the codebase
- No page-level transitions exist today

## 3. Design

### Single-route workspace

`/forms/[formId]` becomes the only route. It renders a `FormWorkspace` component that has two modes: **view** and **edit**.

`/forms/[formId]/edit` becomes a redirect to `/forms/[formId]` (preserves any bookmarks or links).

### View mode layout

```
┌──────────────────────────────────────────────────┐
│  ← Back    Form Name    [✏ Edit] [📋 Submissions]│  Header
├──────────────────────────────────────────────────┤
│                                                  │
│           ┌──────────────────────┐               │
│           │  [Embed] [Page]      │               │
│           │                      │               │
│           │   Form Preview       │               │
│           │   (centered)         │               │
│           │                      │               │
│           └──────────────────────┘               │
│                                                  │
└──────────────────────────────────────────────────┘
```

The preview is centered with Embed/Page tabs above it. The Edit button is a pencil icon in a compact card/FAB.

### Edit mode layout

```
┌──────────────────────────────────────────────────┐
│  ← Back    Form Name ✏    Saving... [Publish] [⚡]│  Header (editor toolbar)
├─────────────────────┬────────────────────────────┤
│                     │                            │
│  Editor Controls    │  ┌──────────────────────┐  │
│  (slides in from    │  │  [Embed] [Page]      │  │
│   the left)         │  │                      │  │
│                     │  │  Live Preview         │  │
│  • Header Section   │  │  (same component,    │  │
│  • Fields Section   │  │   now reading from   │  │
│  • Appearance       │  │   FormContext)        │  │
│  • After Sub...     │  │                      │  │
│                     │  └──────────────────────┘  │
│                     │                            │
└─────────────────────┴────────────────────────────┘
```

Editor controls occupy ~640px on the left. The preview fills the remaining space on the right, which is significantly larger than the current 400–480px panel — a direct benefit of removing the sidebar in epic 20.

### Transition animation

When toggling from View → Edit:

1. **Preview** transitions from centered full-width to right-aligned flex column. CSS `transition-all duration-300 ease-in-out` handles the reflow.
2. **Editor controls** container transitions from `w-0 opacity-0 overflow-hidden` to `w-[640px] opacity-100`. The content appears to slide in from the left.
3. **Header** crossfades between view-mode actions (Edit, Submissions) and edit-mode actions (save status, Publish, Integrate).

When toggling from Edit → View, the reverse plays out: editor controls collapse to zero width, preview recenters.

### Embed/Page tabs in both modes

The Embed vs Page tab toggle is always visible above the preview in both view and edit mode. This was previously only on the View page. In edit mode it controls the preview's rendering mode so the user can see how their changes look in both contexts.

### Edit FAB

In view mode, the primary Edit action is a pencil icon button. Placement is flexible — it can be in the header action area (matching the current position) or as a floating card near the preview. The Submissions link remains as a separate button.

### Mobile behavior

Below `lg` breakpoint:
- **View mode** works as today — centered preview, Embed/Page tabs
- **Edit mode** shows only the editor controls. A fixed "Preview" tab handle on the right edge opens the preview in a `RightPanel` Sheet (existing pattern, unchanged)

The animated transition between view/edit is skipped on mobile — it switches instantly since the layouts are stacked, not side-by-side.

## 4. Architecture

### Unified preview component

Merge `FormPreview` and `LivePreviewPanel` into a single `FormPreview` component that:

- Accepts an optional `form` prop (static data for view mode) OR reads from `FormContext` (live data for edit mode)
- Uses `useEmbedScript` and `renderFromDefinition()` in both cases
- Supports an `embed` vs `page` mode prop for styling
- Debounces re-renders (150ms) when reading from FormContext

This eliminates `LivePreviewPanel` as a separate file. The existing `live-preview-panel.tsx` file can be deleted.

### FormProvider scope

`FormProvider` wraps the entire workspace, not just the editor. This is necessary so the preview always has access to the context. However, **auto-save must only activate in edit mode**:

- The `useAutoSave` hook inside `FormProvider` should accept an `enabled` flag (or the provider should accept an `autoSaveEnabled` prop)
- In view mode, `autoSaveEnabled` is `false` — the provider holds state but does not schedule saves
- When the user enters edit mode, `autoSaveEnabled` flips to `true`
- This prevents accidental saves from view-mode interactions

### Workspace layout

Replace `EditorLayout` internals with a mode-aware layout. The new structure in `FormWorkspace`:

```
<FormProvider autoSaveEnabled={editing}>
  <div className="flex flex-col h-full">
    <WorkspaceHeader editing={editing} ... />
    <div className="flex flex-1 min-h-0">
      {/* Editor column — animates width */}
      <div className={cn(
        "transition-all duration-300 ease-in-out overflow-hidden",
        editing ? "w-[640px] opacity-100" : "w-0 opacity-0"
      )}>
        <div className="w-[640px] overflow-y-auto h-full px-4 md:px-8 py-6">
          <EditorControls />
        </div>
      </div>
      {/* Preview column — fills remaining space */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <PreviewArea mode={previewMode} />
      </div>
    </div>
  </div>
</FormProvider>
```

The key insight is that the preview does not need to move — it stays in its flex column. The editor column grows from `w-0` to `w-[640px]`, pushing the preview to the right naturally. From the user's perspective, the preview "slides over."

### Route changes

| Route | Before | After |
|-------|--------|-------|
| `/forms/[formId]` | `FormViewPage` | `FormWorkspace` |
| `/forms/[formId]/edit` | `FormEditor` | Redirect to `/forms/[formId]` |

The edit route file (`src/app/(admin)/forms/[formId]/edit/page.tsx`) becomes a simple `redirect("/forms/[formId]")`.

### Data loading

The server component at `/forms/[formId]/page.tsx` already fetches the full form (including fields, theme, etc.) via `getOwnedForm`. It also fetches `apiUrl` and the session. The edit route fetches the same data. After consolidation, only the view route's server component remains, and it passes everything `FormWorkspace` needs:

```tsx
// src/app/(admin)/forms/[formId]/page.tsx
export default async function FormRoute({ params }) {
  const form = await getOwnedForm(formId, accountId);
  return <FormWorkspace form={form} apiUrl={apiUrl} ownerEmail={session.user.email} />;
}
```

## 5. Implementation Plan

### Phase 1: Unify the preview component

1. Refactor `FormPreview` (`form-preview.tsx`) to optionally read from `FormContext` when no `form` prop is provided. When `form` is provided, render from that static data. When absent, read from context and debounce (150ms).
2. Add `mode` styling for `page` mode (page background, content width, card wrapper) — currently this logic lives in both `form-view-page.tsx` and `live-preview-panel.tsx`.
3. Delete `live-preview-panel.tsx`.
4. Update `form-editor.tsx` to use the unified `FormPreview` in its panel slot.
5. Verify: edit page preview still updates live; view page preview still renders correctly.

### Phase 2: Add auto-save gating to FormProvider

1. Add an `autoSaveEnabled` prop to `FormProvider` (default `true` for backward compat).
2. Pass it through to `useAutoSave`. When `false`, `useAutoSave` skips scheduling saves (clear any pending timers if it transitions from true to false).
3. Verify: existing edit page behavior unchanged.

### Phase 3: Build FormWorkspace

1. Create `FormWorkspace` (`src/components/forms/form-workspace.tsx`) — the unified component.
2. It accepts the same props as the current `FormEditor` plus anything `FormViewPage` needs.
3. Internal state: `editing` boolean, `previewMode` ("embed" | "page").
4. Wrap contents in `FormProvider` with `autoSaveEnabled={editing}`.
5. Implement the view-mode header: back link to `/forms`, form name (read-only), Edit button (pencil icon), Submissions link.
6. Implement the edit-mode header: back link (exits edit mode, not a route change), editable form name, save status, Publish/Unpublish, Integrate.
7. Implement the two-column body with CSS transition on the editor column width.
8. The editor column renders the same sections as today: `HeaderSection`, `FieldsSection`, `AppearanceSection`, `AfterSubmissionSection`.
9. The preview column renders the unified `FormPreview` with Embed/Page tabs.
10. Mobile: below `lg`, the editor column takes full width when editing. Preview is accessed via the existing `RightPanel` Sheet pattern.
11. Verify: both modes work; transition animates smoothly; auto-save only fires in edit mode; mobile works.

### Phase 4: Route wiring and cleanup

1. Update `/forms/[formId]/page.tsx` to render `FormWorkspace` instead of `FormViewPage`. Pass `ownerEmail` from session (needed for `AfterSubmissionSection`).
2. Replace `/forms/[formId]/edit/page.tsx` body with a `redirect()` to `/forms/[formId]`.
3. Delete `form-view-page.tsx`.
4. Delete `form-editor.tsx`.
5. Delete `live-preview-panel.tsx` (if not already deleted in Phase 1).
6. Evaluate whether `EditorLayout` is used anywhere else. If not, delete it.
7. Evaluate whether `PageContent` is used anywhere else. If so, keep it; if not, delete it.
8. Update any other links that point to `/forms/[formId]/edit` (check `forms-table.tsx`, `form-card.tsx`, dashboard components, etc.) to point to `/forms/[formId]`.
9. Verify: all navigation paths work; no dead imports; build passes; lint passes.

## 6. Acceptance Criteria

1. `/forms/[formId]` renders a unified workspace that supports both viewing and editing.
2. `/forms/[formId]/edit` redirects to `/forms/[formId]`.
3. Clicking the Edit button animates the editor controls in from the left and the preview to the right. The transition is smooth (CSS `transition-all`, ~300ms).
4. Clicking back/close in edit mode animates the editor away and recenters the preview.
5. The Embed/Page tab toggle is visible and functional in both view and edit mode.
6. Auto-save only activates when in edit mode. Viewing a form triggers no write operations.
7. The live preview updates within ~200ms of edits (same as today).
8. The preview area is larger than the old 400–480px panel, taking advantage of the freed horizontal space.
9. Mobile (`<lg`): edit mode shows controls full-width; preview is accessible via the Sheet handle (existing pattern).
10. No new JS dependencies are required — animation uses Tailwind `transition-*` utilities only.
11. `FormPreview` and `LivePreviewPanel` are consolidated into a single component.
12. `form-view-page.tsx` and `form-editor.tsx` are deleted.
13. Build and lint pass with no regressions.

## 7. Out of Scope

- **URL reflecting edit state** — no query param like `?editing=true`. The workspace always starts in view mode.
- **Keyboard shortcut** to toggle edit mode (nice-to-have for later).
- **Device switcher** in the preview (desktop/tablet/mobile viewport simulation).
- **Undo/redo** — FormContext still supports this in principle but it's not part of this epic.
- **Redesign of the editor sections** — the controls themselves (`HeaderSection`, `FieldsSection`, etc.) are unchanged.
- **Integrate panel** redesign — keeps its current Sheet behavior.
- **Submissions page** — remains a separate route at `/forms/[formId]/submissions`.

## 8. Key Files

### Modified

| File | Change |
|------|--------|
| `src/app/(admin)/forms/[formId]/page.tsx` | Render `FormWorkspace` instead of `FormViewPage`; pass session data |
| `src/app/(admin)/forms/[formId]/edit/page.tsx` | Replace with redirect to `/forms/[formId]` |
| `src/components/forms/form-preview.tsx` | Extend to optionally read from FormContext; add page-mode styling |
| `src/components/forms/form-context.tsx` | Add `autoSaveEnabled` prop to `FormProvider` and gating to `useAutoSave` |

### Created

| File | Purpose |
|------|---------|
| `src/components/forms/form-workspace.tsx` | Unified workspace component with animated view/edit toggle |

### Deleted

| File | Reason |
|------|--------|
| `src/components/forms/form-view-page.tsx` | Replaced by `FormWorkspace` |
| `src/components/forms/form-editor.tsx` | Replaced by `FormWorkspace` |
| `src/components/forms/live-preview-panel.tsx` | Merged into `FormPreview` |
| `src/components/patterns/editor-layout.tsx` | Logic absorbed into `FormWorkspace` (verify no other consumers first) |

### Unchanged

| File | Note |
|------|------|
| `src/components/forms/fields-section.tsx` | Rendered inside workspace editor column as-is |
| `src/components/forms/header-section.tsx` | Same |
| `src/components/forms/appearance-section.tsx` | Same |
| `src/components/forms/after-submission-section.tsx` | Same |
| `src/components/forms/integrate-panel.tsx` | Same — opened via Sheet from edit-mode header |
| `src/components/patterns/right-panel.tsx` | Same — used for mobile preview Sheet |
| `src/components/patterns/page-content.tsx` | Kept if used by other pages (forms list, submissions) |

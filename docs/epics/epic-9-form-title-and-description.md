# Epic #9: Add Form Title + Description (Admin + Embed)

## Goal

Allow form creators to define a **Title** and **Description** that render above the fields in the embedded form. These should inherit the existing theme/font/color rules used for other form text (no new theme tokens required).

---

## Scope

Touches:

* Database (Prisma schema + migration)
* Server actions + data access
* Admin Form Editor UI
* Public Embed API payload
* Embed script rendering + styles

This feature must be fully backward compatible. Existing forms without a title or description must render exactly as they do today.

---

## Requirements

### 1. Data Model (Prisma)

Update `prisma/schema.prisma`:

Add two nullable columns to the `Form` model:

* `title String?`
* `description String?`

Create and apply a migration following the workflow in `docs/AGENT_CONTEXT.md`.
Regenerate the Prisma client after schema change.

Constraints:

* `title`: enforce reasonable max length (e.g., 120 chars)
* `description`: enforce reasonable max length (e.g., 400 chars)
* Treat empty strings as `null`

---

### 2. Server Actions + Data Access

Update:

* `getOwnedForm`
* `getOwnedFormMinimal`

Ensure `title` and `description` are included in the returned form object.

Add a new server action in `src/actions/forms.ts`:

`updateFormHeader(formId, { title, description })`

Requirements:

* Enforce ownership using `getOwnedFormMinimal`
* Trim input values
* Convert empty string to `null`
* Enforce length constraints server-side
* Revalidate `/forms/[formId]/edit`

Do not merge this into unrelated update actions.

---

### 3. Admin UI (Form Editor)

File:

* `src/components/forms/form-editor.tsx`

Add a new "Header" section above `FieldsSection` containing:

* Title (single-line input)
* Description (textarea)

Behavior:

* Use same debounced autosave pattern as `formName`
* Show saving/saved status via existing toast/status mechanism
* No modal dialogs
* No additional appearance controls

Preview behavior:

* Ensure `PreviewPanel` receives updated `title` and `description`
* Render them above fields in preview

---

### 4. Public Embed API

File:

* `src/app/api/embed/[formId]/route.ts`

In GET handler:

* Include `title` and `description` in returned JSON
* Keep fields optional
* Do not expose admin-only data

No breaking changes to existing response structure.

---

### 5. Embed Script Rendering

Files:

* `embed/src/form.ts`
* `embed/src/styles.ts`

Update `FormDefinition` type:

* `title?: string`
* `description?: string`

In `render()` method:

* Before rendering fields, inject a header block
* If `title` exists → render `<h2 class="canopy-title">`
* If `description` exists → render `<p class="canopy-description">`
* Do not render empty wrappers

Styling requirements:

* Inherit existing theme font + text color
* No new theme color tokens
* Add appropriate spacing between header and first field
* Ensure no extra vertical space when both fields are null

Rebuild embed bundle using project embed build command.

---

## Acceptance Criteria

* Admin editor displays Title and Description inputs
* Changes autosave correctly
* Preview panel shows Title and Description above fields
* Embedded form renders Title and Description correctly
* Existing forms without values render unchanged
* Empty strings are stored as null
* No regressions in theme styling

---

## Non-Goals

* No new appearance controls
* No separate color settings for title or description
* No rich text editing (plain text only)
* No Markdown support

---

## Notes

* This is a content-layer feature, not an appearance-layer feature.
* Title and Description must visually align with existing typography.
* Keep implementation minimal and consistent with existing patterns in the repo.
* Ensure no layout shift occurs in forms without header content.

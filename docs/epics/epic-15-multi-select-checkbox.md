# Epic 15: Checkboxes (Multi-Select) + Yes / No Rename

**Status**: ✅ Complete
**Version**: v4.7.0
**Date**: 2026-02-27

---

## Summary

Added a new **Checkboxes** field type for multi-select (pick one or more from a list) and renamed the existing boolean checkbox from "Checkbox" to **Yes / No** in the builder UI. Also renamed the `SELECT` enum to `DROPDOWN` for clarity.

---

## What Was Built

### New `CHECKBOXES` field type

- **Schema**: Added `CHECKBOXES` to the `FieldType` enum via Prisma migration
- **Config panel** (`src/components/field-config/checkboxes-config.tsx`): Option management UI mirroring Dropdown — add, edit, reorder (drag-and-drop via `SortableList`), and delete options
- **Embed rendering** (`embed/src/form.ts`): Vertical list of `<input type="checkbox">` with clickable labels, consistent styling with existing single checkbox
- **Client-side validation** (`embed/src/validation.ts`): Requires at least one selection when field is required
- **Server-side validation** (`src/lib/public-submit.ts`): Validates all submitted values exist in the field's option list; rejects unknown values
- **Submission data**: Stored as `string[]` in `submission.data` (e.g., `{"services": ["web", "mobile"]}`)

### Yes / No rename (existing CHECKBOX)

- Display label changed from "Checkbox" to "Yes / No" in `src/lib/field-types.ts`
- Internal `CHECKBOX` enum value unchanged — zero impact on existing forms
- Submission viewer now displays "Yes" / "No" instead of raw `true` / `false`

### SELECT → DROPDOWN rename

- `FieldType.SELECT` renamed to `DROPDOWN` across schema, codebase, and embed
- Prisma migration renames the enum value in-place (existing data preserved)
- `select-config.tsx` renamed to `dropdown-config.tsx`

### Submission viewer improvements

- CHECKBOX (Yes/No) values display as "Yes" / "No" text
- CHECKBOXES values display as comma-separated labels instead of JSON array
- Applied to `src/app/(admin)/forms/[formId]/submissions/[submissionId]/page.tsx`

---

## Options Storage

Checkboxes options stored in `Field.options` JSON column (same structure as Dropdown):

```json
{
  "options": [
    { "value": "option1", "label": "Option 1" },
    { "value": "option2", "label": "Option 2" }
  ]
}
```

---

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Renamed `SELECT` → `DROPDOWN`, added `CHECKBOXES` to FieldType enum |
| `prisma/migrations/20250224000000_rename_select_to_dropdown/` | Enum rename migration |
| `prisma/migrations/20260227212114_add_checkboxes_field_type/` | New enum value migration |
| `src/lib/field-types.ts` | Added CHECKBOXES, renamed CHECKBOX label to "Yes / No", SELECT → DROPDOWN |
| `src/types/field-config.ts` | Added `CheckboxesOptions` type definition |
| `src/components/field-config/checkboxes-config.tsx` | New: config panel for CHECKBOXES options |
| `src/components/field-config/dropdown-config.tsx` | Renamed from `select-config.tsx` |
| `src/components/field-config/index.ts` | Updated exports for new/renamed components |
| `src/components/field-editor-modal.tsx` | Wired CHECKBOXES config panel |
| `src/components/form-fields-manager.tsx` | Updated field type references |
| `embed/src/form.ts` | Added CHECKBOXES rendering (checkbox list) |
| `embed/src/styles.ts` | Added `.canopy-checkbox-group` styles |
| `embed/src/validation.ts` | Added CHECKBOXES validation (required = at least one selected) |
| `public/embed.js` | Rebuilt embed bundle |
| `src/lib/public-submit.ts` | Added server-side CHECKBOXES validation (option whitelist) |
| `src/app/(admin)/forms/[formId]/submissions/[submissionId]/page.tsx` | Improved display for Yes/No and Checkboxes values |
| `docs/AGENT_CONTEXT.md` | Updated FieldType enum in appendix A |
| `docs/UX_PATTERNS.md` | Updated SELECT → DROPDOWN reference |

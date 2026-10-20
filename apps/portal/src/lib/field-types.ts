/**
 * Field Type Display Names - Single Source of Truth
 * 
 * This module defines the human-readable labels for all field types in the admin UI.
 * 
 * IMPORTANT: When adding a new FieldType to the Prisma schema:
 * 1. Add it to FIELD_TYPE_OPTIONS below with its display label
 * 2. The TypeScript assertion at the bottom will fail the build if you forget
 * 
 * This ensures the field type dropdown and all type indicators stay consistent.
 */

import { FieldType } from "@prisma/client";

/**
 * Field type options for dropdowns (ordered list)
 * This defines both the value (enum) and label (human-readable)
 */
export const FIELD_TYPE_OPTIONS = [
  { value: "NAME" as const, label: "Name" },
  { value: "EMAIL" as const, label: "Email" },
  { value: "PHONE" as const, label: "Phone" },
  { value: "ADDRESS" as const, label: "Address" },
  { value: "DATE" as const, label: "Date" },
  { value: "NUMBER" as const, label: "Number" },
  { value: "TEXT" as const, label: "Text" },
  { value: "TEXTAREA" as const, label: "Paragraph" },
  { value: "DROPDOWN" as const, label: "Dropdown" },
  { value: "CHECKBOXES" as const, label: "Checkboxes" },
  { value: "CHECKBOX" as const, label: "Yes / No" },
] as const;

/**
 * Derive a label map from the options for O(1) lookup
 */
const FIELD_TYPE_LABELS: Record<FieldType, string> = FIELD_TYPE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<FieldType, string>
);

/**
 * Get the human-readable label for a field type
 * @param type - The FieldType enum value or string
 * @returns The display label (e.g., "Paragraph" for "TEXTAREA")
 */
export function getFieldTypeLabel(type: FieldType | string): string {
  return FIELD_TYPE_LABELS[type as FieldType] || type;
}

// Compile-time assertion: All FieldType values must be in FIELD_TYPE_OPTIONS
// If a new FieldType is added to Prisma but not to FIELD_TYPE_OPTIONS,
// this will cause a TypeScript error, preventing the build from succeeding.
type OptionValues = typeof FIELD_TYPE_OPTIONS[number]["value"];
type _AssertAllFieldTypesCovered = Exclude<FieldType, OptionValues> extends never
  ? true
  : never;

// This constant will fail to compile if the assertion fails
const _assertCoverage: _AssertAllFieldTypesCovered = true;
// Prevent "unused variable" warnings
void _assertCoverage;

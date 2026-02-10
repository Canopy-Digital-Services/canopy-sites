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
  { value: "TEXT" as const, label: "Text" },
  { value: "EMAIL" as const, label: "Email" },
  { value: "TEXTAREA" as const, label: "Paragraph" },
  { value: "PHONE" as const, label: "Phone" },
  { value: "DATE" as const, label: "Date" },
  { value: "NAME" as const, label: "Name" },
  { value: "SELECT" as const, label: "Select" },
  { value: "CHECKBOX" as const, label: "Checkbox" },
  { value: "HIDDEN" as const, label: "Hidden" },
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
 * Example label placeholders for the field editor (Label input hint per type)
 */
export const FIELD_TYPE_LABEL_PLACEHOLDERS: Record<FieldType, string> = {
  TEXT: "e.g. Company Name",
  EMAIL: "e.g. Email Address",
  TEXTAREA: "e.g. Your message",
  PHONE: "e.g. Phone number",
  DATE: "e.g. Date of birth",
  NAME: "e.g. Full name",
  SELECT: "e.g. Country",
  CHECKBOX: "e.g. I agree to the terms",
  HIDDEN: "e.g. Referral code",
};

/**
 * Get the human-readable label for a field type
 * @param type - The FieldType enum value or string
 * @returns The display label (e.g., "Paragraph" for "TEXTAREA")
 */
export function getFieldTypeLabel(type: FieldType | string): string {
  return FIELD_TYPE_LABELS[type as FieldType] || type;
}

/**
 * Get the example label placeholder for the field editor (Label input)
 * @param type - The FieldType enum value or string
 * @returns Placeholder string (e.g., "e.g. Email Address" for EMAIL)
 */
export function getLabelPlaceholder(type: FieldType | string): string {
  return FIELD_TYPE_LABEL_PLACEHOLDERS[type as FieldType] ?? "e.g. Label";
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

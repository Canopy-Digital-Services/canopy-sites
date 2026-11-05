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
 * Field types in the order the type list shows them, each with its label and
 * the traits the editor and the save rules go by:
 * - choice: picked from a list of options (Choose one, Choose several)
 * - composite: made of parts, each collected and required on its own
 * A choice or composite type keeps its config in `options`, any other in
 * `validation`.
 *
 * Specific before general: people take the first type that looks good enough,
 * so one that would also catch a narrower need comes after it (Name before
 * Short answer, Date of birth before Date, Approval before Yes / No before
 * Choose one). Labels say what the field does and rule each other out.
 */
type FieldTypeTrait = "choice" | "composite";
type FieldTypeOption = { value: FieldType; label: string } & Partial<Record<FieldTypeTrait, true>>;

export const FIELD_TYPE_OPTIONS = [
  { value: "NAME" as const, label: "Name", composite: true },
  { value: "EMAIL" as const, label: "Email" },
  { value: "PHONE" as const, label: "Phone" },
  { value: "WEBSITE" as const, label: "Website" },
  { value: "ADDRESS" as const, label: "Address", composite: true },
  { value: "DATE_OF_BIRTH" as const, label: "Date of birth" },
  { value: "DATE" as const, label: "Date" },
  { value: "NUMBER" as const, label: "Number" },
  { value: "TEXT" as const, label: "Short answer" },
  { value: "TEXTAREA" as const, label: "Paragraph" },
  { value: "APPROVAL" as const, label: "Approval" },
  { value: "CHOOSE_ONE" as const, label: "Choose one", choice: true },
  { value: "CHOOSE_SEVERAL" as const, label: "Choose several", choice: true },
] as const satisfies readonly FieldTypeOption[];

/** One way to start a field in the Add field menu: a type, and the choices a
    choice type starts with when the entry gives them. */
export type FieldStart = { label: string; type: FieldType; choices?: string[] };

/** The Add field menu: every type, with Yes / No before Choose one. A yes or
    no question is a Choose one that starts with Yes and No, listed on its own
    so someone after one finds it before the general type. */
export const FIELD_STARTS: FieldStart[] = FIELD_TYPE_OPTIONS.flatMap((option) => [
  ...(option.value === "CHOOSE_ONE" ? [{ label: "Yes / No", type: option.value, choices: ["Yes", "No"] }] : []),
  { label: option.label, type: option.value },
]);

const TRAITS = new Map<string, FieldTypeOption>(FIELD_TYPE_OPTIONS.map((option) => [option.value, option]));

/** Whether a field type has `trait` (see FIELD_TYPE_OPTIONS). */
export const fieldTypeHas = (type: string, trait: FieldTypeTrait) => TRAITS.get(type)?.[trait] === true;

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

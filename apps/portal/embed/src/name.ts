/**
 * Name field rules, shared by the embed, the server's submit validation, and
 * the editor's Name settings.
 */

export type NamePart = "first" | "middle" | "middleInitial" | "last" | "single";

export type NameOptions = {
  parts?: NamePart[];
  partLabels?: Record<string, string>;
  /** The parts a visitor must fill. */
  requiredParts?: NamePart[];
};

/** A Name field's label until the user gives it one: the type's name
    (src/lib/field-types.ts). The form shows it over the parts. */
export const DEFAULT_NAME_LABEL = "Name";

/** What each part is called under the field's label until the user renames
    it. A single input takes the field's label instead. */
export const NAME_PART_LABELS: Record<NamePart, string> = {
  first: "First",
  middle: "Middle",
  middleInitial: "M.I.",
  last: "Last",
  single: DEFAULT_NAME_LABEL,
};

export const DEFAULT_NAME_PARTS: NamePart[] = ["first", "last"];

/** Parts in the order the form shows them, however they were saved. */
const PART_ORDER: NamePart[] = ["first", "middle", "middleInitial", "last", "single"];

export function orderNameParts(parts: string[]): string[] {
  return [...parts].sort(
    (a, b) => PART_ORDER.indexOf(a as NamePart) - PART_ORDER.indexOf(b as NamePart)
  );
}

/** The parts a visitor must fill. A field without the list (made outside
    the editor) requires, when required, every part but the middle. */
export function nameRequiredParts(options: NameOptions | null | undefined, fieldRequired: boolean): string[] {
  if (options?.requiredParts) return options.requiredParts;
  const parts = options?.parts ?? DEFAULT_NAME_PARTS;
  return fieldRequired ? parts.filter((p) => p !== "middle" && p !== "middleInitial") : [];
}

/** The longest answer a part takes: an initial, with room for its period,
    or a name. */
export function namePartMaxLength(part: string): number {
  return part === "middleInitial" ? 2 : 100;
}

export function namePartLabel(part: string, partLabels?: Record<string, string>): string {
  return partLabels?.[part] || NAME_PART_LABELS[part as NamePart] || part;
}

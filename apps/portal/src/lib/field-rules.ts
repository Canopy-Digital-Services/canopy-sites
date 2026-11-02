// The rules a field's settings keep, wherever they're saved from: the editor
// applies them as the user edits, and the server action applies them to
// whatever reaches it, so a field reads the same however it was stored.

import { fieldTypeHas, getFieldTypeLabel } from "@/lib/field-types";
import { DEFAULT_NAME_PARTS, orderNameParts } from "../../embed/src/name";
import { ADDRESS_PARTS, addressParts, type AddressOptions } from "../../embed/src/address";
import { choiceOptions, clashingChoices, type ChoiceOption, type ChoiceOptions } from "../../embed/src/choices";

export const isChoiceType = (type: string) => fieldTypeHas(type, "choice");

export const isComposite = (type: string) => fieldTypeHas(type, "composite");

/** Types whose config lives in `options`; every other type keeps it in `validation`. */
export const isOptionsType = (type: string) => isChoiceType(type) || isComposite(type);

/** A field's label when the user hasn't given one: its type's name. */
export const defaultLabel = (type: string) => getFieldTypeLabel(type);

/** A new choice field's options, so it saves at once. Their text is a
    stand-in: the editor selects it whole on click, so typing replaces it. */
export const STARTER_OPTIONS: ChoiceOption[] = [1, 2].map((n) => ({ value: `Option ${n}`, label: `Option ${n}` }));
export const isStarterOption = (text: string) => /^Option \d+$/.test(text);

/** What a new field of `type` starts with, so it is complete (and saved) the
    moment it is created and the user only overrides what they need. */
export function newFieldDefaults(type: string) {
  return {
    type,
    label: defaultLabel(type),
    // A form's names and addresses are nearly always required, all but
    // the middle name and the apartment.
    required: isComposite(type),
    options: isChoiceType(type)
      ? { options: STARTER_OPTIONS }
      : type === "NAME"
        ? { parts: DEFAULT_NAME_PARTS, requiredParts: DEFAULT_NAME_PARTS }
        : type === "ADDRESS"
          ? { parts: ADDRESS_PARTS, requiredParts: ADDRESS_PARTS.filter((p) => p !== "line2") }
          : undefined,
  };
}

/** A field's settings as the editor holds them and the server takes them. */
export type FieldSettings = {
  type: string;
  label: string;
  required?: boolean;
  helpText?: string | null;
  options?: unknown;
  validation?: unknown;
};

type Parts = { parts?: string[]; partLabels?: Record<string, string>; requiredParts?: string[] };

/** Why the field can't be saved as it is, or null if it can. */
export function fieldProblem(field: Pick<FieldSettings, "type" | "options">): string | null {
  if (isChoiceType(field.type)) {
    const config = choiceOptions(field.options);
    // Blank options don't count: the field saves without them.
    if (!config.options.some((o) => o.label.trim())) return "Add at least one option to save.";
    if (clashingChoices(config).size > 0) return "Options must be different to save.";
  }
  if (isComposite(field.type)) {
    const parts = (field.options as Parts | null)?.parts;
    const noun = field.type === "NAME" ? "name" : "address";
    if (parts && parts.length === 0) return `Choose at least one ${noun} part to save.`;
  }
  return null;
}

/** A Name's or Address's parts in form order, with labels and requirements
    kept only for the parts it collects. */
export function savedParts<T extends Parts>(options: T, order: (parts: string[]) => string[]): T {
  if (!options.parts) return options;
  const parts = order(options.parts);
  const keep = (part: string) => parts.includes(part);
  const labels = Object.fromEntries(Object.entries(options.partLabels ?? {}).filter(([part]) => keep(part)));
  const saved: Parts = { ...options, parts };
  if (options.requiredParts) saved.requiredParts = order(options.requiredParts.filter(keep));
  if (Object.keys(labels).length > 0) saved.partLabels = labels;
  else delete saved.partLabels;
  return saved as T;
}

/** A choice field's options as saved: blanks dropped, text trimmed, and the
    default kept only while its option is. */
export function savedChoices(options: unknown): ChoiceOptions {
  const config = choiceOptions(options);
  const saved: ChoiceOptions = {
    ...config,
    options: config.options
      .filter((o) => o.value.trim() && o.label.trim())
      .map((o) => ({ value: o.value.trim(), label: o.label.trim() })),
  };
  const preset = saved.defaultValue?.trim();
  if (preset && saved.options.some((o) => o.value === preset)) saved.defaultValue = preset;
  else delete saved.defaultValue;
  return saved;
}

/** Whether a Name or Address asks for any part: the field's `required`,
    which the list's asterisk reads. */
export const anyPartRequired = (options: unknown) => ((options as Parts | null)?.requiredParts?.length ?? 0) > 0;

/** The field as it's stored: text trimmed, a blank label back to the default,
    options tidied by type, and only the config its type keeps. */
export function savedField(field: FieldSettings) {
  const optionsType = isOptionsType(field.type);
  const raw = optionsType ? (field.options ?? null) : null;
  const options = !raw
    ? raw
    : isChoiceType(field.type)
      ? savedChoices(raw)
      : field.type === "NAME"
        ? savedParts(raw as Parts, orderNameParts)
        : field.type === "ADDRESS"
          ? savedParts(raw as Parts, (parts) => addressParts({ parts: parts as AddressOptions["parts"] }))
          : raw;
  const partsListed = isComposite(field.type) && (options as Parts | null)?.requiredParts !== undefined;
  return {
    type: field.type,
    label: field.label.trim() || defaultLabel(field.type),
    helpText: field.helpText?.trim() || null,
    required: partsListed ? anyPartRequired(options) : Boolean(field.required),
    options,
    validation: optionsType ? null : (field.validation ?? null),
  };
}

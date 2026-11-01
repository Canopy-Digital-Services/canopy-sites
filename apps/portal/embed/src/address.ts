/**
 * Address field rules, shared by the embed, the server's submit validation,
 * the CSV export, and the editor's Address settings. US addresses only: the
 * state list and the ZIP check are American.
 */

export type AddressPart = "line1" | "line2" | "city" | "region" | "postalCode";

export type AddressOptions = {
  parts?: AddressPart[];
  partLabels?: Record<string, string>;
  /** The parts a visitor must fill. */
  requiredParts?: AddressPart[];
};

/** What each part is called under the field's label until the user renames it. */
export const ADDRESS_PART_LABELS: Record<AddressPart, string> = {
  line1: "Street",
  line2: "Apt, suite",
  city: "City",
  region: "State",
  postalCode: "ZIP",
};

/** Every part, in the order the form shows them. */
export const ADDRESS_PARTS: AddressPart[] = ["line1", "line2", "city", "region", "postalCode"];

/** A field's parts in form order, all of them until the user picks. */
export function addressParts(options?: AddressOptions | null): AddressPart[] {
  const parts = options?.parts ?? ADDRESS_PARTS;
  return ADDRESS_PARTS.filter((part) => parts.includes(part));
}

export function addressPartLabel(part: string, partLabels?: Record<string, string>): string {
  return partLabels?.[part] || ADDRESS_PART_LABELS[part as AddressPart] || part;
}

/** The parts a visitor must fill. A field without the list (made outside
    the editor) requires, when required, every part but the apartment. */
export function addressRequiredParts(
  options: AddressOptions | null | undefined,
  fieldRequired: boolean
): string[] {
  if (options?.requiredParts) return options.requiredParts;
  return fieldRequired ? addressParts(options).filter((p) => p !== "line2") : [];
}

const ZIP = /^\d{5}(-\d{4})?$/;

/** Why `value` can't be submitted for an Address field, or null if it can:
    a required part left empty, or a ZIP that isn't one. */
export function addressError(
  value: Record<string, unknown> | undefined,
  options: AddressOptions | null | undefined,
  fieldRequired: boolean
): string | null {
  const parts = addressParts(options);
  const required = addressRequiredParts(options, fieldRequired);
  const text = (part: AddressPart) => String(value?.[part] ?? "").trim();
  for (const part of parts) {
    if (required.includes(part) && !text(part)) {
      return `${addressPartLabel(part, options?.partLabels)} is required.`;
    }
  }
  if (parts.includes("postalCode") && text("postalCode") && !ZIP.test(text("postalCode"))) {
    return `${addressPartLabel("postalCode", options?.partLabels)} must be a US ZIP code, like 12345 or 12345-6789.`;
  }
  return null;
}

/**
 * Phone field rules, shared by the embed, the server's submit validation,
 * the CSV export, and the editor's Phone settings. A Phone's answer is its
 * parts, { number, extension }, the number in one format (E.164).
 */

export type PhonePart = "number" | "extension";

/** A Phone's settings: whether it asks for an extension, and what the form
    calls it. A Phone without an extension stores none. */
export type PhoneOptions = {
  parts?: PhonePart[];
  partLabels?: Partial<Record<PhonePart, string>>;
};

/** What the extension is called beside its box until the user renames it. */
export const PHONE_EXTENSION_LABEL = "Ext.";

/** The parts a Phone asks for, in form order: its number, and its
    extension if the user added one. */
export function phoneParts(options: unknown): PhonePart[] {
  const parts = (options as PhoneOptions | null)?.parts;
  return Array.isArray(parts) && parts.includes("extension") ? ["number", "extension"] : ["number"];
}

export function phoneExtensionLabel(options: unknown): string {
  return (options as PhoneOptions | null)?.partLabels?.extension || PHONE_EXTENSION_LABEL;
}

/** A phone number in one format, E.164: a US or Canadian number with its
    area code, however it's written (with +1 or 1 in front or not), as
    +1XXXXXXXXXX, and another country's, written from its + and country
    code, as + and its digits. Null if it's neither. */
export function phoneNumber(value: string): string | null {
  const typed = value.trim().replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(typed)) return null;
  const digits = typed.replace("+", "");
  if (typed.startsWith("+") && !digits.startsWith("1")) {
    return digits.length >= 7 && digits.length <= 15 ? `+${digits}` : null;
  }
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return national.length === 10 ? `+1${national}` : null;
}

/** The longest number a visitor can type, punctuation and all. */
export const PHONE_NUMBER_MAX_LENGTH = 30;
const EXTENSION = /^\d{1,10}$/;
export const PHONE_EXTENSION_MAX_LENGTH = 10;

/** Why a Phone's parts can't be submitted, or null if they can: a required
    number left empty, an extension with no number, a number that isn't
    one, or an extension that isn't digits. */
export function phoneError(
  answer: Partial<Record<PhonePart, string>> | null | undefined,
  options: unknown,
  required: boolean,
  label: string
): string | null {
  const number = answer?.number?.trim() ?? "";
  const extension = answer?.extension?.trim() ?? "";
  if (!number) {
    if (extension) return `${label} must include a phone number.`;
    return required ? `${label} is required.` : null;
  }
  if (number.length > PHONE_NUMBER_MAX_LENGTH || !phoneNumber(number)) {
    return `${label} must be a phone number, like (201) 555-0123 or +44 20 7946 0958.`;
  }
  if (extension && !EXTENSION.test(extension)) {
    return `${phoneExtensionLabel(options)} must be a number, like 45.`;
  }
  return null;
}

/** A Phone answer as stored: the number in E.164 and the extension trimmed,
    each only when given. */
export function storedPhone(answer: Partial<Record<PhonePart, string>>): Partial<Record<PhonePart, string>> {
  const number = answer.number?.trim() ?? "";
  const extension = answer.extension?.trim() ?? "";
  return {
    ...(number && { number: phoneNumber(number) ?? number }),
    ...(extension && { extension }),
  };
}

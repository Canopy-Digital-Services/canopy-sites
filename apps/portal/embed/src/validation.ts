/**
 * The rules an answer must pass, field by field. The form checks them before
 * it submits, and the server (src/lib/public-submit.ts) runs the same checks
 * on every submission, with only its own guardrails (payload size, keys that
 * aren't fields) on top.
 */

import { DEFAULT_NAME_PARTS, nameRequiredParts, namePartLabel, namePartMaxLength, type NameOptions } from "./name";
import { addressError, addressPartLabel, addressParts, type AddressOptions } from "./address";
import { choiceError, type ChoiceOption, type ChoiceOptions } from "./choices";

type FieldValidation = {
  minLength?: number;
  maxLength?: number;
  format?: "lenient" | "strict" | "alphanumeric" | "numbers" | "letters" | "url" | "postal-us" | "postal-ca";
  /** "today": a Future Date. A fixed date, which older fields may hold, is no rule. */
  minDate?: string;
  /** "today": a Past Date. */
  maxDate?: string;
  domainRules?: {
    allow?: string[];
    block?: string[];
  };
  min?: number;
  max?: number;
  integer?: boolean;
};

type FieldDefinition = {
  name: string;
  type: string;
  label: string;
  required: boolean;
  helpText?: string;
  options?: ChoiceOption[] | ChoiceOptions | NameOptions | AddressOptions;
  validation?: FieldValidation;
};

/** What validation reads of a field: the form's definition and the server's
    row both fit. */
type ValidatedField = {
  name: string;
  type: string;
  label: string;
  required: boolean;
  options?: unknown;
  validation?: unknown;
};

/** The longest answer a type takes when the field sets no limit. Only these
    types take a limit of their own. */
const DEFAULT_MAX_LENGTHS: Record<string, number> = {
  TEXT: 200,
  EMAIL: 254, // RFC 5321 standard
  TEXTAREA: 2000,
};

/** The most a field of the type can be set to take, or, for a type without
    a default, the longest answer it takes. */
const ABSOLUTE_MAX_LENGTHS: Record<string, number> = {
  TEXT: 500,
  EMAIL: 320, // Extended email format
  TEXTAREA: 10000,
  PHONE: 30,
  NUMBER: 50,
  DATE: 30,
};

function rulesOf(field: { validation?: unknown }): FieldValidation {
  return typeof field.validation === "object" && field.validation !== null
    ? (field.validation as FieldValidation)
    : {};
}

/** The longest answer the field takes: its own limit when that's a positive
    whole number, else its type's default, and never past its type's absolute.
    A type without a default has no length setting, so it takes its absolute
    whatever the field has stored. */
function getEffectiveMaxLength(field: { type: string; validation?: unknown }): number | undefined {
  const fallback = DEFAULT_MAX_LENGTHS[field.type];
  const absolute = ABSOLUTE_MAX_LENGTHS[field.type];
  if (fallback === undefined) return absolute;
  const configured = rulesOf(field).maxLength;
  const max = Number.isInteger(configured) && configured! > 0 ? configured! : fallback;
  return absolute !== undefined ? Math.min(max, absolute) : max;
}

/** RFC 5322 compliant address shape. */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate an email address.
 * Rejects CR/LF outright: these values reach SMTP headers (Reply-To), where a
 * newline would let a submitter inject additional headers.
 */
export function isValidEmail(value: string): boolean {
  if (value.length > 320) return false;
  if (/[\r\n]/.test(value)) return false;
  return EMAIL_REGEX.test(value);
}

/** The ten digits of a US phone number, however it's written (a leading +1
    or 1 is dropped), or null if it isn't one. */
export function usPhoneDigits(value: string): string | null {
  let digits = value.replace(/[^\d+]/g, "");
  if (digits.startsWith("+1")) {
    digits = digits.substring(2);
  } else if (digits.startsWith("+")) {
    return null;
  } else if (digits.startsWith("1") && digits.length === 11) {
    digits = digits.substring(1);
  }
  return /^\d{10}$/.test(digits) ? digits : null;
}

// Dates are compared as YYYY-MM-DD strings, the way the date input writes
// them. Parsing one with `new Date` reads it as UTC midnight, which is the
// day before anywhere west of UTC.

/** What "today" stands for in a date bound: the earliest and latest date it
    can be, as YYYY-MM-DD. */
export type Today = { earliest: string; latest: string };

/** `date`'s day on this machine's calendar, as YYYY-MM-DD. */
export function localDate(date = new Date()): string {
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today in the form: the visitor's own date. */
export function visitorToday(): Today {
  const today = localDate();
  return { earliest: today, latest: today };
}

/** Today on the server, which can't know where the visitor is: any date it
    is somewhere on Earth, from UTC-12 to UTC+14. */
export function anywhereToday(now = new Date()): Today {
  const dateAt = (hours: number) => new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { earliest: dateAt(-12), latest: dateAt(14) };
}

/** The day an answer names, as YYYY-MM-DD, or null if it names none.
    A date written as the date input writes it is read as written; any other
    way of writing one is read on this machine's calendar. */
function calendarDate(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    // Rejects a day the month doesn't have, which Date would roll over.
    const date = new Date(`${value}T00:00:00Z`);
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : localDate(date);
}

function tooLongError(text: string, maxLength: number | undefined, label: string): string | null {
  return maxLength !== undefined && text.length > maxLength ? `${label} must be at most ${maxLength} characters.` : null;
}

function lengthError(field: ValidatedField, text: string, label: string): string | null {
  const { minLength } = rulesOf(field);
  if (minLength && text.length < minLength) {
    return `${label} must be at least ${minLength} characters.`;
  }
  return tooLongError(text, getEffectiveMaxLength(field), label);
}

/** Text and Textarea formats. "alphanumeric", the default, takes any text. */
function formatError(format: string | undefined, text: string, label: string): string | null {
  switch (format) {
    case "numbers":
      return /^\d+$/.test(text) ? null : `${label} must contain only numbers.`;
    case "letters":
      return /^[A-Za-z]+$/.test(text) ? null : `${label} must contain only letters.`;
    case "url": {
      // Visitors leave the protocol off, so check with one added.
      try {
        const url = new URL(text.startsWith("http") ? text : `https://${text}`);
        if (url.hostname.includes(".")) return null;
      } catch {
        // Not a URL.
      }
      return `${label} must be a valid URL.`;
    }
    case "postal-us":
      return /^\d{5}(-\d{4})?$/.test(text)
        ? null
        : `${label} must be a valid US postal code (e.g., 12345 or 12345-6789).`;
    case "postal-ca":
      return /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(text)
        ? null
        : `${label} must be a valid Canadian postal code (e.g., K1A 0B1).`;
    default:
      return null;
  }
}

/** Why a Name or Address answer isn't an object of only the field's own
    parts, each a piece of text, or null if it is. Each type checks its
    parts' lengths with its other part rules. */
function partsError(
  value: unknown,
  parts: string[],
  partLabel: (part: string) => string,
  label: string
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) return `${label} must be an object of its parts.`;
  for (const [part, text] of Object.entries(value)) {
    if (!parts.includes(part)) return `${label} has no part "${part}".`;
    if (typeof text !== "string") return `${partLabel(part)} must be text.`;
  }
  return null;
}

/** Why `value` can't be submitted for the field, or null if it can. `today`
    is what a date bound of "today" means where this runs. */
export function validateField(field: ValidatedField, value: unknown, today: Today = visitorToday()): string | null {
  const label = field.label || field.name;
  const rules = rulesOf(field);

  // Types whose answer isn't a single piece of text.
  switch (field.type) {
    case "CHECKBOX":
      // An HTML checkbox sends "on" when checked, and nothing when not.
      if (value !== undefined && value !== null && typeof value !== "boolean" && value !== "on") {
        return `${label} must be true or false.`;
      }
      return field.required && !value ? `${label} is required.` : null;
    case "CHECKBOXES":
      if (!Array.isArray(value) || value.length === 0) {
        if (field.required) return `${label} is required.`;
        // Nothing picked. Anything else that isn't a list, choiceError refuses.
        if (value === undefined || value === null || Array.isArray(value)) return null;
      }
      return choiceError("CHECKBOXES", value, field.options, label);
    case "NAME": {
      // Required per part, and each part's length; no pattern checks.
      const options = (typeof field.options === "object" && field.options !== null ? field.options : {}) as NameOptions;
      const parts = options.parts || DEFAULT_NAME_PARTS;
      const labelOf = (part: string) => (part === "single" ? label : namePartLabel(part, options.partLabels));
      const shape = partsError(value, parts, labelOf, label);
      if (shape) return shape;
      const answer = value as Record<string, unknown> | null | undefined;
      const required = nameRequiredParts(options, field.required);
      for (const part of parts) {
        const partValue = answer?.[part];
        const partLabel = labelOf(part);
        if (required.includes(part) && (!partValue || String(partValue).trim() === "")) {
          return `${partLabel} is required.`;
        }
        const tooLong = tooLongError(String(partValue ?? ""), namePartMaxLength(part), partLabel);
        if (tooLong) return tooLong;
      }
      return null;
    }
    case "ADDRESS": {
      const options = field.options as AddressOptions | null | undefined;
      const labelOf = (part: string) => addressPartLabel(part, options?.partLabels);
      return (
        partsError(value, addressParts(options), labelOf, label) ??
        addressError(value as Record<string, unknown> | undefined, options, field.required)
      );
    }
  }

  // The rest take one piece of text, and Number a number too.
  if (value === undefined || value === null) {
    return field.required ? `${label} is required.` : null;
  }
  if (typeof value !== "string" && !(field.type === "NUMBER" && typeof value === "number")) {
    return field.type === "NUMBER" ? `${label} must be a number.` : `${label} must be text.`;
  }
  const text = String(value);
  if (text.trim() === "") {
    return field.required ? `${label} is required.` : null;
  }

  // A type without a length setting is held to its cap before its own rules.
  if (DEFAULT_MAX_LENGTHS[field.type] === undefined) {
    const tooLong = tooLongError(text, getEffectiveMaxLength(field), label);
    if (tooLong) return tooLong;
  }

  switch (field.type) {
    case "DROPDOWN":
      return choiceError("DROPDOWN", value, field.options, label);

    case "PHONE": {
      const format = rules.format || "lenient";
      if (format === "lenient" && !/^[\d\s\-\(\)\+\.]{7,}$/.test(text)) {
        return `${label} must be a valid phone number.`;
      }
      if (format === "strict" && !usPhoneDigits(text)) {
        return `${label} must be a valid US phone number (10 digits).`;
      }
      return null;
    }

    case "DATE": {
      const date = calendarDate(text);
      // Worded as GOV.UK words date errors.
      if (!date) return `${label} must be a real date.`;
      if (rules.minDate === "today" && date < today.earliest) return `${label} must be today or in the future.`;
      if (rules.maxDate === "today" && date > today.latest) return `${label} must be today or in the past.`;
      return null;
    }

    case "NUMBER": {
      const num = Number(value);
      if (isNaN(num)) return `${label} must be a number.`;
      if (rules.integer && !Number.isInteger(num)) return `${label} must be a whole number.`;
      if (rules.min !== undefined && num < rules.min) return `${label} must be at least ${rules.min}.`;
      if (rules.max !== undefined && num > rules.max) return `${label} must be at most ${rules.max}.`;
      return null;
    }

    case "EMAIL": {
      const email = text.trim();
      if (!isValidEmail(email)) return `Enter a valid email address`;
      const domain = email.split("@")[1].toLowerCase();
      const { allow, block } = rules.domainRules ?? {};
      if (Array.isArray(allow) && allow.length > 0 && !allow.some((d) => String(d).toLowerCase() === domain)) {
        return `${label} must be from an allowed domain.`;
      }
      if (Array.isArray(block) && block.some((d) => String(d).toLowerCase() === domain)) {
        return `${label} domain is not allowed.`;
      }
      return lengthError(field, email, label);
    }

    default:
      return lengthError(field, text, label) ?? formatError(rules.format, text, label);
  }
}

/** Every field's error, by field name. */
export function validateSubmission(
  fields: ValidatedField[],
  values: Record<string, unknown>,
  today: Today = visitorToday()
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const error = validateField(field, answerOf(values, field.name), today);
    if (error) errors[field.name] = error;
  }
  return errors;
}

/** The answer sent for `name`. Only the answers' own keys count: a field
    named "constructor" left out isn't Object's constructor. */
export function answerOf(values: Record<string, unknown>, name: string): unknown {
  return Object.prototype.hasOwnProperty.call(values, name) ? values[name] : undefined;
}

export type { FieldDefinition, FieldValidation, ValidatedField, NameOptions, AddressOptions };
export { getEffectiveMaxLength, DEFAULT_MAX_LENGTHS, ABSOLUTE_MAX_LENGTHS };

/**
 * The rules an answer must pass, field by field. The form checks them before
 * it submits, and the server (src/lib/public-submit.ts) runs the same checks
 * on every submission, with only its own guardrails (payload size) on top.
 */

import { DEFAULT_NAME_PARTS, nameRequiredParts, namePartLabel, type NameOptions } from "./name";
import { addressError, type AddressOptions } from "./address";
import { choiceError, type ChoiceOption, type ChoiceOptions } from "./choices";

type FieldValidation = {
  minLength?: number;
  maxLength?: number;
  format?: "lenient" | "strict" | "alphanumeric" | "numbers" | "letters" | "url" | "postal-us" | "postal-ca";
  minDate?: string;
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
  placeholder?: string;
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

/** The longest answer a type takes when the field sets no limit. */
const DEFAULT_MAX_LENGTHS: Record<string, number> = {
  TEXT: 200,
  EMAIL: 254, // RFC 5321 standard
  TEXTAREA: 2000,
};

/** The most a field of the type can be set to take. */
const ABSOLUTE_MAX_LENGTHS: Record<string, number> = {
  TEXT: 500,
  EMAIL: 320, // Extended email format
  TEXTAREA: 10000,
};

function rulesOf(field: { validation?: unknown }): FieldValidation {
  return typeof field.validation === "object" && field.validation !== null
    ? (field.validation as FieldValidation)
    : {};
}

/** The longest answer the field takes: its own limit when that's a positive
    whole number, else its type's default, and never past its type's absolute. */
function getEffectiveMaxLength(field: { type: string; validation?: unknown }): number | undefined {
  const configured = rulesOf(field).maxLength;
  const max = Number.isInteger(configured) && configured! > 0 ? configured : DEFAULT_MAX_LENGTHS[field.type];
  const absolute = ABSOLUTE_MAX_LENGTHS[field.type];
  return max !== undefined && absolute !== undefined ? Math.min(max, absolute) : max;
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

/** The day an answer or bound names, as YYYY-MM-DD, or null if it names none.
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

/** A YYYY-MM-DD date in the reader's own format. A date-time without an
    offset is local, so the day stays the one named. */
function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString();
}

function dateBound(bound: string | undefined, today: string): string | null {
  if (!bound) return null;
  return bound === "today" ? today : calendarDate(bound);
}

function lengthError(field: ValidatedField, text: string, label: string): string | null {
  const { minLength } = rulesOf(field);
  if (minLength && text.length < minLength) {
    return `${label} must be at least ${minLength} characters.`;
  }
  const maxLength = getEffectiveMaxLength(field);
  if (maxLength !== undefined && text.length > maxLength) {
    return `${label} must be at most ${maxLength} characters.`;
  }
  return null;
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

/** Why `value` can't be submitted for the field, or null if it can. `today`
    is what a date bound of "today" means where this runs. */
export function validateField(field: ValidatedField, value: unknown, today: Today = visitorToday()): string | null {
  const label = field.label || field.name;
  const rules = rulesOf(field);

  // Types whose answer isn't a single piece of text.
  switch (field.type) {
    case "CHECKBOX":
      return field.required && !value ? `${label} is required.` : null;
    case "CHECKBOXES":
      if (!Array.isArray(value) || value.length === 0) {
        if (field.required) return `${label} is required.`;
        // Nothing picked. Anything else that isn't a list, choiceError refuses.
        if (value === undefined || value === null || Array.isArray(value)) return null;
      }
      return choiceError("CHECKBOXES", value, field.options, label);
    case "NAME": {
      // Required per part, and no length or pattern checks on the parts.
      const answer = value as Record<string, unknown> | null | undefined;
      const options = (typeof field.options === "object" && field.options !== null ? field.options : {}) as NameOptions;
      const required = nameRequiredParts(options, field.required);
      for (const part of options.parts || DEFAULT_NAME_PARTS) {
        const partValue = answer?.[part];
        if (required.includes(part) && (!partValue || String(partValue).trim() === "")) {
          return `${part === "single" ? label : namePartLabel(part, options.partLabels)} is required.`;
        }
      }
      return null;
    }
    case "ADDRESS":
      return addressError(
        value as Record<string, unknown> | undefined,
        field.options as AddressOptions | null | undefined,
        field.required
      );
  }

  if (value === undefined || value === null || String(value).trim() === "") {
    return field.required ? `${label} is required.` : null;
  }
  const text = String(value);

  switch (field.type) {
    case "DROPDOWN":
      return choiceError("DROPDOWN", value, field.options, label);

    case "PHONE": {
      // Phone numbers skip the length checks.
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
      if (!date) return `${label} must be a valid date.`;
      const minDate = dateBound(rules.minDate, today.earliest);
      if (minDate && date < minDate) return `${label} must be on or after ${formatDate(minDate)}.`;
      const maxDate = dateBound(rules.maxDate, today.latest);
      if (maxDate && date > maxDate) return `${label} must be on or before ${formatDate(maxDate)}.`;
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
    const error = validateField(field, values[field.name], today);
    if (error) errors[field.name] = error;
  }
  return errors;
}

export type { FieldDefinition, FieldValidation, ValidatedField, NameOptions, AddressOptions };
export { getEffectiveMaxLength, DEFAULT_MAX_LENGTHS, ABSOLUTE_MAX_LENGTHS };

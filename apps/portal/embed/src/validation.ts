/**
 * The rules an answer must pass, field by field. The form checks them before
 * it submits, and the server (src/lib/public-submit.ts) runs the same checks
 * on every submission, with only its own guardrails (payload size, keys that
 * aren't fields) on top.
 */

import { DEFAULT_NAME_PARTS, nameRequiredParts, namePartLabel, namePartMaxLength, type NameOptions } from "./name";
import { addressError, addressPartLabel, addressParts, type AddressOptions } from "./address";
import { choiceError, type ChoiceOption, type ChoiceOptions } from "./choices";
import { phoneError, phoneExtensionLabel, phoneParts, type PhoneOptions } from "./phone";

type FieldValidation = {
  /** A Paragraph's character limit. */
  maxLength?: number;
  /** "today": a Future Date. A fixed date, which older fields may hold, is no rule. */
  minDate?: string;
  /** "today": a Past Date. */
  maxDate?: string;
  min?: number;
  max?: number;
  integer?: boolean;
} & PhoneOptions;

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

/** The longest answer a type takes: a box's maxlength, so a visitor can't
    type past what the server would refuse. A Paragraph's own limit is
    counted instead (`characterLimit`). */
const MAX_LENGTHS: Record<string, number> = {
  TEXT: 200,
  EMAIL: 254, // RFC 5321
  TEXTAREA: 10000,
  NUMBER: 50,
  DATE: 30,
  DATE_OF_BIRTH: 10, // YYYY-MM-DD
  WEBSITE: 2000,
};

function rulesOf(field: { validation?: unknown }): FieldValidation {
  return typeof field.validation === "object" && field.validation !== null
    ? (field.validation as FieldValidation)
    : {};
}

/** A Paragraph's character limit: its own, when that's a whole number from 1
    to the most a Paragraph takes. No other type has one. */
export function characterLimit(field: { type: string; validation?: unknown }): number | undefined {
  if (field.type !== "TEXTAREA") return undefined;
  const limit = rulesOf(field).maxLength;
  return Number.isInteger(limit) && limit! >= 1 && limit! <= MAX_LENGTHS.TEXTAREA ? limit : undefined;
}

/** "1 character", "2,000 characters". */
export const characters = (count: number) => `${count.toLocaleString("en-US")} character${count === 1 ? "" : "s"}`;

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

/** A Date of birth's answer as the date it names, YYYY-MM-DD, or null if it
    names none. The form joins its Month, Day and Year boxes as YYYY-M-D. */
export function dateOfBirth(text: string): string | null {
  const parts = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  return parts ? calendarDate(`${parts[1]}-${parts[2].padStart(2, "0")}-${parts[3].padStart(2, "0")}`) : null;
}

/** A Number answer as the number it names: digits, an optional minus and
    decimal point, with any commas or spaces a large number is written with
    left out. Null if it names none. */
export function numberAnswer(value: string | number): string | null {
  const typed = String(value).replace(/[,\s]/g, "");
  return /^-?(\d+\.?\d*|\.\d+)$/.test(typed) ? typed : null;
}

/** A Website answer as a full address: https:// added when it has no http://
    or https:// of its own. Null if it isn't a web address: no host with a
    dot, another scheme, a space, or a name and password (an email typed in
    the wrong box reads as one). */
export function websiteAddress(value: string): string | null {
  const typed = value.trim();
  if (/\s/.test(typed)) return null;
  const full = /^https?:\/\//i.test(typed) ? typed : `https://${typed}`;
  try {
    const url = new URL(full);
    const named = url.hostname.split(".");
    return named.length > 1 && named.every(Boolean) && !url.username && !url.password ? full : null;
  } catch {
    return null;
  }
}

function tooLongError(text: string, maxLength: number | undefined, label: string): string | null {
  return maxLength !== undefined && text.length > maxLength ? `${label} must be ${characters(maxLength)} or fewer.` : null;
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
    case "PHONE": {
      const labelOf = (part: string) => (part === "extension" ? phoneExtensionLabel(field.validation) : label);
      return (
        partsError(value, phoneParts(field.validation), labelOf, label) ??
        phoneError(value as Record<string, string> | undefined, field.validation, field.required, label)
      );
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

  // Held to its length before its type's own rules.
  const tooLong = tooLongError(text, characterLimit(field) ?? MAX_LENGTHS[field.type], label);
  if (tooLong) return tooLong;

  switch (field.type) {
    case "DROPDOWN":
      return choiceError("DROPDOWN", value, field.options, label);


    case "DATE": {
      const date = calendarDate(text);
      // Worded as GOV.UK words date errors.
      if (!date) return `${label} must be a real date.`;
      if (rules.minDate === "today" && date < today.earliest) return `${label} must be today or in the future.`;
      if (rules.maxDate === "today" && date > today.latest) return `${label} must be today or in the past.`;
      return null;
    }

    case "DATE_OF_BIRTH": {
      // GOV.UK's date errors, a missing box first. An empty box joins as an
      // empty piece ("1980--27").
      const [year = "", month = "", day = ""] = text.split("-");
      if (!month.trim()) return `${label} must include a month.`;
      if (!day.trim()) return `${label} must include a day.`;
      if (!year.trim()) return `${label} must include a year.`;
      if (!/^\d{4}$/.test(year)) return "Year must include 4 numbers.";
      const date = dateOfBirth(text);
      if (!date) return `${label} must be a real date.`;
      return date >= today.latest ? `${label} must be in the past.` : null;
    }

    case "NUMBER": {
      // GOV.UK's number errors, with an example the field takes.
      const { min, max, integer } = rules;
      const example = Math.min(Math.max(10, min ?? -Infinity), max ?? Infinity);
      const typed = numberAnswer(value as string | number);
      if (typed === null) return `${label} must be a ${integer ? "whole " : ""}number, like ${example}.`;
      const num = Number(typed);
      if (integer && !Number.isInteger(num)) return `${label} must be a whole number, like ${example}.`;
      const outside = (min !== undefined && num < min) || (max !== undefined && num > max);
      if (!outside) return null;
      if (min !== undefined && max !== undefined) return `${label} must be between ${min} and ${max}.`;
      // Fewer of a count, less of an amount.
      return min !== undefined ? `${label} must be ${min} or more.` : `${label} must be ${max} or ${integer ? "fewer" : "less"}.`;
    }

    case "WEBSITE":
      return websiteAddress(text) ? null : `${label} must be a web address, like example.com.`;

    case "EMAIL":
      return isValidEmail(text.trim()) ? null : `${label} must be an email address, like name@example.com.`;

    default:
      return null;
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

export type { FieldDefinition, FieldValidation, ValidatedField, NameOptions, AddressOptions, PhoneOptions };
export { MAX_LENGTHS };

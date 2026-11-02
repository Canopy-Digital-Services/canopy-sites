// Choice fields (Dropdown, Checkboxes): the rules the form, the server and
// the editor share.

export type ChoiceOption = { value: string; label: string };

export type ChoiceOptions = {
  options: ChoiceOption[];
  /** Dropdown only: the option chosen when the form loads. */
  defaultValue?: string;
  /** Offers an "Other" choice whose answer the visitor types. */
  allowOther?: boolean;
};

/** A dropdown's first line, which no answer can be, so that nothing is
    picked until the visitor picks it. */
export const CHOICE_PROMPT = "Choose one...";

export const OTHER_LABEL = "Other";

/** The form's value for "Other" until the visitor's answer replaces it. */
export const OTHER_VALUE = "__other__";

/** The longest "Other" answer accepted. */
export const OTHER_MAX_LENGTH = 200;

/** The options, from today's shape or the bare list older fields stored. */
export function choiceList(options: unknown): ChoiceOption[] {
  const list = Array.isArray(options) ? options : (options as { options?: unknown } | null)?.options;
  if (!Array.isArray(list)) return [];
  return list.filter(
    (o): o is ChoiceOption => typeof o === "object" && o !== null && typeof o.value === "string"
  );
}

/** The field's options in today's shape, whatever it stored. */
export function choiceOptions(options: unknown): ChoiceOptions {
  const rest = typeof options === "object" && options !== null && !Array.isArray(options) ? options : {};
  return { ...rest, options: choiceList(options) };
}

/** How options compare: to a visitor, "Red" and "red " are the same option. */
export const choiceKey = (text: string) => text.trim().toLowerCase();

/** The options that clash with another, "Other" included, by key. */
export function clashingChoices(config: ChoiceOptions): Set<string> {
  const seen = new Set<string>(config.allowOther ? [choiceKey(OTHER_LABEL)] : []);
  const clashes = new Set<string>();
  for (const option of config.options) {
    const key = choiceKey(option.label);
    if (!key) continue;
    if (seen.has(key)) clashes.add(key);
    else seen.add(key);
  }
  return clashes;
}

export function allowsOther(options: unknown): boolean {
  return !Array.isArray(options) && (options as ChoiceOptions | null)?.allowOther === true;
}

/**
 * Why the answer isn't one the field offers, or null. An answer off the list
 * is the visitor's "Other", one at most and only where the field offers it.
 * An empty answer is the required check's business, not this one's.
 */
export function choiceError(
  type: "DROPDOWN" | "CHECKBOXES",
  value: unknown,
  options: unknown,
  label: string
): string | null {
  const answers = type === "CHECKBOXES" ? value : typeof value === "string" ? [value] : null;
  if (!Array.isArray(answers)) return `${label} must be one of its options.`;
  const values = choiceList(options).map((o) => o.value);
  const typed = answers.map(String).filter((a) => !values.includes(a));
  if (typed.length === 0) return null;
  if (!allowsOther(options) || typed.length > 1) return `${label} must be one of its options.`;
  if (typed[0].length > OTHER_MAX_LENGTH) {
    return `${label} must be ${OTHER_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

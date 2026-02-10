/**
 * Type definitions for field configuration
 * These types define the shape of the `validation` and `options` JSON fields
 * stored in the Field model for each FieldType.
 */

// Base validation (shared by TEXT, EMAIL, TEXTAREA)
export type BaseValidation = {
  minLength?: number;
  maxLength?: number;
  format?: "alphanumeric" | "numbers" | "letters" | "url" | "postal-us" | "postal-ca";
};

// Type-specific validation extensions
export type EmailValidation = {
  domainRules?: {
    allow?: string[];
    block?: string[];
  };
  normalize?: boolean; // Auto-lowercase
};

export type PhoneValidation = {
  format?: "lenient" | "strict";
};

export type DateValidation = {
  minDate?: string; // ISO string or "today"
  maxDate?: string; // ISO string or "today"
  noFuture?: boolean;
  noPast?: boolean;
};

// Type-specific options
export type SelectOption = {
  value: string;
  label: string;
};

export type SelectOptions = {
  options: SelectOption[];
  defaultValue?: string;
  allowOther?: boolean;
};

export type NameOptions = {
  parts: ("first" | "last" | "middle" | "middleInitial" | "single")[];
  partLabels?: Record<string, string>;
  partsRequired?: Record<string, boolean>;
};

export type HiddenOptions = {
  valueSource: "static" | "urlParam" | "pageUrl" | "referrer";
  staticValue?: string;
  paramName?: string;
};

// Field configuration discriminated union
export type FieldConfig =
  | {
      type: "TEXT";
      validation?: BaseValidation;
      options?: never;
    }
  | {
      type: "EMAIL";
      validation?: EmailValidation;
      options?: never;
    }
  | {
      type: "TEXTAREA";
      validation?: BaseValidation;
      options?: never;
    }
  | {
      type: "PHONE";
      validation?: PhoneValidation;
      options?: never;
    }
  | {
      type: "DATE";
      validation?: DateValidation;
      options?: never;
    }
  | {
      type: "NAME";
      validation?: never;
      options: NameOptions;
    }
  | {
      type: "SELECT";
      validation?: never;
      options: SelectOptions;
    }
  | {
      type: "CHECKBOX";
      validation?: never;
      options?: never;
    }
  | {
      type: "HIDDEN";
      validation?: never;
      options: HiddenOptions;
    };

// Helper type for extracting validation type from field type
export type ValidationForType<T extends FieldConfig["type"]> = Extract<
  FieldConfig,
  { type: T }
>["validation"];

// Helper type for extracting options type from field type
export type OptionsForType<T extends FieldConfig["type"]> = Extract<
  FieldConfig,
  { type: T }
>["options"];

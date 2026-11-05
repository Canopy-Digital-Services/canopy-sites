/**
 * Type definitions for field configuration
 * These types define the shape of the `validation` and `options` JSON fields
 * stored in the Field model for each FieldType.
 */

import type { NameOptions } from "../../embed/src/name";
import type { AddressOptions } from "../../embed/src/address";
import type { PhoneOptions } from "../../embed/src/phone";
import type { ChoiceOption, ChoiceOptions } from "../../embed/src/choices";

// Choose one and Choose several share one shape.
export type { NameOptions, AddressOptions, PhoneOptions, ChoiceOption, ChoiceOptions };

/** A Paragraph's character limit; without one it takes the most a Paragraph
    takes. */
export type ParagraphValidation = { maxLength: number };

// Type-specific validation extensions

/** A Future Date takes today or later (`minDate`), a Past Date today or
    earlier (`maxDate`); an Any Date field stores no rule. */
export type DateValidation = { minDate: "today" } | { maxDate: "today" };

export type NumberValidation = {
  min?: number;
  max?: number;
  integer?: boolean;
};

// Field configuration discriminated union
export type FieldConfig =
  | {
      type: "TEXT";
      validation?: never;
      options?: never;
    }
  | {
      type: "EMAIL";
      validation?: never;
      options?: never;
    }
  | {
      type: "TEXTAREA";
      validation?: ParagraphValidation;
      options?: never;
    }
  | {
      type: "PHONE";
      validation?: PhoneOptions;
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
      type: "CHOOSE_ONE";
      validation?: never;
      options: ChoiceOptions;
    }
  | {
      type: "APPROVAL";
      validation?: never;
      options?: never;
    }
  | {
      type: "CHOOSE_SEVERAL";
      validation?: never;
      options: ChoiceOptions;
    }
  | {
      type: "NUMBER";
      validation?: NumberValidation;
      options?: never;
    }
  | {
      type: "ADDRESS";
      validation?: never;
      options?: AddressOptions;
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

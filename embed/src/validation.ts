type FieldOption = { value: string; label: string };

type FieldValidation = {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
};

type FieldDefinition = {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FieldOption[];
  validation?: FieldValidation;
};

// Default maximum lengths for field types
const DEFAULT_MAX_LENGTHS: Record<string, number> = {
  TEXT: 200,
  EMAIL: 254, // RFC 5321 standard
  TEXTAREA: 2000,
};

// Get effective max length for a field (configured or default)
function getEffectiveMaxLength(field: FieldDefinition): number | undefined {
  if (field.validation?.maxLength) {
    return field.validation.maxLength;
  }
  return DEFAULT_MAX_LENGTHS[field.type];
}

type ValidationResult = {
  [key: string]: string;
};

function getLabel(field: FieldDefinition) {
  return field.label || field.name;
}

export function validateSubmission(
  fields: FieldDefinition[],
  values: Record<string, unknown>
): ValidationResult {
  const errors: ValidationResult = {};

  fields.forEach((field) => {
    const value = values[field.name];
    const label = getLabel(field);

    if (field.required) {
      if (field.type === "CHECKBOX") {
        if (!value) {
          errors[field.name] = `${label} is required.`;
          return;
        }
      } else if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        errors[field.name] = `${label} is required.`;
        return;
      }
    }

    if (value === undefined || value === null || String(value).trim() === "") {
      return;
    }

    if (field.type === "EMAIL") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        errors[field.name] = `${label} must be a valid email address.`;
        return;
      }
    }

    if (field.type === "SELECT" && field.options?.length) {
      const optionValues = field.options.map((option) => option.value);
      if (!optionValues.includes(String(value))) {
        errors[field.name] = `${label} must be a valid option.`;
        return;
      }
    }

    const stringValue = String(value);
    const effectiveMaxLength = getEffectiveMaxLength(field);

    // Check minLength if configured
    if (
      field.validation?.minLength &&
      stringValue.length < field.validation.minLength
    ) {
      errors[field.name] =
        field.validation.message ||
        `${label} must be at least ${field.validation.minLength} characters.`;
      return;
    }

    // Check maxLength (configured or default)
    if (
      effectiveMaxLength &&
      stringValue.length > effectiveMaxLength
    ) {
      errors[field.name] =
        field.validation?.message ||
        `${label} must be at most ${effectiveMaxLength} characters.`;
      return;
    }

    // Check pattern if configured
    if (field.validation?.pattern) {
      try {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(stringValue)) {
          errors[field.name] =
            field.validation.message || `${label} is invalid.`;
        }
      } catch {
        // Invalid regex should not block submission
      }
    }
  });

  return errors;
}

export type { FieldDefinition, FieldValidation, FieldOption };
export { getEffectiveMaxLength };

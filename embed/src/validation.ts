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

    if (field.validation) {
      const stringValue = String(value);
      if (
        typeof field.validation.minLength === "number" &&
        stringValue.length < field.validation.minLength
      ) {
        errors[field.name] =
          field.validation.message ||
          `${label} must be at least ${field.validation.minLength} characters.`;
        return;
      }

      if (
        typeof field.validation.maxLength === "number" &&
        stringValue.length > field.validation.maxLength
      ) {
        errors[field.name] =
          field.validation.message ||
          `${label} must be at most ${field.validation.maxLength} characters.`;
        return;
      }

      if (field.validation.pattern) {
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
    }
  });

  return errors;
}

export type { FieldDefinition, FieldValidation, FieldOption };

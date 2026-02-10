type FieldOption = { value: string; label: string };

type FieldValidation = {
  minLength?: number;
  maxLength?: number;
  format?: "lenient" | "strict" | "alphanumeric" | "numbers" | "letters" | "url" | "postal-us" | "postal-ca";
  minDate?: string;
  maxDate?: string;
  noFuture?: boolean;
  noPast?: boolean;
  domainRules?: {
    allow?: string[];
    block?: string[];
  };
  normalize?: boolean;
};

type NameOptions = {
  parts?: string[];
  partLabels?: Record<string, string>;
  partsRequired?: Record<string, boolean>;
};

type SelectOptions = {
  options: FieldOption[];
  defaultValue?: string;
  allowOther?: boolean;
};

type HiddenOptions = {
  valueSource: "static" | "urlParam" | "pageUrl" | "referrer";
  staticValue?: string;
  paramName?: string;
};

type FieldDefinition = {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  helpText?: string;
  options?: FieldOption[] | NameOptions | SelectOptions | HiddenOptions;
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
      } else if (field.type === "NAME") {
        // NAME validation handled below
      } else if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        errors[field.name] = `${label} is required.`;
        return;
      }
    }

    if (field.type === "NAME") {
      // NAME is always validated (handle required per-part)
    } else if (value === undefined || value === null || String(value).trim() === "") {
      return;
    }

    if (field.type === "EMAIL") {
      const stringValue = String(value);
      
      // RFC 5322 compliant (simplified but strict)
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      
      if (!emailRegex.test(stringValue)) {
        errors[field.name] = `Enter a valid email address`;
        return;
      }
      
      // Check domain rules
      const domainRules = (field.validation as any)?.domainRules;
      if (domainRules) {
        const domain = stringValue.split("@")[1]?.toLowerCase();
        
        if (domainRules.allow && domainRules.allow.length > 0) {
          const allowed = domainRules.allow.map((d: string) => d.toLowerCase());
          if (!allowed.includes(domain)) {
            errors[field.name] = `${label} must be from an allowed domain.`;
            return;
          }
        }
        
        if (domainRules.block && domainRules.block.length > 0) {
          const blocked = domainRules.block.map((d: string) => d.toLowerCase());
          if (blocked.includes(domain)) {
            errors[field.name] = `${label} domain is not allowed.`;
            return;
          }
        }
      }
    }

    if (field.type === "PHONE") {
      const stringValue = String(value);
      const format = (field.validation as any)?.format || "lenient";
      
      if (format === "lenient") {
        // Allow digits, spaces, dashes, parens, plus sign, min 7 chars
        if (!/^[\d\s\-\(\)\+\.]{7,}$/.test(stringValue)) {
          errors[field.name] = `${label} must be a valid phone number.`;
          return;
        }
      } else if (format === "strict") {
        // Strict US validation: must be 10 digits (with optional +1 prefix)
        // Strip everything except digits and leading +
        let cleaned = stringValue.replace(/[^\d+]/g, "");
        
        // Remove +1 prefix if present
        if (cleaned.startsWith("+1")) {
          cleaned = cleaned.substring(2);
        } else if (cleaned.startsWith("+")) {
          // Has + but not +1
          errors[field.name] = `${label} must be a valid US phone number (10 digits).`;
          return;
        } else if (cleaned.startsWith("1") && cleaned.length === 11) {
          // Has 1 prefix without +
          cleaned = cleaned.substring(1);
        }
        
        // Must be exactly 10 digits
        if (!/^\d{10}$/.test(cleaned)) {
          errors[field.name] = `${label} must be a valid US phone number (10 digits).`;
          return;
        }
      }
      
      // Skip generic length checks for PHONE fields
      return;
    }

    if (field.type === "DATE") {
      const stringValue = String(value);
      const dateValue = new Date(stringValue);
      
      if (isNaN(dateValue.getTime())) {
        errors[field.name] = `${label} must be a valid date.`;
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateValue.setHours(0, 0, 0, 0);

      const validation = field.validation as any;
      
      if (validation?.noFuture && dateValue > today) {
        errors[field.name] = `${label} cannot be a future date.`;
        return;
      }
      
      if (validation?.noPast && dateValue < today) {
        errors[field.name] = `${label} cannot be a past date.`;
        return;
      }

      if (validation?.minDate) {
        const minDate = new Date(
          validation.minDate === "today"
            ? today
            : validation.minDate
        );
        minDate.setHours(0, 0, 0, 0);
        if (dateValue < minDate) {
          errors[field.name] = `${label} must be on or after ${minDate.toLocaleDateString()}.`;
          return;
        }
      }

      if (validation?.maxDate) {
        const maxDate = new Date(
          validation.maxDate === "today"
            ? today
            : validation.maxDate
        );
        maxDate.setHours(0, 0, 0, 0);
        if (dateValue > maxDate) {
          errors[field.name] = `${label} must be on or before ${maxDate.toLocaleDateString()}.`;
          return;
        }
      }
    }

    if (field.type === "NAME") {
      const nameValue = value as Record<string, string>;
      const options = (field.options as NameOptions) || { parts: ["first", "last"] };
      const parts = options.parts || ["first", "last"];
      const partsRequired = options.partsRequired || {};
      
      // Validate each part
      for (const part of parts) {
        const partValue = nameValue[part];
        const isPartRequired = field.required || partsRequired[part];
        
        if (isPartRequired && (!partValue || partValue.trim() === "")) {
          const partLabel = options.partLabels?.[part] || part;
          errors[field.name] = `${partLabel} is required.`;
          return;
        }
      }
      
      // Skip further validation for NAME (no length/pattern checks on composite)
      return;
    }

    if (field.type === "SELECT" && Array.isArray(field.options)) {
      const optionValues = (field.options as FieldOption[]).map(
        (option) => option.value
      );
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
      errors[field.name] = `${label} must be at least ${field.validation.minLength} characters.`;
      return;
    }

    // Check maxLength (configured or default)
    if (
      effectiveMaxLength &&
      stringValue.length > effectiveMaxLength
    ) {
      errors[field.name] = `${label} must be at most ${effectiveMaxLength} characters.`;
      return;
    }

    // Check format if configured (for TEXT and TEXTAREA)
    if (field.type === "TEXT" || field.type === "TEXTAREA") {
      const format = field.validation?.format;
      if (format && format !== "alphanumeric") {
        let isValid = true;
        let defaultMessage = `${label} is invalid.`;

        switch (format) {
          case "numbers":
            isValid = /^\d+$/.test(stringValue);
            defaultMessage = `${label} must contain only numbers.`;
            break;
          case "letters":
            isValid = /^[A-Za-z]+$/.test(stringValue);
            defaultMessage = `${label} must contain only letters.`;
            break;
          case "url": {
            // Prepend protocol if missing for validation
            const urlString = stringValue.startsWith("http")
              ? stringValue
              : `https://${stringValue}`;
            try {
              const url = new URL(urlString);
              isValid = url.hostname.includes(".");
            } catch {
              isValid = false;
            }
            defaultMessage = `${label} must be a valid URL.`;
            break;
          }
          case "postal-us":
            isValid = /^\d{5}(-\d{4})?$/.test(stringValue);
            defaultMessage = `${label} must be a valid US postal code (e.g., 12345 or 12345-6789).`;
            break;
          case "postal-ca":
            isValid = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(stringValue);
            defaultMessage = `${label} must be a valid Canadian postal code (e.g., K1A 0B1).`;
            break;
        }

        if (!isValid) {
          errors[field.name] = defaultMessage;
        }
      }
    }
  });

  return errors;
}

export type { FieldDefinition, FieldValidation, FieldOption };
export { getEffectiveMaxLength };

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateOrigin, getClientIP, hashIP } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";
import { queueNewSubmissionNotification } from "@/lib/email-queue";

type FieldDefinition = {
  name: string;
  type: string;
  label: string;
  required: boolean;
  options: unknown;
  validation: unknown;
};

type RateLimitConfig = {
  max: number;
  windowMs: number;
};

type SubmitOptions = {
  request: NextRequest;
  formId: string;
  allowMethods: string;
  rateLimit: RateLimitConfig;
};

function jsonResponse(
  payload: Record<string, unknown>,
  status: number,
  origin: string | null,
  allowMethods: string
) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": allowMethods,
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function getFieldLabel(field: { label: string; name: string }) {
  return field.label || field.name;
}

// Default maximum lengths for field types (guardrails)
const DEFAULT_MAX_LENGTHS: Record<string, number> = {
  TEXT: 200,
  EMAIL: 254, // RFC 5321 standard
  TEXTAREA: 2000,
};

// Absolute maximum limits (security guardrails)
const ABSOLUTE_MAX_LENGTHS: Record<string, number> = {
  TEXT: 500,
  EMAIL: 320, // Extended email format
  TEXTAREA: 10000,
};

// Maximum payload size (64KB)
const MAX_PAYLOAD_SIZE = 64 * 1024;

// Get effective max length for a field (configured, default, or absolute)
function getEffectiveMaxLength(field: FieldDefinition): number {
  const validation =
    typeof field.validation === "object" && field.validation !== null
      ? (field.validation as { maxLength?: number })
      : undefined;
  
  const configuredMax = validation?.maxLength;
  const defaultMax = DEFAULT_MAX_LENGTHS[field.type];
  const absoluteMax = ABSOLUTE_MAX_LENGTHS[field.type];
  
  // Use configured max if set, otherwise use default
  const effectiveMax = configuredMax ?? defaultMax;
  
  // Never exceed absolute maximum
  return absoluteMax ? Math.min(effectiveMax ?? absoluteMax, absoluteMax) : effectiveMax ?? Infinity;
}

function validateFields(
  fields: FieldDefinition[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = data[field.name];
    const label = getFieldLabel(field);
    const validation =
      typeof field.validation === "object" && field.validation !== null
        ? (field.validation as {
            minLength?: number;
            maxLength?: number;
            format?: string;
            message?: string;
            minDate?: string;
            maxDate?: string;
            noFuture?: boolean;
            noPast?: boolean;
          })
        : undefined;

    if (field.required) {
      if (field.type === "CHECKBOX") {
        if (!value) {
          errors[field.name] = `${label} is required.`;
          continue;
        }
      } else if (field.type === "NAME") {
        // NAME validation handled below
      } else if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        errors[field.name] = `${label} is required.`;
        continue;
      }
    }

    if (field.type === "NAME") {
      // NAME is always validated (handle required per-part)
    } else if (value === undefined || value === null || String(value).trim() === "") {
      continue;
    }

    if (field.type === "EMAIL") {
      const emailValue = String(value).trim();
      
      // Get validation config
      const validation = typeof field.validation === "object" && field.validation !== null
        ? (field.validation as any)
        : undefined;
      
      // Validate email format (RFC 5322 compliant)
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      
      if (!emailRegex.test(emailValue)) {
        errors[field.name] = validation?.message || `Enter a valid email address`;
        continue;
      }
      
      // Check domain rules
      const domainRules = validation?.domainRules;
      if (domainRules) {
        const domain = emailValue.split("@")[1]?.toLowerCase();
        
        if (domainRules.allow && Array.isArray(domainRules.allow) && domainRules.allow.length > 0) {
          const allowed = domainRules.allow.map((d: string) => d.toLowerCase());
          if (!allowed.includes(domain)) {
            errors[field.name] = validation?.message || `${label} must be from an allowed domain.`;
            continue;
          }
        }
        
        if (domainRules.block && Array.isArray(domainRules.block) && domainRules.block.length > 0) {
          const blocked = domainRules.block.map((d: string) => d.toLowerCase());
          if (blocked.includes(domain)) {
            errors[field.name] = validation?.message || `${label} domain is not allowed.`;
            continue;
          }
        }
      }
    }

    if (field.type === "PHONE") {
      const stringValue = String(value);
      const format = validation?.format || "lenient";
      
      if (format === "lenient") {
        // Allow digits, spaces, dashes, parens, plus sign, dots, min 7 chars
        if (!/^[\d\s\-\(\)\+\.]{7,}$/.test(stringValue)) {
          errors[field.name] =
            validation?.message ||
            `${label} must be a valid phone number.`;
          continue;
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
          errors[field.name] =
            validation?.message ||
            `${label} must be a valid US phone number (10 digits).`;
          continue;
        } else if (cleaned.startsWith("1") && cleaned.length === 11) {
          // Has 1 prefix without +
          cleaned = cleaned.substring(1);
        }
        
        // Must be exactly 10 digits
        if (!/^\d{10}$/.test(cleaned)) {
          errors[field.name] =
            validation?.message ||
            `${label} must be a valid US phone number (10 digits).`;
          continue;
        }
        
        // Normalize to E.164 format: +1XXXXXXXXXX
        data[field.name] = `+1${cleaned}`;
      }
      
      // Skip generic length checks for PHONE fields
      continue;
    }

    if (field.type === "DATE") {
      const stringValue = String(value);
      const dateValue = new Date(stringValue);
      
      if (isNaN(dateValue.getTime())) {
        errors[field.name] =
          validation?.message || `${label} must be a valid date.`;
        continue;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateValue.setHours(0, 0, 0, 0);

      if (validation?.noFuture && dateValue > today) {
        errors[field.name] =
          validation.message || `${label} cannot be a future date.`;
        continue;
      }
      
      if (validation?.noPast && dateValue < today) {
        errors[field.name] =
          validation.message || `${label} cannot be a past date.`;
        continue;
      }

      if (validation?.minDate) {
        const minDate = new Date(
          validation.minDate === "today"
            ? today
            : validation.minDate
        );
        minDate.setHours(0, 0, 0, 0);
        if (dateValue < minDate) {
          errors[field.name] =
            validation.message ||
            `${label} must be on or after ${minDate.toLocaleDateString()}.`;
          continue;
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
          errors[field.name] =
            validation.message ||
            `${label} must be on or before ${maxDate.toLocaleDateString()}.`;
          continue;
        }
      }
    }

    if (field.type === "NAME") {
      const nameValue = value as Record<string, any>;
      const options =
        typeof field.options === "object" && field.options !== null
          ? (field.options as {
              parts?: string[];
              partLabels?: Record<string, string>;
              partsRequired?: Record<string, boolean>;
            })
          : { parts: ["first", "last"] };
      
      const parts = options.parts || ["first", "last"];
      const partsRequired = options.partsRequired || {};
      
      // Validate each part
      for (const part of parts) {
        const partValue = nameValue?.[part];
        const isPartRequired = field.required || partsRequired[part];
        
        if (isPartRequired && (!partValue || String(partValue).trim() === "")) {
          const partLabel = options.partLabels?.[part] || part;
          errors[field.name] = `${partLabel} is required.`;
          break;
        }
      }
      
      // Skip further validation for NAME (no length/pattern checks on composite)
      continue;
    }

    if (field.type === "SELECT" && Array.isArray(field.options)) {
      const optionValues = field.options
        .map((option) =>
          typeof option === "object" && option !== null
            ? (option as { value?: string }).value
            : null
        )
        .filter((option): option is string => Boolean(option));

      if (optionValues.length > 0 && !optionValues.includes(String(value))) {
        errors[field.name] = `${label} must be a valid option.`;
        continue;
      }
    }

    const stringValue = String(value);
    const effectiveMaxLength = getEffectiveMaxLength(field);
    
    // Check minLength if configured
    if (
      validation?.minLength &&
      stringValue.length < validation.minLength
    ) {
      errors[field.name] =
        validation.message ||
        `${label} must be at least ${validation.minLength} characters.`;
      continue;
    }

    // Check maxLength (with guardrails)
    if (stringValue.length > effectiveMaxLength) {
      errors[field.name] =
        validation?.message ||
        `${label} must be at most ${effectiveMaxLength} characters.`;
      continue;
    }

    // Check format if configured (for TEXT and TEXTAREA)
    if (field.type === "TEXT" || field.type === "TEXTAREA") {
      const format = validation?.format as string | undefined;
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
          errors[field.name] = validation?.message || defaultMessage;
        }
      }
    }
  }

  return errors;
}

export async function handlePublicSubmit({
  request,
  formId,
  allowMethods,
  rateLimit,
}: SubmitOptions) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      fields: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!form) {
    return jsonResponse({ error: "Form not found" }, 404, origin, allowMethods);
  }

  if (!validateOrigin(origin, form.allowedOrigins, referer)) {
    return jsonResponse(
      { error: "Origin not allowed" },
      403,
      origin,
      allowMethods
    );
  }

  const clientIP = getClientIP(request);
  const ipHash = hashIP(clientIP);
  if (isRateLimited(ipHash, rateLimit.max, rateLimit.windowMs)) {
    return jsonResponse(
      { error: "Rate limit exceeded" },
      429,
      origin,
      allowMethods
    );
  }

  // Check time-based submission limit
  if (form.stopAt && new Date() > new Date(form.stopAt)) {
    return jsonResponse(
      { error: "This form is no longer accepting submissions" },
      403,
      origin,
      allowMethods
    );
  }

  // Check count-based submission limit (excluding spam)
  if (form.maxSubmissions) {
    const count = await prisma.submission.count({
      where: { formId: form.id, isSpam: false },
    });
    if (count >= form.maxSubmissions) {
      return jsonResponse(
        { error: "This form has reached its maximum number of submissions" },
        403,
        origin,
        allowMethods
      );
    }
  }

  // Check Content-Length header first (fast rejection)
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    return jsonResponse(
      { error: "Payload too large" },
      413,
      origin,
      allowMethods
    );
  }

  let formData: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_PAYLOAD_SIZE) {
      return jsonResponse(
        { error: "Payload too large" },
        413,
        origin,
        allowMethods
      );
    }
    formData = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, origin, allowMethods);
  }

  if (form.fields.length > 0) {
    const errors = validateFields(
      form.fields.map((field) => ({
        name: field.name,
        type: field.type,
        label: field.label,
        required: field.required,
        options: field.options,
        validation: field.validation,
      })),
      formData
    );

    if (Object.keys(errors).length > 0) {
      return jsonResponse(
        { error: "Validation failed", fields: errors },
        400,
        origin,
        allowMethods
      );
    }
    
    // Apply normalization after validation passes
    form.fields.forEach((field) => {
      if (field.type === "EMAIL" && formData[field.name]) {
        const validation = typeof field.validation === "object" && field.validation !== null
          ? (field.validation as any)
          : undefined;
        
        if (validation?.normalize) {
          formData[field.name] = String(formData[field.name]).toLowerCase();
        }
      }
    });
  }

  let isSpam = false;
  if (form.honeypotField && formData[form.honeypotField]) {
    isSpam = true;
  }

  const meta = {
    ipHash,
    userAgent: request.headers.get("user-agent") || "unknown",
    referrer: request.headers.get("referer") || null,
    origin: origin || null,
  };

  const submission = await prisma.submission.create({
    data: {
      formId: form.id,
      data: formData as any,
      meta: meta as any,
      isSpam,
      status: "NEW",
    },
  });

  // Send notification to account owner if enabled
  if (!isSpam && (form as any).emailNotificationsEnabled) {
    queueNewSubmissionNotification(
      form.id,
      form.name,
      submission.createdAt,
      form.accountId
    );
  }

  return jsonResponse(
    { success: true, id: submission.id },
    200,
    origin,
    allowMethods
  );
}

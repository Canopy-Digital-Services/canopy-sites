import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateOrigin, getClientIP, hashIP } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";
import { queueEmailNotification, queueNewSubmissionNotification } from "@/lib/email-queue";

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
  siteApiKey: string;
  formSlug: string;
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
            pattern?: string;
            message?: string;
          })
        : undefined;

    if (field.required) {
      if (field.type === "CHECKBOX") {
        if (!value) {
          errors[field.name] = `${label} is required.`;
          continue;
        }
      } else if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        errors[field.name] = `${label} is required.`;
        continue;
      }
    }

    if (value === undefined || value === null || String(value).trim() === "") {
      continue;
    }

    if (field.type === "EMAIL") {
      const emailValue = String(value).trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        errors[field.name] = `${label} must be a valid email address.`;
        continue;
      }
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

    // Check pattern if configured
    if (validation?.pattern) {
      try {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(stringValue)) {
          errors[field.name] = validation.message || `${label} is invalid.`;
        }
      } catch {
        // Ignore invalid regex in configuration
      }
    }
  }

  return errors;
}

export async function handlePublicSubmit({
  request,
  siteApiKey,
  formSlug,
  allowMethods,
  rateLimit,
}: SubmitOptions) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const site = await prisma.site.findUnique({
    where: { apiKey: siteApiKey },
  });

  if (!site) {
    return jsonResponse({ error: "Site not found" }, 404, origin, allowMethods);
  }

  if (!validateOrigin(origin, site.domain, referer)) {
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

  const form = await prisma.form.findUnique({
    where: {
      siteId_slug: {
        siteId: site.id,
        slug: formSlug,
      },
    },
    include: {
      fields: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!form) {
    return jsonResponse({ error: "Form not found" }, 404, origin, allowMethods);
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

  if (!isSpam && form.notifyEmails.length > 0) {
    queueEmailNotification(submission, form, site);
  }

  // Epic 4: Send notification to account owner if enabled
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

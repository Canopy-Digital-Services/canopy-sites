import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateOrigin, getClientIP, hashIP } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";
import { queueEmailNotification } from "@/lib/email-queue";

// Disable caching for this API route to ensure fresh form definitions
export const dynamic = "force-dynamic";

const GET_RATE_LIMIT = { max: 60, windowMs: 60 * 1000 };
const POST_RATE_LIMIT = { max: 10, windowMs: 60 * 1000 };

function jsonError(message: string, status: number, origin?: string | null) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

function getFieldLabel(field: { label: string; name: string }) {
  return field.label || field.name;
}

function validateFields(
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    options: unknown;
    validation: unknown;
  }>,
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

    if (validation) {
      const stringValue = String(value);
      if (
        typeof validation.minLength === "number" &&
        stringValue.length < validation.minLength
      ) {
        errors[field.name] =
          validation.message ||
          `${label} must be at least ${validation.minLength} characters.`;
        continue;
      }

      if (
        typeof validation.maxLength === "number" &&
        stringValue.length > validation.maxLength
      ) {
        errors[field.name] =
          validation.message ||
          `${label} must be at most ${validation.maxLength} characters.`;
        continue;
      }

      if (validation.pattern) {
        try {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(stringValue)) {
            errors[field.name] =
              validation.message || `${label} is invalid.`;
          }
        } catch {
          // Ignore invalid regex in configuration
        }
      }
    }
  }

  return errors;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteApiKey: string; formSlug: string }> }
) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  try {
    const { siteApiKey, formSlug } = await params;

    const site = await prisma.site.findUnique({
      where: { apiKey: siteApiKey },
    });

    if (!site) {
      return jsonError("Site not found", 404, origin);
    }

    if (!validateOrigin(origin, site.domain, referer)) {
      return jsonError("Origin not allowed", 403, origin);
    }

    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);
    if (isRateLimited(ipHash, GET_RATE_LIMIT.max, GET_RATE_LIMIT.windowMs)) {
      return jsonError("Rate limit exceeded", 429, origin);
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
      return jsonError("Form not found", 404, origin);
    }

    return NextResponse.json(
      {
        formId: form.id,
        slug: form.slug,
        fields: form.fields.map((field) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          options: field.options,
          validation: field.validation,
        })),
        successMessage: form.successMessage || undefined,
        redirectUrl: form.redirectUrl || undefined,
        defaultTheme: form.defaultTheme || undefined,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Embed fetch error:", error);
    return jsonError("Internal server error", 500, origin);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteApiKey: string; formSlug: string }> }
) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  try {
    const { siteApiKey, formSlug } = await params;

    const site = await prisma.site.findUnique({
      where: { apiKey: siteApiKey },
    });

    if (!site) {
      return jsonError("Site not found", 404, origin);
    }

    if (!validateOrigin(origin, site.domain, referer)) {
      return jsonError("Origin not allowed", 403, origin);
    }

    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);
    if (isRateLimited(ipHash, POST_RATE_LIMIT.max, POST_RATE_LIMIT.windowMs)) {
      return jsonError("Rate limit exceeded", 429, origin);
    }

    let formData: Record<string, unknown>;
    try {
      formData = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonError("Invalid JSON", 400, origin);
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
      return jsonError("Form not found", 404, origin);
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
        return NextResponse.json(
          { error: "Validation failed", fields: errors },
          {
            status: 400,
            headers: {
              "Access-Control-Allow-Origin": origin || "*",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          }
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

    return NextResponse.json(
      { success: true, id: submission.id },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Embed submit error:", error);
    return jsonError("Internal server error", 500, origin);
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

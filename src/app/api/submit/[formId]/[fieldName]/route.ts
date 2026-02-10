import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateOrigin, getClientIP, hashIP } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";
import { queueNewSubmissionNotification } from "@/lib/email-queue";

const POST_RATE_LIMIT = { max: 10, windowMs: 60 * 1000 };
const MAX_PAYLOAD_SIZE = 64 * 1024;

function jsonResponse(
  payload: Record<string, unknown>,
  status: number,
  origin: string | null
) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string; fieldName: string }> }
) {
  try {
    const { formId, fieldName } = await params;
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");

    // Look up form
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!form) {
      return jsonResponse({ error: "Form not found" }, 404, origin);
    }

    // Validate origin
    if (!validateOrigin(origin, form.allowedOrigins, referer)) {
      return jsonResponse({ error: "Origin not allowed" }, 403, origin);
    }

    // Rate limiting
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);
    if (isRateLimited(ipHash, POST_RATE_LIMIT.max, POST_RATE_LIMIT.windowMs)) {
      return jsonResponse({ error: "Rate limit exceeded" }, 429, origin);
    }

    // Check payload size
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return jsonResponse({ error: "Payload too large" }, 413, origin);
    }

    // Parse field value from request body
    let fieldValue: unknown;
    const contentType = request.headers.get("content-type") || "";
    
    try {
      const text = await request.text();
      if (text.length > MAX_PAYLOAD_SIZE) {
        return jsonResponse({ error: "Payload too large" }, 413, origin);
      }

      if (contentType.includes("application/json")) {
        const json = JSON.parse(text) as Record<string, unknown>;
        // Support both { "value": "..." } and direct field value
        fieldValue = json.value !== undefined ? json.value : json;
      } else {
        // Plain text body
        fieldValue = text;
      }
    } catch {
      return jsonResponse({ error: "Invalid request body" }, 400, origin);
    }

    // Find the specific field
    const field = form.fields.find((f) => f.name === fieldName);
    if (!field) {
      return jsonResponse({ error: "Field not found" }, 404, origin);
    }

    // Build submission data with just this field
    const formData: Record<string, unknown> = {
      [fieldName]: fieldValue,
    };

    // Basic validation for this single field (simplified from full validation)
    const errors: Record<string, string> = {};
    
    if (field.required && (fieldValue === undefined || fieldValue === null || String(fieldValue).trim() === "")) {
      errors[fieldName] = `${field.label || field.name} is required.`;
    }

    if (Object.keys(errors).length > 0) {
      return jsonResponse({ error: "Validation failed", fields: errors }, 400, origin);
    }

    // Check honeypot (should be empty or not present in single-field submission)
    let isSpam = false;
    if (form.honeypotField && formData[form.honeypotField]) {
      isSpam = true;
    }

    // Store submission
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

    // Send notifications if not spam
    if (!isSpam && form.emailNotificationsEnabled) {
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
      origin
    );
  } catch (error) {
    const origin = request.headers.get("origin");
    console.error("Single field submit error:", error);
    return jsonResponse(
      { error: "Internal server error" },
      500,
      origin
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { validateOrigin, getClientIP, hashIP } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";
import { queueNewSubmissionNotification } from "@/lib/email-queue";
import { buildSubmissionEmailExtras } from "@/lib/submission-email";
import {
  upsertLimitNotification,
  upsertSubmissionNotification,
} from "@/lib/data-access/notifications";
import { answerOf, anywhereToday, dateOfBirth, usPhoneDigits, validateSubmission } from "../../embed/src/validation";

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

// Maximum payload size (64KB)
const MAX_PAYLOAD_SIZE = 64 * 1024;

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

  if (form.type === "HOSTED") {
    return jsonResponse(
      {
        error: "This form is only available at its hosted URL.",
        code: "FORM_HOSTED_ONLY",
      },
      403,
      origin,
      allowMethods
    );
  }

  if (!form.published) {
    return jsonResponse(
      {
        error: "This form is not currently accepting responses",
        code: "FORM_INACTIVE",
      },
      403,
      origin,
      allowMethods
    );
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
    await upsertLimitNotification(form.accountId, form.id, "LIMIT_DEADLINE_REACHED");
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
      await upsertLimitNotification(form.accountId, form.id, "LIMIT_MAX_REACHED");
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
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Not an object");
    }
    formData = parsed as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, origin, allowMethods);
  }

  // A key is a field's answer or the honeypot; anything else is refused.
  // The form's own checks follow. The server can't know the visitor's date,
  // so a bound of "today" takes any date it is somewhere.
  const fieldNames = new Set(form.fields.map((field) => field.name));
  const errors: Record<string, string> = {};
  for (const key of Object.keys(formData)) {
    if (!fieldNames.has(key) && key !== form.honeypotField) {
      errors[key] = "This form has no field by that name.";
    }
  }
  Object.assign(errors, validateSubmission(form.fields, formData, anywhereToday()));

  if (Object.keys(errors).length > 0) {
    return jsonResponse(
      { error: "Validation failed", fields: errors },
      400,
      origin,
      allowMethods
    );
  }

  // Only the fields are stored, as checked: an email trimmed, and lowercased
  // when the field normalizes it; a strict US phone as E.164 (+1XXXXXXXXXX);
  // a date of birth as YYYY-MM-DD, like a Date's answer.
  const data: Record<string, unknown> = {};
  for (const field of form.fields) {
    const value = answerOf(formData, field.name);
    if (value === undefined) continue;
    data[field.name] = value;
    if (typeof value !== "string" || value.trim() === "") continue;
    const rules =
      typeof field.validation === "object" && field.validation !== null
        ? (field.validation as { format?: string; normalize?: boolean })
        : {};

    if (field.type === "EMAIL") {
      const email = value.trim();
      data[field.name] = rules.normalize ? email.toLowerCase() : email;
    } else if (field.type === "PHONE" && rules.format === "strict") {
      data[field.name] = `+1${usPhoneDigits(value)}`;
    } else if (field.type === "DATE_OF_BIRTH") {
      data[field.name] = dateOfBirth(value) ?? value;
    }
  }

  const isSpam = Boolean(form.honeypotField && formData[form.honeypotField]);

  const meta = {
    ipHash,
    userAgent: request.headers.get("user-agent") || "unknown",
    referrer: request.headers.get("referer") || null,
    origin: origin || null,
  };

  const submission = await prisma.submission.create({
    data: {
      formId: form.id,
      data: data as Prisma.InputJsonValue,
      meta: meta as Prisma.InputJsonValue,
      isSpam,
      status: "NEW",
    },
  });

  // Send notification to all listed recipients if enabled
  if (!isSpam && form.emailNotificationsEnabled && form.notifyEmails.length > 0) {
    const extras = form.emailIncludeResponses
      ? buildSubmissionEmailExtras(form.fields, data, form.honeypotField)
      : null;

    queueNewSubmissionNotification({
      formId: form.id,
      formName: form.name,
      accountId: form.accountId,
      submittedAt: submission.createdAt,
      notifyEmails: form.notifyEmails,
      responses: extras?.responses,
      replyTo: extras?.replyTo,
    });
  }

  // In-app bell notification (independent of email preferences)
  if (!isSpam) {
    await upsertSubmissionNotification(form.accountId, form.id);
  }

  return jsonResponse(
    { success: true, id: submission.id },
    200,
    origin,
    allowMethods
  );
}

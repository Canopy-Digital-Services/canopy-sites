/**
 * Data access helpers for forms.
 * Enforces form ownership: form.accountId === accountId
 *
 * A form id is checked to be a string here as well as in the action that
 * took it. What follows an ownership check uses the id of the row it
 * returned, never the caller's value again.
 */

import { prisma } from "@/lib/db";
import { requireId } from "@/lib/ids";

/**
 * Get a form owned by the given account.
 * Enforces: form.accountId === accountId
 */
export async function getOwnedForm(formId: string, accountId: string) {
  const form = await prisma.form.findFirst({
    where: {
      id: requireId(formId, "form id"),
      accountId: requireId(accountId, "account id"),
    },
    include: {
      fields: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!form) {
    throw new Error("Form not found or access denied");
  }

  return form;
}

/**
 * Get a form with minimal data (no fields).
 * Useful for quick ownership checks.
 */
export async function getOwnedFormMinimal(formId: string, accountId: string) {
  const form = await prisma.form.findFirst({
    where: {
      id: requireId(formId, "form id"),
      accountId: requireId(accountId, "account id"),
    },
  });

  if (!form) {
    throw new Error("Form not found or access denied");
  }

  return form;
}

/**
 * A published form as its public page sees it (no auth), or null if the form
 * doesn't exist or isn't published. It selects the columns a visitor's
 * browser may hold and no others: the page hands them to a client component,
 * whose props are sent to the browser whole. Add a column here only if it is
 * public.
 */
export async function getPublishedForm(formId: string) {
  return prisma.form.findFirst({
    where: {
      id: requireId(formId, "form id"),
      published: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      title: true,
      description: true,
      successMessage: true,
      redirectUrl: true,
      defaultTheme: true,
      fields: {
        orderBy: { order: "asc" },
        select: {
          name: true,
          type: true,
          label: true,
          required: true,
          order: true,
          helpText: true,
          options: true,
          validation: true,
        },
      },
    },
  });
}

/**
 * Check if a form exists by ID (public, no auth).
 * Used to distinguish 404 from "not published".
 */
export async function formExists(formId: string) {
  const count = await prisma.form.count({
    where: { id: requireId(formId, "form id") },
  });
  return count > 0;
}

/**
 * Get all forms for an account with new-submission counts.
 * Used for forms list page.
 */
export async function getUserForms(accountId: string) {
  const forms = await prisma.form.findMany({
    where: { accountId },
    select: {
      id: true,
      accountId: true,
      createdByUserId: true,
      name: true,
      title: true,
      description: true,
      slug: true,
      allowedOrigins: true,
      notifyEmails: true,
      emailNotificationsEnabled: true,
      emailIncludeResponses: true,
      honeypotField: true,
      successMessage: true,
      redirectUrl: true,
      defaultTheme: true,
      stopAt: true,
      maxSubmissions: true,
      published: true,
      type: true,
      createdAt: true,
      _count: { select: { submissions: true, fields: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const newCounts = await prisma.submission.groupBy({
    by: ["formId"],
    _count: true,
    where: {
      formId: { in: forms.map((f) => f.id) },
      status: "NEW",
      isSpam: false,
    },
  });

  const newCountMap = new Map(newCounts.map((c) => [c.formId, c._count]));
  return forms.map((form) => ({
    ...form,
    newSubmissionsCount: newCountMap.get(form.id) ?? 0,
  }));
}

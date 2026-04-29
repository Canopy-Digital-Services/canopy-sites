/**
 * Data access helpers for forms.
 * Enforces form ownership: form.accountId === accountId
 */

import { prisma } from "@/lib/db";

/**
 * Get a form owned by the given account.
 * Enforces: form.accountId === accountId
 */
export async function getOwnedForm(formId: string, accountId: string) {
  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      accountId,
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
      id: formId,
      accountId,
    },
  });

  if (!form) {
    throw new Error("Form not found or access denied");
  }

  return form;
}

/**
 * Get a published form by ID (public, no auth).
 * Returns null if form doesn't exist or isn't published.
 */
export async function getPublishedForm(formId: string) {
  return prisma.form.findFirst({
    where: {
      id: formId,
      published: true,
    },
    include: {
      fields: {
        orderBy: { order: "asc" },
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
    where: { id: formId },
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

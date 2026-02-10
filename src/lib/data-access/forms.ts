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
 * Get all forms for an account.
 * Used for forms list page.
 */
export async function getUserForms(accountId: string) {
  return prisma.form.findMany({
    where: {
      accountId,
    },
    include: {
      _count: {
        select: {
          submissions: true,
          fields: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

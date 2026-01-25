/**
 * Data access helpers for forms.
 * Enforces forms-first ownership: Form → Site → User
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
      site: true,
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
 * Get a form with minimal data (no fields, just site info).
 * Useful for quick ownership checks.
 */
export async function getOwnedFormMinimal(formId: string, accountId: string) {
  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      accountId,
    },
    include: {
      site: true,
    },
  });

  if (!form) {
    throw new Error("Form not found or access denied");
  }

  return form;
}

/**
 * Get all forms for an account (across all sites).
 * Used for forms list page.
 */
export async function getUserForms(accountId: string) {
  return prisma.form.findMany({
    where: {
      accountId,
    },
    include: {
      site: {
        select: {
          id: true,
          name: true,
        },
      },
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

/**
 * Get all sites for an account.
 * Used for site selector dropdown.
 */
export async function getUserSites(accountId: string) {
  return prisma.site.findMany({
    where: {
      accountId,
    },
    select: {
      id: true,
      name: true,
      domain: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Verify a site is owned by the account.
 */
export async function getOwnedSite(siteId: string, accountId: string) {
  const site = await prisma.site.findFirst({
    where: {
      id: siteId,
      accountId,
    },
  });

  if (!site) {
    throw new Error("Site not found or access denied");
  }

  return site;
}

/**
 * Data access helpers for forms.
 * Enforces forms-first ownership: Form → Site → User
 */

import { prisma } from "@/lib/db";

/**
 * Get a form owned by the given user.
 * Enforces: form.site.userId === userId
 */
export async function getOwnedForm(formId: string, userId: string) {
  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      site: {
        userId,
      },
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
export async function getOwnedFormMinimal(formId: string, userId: string) {
  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      site: {
        userId,
      },
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
 * Get all forms for a user (across all sites).
 * Used for forms list page.
 */
export async function getUserForms(userId: string) {
  return prisma.form.findMany({
    where: {
      site: {
        userId,
      },
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
 * Get all sites for a user.
 * Used for site selector dropdown.
 */
export async function getUserSites(userId: string) {
  return prisma.site.findMany({
    where: {
      userId,
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
 * Verify a site is owned by the user.
 */
export async function getOwnedSite(siteId: string, userId: string) {
  const site = await prisma.site.findFirst({
    where: {
      id: siteId,
      userId,
    },
  });

  if (!site) {
    throw new Error("Site not found or access denied");
  }

  return site;
}

"use server";

/**
 * Shared form actions.
 * Decoupled from route structure - can be called from any route.
 * All actions enforce ownership internally via Form → Account.
 */

import { prisma } from "@/lib/db";
import { getCurrentUserId, getCurrentAccountId } from "@/lib/auth-utils";
import { FieldType } from "@prisma/client";
import { getOwnedForm, getOwnedFormMinimal, getOwnedSite } from "@/lib/data-access/forms";
import { revalidatePath } from "next/cache";

type FieldInput = {
  name: string;
  type: string;
  label: string;
  placeholder?: string | null;
  required?: boolean;
  options?: unknown;
  validation?: unknown;
};

// ============================================================================
// FIELD ACTIONS
// ============================================================================

export async function createField(formId: string, data: FieldInput) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  if (!data.name || !data.label) {
    throw new Error("Field name and label are required");
  }

  const lastField = await prisma.field.findFirst({
    where: { formId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const order = (lastField?.order ?? 0) + 1;

  const field = await prisma.field.create({
    data: {
      formId,
      name: data.name.trim(),
      type: data.type as FieldType,
      label: data.label.trim(),
      placeholder: data.placeholder?.trim() || null,
      required: Boolean(data.required),
      order,
      options: data.options || undefined,
      validation: data.validation || undefined,
    },
  });

  revalidatePath(`/forms/${formId}/edit`);
  return field;
}

export async function updateField(
  formId: string,
  fieldId: string,
  data: FieldInput
) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  if (!data.name || !data.label) {
    throw new Error("Field name and label are required");
  }

  const field = await prisma.field.findFirst({
    where: {
      id: fieldId,
      formId,
    },
  });

  if (!field) {
    throw new Error("Field not found");
  }

  const updated = await prisma.field.update({
    where: { id: fieldId },
    data: {
      name: data.name.trim(),
      type: data.type as FieldType,
      label: data.label.trim(),
      placeholder: data.placeholder?.trim() || null,
      required: Boolean(data.required),
      options: data.options || undefined,
      validation: data.validation || undefined,
    },
  });

  revalidatePath(`/forms/${formId}/edit`);
  return updated;
}

export async function deleteField(formId: string, fieldId: string) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  const field = await prisma.field.findFirst({
    where: {
      id: fieldId,
      formId,
    },
  });

  if (!field) {
    throw new Error("Field not found");
  }

  await prisma.field.delete({ where: { id: fieldId } });

  // Reorder remaining fields
  const remaining = await prisma.field.findMany({
    where: { formId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  await prisma.$transaction(
    remaining.map((item, index) =>
      prisma.field.update({
        where: { id: item.id },
        data: { order: index + 1 },
      })
    )
  );

  revalidatePath(`/forms/${formId}/edit`);
}

export async function reorderFields(formId: string, fieldIds: string[]) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  const fields = await prisma.field.findMany({
    where: { formId },
    select: { id: true },
  });

  const ownedIds = new Set(fields.map((field) => field.id));
  for (const fieldId of fieldIds) {
    if (!ownedIds.has(fieldId)) {
      throw new Error("Invalid field order");
    }
  }

  await prisma.$transaction(
    fieldIds.map((fieldId, index) =>
      prisma.field.update({
        where: { id: fieldId },
        data: { order: index + 1 },
      })
    )
  );

  revalidatePath(`/forms/${formId}/edit`);
}

// ============================================================================
// FORM ACTIONS
// ============================================================================

export async function updateFormBasics(
  formId: string,
  data: {
    name?: string;
    slug?: string;
    notifyEmails?: string[];
    honeypotField?: string | null;
  }
) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  const updateData: {
    name?: string;
    slug?: string;
    notifyEmails?: string[];
    honeypotField?: string | null;
  } = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }

  if (data.slug !== undefined) {
    updateData.slug = data.slug.trim();
  }

  if (data.notifyEmails !== undefined) {
    updateData.notifyEmails = data.notifyEmails;
  }

  if (data.honeypotField !== undefined) {
    updateData.honeypotField = data.honeypotField?.trim() || null;
  }

  await prisma.form.update({
    where: { id: formId },
    data: updateData,
  });

  revalidatePath(`/forms/${formId}/edit`);
  revalidatePath(`/forms`);
}

export async function updateFormBehavior(
  formId: string,
  data: {
    successMessage?: string | null;
    redirectUrl?: string | null;
    emailNotificationsEnabled?: boolean;
  }
) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  const updateData: {
    successMessage?: string | null;
    redirectUrl?: string | null;
    emailNotificationsEnabled?: boolean;
  } = {};

  if (data.successMessage !== undefined) {
    updateData.successMessage = data.successMessage?.trim() || null;
  }

  if (data.redirectUrl !== undefined) {
    updateData.redirectUrl = data.redirectUrl?.trim() || null;
  }

  if (data.emailNotificationsEnabled !== undefined) {
    updateData.emailNotificationsEnabled = data.emailNotificationsEnabled;
  }

  await prisma.form.update({
    where: { id: formId },
    data: updateData,
  });

  revalidatePath(`/forms/${formId}/edit`);
}

export async function updateFormAppearance(
  formId: string,
  data: {
    defaultTheme?: unknown;
  }
) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  await prisma.form.update({
    where: { id: formId },
    data: {
      defaultTheme: data.defaultTheme || undefined,
    },
  });

  revalidatePath(`/forms/${formId}/edit`);
}

export async function moveFormToSite(formId: string, siteId: string) {
  const accountId = await getCurrentAccountId();

  // Verify form ownership
  await getOwnedFormMinimal(formId, accountId);

  // Verify destination site ownership
  await getOwnedSite(siteId, accountId);

  await prisma.form.update({
    where: { id: formId },
    data: { siteId },
  });

  revalidatePath(`/forms/${formId}/edit`);
  revalidatePath(`/forms`);
}

export async function deleteForm(formId: string) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  await prisma.form.delete({
    where: { id: formId },
  });

  revalidatePath(`/forms`);
}

export async function createForm(data: {
  name: string;
  slug: string;
  siteId: string;
  notifyEmails?: string[];
  honeypotField?: string | null;
}) {
  const userId = await getCurrentUserId();
  const accountId = await getCurrentAccountId();

  // Verify site ownership
  await getOwnedSite(data.siteId, accountId);

  const form = await prisma.form.create({
    data: {
      siteId: data.siteId,
      accountId,
      createdByUserId: userId,
      name: data.name.trim(),
      slug: data.slug.trim(),
      notifyEmails: data.notifyEmails || [],
      honeypotField: data.honeypotField?.trim() || null,
    },
  });

  revalidatePath(`/forms`);
  return form;
}

"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-utils";
import { FieldType } from "@prisma/client";

type FieldInput = {
  name: string;
  type: string;
  label: string;
  placeholder?: string | null;
  required?: boolean;
  options?: unknown;
  validation?: unknown;
};

async function getOwnedForm(siteId: string, formId: string, userId: string) {
  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      siteId,
      site: {
        userId,
      },
    },
  });

  if (!form) {
    throw new Error("Form not found");
  }

  return form;
}

export async function createField(
  siteId: string,
  formId: string,
  data: FieldInput
) {
  const userId = await getCurrentUserId();
  await getOwnedForm(siteId, formId, userId);

  if (!data.name || !data.label) {
    throw new Error("Field name and label are required");
  }

  const lastField = await prisma.field.findFirst({
    where: { formId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const order = (lastField?.order ?? 0) + 1;

  return prisma.field.create({
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
}

export async function updateField(
  siteId: string,
  formId: string,
  fieldId: string,
  data: FieldInput
) {
  const userId = await getCurrentUserId();
  await getOwnedForm(siteId, formId, userId);

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

  return prisma.field.update({
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
}

export async function deleteField(
  siteId: string,
  formId: string,
  fieldId: string
) {
  const userId = await getCurrentUserId();
  await getOwnedForm(siteId, formId, userId);

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
}

export async function reorderFields(
  siteId: string,
  formId: string,
  fieldIds: string[]
) {
  const userId = await getCurrentUserId();
  await getOwnedForm(siteId, formId, userId);

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
}

export async function updateFormSettings(
  siteId: string,
  formId: string,
  data: {
    successMessage?: string | null;
    redirectUrl?: string | null;
    defaultTheme?: unknown;
  }
) {
  const userId = await getCurrentUserId();
  await getOwnedForm(siteId, formId, userId);

  const updateData: {
    successMessage?: string | null;
    redirectUrl?: string | null;
    defaultTheme?: any;
  } = {};

  if (data.successMessage !== undefined) {
    updateData.successMessage = data.successMessage?.trim() || null;
  }

  if (data.redirectUrl !== undefined) {
    updateData.redirectUrl = data.redirectUrl?.trim() || null;
  }

  if (data.defaultTheme !== undefined) {
    updateData.defaultTheme = data.defaultTheme || undefined;
  }

  await prisma.form.update({
    where: { id: formId },
    data: updateData,
  });
}

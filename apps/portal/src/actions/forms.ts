"use server";

/**
 * Shared form actions.
 * Decoupled from route structure - can be called from any route.
 * All actions enforce ownership internally via Form → Account.
 */

import { prisma } from "@/lib/db";
import { getCurrentUserId, getCurrentAccountId } from "@/lib/auth-utils";
import { FieldType, FormType, Prisma } from "@prisma/client";
import { getOwnedFormMinimal } from "@/lib/data-access/forms";
import { getAccountEntitlements } from "@/lib/data-access/entitlements";
import {
  PLAN_ERROR_CODES,
  PlanLimitError,
  PlanResolutionRequiredError,
} from "@/lib/errors/plan-errors";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";
import { fieldProblem, savedField } from "@/lib/field-rules";

type FieldInput = {
  name?: string; // Optional on create, ignored on update
  type: string;
  label: string;
  required?: boolean;
  helpText?: string | null;
  options?: unknown;
  validation?: unknown;
};

// ============================================================================
// FIELD ACTIONS
// ============================================================================

// The honeypot's name is taken too: a filled honeypot marks the submission
// as spam, so a field by that name would mark every answer to it as spam.
async function generateUniqueName(
  formId: string,
  honeypotField: string | null,
  baseSlug: string
): Promise<string> {
  const existing = await prisma.field.findMany({
    where: { formId },
    select: { name: true },
  });

  const takenNames = new Set(existing.map(f => f.name));
  if (honeypotField) takenNames.add(honeypotField);

  if (!takenNames.has(baseSlug)) {
    return baseSlug;
  }

  // Find next available suffix
  let counter = 2;
  while (takenNames.has(`${baseSlug}_${counter}`)) {
    counter++;
  }
  return `${baseSlug}_${counter}`;
}

export async function createField(formId: string, data: FieldInput) {
  const accountId = await getCurrentAccountId();
  const form = await getOwnedFormMinimal(formId, accountId);

  // The same rules the editor keeps, whatever sent the field.
  const problem = fieldProblem(data);
  if (problem) throw new Error(problem);
  const saved = savedField(data);

  // Generate unique name from label if not provided
  const fieldName = data.name?.trim() || await generateUniqueName(
    formId,
    form.honeypotField,
    slugify(saved.label)
  );
  if (fieldName === form.honeypotField) {
    throw new Error(`"${fieldName}" is this form's honeypot, so no field can use it.`);
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
      name: fieldName,
      type: saved.type as FieldType,
      label: saved.label,
      required: saved.required,
      helpText: saved.helpText,
      order,
      options: (saved.options as Prisma.InputJsonValue | null) ?? undefined,
      validation: (saved.validation as Prisma.InputJsonValue | null) ?? undefined,
    },
  });

  revalidatePath(`/forms/${formId}`);
  return field;
}

export async function updateField(
  formId: string,
  fieldId: string,
  data: FieldInput
) {
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

  // A field's name and type are fixed once it exists: the rules follow the
  // type it has, not one the request names.
  const settings = { ...data, type: field.type };
  const problem = fieldProblem(settings);
  if (problem) throw new Error(problem);
  const saved = savedField(settings);

  // Options and validation are written whole: a field whose rules were
  // cleared stores none.
  const updated = await prisma.field.update({
    where: { id: fieldId },
    data: {
      label: saved.label,
      required: saved.required,
      helpText: saved.helpText,
      options: (saved.options as Prisma.InputJsonValue | null) ?? Prisma.DbNull,
      validation: (saved.validation as Prisma.InputJsonValue | null) ?? Prisma.DbNull,
    },
  });

  revalidatePath(`/forms/${formId}`);
  return updated;
}

export async function checkFieldHasData(formId: string, fieldName: string) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  const count = await prisma.submission.count({
    where: {
      formId,
      data: { path: [fieldName], not: Prisma.DbNull },
    },
  });

  return count;
}

export async function deleteField(
  formId: string,
  fieldId: string,
  purgeData?: boolean
) {
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

  if (purgeData) {
    await prisma.$executeRaw`
      UPDATE submissions
      SET data = data - ${field.name}
      WHERE "formId" = ${formId}
    `;
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

  revalidatePath(`/forms/${formId}`);
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

  revalidatePath(`/forms/${formId}`);
}

// ============================================================================
// FORM ACTIONS
// ============================================================================

export async function updateFormBasics(
  formId: string,
  data: {
    name?: string;
    slug?: string;
    honeypotField?: string | null;
  }
) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  const updateData: {
    name?: string;
    slug?: string;
    honeypotField?: string | null;
  } = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }

  if (data.slug !== undefined) {
    updateData.slug = data.slug.trim();
  }

  if (data.honeypotField !== undefined) {
    const honeypotField = data.honeypotField?.trim() || null;
    // A filled honeypot marks the submission as spam, so a honeypot named
    // for a field would mark every answer to that field as spam.
    if (honeypotField && await prisma.field.count({ where: { formId, name: honeypotField } })) {
      throw new Error(`A field is already named "${honeypotField}", so the honeypot can't be.`);
    }
    updateData.honeypotField = honeypotField;
  }

  await prisma.form.update({
    where: { id: formId },
    data: updateData,
  });

  revalidatePath(`/forms/${formId}`);
  revalidatePath(`/forms`);
}

export async function updateAfterSubmission(
  formId: string,
  data: {
    successMessage?: string | null;
    redirectUrl?: string | null;
    emailNotificationsEnabled?: boolean;
    emailIncludeResponses?: boolean;
    notifyEmails?: string[];
    allowedOrigins?: string[];
    stopAt?: Date | null;
    maxSubmissions?: number | null;
  }
) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  const updateData: {
    successMessage?: string | null;
    redirectUrl?: string | null;
    emailNotificationsEnabled?: boolean;
    emailIncludeResponses?: boolean;
    notifyEmails?: string[];
    allowedOrigins?: string[];
    stopAt?: Date | null;
    maxSubmissions?: number | null;
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

  if (data.emailIncludeResponses !== undefined) {
    updateData.emailIncludeResponses = data.emailIncludeResponses;
  }

  if (data.notifyEmails !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    updateData.notifyEmails = [...new Set(
      data.notifyEmails
        .map(e => e.trim().toLowerCase())
        .filter(e => emailRegex.test(e))
    )].slice(0, 5);
  }

  if (data.allowedOrigins !== undefined) {
    updateData.allowedOrigins = data.allowedOrigins;
  }

  if (data.stopAt !== undefined) {
    updateData.stopAt = data.stopAt;
  }

  if (data.maxSubmissions !== undefined) {
    updateData.maxSubmissions = data.maxSubmissions;
  }

  await prisma.form.update({
    where: { id: formId },
    data: updateData,
  });

  revalidatePath(`/forms/${formId}`);
}

// Legacy alias for backwards compatibility (if needed)
export const updateFormBehavior = updateAfterSubmission;

export async function updateFormHeader(
  formId: string,
  data: { title?: string | null; description?: string | null }
) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  const MAX_TITLE = 120;
  const MAX_DESC = 400;

  const updateData: { title?: string | null; description?: string | null } = {};

  if (data.title !== undefined) {
    const title = data.title?.trim() || null;
    if (title && title.length > MAX_TITLE) {
      throw new Error(`Title must be ${MAX_TITLE} characters or fewer`);
    }
    updateData.title = title;
  }

  if (data.description !== undefined) {
    const description = data.description?.trim() || null;
    if (description && description.length > MAX_DESC) {
      throw new Error(`Description must be ${MAX_DESC} characters or fewer`);
    }
    updateData.description = description;
  }

  await prisma.form.update({
    where: { id: formId },
    data: updateData,
  });

  revalidatePath(`/forms/${formId}`);
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

  revalidatePath(`/forms/${formId}`);
  revalidatePath(`/f/${formId}`);
}

export async function toggleFormPublished(formId: string, published: boolean) {
  const accountId = await getCurrentAccountId();
  const form = await getOwnedFormMinimal(formId, accountId);

  // Unpublishing is always allowed; it releases a slot and cannot violate a
  // plan limit. Re-publishing an already-published form is also a no-op.
  if (published && !form.published) {
    // Submissions store only fields, so a form without one has nothing to take.
    if ((await prisma.field.count({ where: { formId } })) === 0) {
      throw new Error("A form needs a field before it can be published.");
    }

    const entitlements = await getAccountEntitlements(accountId);

    if (entitlements.requiresPlanResolution) {
      throw new PlanResolutionRequiredError();
    }

    if (!entitlements.canPublishAnother) {
      throw new PlanLimitError({
        code: PLAN_ERROR_CODES.MAX_PUBLISHED_FORMS_REACHED,
        planCode: entitlements.planCode,
        maxPublishedForms: entitlements.maxPublishedForms,
      });
    }
  }

  await prisma.form.update({
    where: { id: formId },
    data: { published },
  });

  revalidatePath(`/forms/${formId}`);
  revalidatePath(`/f/${formId}`);
}

export async function deleteForm(formId: string) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  await prisma.form.delete({
    where: { id: formId },
  });

  revalidatePath(`/forms`);
}

export async function markAllSubmissionsRead(formId: string) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  await prisma.submission.updateMany({
    where: { formId, status: "NEW" },
    data: { status: "READ" },
  });

  revalidatePath(`/forms/${formId}`);
}

export async function updateFormThumbnail(formId: string, thumbnailBase64: string) {
  const accountId = await getCurrentAccountId();
  await getOwnedFormMinimal(formId, accountId);

  // Max ~1.5MB decoded image
  if (thumbnailBase64.length > 2_000_000) {
    throw new Error("Thumbnail too large");
  }

  const thumbnailBytes = Buffer.from(thumbnailBase64, "base64");

  await prisma.form.update({
    where: { id: formId },
    data: { thumbnail: thumbnailBytes },
  });
}

export async function createForm(data: {
  name: string;
  slug: string;
  type: FormType;
  notifyEmails?: string[];
  honeypotField?: string | null;
}) {
  const userId = await getCurrentUserId();
  const accountId = await getCurrentAccountId();

  const form = await prisma.form.create({
    data: {
      accountId,
      createdByUserId: userId,
      name: data.name.trim(),
      slug: data.slug.trim(),
      type: data.type,
      notifyEmails: data.notifyEmails || [],
      honeypotField: data.honeypotField?.trim() || null,
      allowedOrigins: [],
    },
  });

  revalidatePath(`/forms`);
  return form;
}

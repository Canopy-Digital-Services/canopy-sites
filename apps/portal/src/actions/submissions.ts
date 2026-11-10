"use server";

/**
 * A submission's status and spam flag, set from its page. Each action
 * resolves the caller's form, then changes the submission only as one of
 * that form's: a submission of any other form is not found.
 */

import { redirect } from "next/navigation";
import { SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentAccountId } from "@/lib/auth-utils";
import { getOwnedFormMinimal } from "@/lib/data-access/forms";
import { requireId } from "@/lib/ids";

const STATUSES: readonly string[] = Object.values(SubmissionStatus);

/** Changes one submission of the caller's form, and returns its page. */
async function updateOwnSubmission(
  formId: unknown,
  submissionId: unknown,
  data: { status: SubmissionStatus } | { isSpam: boolean }
): Promise<string> {
  const id = requireId(submissionId, "submission id");
  const accountId = await getCurrentAccountId();
  const form = await getOwnedFormMinimal(requireId(formId, "form id"), accountId);

  const { count } = await prisma.submission.updateMany({
    where: { id, formId: form.id },
    data,
  });
  if (count === 0) throw new Error("Submission not found");

  return `/forms/${form.id}/submissions/${id}`;
}

export async function setSubmissionStatus(formId: string, submissionId: string, status: string) {
  if (typeof status !== "string" || !STATUSES.includes(status)) {
    throw new Error("Invalid status");
  }
  redirect(await updateOwnSubmission(formId, submissionId, { status: status as SubmissionStatus }));
}

export async function setSubmissionSpam(formId: string, submissionId: string, isSpam: boolean) {
  if (typeof isSpam !== "boolean") {
    throw new Error("Invalid spam flag");
  }
  redirect(await updateOwnSubmission(formId, submissionId, { isSpam }));
}

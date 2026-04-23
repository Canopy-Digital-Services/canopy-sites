import { requireAuth } from "@/lib/auth-utils";
import { getOwnedForm } from "@/lib/data-access/forms";
import { notFound } from "next/navigation";
import { FormWorkspace } from "@/components/forms/form-workspace";
import { prisma } from "@/lib/db";
import { SubmissionStatus } from "@prisma/client";
import { buildSubmissionPreview } from "@/lib/submission-preview";
import { getAccountEntitlements } from "@/lib/data-access/entitlements";
import { formatPublishDisabledReason } from "@/lib/copy/plans";

export default async function FormViewRoute({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ mode?: string; status?: string }>;
}) {
  const { formId } = await params;
  const { mode, status: statusParam } = await searchParams;
  const session = await requireAuth();
  const accountId = (await import("@/lib/auth-utils")).getCurrentAccountId();

  let form;
  try {
    form = await getOwnedForm(formId, await accountId);
  } catch {
    notFound();
  }

  const apiUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3006"
  ).replace(/\/$/, "");

  const statusFilter = statusParam || "all";

  let submissions: Array<{
    id: string;
    createdAt: string;
    status: string;
    preview: string;
  }> = [];

  if (mode === "submissions") {
    const where: {
      formId: string;
      isSpam?: boolean;
      status?: SubmissionStatus | { not: SubmissionStatus };
    } = { formId };

    if (statusFilter === "spam") {
      where.isSpam = true;
    } else if (statusFilter === "all") {
      where.isSpam = false;
      where.status = { not: "ARCHIVED" as SubmissionStatus };
    } else {
      where.isSpam = false;
      where.status = statusFilter.toUpperCase() as SubmissionStatus;
    }

    const raw = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const previewFields = form.fields.map((f) => ({
      name: f.name,
      type: f.type,
      options: f.options,
    }));

    submissions = raw.map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      status: s.status,
      preview: buildSubmissionPreview(
        previewFields,
        s.data as Record<string, unknown>
      ),
    }));
  }

  const entitlements = await getAccountEntitlements(await accountId);
  const publishDisabledReason =
    !form.published && !entitlements.canPublishAnother
      ? formatPublishDisabledReason(
          entitlements.planDisplayName,
          entitlements.maxPublishedForms
        )
      : undefined;

  return (
    <FormWorkspace
      apiUrl={apiUrl}
      ownerEmail={session.user.email || ""}
      form={form}
      submissions={submissions}
      statusFilter={statusFilter}
      publishDisabledReason={publishDisabledReason}
    />
  );
}

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
  searchParams: Promise<{ mode?: string; status?: string; spam?: string }>;
}) {
  const { formId } = await params;
  const { mode, status: statusParam, spam: spamParam } = await searchParams;
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
  const spamFilter = spamParam || "all";

  let submissions: Array<{
    id: string;
    createdAt: string;
    status: string;
    isSpam: boolean;
    preview: string;
  }> = [];

  if (mode === "submissions") {
    const statusValue =
      statusFilter !== "all" ? (statusFilter.toUpperCase() as SubmissionStatus) : undefined;
    const spamValue =
      spamFilter === "yes" ? true : spamFilter === "no" ? false : undefined;

    const raw = await prisma.submission.findMany({
      where: {
        formId,
        ...(statusValue !== undefined ? { status: statusValue } : {}),
        ...(spamValue !== undefined ? { isSpam: spamValue } : {}),
      },
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
      isSpam: s.isSpam,
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
      spamFilter={spamFilter}
      publishDisabledReason={publishDisabledReason}
    />
  );
}

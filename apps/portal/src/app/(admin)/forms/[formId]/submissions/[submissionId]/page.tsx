import { redirect } from "next/navigation";
import { SubmissionStatus } from "@prisma/client";
import { getOwnedForm } from "@/lib/data-access/forms";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCompositeValue, isCompositeFieldType } from "@/lib/composite-format";
import { PageHeader } from "@/components/patterns/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContent } from "@/components/patterns/page-content";

async function updateStatus(
  formId: string,
  submissionId: string,
  status: string
) {
  "use server";

  const accountId = (await import("@/lib/auth-utils")).getCurrentAccountId();
  await getOwnedForm(formId, await accountId);

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: status as SubmissionStatus },
  });

  redirect(`/forms/${formId}/submissions/${submissionId}`);
}

async function toggleSpam(
  formId: string,
  submissionId: string,
  currentIsSpam: boolean
) {
  "use server";

  const accountId = (await import("@/lib/auth-utils")).getCurrentAccountId();
  await getOwnedForm(formId, await accountId);

  await prisma.submission.update({
    where: { id: submissionId },
    data: { isSpam: !currentIsSpam },
  });

  redirect(`/forms/${formId}/submissions/${submissionId}`);
}

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ formId: string; submissionId: string }>;
}) {
  const { formId, submissionId } = await params;
  const accountId = (await import("@/lib/auth-utils")).getCurrentAccountId();

  let form;
  try {
    form = await getOwnedForm(formId, await accountId);
  } catch {
    notFound();
  }

  const submission = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      formId,
    },
  });

  if (!submission) {
    notFound();
  }

  // Build field lookup map (label, type, options) for pretty rendering
  const fieldMap = new Map(
    form.fields.map((f) => [
      f.name,
      { label: f.label, type: f.type, options: f.options },
    ])
  );

  const data = submission.data as Record<string, unknown>;

  // Display entries in the form's current field order, then append any
  // orphan keys (from fields that have since been removed from the form).
  const orderedFieldNames = [...form.fields]
    .sort((a, b) => a.order - b.order)
    .map((f) => f.name);
  const orphanKeys = Object.keys(data).filter((k) => !fieldMap.has(k));
  const displayKeys = [
    ...orderedFieldNames.filter((name) => name in data),
    ...orphanKeys,
  ];
  const meta = submission.meta as {
    ipHash?: string;
    userAgent?: string;
    referrer?: string;
    origin?: string;
  };

  return (
    <PageContent>
    <div className="space-y-6">
      <PageHeader
        title="Submission Details"
        description={form.name}
        backHref={`/forms/${formId}?mode=submissions`}
      />

      <div className="flex items-center gap-3">
        <Badge variant={submission.status === "NEW" ? "default" : "secondary"}>
          {submission.status}
        </Badge>
        {submission.isSpam && <Badge variant="destructive">SPAM</Badge>}
        <span className="text-sm text-muted-foreground">
          {submission.createdAt.toLocaleString()}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayKeys.map((key) => {
              const value = data[key];
              const fieldInfo = fieldMap.get(key);
              const label = fieldInfo?.label || key;
              return (
                <div key={key}>
                  <div className="text-sm font-medium text-muted-foreground">
                    {label}
                  </div>
                  <div className="text-sm mt-1">
                    {typeof value === "boolean"
                      ? value ? "Yes" : "No"
                      : Array.isArray(value)
                      ? (value as string[]).join(", ")
                      : typeof value === "object" && value !== null
                      ? fieldInfo && isCompositeFieldType(fieldInfo.type)
                        ? formatCompositeValue(
                            fieldInfo.type,
                            value as Record<string, unknown>,
                            fieldInfo.options
                          )
                        : JSON.stringify(value, null, 2)
                      : String(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">IP Hash</div>
              <code className="text-xs bg-muted px-2 py-1 rounded-md">
                {meta.ipHash}
              </code>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">
                User Agent
              </div>
              <div>{meta.userAgent || "N/A"}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Referrer</div>
              <div>{meta.referrer || "N/A"}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Origin</div>
              <div>{meta.origin || "N/A"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardFooter>
          <div className="flex flex-wrap gap-2">
            <form action={updateStatus.bind(null, formId, submissionId, "READ")}>
              <Button
                type="submit"
                variant={submission.status === "NEW" ? "default" : "outline"}
                disabled={submission.status === "READ"}
              >
                Mark as Read
              </Button>
            </form>
            <form
              action={updateStatus.bind(null, formId, submissionId, "ARCHIVED")}
            >
              <Button
                type="submit"
                variant="outline"
                disabled={submission.status === "ARCHIVED"}
              >
                Archive
              </Button>
            </form>
            <form action={updateStatus.bind(null, formId, submissionId, "NEW")}>
              <Button
                type="submit"
                variant="outline"
                disabled={submission.status === "NEW"}
              >
                Mark as New
              </Button>
            </form>
            <form
              action={toggleSpam.bind(null, formId, submissionId, submission.isSpam)}
            >
              <Button
                type="submit"
                variant={submission.isSpam ? "default" : "outline"}
              >
                {submission.isSpam ? "Not Spam" : "Mark as Spam"}
              </Button>
            </form>
          </div>
        </CardFooter>
      </Card>
    </div>
    </PageContent>
  );
}

import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getOwnedForm } from "@/lib/data-access/forms";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    data: { status: status as any },
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

  const data = submission.data as Record<string, unknown>;
  const meta = submission.meta as {
    ipHash?: string;
    userAgent?: string;
    referrer?: string;
    origin?: string;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submission Details"
        description={`${form.name} • ${submission.createdAt.toLocaleString()}`}
        actions={
          <Link href={`/forms/${formId}/submissions`}>
            <Button variant="outline">Back to Submissions</Button>
          </Link>
        }
      />

      <div className="flex gap-2">
        <Badge variant={submission.status === "NEW" ? "default" : "secondary"}>
          {submission.status}
        </Badge>
        {submission.isSpam && <Badge variant="destructive">SPAM</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data).map(([key, value]) => (
              <div key={key}>
                <div className="text-sm font-medium text-muted-foreground">
                  {key}
                </div>
                <div className="text-sm mt-1">
                  {typeof value === "object"
                    ? JSON.stringify(value, null, 2)
                    : String(value)}
                </div>
              </div>
            ))}
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
              <code className="text-xs bg-muted px-2 py-1 rounded">
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
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <form action={updateStatus.bind(null, formId, submissionId, "READ")}>
              <Button
                type="submit"
                variant="outline"
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
        </CardContent>
      </Card>
    </div>
  );
}

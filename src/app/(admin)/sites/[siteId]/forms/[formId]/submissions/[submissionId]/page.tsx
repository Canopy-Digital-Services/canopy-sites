import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

async function updateStatus(
  siteId: string,
  formId: string,
  submissionId: string,
  status: string
) {
  "use server";

  const userId = await getCurrentUserId();

  // Verify ownership
  const site = await prisma.site.findFirst({
    where: { id: siteId, userId },
  });

  if (!site) {
    throw new Error("Site not found");
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: status as any },
  });

  redirect(
    `/sites/${siteId}/forms/${formId}/submissions/${submissionId}`
  );
}

async function toggleSpam(
  siteId: string,
  formId: string,
  submissionId: string,
  currentIsSpam: boolean
) {
  "use server";

  const userId = await getCurrentUserId();

  // Verify ownership
  const site = await prisma.site.findFirst({
    where: { id: siteId, userId },
  });

  if (!site) {
    throw new Error("Site not found");
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: { isSpam: !currentIsSpam },
  });

  redirect(
    `/sites/${siteId}/forms/${formId}/submissions/${submissionId}`
  );
}

export default async function SubmissionDetailPage({
  params,
}: {
  params: { siteId: string; formId: string; submissionId: string };
}) {
  const userId = await getCurrentUserId();

  const site = await prisma.site.findFirst({
    where: {
      id: params.siteId,
      userId,
    },
    include: {
      forms: {
        where: { id: params.formId },
        include: {
          submissions: {
            where: { id: params.submissionId },
          },
        },
      },
    },
  });

  if (
    !site ||
    site.forms.length === 0 ||
    site.forms[0].submissions.length === 0
  ) {
    notFound();
  }

  const form = site.forms[0];
  const submission = form.submissions[0];
  const data = submission.data as Record<string, any>;
  const meta = submission.meta as Record<string, any>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Submission Details</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {form.name} • {submission.createdAt.toLocaleString()}
          </p>
        </div>
        <Link
          href={`/sites/${params.siteId}/forms/${params.formId}/submissions`}
        >
          <Button variant="outline">Back to Submissions</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Badge
          variant={submission.status === "NEW" ? "default" : "secondary"}
        >
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
                <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
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
              <div className="font-medium text-zinc-600 dark:text-zinc-400">
                IP Hash
              </div>
              <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                {meta.ipHash}
              </code>
            </div>
            <div>
              <div className="font-medium text-zinc-600 dark:text-zinc-400">
                User Agent
              </div>
              <div>{meta.userAgent}</div>
            </div>
            <div>
              <div className="font-medium text-zinc-600 dark:text-zinc-400">
                Referrer
              </div>
              <div>{meta.referrer || "N/A"}</div>
            </div>
            <div>
              <div className="font-medium text-zinc-600 dark:text-zinc-400">
                Origin
              </div>
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
            <form
              action={updateStatus.bind(
                null,
                params.siteId,
                params.formId,
                params.submissionId,
                "READ"
              )}
            >
              <Button
                type="submit"
                variant="outline"
                disabled={submission.status === "READ"}
              >
                Mark as Read
              </Button>
            </form>
            <form
              action={updateStatus.bind(
                null,
                params.siteId,
                params.formId,
                params.submissionId,
                "ARCHIVED"
              )}
            >
              <Button
                type="submit"
                variant="outline"
                disabled={submission.status === "ARCHIVED"}
              >
                Archive
              </Button>
            </form>
            <form
              action={updateStatus.bind(
                null,
                params.siteId,
                params.formId,
                params.submissionId,
                "NEW"
              )}
            >
              <Button
                type="submit"
                variant="outline"
                disabled={submission.status === "NEW"}
              >
                Mark as New
              </Button>
            </form>
            <form
              action={toggleSpam.bind(
                null,
                params.siteId,
                params.formId,
                params.submissionId,
                submission.isSpam
              )}
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

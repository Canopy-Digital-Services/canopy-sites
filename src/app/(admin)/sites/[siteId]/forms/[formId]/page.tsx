import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function FormDetailPage({
  params,
}: {
  params: { siteId: string; formId: string };
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
          _count: {
            select: { submissions: true },
          },
        },
      },
    },
  });

  if (!site || site.forms.length === 0) {
    notFound();
  }

  const form = site.forms[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{form.name}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {site.name} • {form.slug}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/sites/${site.id}/forms/${form.id}/edit`}>
            <Button variant="outline">Edit Form</Button>
          </Link>
          <Link href={`/sites/${site.id}/forms/${form.id}/submissions`}>
            <Button>View Submissions</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Slug
              </div>
              <code className="text-sm bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                {form.slug}
              </code>
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Notification Emails
              </div>
              <div className="text-sm">
                {form.notifyEmails.length > 0 ? (
                  form.notifyEmails.join(", ")
                ) : (
                  <span className="text-zinc-500">None configured</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Honeypot Field
              </div>
              <div className="text-sm">
                {form.honeypotField || (
                  <span className="text-zinc-500">Not configured</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Total Submissions
              </div>
              <div className="text-2xl font-bold">
                {form._count.submissions}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Integration</CardTitle>
            <Link href={`/sites/${site.id}/forms/${form.id}/integrate`}>
              <Button variant="outline" size="sm">
                View Integration Guide
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm font-medium">API Endpoint</div>
            <code className="block text-xs bg-zinc-100 dark:bg-zinc-800 p-3 rounded overflow-x-auto">
              POST /api/v1/submit/{site.apiKey}/{form.slug}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

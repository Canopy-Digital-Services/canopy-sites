import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyButton } from "@/components/copy-button";

export default async function SiteDetailPage({
  params,
}: {
  params: { siteId: string };
}) {
  const userId = await getCurrentUserId();

  const site = await prisma.site.findFirst({
    where: {
      id: params.siteId,
      userId,
    },
    include: {
      forms: {
        include: {
          _count: {
            select: { submissions: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!site) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{site.name}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">{site.domain}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/sites/${site.id}/edit`}>
            <Button variant="outline">Edit Site</Button>
          </Link>
          <Link href={`/sites/${site.id}/forms/new`}>
            <Button>Create Form</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">API Key</Label>
            <div className="flex gap-2 mt-2">
              <code className="flex-1 text-sm bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded">
                {site.apiKey}
              </code>
              <CopyButton text={site.apiKey} />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Use this key in your form submission URLs
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Forms</h2>
        {site.forms.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Create your first form to start collecting submissions
            </p>
            <Link href={`/sites/${site.id}/forms/new`}>
              <Button>Create Form</Button>
            </Link>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {site.forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/sites/${site.id}/forms/${form.id}`}
                        className="hover:underline"
                      >
                        {form.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                        {form.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {form._count.submissions}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link
                          href={`/sites/${site.id}/forms/${form.id}/submissions`}
                        >
                          <Button variant="ghost" size="sm">
                            Submissions
                          </Button>
                        </Link>
                        <Link
                          href={`/sites/${site.id}/forms/${form.id}/edit`}
                        >
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}

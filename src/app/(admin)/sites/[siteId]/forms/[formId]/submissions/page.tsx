import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";

export default async function SubmissionsPage({
  params,
  searchParams,
}: {
  params: { siteId: string; formId: string };
  searchParams: { status?: string; spam?: string };
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
      },
    },
  });

  if (!site || site.forms.length === 0) {
    notFound();
  }

  const form = site.forms[0];

  // Build filters
  const filters: any = { formId: form.id };
  
  if (searchParams.status && searchParams.status !== "all") {
    filters.status = searchParams.status.toUpperCase();
  }
  
  if (searchParams.spam === "yes") {
    filters.isSpam = true;
  } else if (searchParams.spam === "no") {
    filters.isSpam = false;
  }

  const submissions = await prisma.submission.findMany({
    where: filters,
    orderBy: { createdAt: "desc" },
    take: 50, // Limit to 50 for now
  });

  const statusFilter = searchParams.status || "all";
  const spamFilter = searchParams.spam || "all";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Submissions</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {form.name} on {site.name}
          </p>
        </div>
        <Link
          href={`/sites/${params.siteId}/forms/${params.formId}/submissions/export`}
        >
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div>
          <label className="text-sm font-medium">Status</label>
          <div className="flex gap-2 mt-1">
            {["all", "NEW", "READ", "ARCHIVED"].map((status) => (
              <Link
                key={status}
                href={`?status=${status}&spam=${spamFilter}`}
              >
                <Button
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                >
                  {status}
                </Button>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Spam</label>
          <div className="flex gap-2 mt-1">
            {[
              { value: "all", label: "All" },
              { value: "no", label: "Not Spam" },
              { value: "yes", label: "Spam" },
            ].map((option) => (
              <Link
                key={option.value}
                href={`?status=${statusFilter}&spam=${option.value}`}
              >
                <Button
                  variant={spamFilter === option.value ? "default" : "outline"}
                  size="sm"
                >
                  {option.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Submissions will appear here once your form receives data
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => {
                const data = submission.data as Record<string, any>;
                const preview = Object.entries(data)
                  .slice(0, 2)
                  .map(([key, value]) => `${key}: ${String(value).substring(0, 30)}`)
                  .join(", ");

                return (
                  <TableRow key={submission.id}>
                    <TableCell>
                      {submission.createdAt.toLocaleDateString()}{" "}
                      {submission.createdAt.toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            submission.status === "NEW"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {submission.status}
                        </Badge>
                        {submission.isSpam && (
                          <Badge variant="destructive">SPAM</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {preview}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/sites/${params.siteId}/forms/${params.formId}/submissions/${submission.id}`}
                      >
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

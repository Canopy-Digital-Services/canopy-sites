import { getCurrentUserId } from "@/lib/auth-utils";
import { getOwnedForm } from "@/lib/data-access/forms";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { DataTable } from "@/components/patterns/data-table";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Download, FileText, ChevronDown } from "lucide-react";

export default async function SubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: { status?: string; spam?: string };
}) {
  const { formId } = await params;
  const accountId = (await import("@/lib/auth-utils")).getCurrentAccountId();

  let form;
  try {
    form = await getOwnedForm(formId, await accountId);
  } catch {
    notFound();
  }

  // Build filters
  const filters: any = { formId };

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
    take: 50,
  });

  const statusFilter = searchParams.status || "all";
  const spamFilter = searchParams.spam || "all";

  const columns = [
    {
      key: "date",
      header: "Date",
      cell: (submission: typeof submissions[0]) => (
        <span className="text-sm">
          {submission.createdAt.toLocaleDateString()}{" "}
          {submission.createdAt.toLocaleTimeString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (submission: typeof submissions[0]) => (
        <div className="flex gap-2">
          <Badge variant={submission.status === "NEW" ? "default" : "secondary"}>
            {submission.status}
          </Badge>
          {submission.isSpam && <Badge variant="destructive">SPAM</Badge>}
        </div>
      ),
    },
    {
      key: "preview",
      header: "Preview",
      cell: (submission: typeof submissions[0]) => {
        const data = submission.data as Record<string, any>;
        const preview = Object.entries(data)
          .slice(0, 2)
          .map(([key, value]) => `${key}: ${String(value).substring(0, 30)}`)
          .join(", ");
        return <span className="text-sm truncate max-w-md">{preview}</span>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (submission: typeof submissions[0]) => (
        <Link href={`/forms/${formId}/submissions/${submission.id}`}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submissions"
        description={`${form.name} on ${form.site.name}`}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/forms/${formId}/submissions/export?format=csv`}>
                  Export CSV
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/forms/${formId}/submissions/export?format=json`}>
                  Export JSON
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-sm font-medium">Status</label>
          <div className="flex gap-2 mt-1">
            {["all", "NEW", "READ", "ARCHIVED"].map((status) => (
              <Link key={status} href={`?status=${status}&spam=${spamFilter}`}>
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
        <EmptyState
          icon={<FileText className="h-10 w-10 text-muted-foreground" />}
          title="No submissions yet"
          description="Submissions will appear here once your form receives data"
        />
      ) : (
        <DataTable columns={columns} data={submissions} />
      )}
    </div>
  );
}

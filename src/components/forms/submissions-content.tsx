"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/patterns/data-table";
import { EmptyState } from "@/components/patterns/empty-state";
import { ArrowRight, Download, ChevronDown, FileText } from "lucide-react";

type Submission = {
  id: string;
  createdAt: string;
  status: string;
  isSpam: boolean;
  preview: string;
};

type SubmissionsContentProps = {
  formId: string;
  submissions: Submission[];
  statusFilter: string;
  spamFilter: string;
};

export function SubmissionsContent({
  formId,
  submissions,
  statusFilter,
  spamFilter,
}: SubmissionsContentProps) {
  const columns = [
    {
      key: "date",
      header: "Date",
      cell: (s: Submission) => (
        <span className="text-sm">
          {s.createdAt.slice(0, 10)}{" "}
          {s.createdAt.slice(11, 19)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (s: Submission) => (
        <div className="flex gap-2">
          <Badge variant={s.status === "NEW" ? "default" : "secondary"}>
            {s.status}
          </Badge>
          {s.isSpam && <Badge variant="destructive">SPAM</Badge>}
        </div>
      ),
    },
    {
      key: "preview",
      header: "Preview",
      cell: (s: Submission) => (
        <span className="text-sm truncate max-w-md">
          {s.preview || (
            <span className="text-muted-foreground">&mdash;</span>
          )}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (s: Submission) => (
        <Link href={`/forms/${formId}/submissions/${s.id}`}>
          <Button variant="ghost" size="sm">
            View
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex gap-4 flex-wrap items-end">
        <div>
          <label className="text-sm font-medium">Status</label>
          <div className="flex gap-2 mt-1">
            {[
              { value: "all", label: "All" },
              { value: "NEW", label: "New" },
              { value: "READ", label: "Read" },
              { value: "ARCHIVED", label: "Archived" },
            ].map((option) => (
              <Link
                key={option.value}
                href={`?mode=submissions&status=${option.value}&spam=${spamFilter}`}
              >
                <Button
                  variant={statusFilter === option.value ? "secondary" : "outline"}
                  size="sm"
                >
                  {option.label}
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
                href={`?mode=submissions&status=${statusFilter}&spam=${option.value}`}
              >
                <Button
                  variant={spamFilter === option.value ? "secondary" : "outline"}
                  size="sm"
                >
                  {option.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
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

"use client";

import Link from "next/link";
import { useTransition } from "react";
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
import { ArrowRight, Download, ChevronDown, FileText, CheckCheck } from "lucide-react";
import { markAllSubmissionsRead } from "@/actions/forms";
import { cn } from "@/lib/utils";

type Submission = {
  id: string;
  createdAt: string;
  status: string;
  preview: string;
};

type SubmissionsContentProps = {
  formId: string;
  submissions: Submission[];
  statusFilter: string;
};

export function SubmissionsContent({
  formId,
  submissions,
  statusFilter,
}: SubmissionsContentProps) {
  const [isPending, startTransition] = useTransition();
  const hasNew = submissions.some((s) => s.status === "NEW");

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllSubmissionsRead(formId);
    });
  }

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
        <Badge variant={s.status === "NEW" ? "default" : "secondary"}>
          {s.status}
        </Badge>
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
      <div className="flex gap-4 flex-wrap items-center">
        <div className="inline-flex h-8 items-center bg-muted-foreground/10 rounded-lg p-[3px]">
          {[
            { value: "all", label: "All" },
            { value: "NEW", label: "New" },
            { value: "READ", label: "Read" },
            { value: "ARCHIVED", label: "Archived" },
            { value: "spam", label: "Spam" },
          ].map((option) => (
            <Link
              key={option.value}
              href={`?mode=submissions&status=${option.value}`}
              className="h-full"
            >
              <span
                className={cn(
                  "inline-flex h-full items-center rounded-md px-3 text-sm font-medium transition-colors",
                  statusFilter === option.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </span>
            </Link>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 ${!hasNew ? "invisible" : ""}`}
            onClick={handleMarkAllRead}
            disabled={isPending || !hasNew}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
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
          icon={<FileText className="h-9 w-9" />}
          title={
            statusFilter === "all" ? "No submissions yet" :
            statusFilter === "NEW" ? "No new submissions" :
            statusFilter === "READ" ? "No read submissions" :
            statusFilter === "ARCHIVED" ? "No archived submissions" :
            statusFilter === "spam" ? "No spam submissions" :
            "No submissions"
          }
        />
      ) : (
        <DataTable columns={columns} data={submissions} />
      )}
    </div>
  );
}

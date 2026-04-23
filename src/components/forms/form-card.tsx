"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteFormIcon } from "@/components/delete-form-icon";
import type { getUserForms } from "@/lib/data-access/forms";

type FormCardProps = {
  form: Awaited<ReturnType<typeof getUserForms>>[number] & { published: boolean };
};

export function FormCard({ form }: FormCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow overflow-hidden">
      {/* Thumbnail — decorative link, form name below is the real nav target */}
      <Link href={`/forms/${form.id}`} className="block" aria-hidden="true" tabIndex={-1}>
        <div className="aspect-[16/10] bg-muted/40 overflow-hidden">
          <img
            src={`/api/forms/${form.id}/thumbnail`}
            alt=""
            className="w-full h-full object-cover object-top"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      </Link>

      {/* Content */}
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/forms/${form.id}`} className="text-base font-semibold tracking-tight hover:underline truncate">
            {form.name}
          </Link>
          <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="View submissions"
                  asChild
                >
                  <Link href={`/forms/${form.id}?mode=submissions`}>
                    <ClipboardList className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View submissions</TooltipContent>
            </Tooltip>
            <DeleteFormIcon formId={form.id} formName={form.name} />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {form.published ? (
            <Badge variant="default" className="text-[11px] mr-2">Published</Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] mr-2">Draft</Badge>
          )}
          {form._count.fields} {form._count.fields === 1 ? "field" : "fields"} &middot;{" "}
          {form._count.submissions} {form._count.submissions === 1 ? "submission" : "submissions"}
          {form.newSubmissionsCount > 0 && (
            <span className="text-success font-medium">
              {" "}({form.newSubmissionsCount} new)
            </span>
          )}
        </p>
      </div>
    </Card>
  );
}

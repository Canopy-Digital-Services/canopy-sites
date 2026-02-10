import { getCurrentUserId } from "@/lib/auth-utils";
import { getUserForms } from "@/lib/data-access/forms";
import { PageHeader } from "@/components/patterns/page-header";
import { DataTable } from "@/components/patterns/data-table";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteFormIcon } from "@/components/delete-form-icon";
import Link from "next/link";
import { FileText, Plus, Pencil, ClipboardList } from "lucide-react";

export default async function FormsPage() {
  const accountId = (await import("@/lib/auth-utils")).getCurrentAccountId();
  const forms = await getUserForms(await accountId);

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (form: typeof forms[0]) => (
        <Link href={`/forms/${form.id}/edit`} className="font-medium hover:underline">
          {form.name}
        </Link>
      ),
    },
    {
      key: "fields",
      header: "Fields",
      cell: (form: typeof forms[0]) => (
        <Badge variant="secondary">{form._count.fields}</Badge>
      ),
    },
    {
      key: "submissions",
      header: "Submissions",
      cell: (form: typeof forms[0]) => (
        <Badge variant="secondary">{form._count.submissions}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (form: typeof forms[0]) => (
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/forms/${form.id}/edit`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="Edit form"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit form</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/forms/${form.id}/submissions`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="View submissions"
                  >
                    <ClipboardList className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>View submissions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DeleteFormIcon formId={form.id} formName={form.name} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forms"
        description="Manage all your forms across sites"
        actions={
          <CreateFormButton />
        }
      />

      {forms.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10 text-muted-foreground" />}
          title="No forms yet"
          description="Create your first form to start collecting submissions"
          action={<CreateFormButton />}
        />
      ) : (
        <DataTable columns={columns} data={forms} />
      )}
    </div>
  );
}

function CreateFormButton() {
  return (
    <Link href="/forms/new">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Create Form
      </Button>
    </Link>
  );
}

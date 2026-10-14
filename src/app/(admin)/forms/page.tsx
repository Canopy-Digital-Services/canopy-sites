import { getUserForms } from "@/lib/data-access/forms";
import { PageHeader } from "@/components/patterns/page-header";
import { DataTable } from "@/components/patterns/data-table";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteFormIcon } from "@/components/delete-form-icon";
import { FormCard } from "@/components/forms/form-card";
import { ViewToggle } from "@/components/forms/view-toggle";
import Link from "next/link";
import { FileText, Plus, ClipboardList } from "lucide-react";
import { PageContent } from "@/components/patterns/page-content";

type FormRow = Awaited<ReturnType<typeof getUserForms>>[number] & { published: boolean };

export default async function FormsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: viewParam } = await searchParams;
  const view = viewParam === "list" ? "list" : "grid";

  const accountId = (await import("@/lib/auth-utils")).getCurrentAccountId();
  const forms = await getUserForms(await accountId);

  const totalSubmissions = forms.reduce((sum, f) => sum + f._count.submissions, 0);
  const totalNew = forms.reduce((sum, f) => sum + f.newSubmissionsCount, 0);

  return (
    <PageContent>
      <div className="space-y-6">
        <PageHeader
          title="Forms"
          actions={
            forms.length > 0 ? (
              <>
                <ViewToggle view={view} />
                <CreateFormButton />
              </>
            ) : undefined
          }
        />

        {forms.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-9 w-9" />}
            title="No forms yet"
            description="Create your first form to start collecting submissions"
            action={<CreateFormButton />}
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {forms.length} {forms.length === 1 ? "form" : "forms"} &middot;{" "}
              {totalSubmissions} {totalSubmissions === 1 ? "submission" : "submissions"}
              {totalNew > 0 && (
                <span className="text-success-strong font-medium">
                  {" "}&middot; {totalNew} new
                </span>
              )}
            </p>

            {view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {forms.map((form) => (
                  <FormCard key={form.id} form={form as FormRow} />
                ))}
              </div>
            ) : (
              <FormsListView forms={forms as FormRow[]} />
            )}
          </>
        )}
      </div>
    </PageContent>
  );
}

function CreateFormButton() {
  return (
    <Link href="/forms/new">
      <Button>
        <Plus className="h-4 w-4" />
        Create Form
      </Button>
    </Link>
  );
}

function FormsListView({ forms }: { forms: FormRow[] }) {
  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (form: FormRow) => (
        <Link href={`/forms/${form.id}`} className="font-medium hover:underline">
          {form.name}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (form: FormRow) =>
        form.published ? (
          <Badge variant="default" className="text-[11px]">Published</Badge>
        ) : (
          <Badge variant="outline" className="text-[11px]">Draft</Badge>
        ),
    },
    {
      key: "fields",
      header: "Fields",
      cell: (form: FormRow) => (
        <span className="text-sm text-muted-foreground">{form._count.fields}</span>
      ),
    },
    {
      key: "submissions",
      header: "Submissions",
      cell: (form: FormRow) => (
        <span className="text-sm text-muted-foreground">
          {form._count.submissions}
          {form.newSubmissionsCount > 0 && (
            <span className="text-success-strong font-medium">
              {" "}({form.newSubmissionsCount} new)
            </span>
          )}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (form: FormRow) => (
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/forms/${form.id}?mode=submissions`}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="View submissions"
                >
                  <ClipboardList className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>View submissions</TooltipContent>
          </Tooltip>
          <DeleteFormIcon formId={form.id} formName={form.name} />
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={forms} />;
}

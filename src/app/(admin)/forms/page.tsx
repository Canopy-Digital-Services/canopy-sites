import { getCurrentUserId } from "@/lib/auth-utils";
import { getUserForms } from "@/lib/data-access/forms";
import { PageHeader } from "@/components/patterns/page-header";
import { DataTable } from "@/components/patterns/data-table";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

export default async function FormsPage({
  searchParams,
}: {
  searchParams: { site?: string };
}) {
  const accountId = (await import("@/lib/auth-utils")).getCurrentAccountId();
  const allForms = await getUserForms(await accountId);

  // Client-side filtering by site
  const forms = searchParams.site
    ? allForms.filter((form) => form.site.id === searchParams.site)
    : allForms;

  // Get unique sites for filter
  const sites = Array.from(
    new Set(allForms.map((form) => form.site.id))
  ).map((siteId) => {
    const form = allForms.find((f) => f.site.id === siteId);
    return { id: siteId, name: form!.site.name };
  });

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
      key: "site",
      header: "Site",
      cell: (form: typeof forms[0]) => (
        <span className="text-sm text-muted-foreground">{form.site.name}</span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      cell: (form: typeof forms[0]) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">{form.slug}</code>
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
        <div className="flex gap-2">
          <Link href={`/forms/${form.id}/edit`}>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </Link>
          <Link href={`/forms/${form.id}/submissions`}>
            <Button variant="ghost" size="sm">
              Submissions
            </Button>
          </Link>
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

      {/* Site Filter */}
      {sites.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Link href="/forms">
            <Button
              variant={!searchParams.site ? "default" : "outline"}
              size="sm"
            >
              All Sites
            </Button>
          </Link>
          {sites.map((site) => (
            <Link key={site.id} href={`/forms?site=${site.id}`}>
              <Button
                variant={searchParams.site === site.id ? "default" : "outline"}
                size="sm"
              >
                {site.name}
              </Button>
            </Link>
          ))}
        </div>
      )}

      {forms.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10 text-muted-foreground" />}
          title={searchParams.site ? "No forms in this site" : "No forms yet"}
          description={
            searchParams.site
              ? "Create a form to start collecting submissions for this site"
              : "Create your first form to start collecting submissions"
          }
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

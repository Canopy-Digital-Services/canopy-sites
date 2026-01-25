import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getUserSites } from "@/lib/data-access/forms";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/patterns/page-header";
import { DataTable } from "@/components/patterns/data-table";
import { EmptyState } from "@/components/patterns/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/copy-button";
import { Plus, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

async function createSite(formData: FormData) {
  "use server";

  const userId = await getCurrentUserId();
  const accountId = (await import("@/lib/auth-utils")).getCurrentAccountId();
  const name = formData.get("name") as string;
  const domain = formData.get("domain") as string;

  if (!name || !domain) {
    throw new Error("Name and domain are required");
  }

  await prisma.site.create({
    data: {
      userId,
      accountId: await accountId,
      name,
      domain,
    },
  });

  redirect("/settings/sites");
}

async function deleteSite(siteId: string) {
  "use server";

  const accountId = (await import("@/lib/auth-utils")).getCurrentAccountId();

  await prisma.site.delete({
    where: {
      id: siteId,
      accountId: await accountId,
    },
  });

  redirect("/settings/sites");
}

export default async function SitesManagementPage() {
  const accountId = (await import("@/lib/auth-utils")).getCurrentAccountId();
  const sites = await getUserSites(await accountId);

  // Get form counts for each site
  const sitesWithCounts = await Promise.all(
    sites.map(async (site) => {
      const formCount = await prisma.form.count({
        where: { siteId: site.id },
      });
      return { ...site, formCount };
    })
  );

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (site: typeof sitesWithCounts[0]) => (
        <span className="font-medium">{site.name}</span>
      ),
    },
    {
      key: "domain",
      header: "Domain",
      cell: (site: typeof sitesWithCounts[0]) => (
        <span className="text-sm text-muted-foreground">{site.domain}</span>
      ),
    },
    {
      key: "apiKey",
      header: "API Key",
      cell: (site: typeof sitesWithCounts[0]) => (
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {site.id.substring(0, 12)}...
          </code>
          <CopyButton text={site.id} />
        </div>
      ),
    },
    {
      key: "forms",
      header: "Forms",
      cell: (site: typeof sitesWithCounts[0]) => (
        <Badge variant="secondary">{site.formCount}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Management"
        description="Manage sites for organizing your forms"
      />

      {/* Create New Site Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Site</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSite} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Site Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My Personal Site"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  A friendly name to identify this site
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  name="domain"
                  placeholder="example.com"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The canonical domain for origin validation
                </p>
              </div>
            </div>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Create Site
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sites List */}
      {sitesWithCounts.length === 0 ? (
        <EmptyState
          icon={<Globe className="h-10 w-10 text-muted-foreground" />}
          title="No sites yet"
          description="Create your first site to organize your forms"
        />
      ) : (
        <DataTable columns={columns} data={sitesWithCounts} />
      )}

      {/* Help Text */}
      <Card>
        <CardHeader>
          <CardTitle>About Sites</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Sites are used to organize your forms and control origin validation for security.
            Each site has a unique API key that's used in form submissions.
          </p>
          <p>
            You can move forms between sites at any time from the form editor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

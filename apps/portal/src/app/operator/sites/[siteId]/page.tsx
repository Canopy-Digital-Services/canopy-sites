// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { notFound } from "next/navigation";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { getSiteForOperator, listAccountsAvailableForSite } from "@/lib/data-access/sites";
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignSiteButton } from "./assign-site-button";
import { SiteSettingsForm } from "./site-settings-form";
import { SiteBuildsCard } from "./site-builds-card";

export default async function SitePage({ params }: { params: Promise<{ siteId: string }> }) {
  await requireGlobalAdmin();
  const { siteId } = await params;

  const site = await getSiteForOperator(siteId);
  if (!site) notFound();
  const accounts = await listAccountsAvailableForSite();

  return (
    <PageContent>
      <div className="max-w-[640px] mx-auto space-y-6">
        <PageHeader title={site.name} backHref="/operator/sites" />

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Owner</dt>
              <dd>{site.ownerEmail ?? "No owner"}</dd>
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-mono">{site.slug}</dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{site.createdAt.toLocaleDateString()}</dd>
            </dl>
          </CardContent>
          <CardFooter>
            <AssignSiteButton siteId={site.id} siteName={site.name} accounts={accounts} />
          </CardFooter>
        </Card>

        <SiteBuildsCard siteId={site.id} isDemo={site.isDemo} hasRepo={Boolean(site.repoUrl)} />

        <SiteSettingsForm
          siteId={site.id}
          initial={{
            name: site.name,
            repoUrl: site.repoUrl ?? "",
            defaultBranch: site.defaultBranch,
            productionHostnames: site.productionHostnames,
            contractVersion: site.contractVersion ?? "",
            umamiWebsiteId: site.umamiWebsiteId ?? "",
            runbookOverlay: site.runbookOverlay,
            lockedFields: site.lockedFields,
          }}
        />
      </div>
    </PageContent>
  );
}

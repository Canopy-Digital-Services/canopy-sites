// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import Link from "next/link";
import { Globe } from "lucide-react";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { listSitesForOperator, type OperatorSiteListItem } from "@/lib/data-access/sites";
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { DataTable } from "@/components/patterns/data-table";
import { EmptyState } from "@/components/patterns/empty-state";
import { LinkSiteButton } from "./link-site-button";
import { listAppRepos } from "@/lib/builder-client";
import { normalizeGitHubRepo } from "@/lib/sites";

export default async function SitesPage() {
  await requireGlobalAdmin();

  const [sites, appRepos] = await Promise.all([listSitesForOperator(), listAppRepos()]);
  // The picker offers the repos the GitHub App reaches that no site uses yet.
  const linked = new Set(sites.map((s) => normalizeGitHubRepo(s.repoUrl ?? "")?.toLowerCase()));
  const repos = appRepos && appRepos.filter((r) => !linked.has(r.url.toLowerCase()));
  const linkSite = <LinkSiteButton repos={repos} />;

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (site: OperatorSiteListItem) => (
        <Link href={`/operator/sites/${site.id}`} className="font-medium hover:underline">
          {site.name}
        </Link>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      cell: (site: OperatorSiteListItem) => <span className="font-mono text-sm">{site.slug}</span>,
    },
    {
      key: "account",
      header: "Account",
      cell: (site: OperatorSiteListItem) => <span className="text-sm">{site.ownerEmail ?? "No owner"}</span>,
    },
    {
      key: "hostnames",
      header: "Hostnames",
      cell: (site: OperatorSiteListItem) => (
        <span className="text-sm text-muted-foreground">
          {site.productionHostnames.length ? site.productionHostnames.join(", ") : "None"}
        </span>
      ),
    },
    {
      key: "contract",
      header: "Contract",
      cell: (site: OperatorSiteListItem) => (
        <span className="text-sm text-muted-foreground">{site.contractVersion ?? "Not read yet"}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (site: OperatorSiteListItem) => (
        <span className="text-sm text-muted-foreground">{new Date(site.createdAt).toLocaleDateString()}</span>
      ),
    },
  ];

  return (
    <PageContent width="wide">
      <div className="space-y-6">
        <PageHeader title="Sites" actions={sites.length > 0 ? linkSite : undefined} />

        {sites.length === 0 ? (
          <EmptyState
            icon={<Globe className="h-9 w-9" />}
            title="No sites"
            action={linkSite}
          />
        ) : (
          <DataTable columns={columns} data={sites} />
        )}
      </div>
    </PageContent>
  );
}

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import Link from "next/link";
import { Globe } from "lucide-react";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import {
  listAccountsAvailableForSite,
  listSitesForOperator,
  type OperatorSiteListItem,
} from "@/lib/data-access/sites";
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { DataTable } from "@/components/patterns/data-table";
import { EmptyState } from "@/components/patterns/empty-state";
import { NewSiteButton } from "./new-site-button";

export default async function SitesPage() {
  await requireGlobalAdmin();

  const [sites, accounts] = await Promise.all([listSitesForOperator(), listAccountsAvailableForSite()]);
  const newSite = <NewSiteButton accounts={accounts} />;

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
        <span className="text-sm text-muted-foreground">{site.contractVersion ?? "Not set"}</span>
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
        <PageHeader title="Sites" actions={sites.length > 0 ? newSite : undefined} />

        {sites.length === 0 ? (
          <EmptyState
            icon={<Globe className="h-9 w-9" />}
            title="No sites"
            description="A site belongs to one account on the Sites plan."
            action={newSite}
          />
        ) : (
          <DataTable columns={columns} data={sites} />
        )}
      </div>
    </PageContent>
  );
}

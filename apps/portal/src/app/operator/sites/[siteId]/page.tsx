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
import { OwnerCard, type OwnerRow } from "./owner-card";
import { getOwnerAccess } from "@/lib/claim";

export default async function SitePage({ params }: { params: Promise<{ siteId: string }> }) {
  await requireGlobalAdmin();
  const { siteId } = await params;

  const site = await getSiteForOperator(siteId);
  if (!site) notFound();
  const [accounts, access] = await Promise.all([listAccountsAvailableForSite(), getOwnerAccess(site.accountId)]);
  const when = (d: Date) => d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: site.timeZone });
  const owner: OwnerRow | null = access && {
    email: access.email,
    claimed: access.claimed,
    claimedAt: access.claimedAt && when(access.claimedAt),
    link:
      access.link &&
      `${access.link.emailedAt ? "Emailed" : "Copied"} ${when(access.link.emailedAt ?? access.link.createdAt)}${
        access.link.by ? ` by ${access.link.by}` : " at their request"
      }`,
    lastSignIn: access.lastLoginAt && when(access.lastLoginAt),
  };

  return (
    <PageContent>
      <div className="max-w-[640px] mx-auto space-y-6">
        <PageHeader title={site.name} backHref="/operator/sites" />

        <OwnerCard siteId={site.id} owner={owner} />

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-mono">{site.slug}</dd>
              <dt className="text-muted-foreground">Contract</dt>
              <dd className={site.contractVersion ? "font-mono" : "text-muted-foreground"}>{site.contractVersion ?? "Not read yet"}</dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{site.createdAt.toLocaleDateString()}</dd>
            </dl>
          </CardContent>
          <CardFooter>
            <AssignSiteButton siteId={site.id} siteName={site.name} accounts={accounts} />
          </CardFooter>
        </Card>

        <SiteBuildsCard
          siteId={site.id}
          isDemo={site.isDemo}
          hasRepo={Boolean(site.repoUrl)}
          latestBuild={
            site.latestBuild && {
              status: site.latestBuild.status,
              error: site.latestBuild.error,
              when: (site.latestBuild.finishedAt ?? site.latestBuild.createdAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: site.timeZone,
              }),
            }
          }
        />

        <SiteSettingsForm
          siteId={site.id}
          initial={{
            name: site.name,
            repoUrl: site.repoUrl ?? "",
            defaultBranch: site.defaultBranch,
            productionHostnames: site.productionHostnames,
            umamiWebsiteId: site.umamiWebsiteId ?? "",
            runbookOverlay: site.runbookOverlay,
            lockedFields: site.lockedFields,
            fixedLists: site.fixedLists,
          }}
        />
      </div>
    </PageContent>
  );
}

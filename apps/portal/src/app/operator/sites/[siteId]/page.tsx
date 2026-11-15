// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { getSiteForOperator, listAccountsAvailableForSite } from "@/lib/data-access/sites";
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignSiteButton } from "./assign-site-button";
import { SiteSettingsForm } from "./site-settings-form";
import { SiteBuildsCard } from "./site-builds-card";
import { PeopleCard, type PersonRow } from "./people-card";
import { WelcomeVideoCard } from "./welcome-video-card";
import { listPeopleAccess } from "@/lib/claim";
import { countOpenHelpRequests } from "@/lib/site-tools/help-requests";
import { welcomeVideoState } from "@/lib/welcome-video";

export default async function SitePage({ params }: { params: Promise<{ siteId: string }> }) {
  await requireGlobalAdmin();
  const { siteId } = await params;

  const site = await getSiteForOperator(siteId);
  if (!site) notFound();
  const [accounts, access, openRequests, welcome] = await Promise.all([
    listAccountsAvailableForSite(),
    listPeopleAccess(site.accountId),
    countOpenHelpRequests(site.id),
    welcomeVideoState(site),
  ]);
  const when = (d: Date) => d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: site.timeZone });
  const people: PersonRow[] = access.map((person) => ({
    userId: person.userId,
    name: person.name,
    email: person.email,
    owner: person.role === "OWNER",
    claimed: person.claimed,
    claimedAt: person.claimedAt && when(person.claimedAt),
    link:
      person.link &&
      `${person.link.emailedAt ? "emailed" : "copied"} ${when(person.link.emailedAt ?? person.link.createdAt)}${
        person.link.by ? ` by ${person.link.by}` : " at their request"
      }`,
    lastSignIn: person.lastLoginAt && when(person.lastLoginAt),
  }));

  return (
    <PageContent>
      <div className="max-w-[640px] mx-auto space-y-6">
        <PageHeader title={site.name} backHref="/operator/sites" />

        <PeopleCard siteId={site.id} siteName={site.name} accountId={site.accountId} people={people} />

        <WelcomeVideoCard siteId={site.id} state={typeof welcome === "object" ? { uploadedAt: when(welcome.uploadedAt) } : welcome} />

        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <Link href={`/operator/requests?site=${site.id}`} className="hover:underline">
              {openRequests === 0 ? "None open" : `${openRequests} open`}
            </Link>
          </CardContent>
        </Card>

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
              <dd>{site.createdAt.toLocaleDateString("en-US", { dateStyle: "medium", timeZone: site.timeZone })}</dd>
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
            lockedFields: site.lockedFields,
            fixedLists: site.fixedLists,
          }}
        />
      </div>
    </PageContent>
  );
}

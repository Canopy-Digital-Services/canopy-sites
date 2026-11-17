// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
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
import { StatsCard, StatsCardShell } from "./stats-card";
import { listPeopleAccess } from "@/lib/claim";
import { countOpenHelpRequests } from "@/lib/site-tools/help-requests";
import { SITES_TABS } from "@/lib/sites-tabs";
import { welcomeVideoStates } from "@/lib/welcome-video";
import { clock } from "@/lib/welcome-video-limits";

/** A person's welcome videos in the tabs' order, "Watched Quick Edit 4:12 of 5:03 · Editor 0:40 of 2:10", or null when they have played none. */
function watchedLine(watched: { tab: string; seconds: number; of: number }[]): string | null {
  const parts = SITES_TABS.flatMap(({ id, label }) =>
    watched.filter((w) => w.tab === id).map((w) => `${label} ${clock(w.seconds)} of ${clock(w.of)}`),
  );
  return parts.length ? `Watched ${parts.join(" · ")}` : null;
}

export default async function SitePage({ params }: { params: Promise<{ siteId: string }> }) {
  await requireGlobalAdmin();
  const { siteId } = await params;

  const site = await getSiteForOperator(siteId);
  if (!site) notFound();
  const [accounts, access, openRequests, welcome] = await Promise.all([
    listAccountsAvailableForSite(),
    listPeopleAccess(site.accountId),
    countOpenHelpRequests(site.id),
    welcomeVideoStates(site.id),
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
    watched: watchedLine(person.watched),
  }));

  return (
    <PageContent>
      <div className="max-w-[640px] mx-auto space-y-6">
        <PageHeader title={site.name} backHref="/operator/sites" />

        <PeopleCard siteId={site.id} siteName={site.name} accountId={site.accountId} people={people} />

        <WelcomeVideoCard
          siteId={site.id}
          videos={
            welcome &&
            welcome.map(({ tab, state }) => ({ tab, state: typeof state === "object" ? { uploadedAt: when(state.uploadedAt) } : state }))
          }
        />

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

        <Suspense
          fallback={
            <StatsCardShell>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking Umami…
              </p>
            </StatsCardShell>
          }
        >
          <StatsCard site={site} />
        </Suspense>

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

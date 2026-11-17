// UI: see docs/UX_PATTERNS.md for layout and component conventions.
// The site's Stats as the operator needs to see them: whether the owner's
// Stats can load, which Umami website they read, and whether it is still
// recording (Epic 35, 4.7). Rendered on the server; the page streams it in so
// a slow Umami never holds up the rest of the page.
import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatsHealth, QUIET_DAYS } from "@/lib/stats/health";
import { cn } from "@/lib/utils";

type StatsCardSite = { isDemo: boolean; umamiWebsiteId: string | null; productionHostnames: string[]; timeZone: string };

export function StatsCardShell({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">{children}</CardContent>
    </Card>
  );
}

export async function StatsCard({ site }: { site: StatsCardSite }) {
  if (site.isDemo && !site.umamiWebsiteId) {
    return <StatsCardShell><p className="text-muted-foreground">Sample data.</p></StatsCardShell>;
  }

  const health = await getStatsHealth(site);
  const date = (d: Date) => d.toLocaleDateString("en-US", { dateStyle: "medium", timeZone: site.timeZone });
  const dateTime = (d: Date) => d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: site.timeZone });

  if (health.status === "none") {
    return <StatsCardShell><p className="text-muted-foreground">No Umami website.</p></StatsCardShell>;
  }
  if (health.status === "unconfigured") {
    return <StatsCardShell><p className="text-muted-foreground">Umami isn&apos;t set up in this environment.</p></StatsCardShell>;
  }
  if (health.status === "unreachable") {
    return (
      <StatsCardShell>
        <Notice tone="amber">Umami didn&apos;t answer.</Notice>
      </StatsCardShell>
    );
  }
  if (health.status === "refused") {
    return (
      <StatsCardShell>
        <Notice tone="destructive">
          Umami won&apos;t let the portal read this website, so the owner&apos;s Stats can&apos;t load. Move it into the Canopy Sites
          team, or check the ID.
        </Notice>
      </StatsCardShell>
    );
  }

  const { website, domainMatches, quiet } = health;
  return (
    <StatsCardShell>
      <dl className="grid grid-cols-[8rem_1fr] gap-y-2">
        <dt className="text-muted-foreground">Umami website</dt>
        <dd>
          {website.name}
          {website.domain ? <span className="text-muted-foreground"> · {website.domain}</span> : null}
        </dd>
        <dt className="text-muted-foreground">First visit</dt>
        <dd className={website.firstEvent ? undefined : "text-muted-foreground"}>{website.firstEvent ? date(website.firstEvent) : "None yet"}</dd>
        <dt className="text-muted-foreground">Last visit</dt>
        <dd className={website.lastEvent ? undefined : "text-muted-foreground"}>{website.lastEvent ? dateTime(website.lastEvent) : "None yet"}</dd>
      </dl>
      {!domainMatches ? (
        <Notice tone="amber">
          Umami has this website as {website.domain ?? "no domain"}, which isn&apos;t one of this site&apos;s hostnames.
        </Notice>
      ) : null}
      {quiet ? (
        <Notice tone="amber">
          {website.lastEvent ? `Nothing recorded in ${QUIET_DAYS} days.` : "Nothing recorded yet."} Check that the site&apos;s Umami domain
          filter lists its hostnames.
        </Notice>
      ) : null}
    </StatsCardShell>
  );
}

function Notice({ tone, children }: { tone: "amber" | "destructive"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-xs",
        tone === "amber"
          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
          : "bg-destructive/12 text-destructive",
      )}
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

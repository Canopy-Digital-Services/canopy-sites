// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { ChartLine } from "lucide-react";
import { getCurrentAccountId } from "@/lib/auth-utils";
import { getAccountSite } from "@/lib/data-access/sites";
import { getSiteStats, parseStatsRange } from "@/lib/stats";
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RangeSelect } from "@/components/stats/range-select";
import { StatTiles } from "@/components/stats/stat-tiles";
import { VisitorsChart } from "@/components/stats/visitors-chart";
import { RankedList } from "@/components/stats/ranked-list";

export const dynamic = "force-dynamic";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const range = parseStatsRange((await searchParams).range);
  const site = await getAccountSite(await getCurrentAccountId());
  const stats = site ? await getSiteStats(site, range) : null;

  if (!stats) {
    return (
      <PageContent>
        <div className="space-y-6">
          <PageHeader title="Stats" />
          <EmptyState
            icon={<ChartLine className="h-9 w-9" />}
            title="No stats yet"
            description="Stats appear here once your site is live."
          />
        </div>
      </PageContent>
    );
  }

  return (
    <PageContent width="wide">
      <div className="space-y-6">
        <PageHeader
          title="Stats"
          actions={
            <>
              {stats.sample ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge tabIndex={0} className="mr-2">
                      Sample data
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64">
                    This demo site has no real traffic, so these numbers are generated.
                  </TooltipContent>
                </Tooltip>
              ) : null}
              <RangeSelect current={range} />
            </>
          }
        />
        <StatTiles totals={stats.totals} />
        <VisitorsChart daily={stats.daily} />
        <div className="grid gap-6 lg:grid-cols-2">
          <RankedList
            title="Top pages"
            labelHeading="Page"
            valueHeading="Views"
            rows={stats.topPages.map((p) => ({ label: p.path, value: p.pageviews }))}
            total={stats.totals.pageviews}
          />
          <RankedList
            title="Referrers"
            labelHeading="Source"
            valueHeading="Visitors"
            rows={stats.referrers.map((r) => ({ label: r.source, value: r.visitors }))}
            total={stats.totals.visitors}
          />
        </div>
      </div>
    </PageContent>
  );
}

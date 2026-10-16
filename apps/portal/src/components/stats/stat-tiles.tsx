// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { Card } from "@/components/ui/card";
import type { StatsTotals } from "@/lib/stats";
import { formatCount, formatRatio } from "./format";

/** The headline numbers for the range: visitors, pageviews, views per visit. */
export function StatTiles({ totals }: { totals: StatsTotals }) {
  const tiles = [
    { label: "Visitors", value: formatCount(totals.visitors) },
    { label: "Pageviews", value: formatCount(totals.pageviews) },
    { label: "Views per visit", value: totals.visitors ? formatRatio(totals.pageviews / totals.visitors) : "0" },
  ];

  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      {tiles.map(({ label, value }) => (
        <Card key={label} className="gap-1 px-6 py-5">
          <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
          <dd className="text-3xl font-semibold tracking-tight">{value}</dd>
        </Card>
      ))}
    </dl>
  );
}

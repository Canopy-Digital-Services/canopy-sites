// UI: see docs/UX_PATTERNS.md for layout and component conventions.
// A compact ranked table (top pages, referrers). Each row carries a quiet
// bar in the chart hue, scaled to the top row; the count and share are
// always printed, so the bar never carries a value alone.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCount } from "./format";

export type RankedRow = { label: string; value: number };

export function RankedList({
  title,
  labelHeading,
  valueHeading,
  rows,
  total,
}: {
  title: string;
  labelHeading: string;
  valueHeading: string;
  rows: RankedRow[];
  total: number;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="pb-2 text-left font-semibold">
                {labelHeading}
              </th>
              <th scope="col" className="w-20 pb-2 text-right font-semibold">
                {valueHeading}
              </th>
              <th scope="col" className="w-14 pb-2 text-right font-semibold">
                <span className="sr-only">Share</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td>
                  <div className="relative flex h-8 items-center">
                    <div
                      aria-hidden
                      className="absolute inset-y-1 left-0 rounded-sm bg-chart-2/15"
                      style={{ width: `${(row.value / max) * 100}%` }}
                    />
                    <span className="relative truncate px-2">{row.label}</span>
                  </div>
                </td>
                <td className="text-right tabular-nums">{formatCount(row.value)}</td>
                <td className="text-right text-xs tabular-nums text-muted-foreground">
                  {total ? Math.round((row.value / total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

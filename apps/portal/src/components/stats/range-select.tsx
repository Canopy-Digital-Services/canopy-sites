// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { STATS_RANGES, type StatsRange } from "@/lib/stats";

/** Date range presets as links, so the range lives in `?range=` and survives reload. */
export function RangeSelect({ current }: { current: StatsRange }) {
  return (
    <div role="group" aria-label="Date range" className="flex gap-1">
      {STATS_RANGES.map(({ value, label }) => {
        const active = value === current;
        return (
          <Button key={value} asChild size="sm" variant={active ? "secondary" : "ghost"}>
            <Link href={`/stats?range=${value}`} scroll={false} aria-current={active ? "true" : undefined}>
              {label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

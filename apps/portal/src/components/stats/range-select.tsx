// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { ToggleLinkGroup, ToggleLinkItem } from "@/components/ui/toggle-group";
import { STATS_RANGES, type StatsRange } from "@/lib/stats";

/** Date range presets as links, so the range lives in `?range=` and survives reload. */
export function RangeSelect({ current }: { current: StatsRange }) {
  return (
    <ToggleLinkGroup aria-label="Date range">
      {STATS_RANGES.map(({ value, label }) => (
        <ToggleLinkItem key={value} href={`/stats?range=${value}`} scroll={false} active={value === current}>
          {label}
        </ToggleLinkItem>
      ))}
    </ToggleLinkGroup>
  );
}

/** The Stats page's date ranges, kept in the `?range=` search param. */

export const STATS_RANGES = [
  { value: "7d", days: 7, label: "7 days" },
  { value: "30d", days: 30, label: "30 days" },
  { value: "90d", days: 90, label: "90 days" },
] as const;

export type StatsRange = (typeof STATS_RANGES)[number]["value"];

export const DEFAULT_STATS_RANGE: StatsRange = "30d";

/** The range a `?range=` value names, or the default for anything else. */
export function parseStatsRange(value: string | string[] | undefined): StatsRange {
  const match = STATS_RANGES.find((r) => r.value === value);
  return match ? match.value : DEFAULT_STATS_RANGE;
}

export function statsRangeDays(range: StatsRange): number {
  return STATS_RANGES.find((r) => r.value === range)!.days;
}

const DAY_MS = 86_400_000;

/** The `days` UTC calendar dates ending with `end`'s, oldest first. */
export function datesEnding(end: Date, days: number): string[] {
  const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Array.from({ length: days }, (_, i) => new Date(last - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10));
}

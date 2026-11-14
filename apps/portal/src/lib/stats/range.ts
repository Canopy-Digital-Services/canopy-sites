/**
 * The Stats page's date ranges, kept in the `?range=` search param. A range
 * is today and the days before it in the account's time zone (the
 * business's), so "7 days" means the same week to the owner as to Umami.
 */

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

/** The calendar date (`YYYY-MM-DD`) it is at `at` in `timeZone`. */
export function dateIn(timeZone: string, at: Date): string {
  return at.toLocaleDateString("en-CA", { timeZone });
}

/** The `days` calendar dates in `timeZone` ending with `end`'s, oldest first. */
export function datesEnding(end: Date, days: number, timeZone = "UTC"): string[] {
  const last = Date.parse(`${dateIn(timeZone, end)}T00:00:00Z`);
  return Array.from({ length: days }, (_, i) => new Date(last - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10));
}

/** How far `timeZone`'s clock is ahead of UTC at `at`, in milliseconds. */
function offsetMs(timeZone: string, at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const wall = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return wall - Math.floor(at.getTime() / 1000) * 1000;
}

/** The instant `date` (`YYYY-MM-DD`) begins in `timeZone`. */
export function startOfDayIn(date: string, timeZone: string): Date {
  const midnightUtc = Date.parse(`${date}T00:00:00Z`);
  // Twice: the offset at the first guess can differ from the offset at local
  // midnight when a clock change falls between them.
  let at = midnightUtc - offsetMs(timeZone, new Date(midnightUtc));
  at = midnightUtc - offsetMs(timeZone, new Date(at));
  return new Date(at);
}

/**
 * Time zones as IANA names ("America/Los_Angeles"). An account's zone
 * (`Account.timeZone`) is the business's: emails state times in it, and its
 * site's dates follow it.
 */

/** The zone of an account nobody has told us the zone of. */
export const UNKNOWN_TIME_ZONE = "UTC";

/** Where Canopy's own clients are, for an account the operator creates. */
export const CANOPY_TIME_ZONE = "America/Los_Angeles";

/** Whether the value names a zone this runtime can format in. */
export function isTimeZone(value: unknown): value is string {
  return canonicalTimeZone(value) !== null;
}

/**
 * The zone as the runtime spells it ("america/los_angeles" is
 * "America/Los_Angeles"), or null when the value isn't a zone. What gets
 * stored, so a zone reads the same wherever it came from.
 */
export function canonicalTimeZone(value: unknown): string | null {
  if (typeof value !== "string" || !value || value.length > 60) return null;
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

/** One zone in a list to choose from: "Los Angeles (GMT-8)", and "Pacific Time" beside it. */
export type TimeZoneOption = { value: string; label: string; detail: string };

function zoneName(zone: string, style: "shortOffset" | "longGeneric", at: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: style }).formatToParts(at);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

/** Minutes east of UTC, from an offset as Intl writes it ("GMT-8", "GMT+5:30", "GMT"). */
function offsetMinutes(offset: string): number {
  const m = /^GMT([+-])(\d+)(?::(\d+))?$/.exec(offset);
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

function describe(zone: string, at: Date): TimeZoneOption & { offset: number } {
  if (zone === "UTC") return { value: zone, label: "UTC", detail: "Coordinated Universal Time", offset: 0 };
  const offset = zoneName(zone, "shortOffset", at);
  // The place without its continent, smallest first: "Los Angeles", "Knox, Indiana".
  const place = zone
    .split("/")
    .slice(1)
    .reverse()
    .map((part) => part.replaceAll("_", " "))
    .join(", ");
  return { value: zone, label: `${place || zone} (${offset})`, detail: zoneName(zone, "longGeneric", at), offset: offsetMinutes(offset) };
}

/** The zone as a person reads it: its city and its offset from UTC at `at`, "Los Angeles (GMT-8)". */
export function timeZoneLabel(zone: string, at = new Date()): string {
  return describe(zone, at).label;
}

let listed: { hour: number; zones: Array<TimeZoneOption & { offset: number }> } | null = null;

/**
 * Every zone the runtime knows plus UTC, west to east and then by place, as
 * the Account page offers them. `current` is added when the list lacks it (a
 * browser can report a name this runtime only knows as an alias), so the
 * account's own zone is always there to show as chosen. Offsets are as of
 * `at`, and the list is built once an hour.
 */
export function timeZoneOptions(current: string, at = new Date()): TimeZoneOption[] {
  const hour = Math.floor(at.getTime() / 3_600_000);
  if (listed?.hour !== hour) {
    listed = { hour, zones: [UNKNOWN_TIME_ZONE, ...Intl.supportedValuesOf("timeZone")].map((zone) => describe(zone, at)) };
  }
  const zones = listed.zones.some((z) => z.value === current) || !isTimeZone(current) ? listed.zones : [...listed.zones, describe(current, at)];
  return [...zones]
    .sort((a, b) => a.offset - b.offset || a.label.localeCompare(b.label, "en-US"))
    .map(({ value, label, detail }) => ({ value, label, detail }));
}

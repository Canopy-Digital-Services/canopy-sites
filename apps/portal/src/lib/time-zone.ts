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
  if (typeof value !== "string" || !value || value.length > 60) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

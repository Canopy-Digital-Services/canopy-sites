/**
 * A server action's arguments are whatever the client sent, whatever their
 * TypeScript types say. An id is a non-empty string or the call is refused,
 * before it reaches a query: every action that takes an id passes it through
 * here (or `String(...)`) first, and every data-access helper that finds a
 * row by a caller's id does too.
 */
export function requireId(value: unknown, name = "id"): string {
  if (typeof value !== "string" || value === "") throw new Error(`Invalid ${name}`);
  return value;
}

/** The same for a list of ids. */
export function requireIds(value: unknown, name = "ids"): string[] {
  if (!Array.isArray(value)) throw new Error(`Invalid ${name}`);
  return value.map((id) => requireId(id, name));
}

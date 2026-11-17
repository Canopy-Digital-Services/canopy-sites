/**
 * What a person is called to the other people on their account and to Canopy
 * (PRD D63): their name, and their email until someone has typed one. Anything
 * that names a person to someone else goes through `personName`.
 */

export const PERSON_NAME_MAX = 80;

export function personName(person: { name: string | null; email: string }): string {
  return person.name?.trim() || person.email;
}

/** A name as typed: one line, single-spaced. Null for none, an error when it is too long. */
export function parsePersonName(input: unknown): { ok: true; name: string | null } | { ok: false; error: string } {
  const name = String(input ?? "").replace(/\s+/g, " ").trim();
  if (name.length > PERSON_NAME_MAX) return { ok: false, error: `A name can be ${PERSON_NAME_MAX} characters at most.` };
  return { ok: true, name: name || null };
}

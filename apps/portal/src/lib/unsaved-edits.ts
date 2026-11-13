/**
 * Edits the Editor couldn't send, kept in the browser until they can be.
 *
 * A save can fail before it reaches the server's code: the portal restarted
 * with a new build while the page was open (a page from the old build can't
 * call the new one), or the connection dropped. The owner's text is on screen
 * but in no draft. These helpers keep it in localStorage, per site, so the
 * Editor can save it once the page is reloaded.
 */
export type UnsavedEdit = { address: string; value: string | null };

type Stash = { at: number; edits: UnsavedEdit[] };
/** The storage this needs: localStorage, or a stand-in. */
export type EditStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** After this long the site has likely moved on, and an old edit would overwrite newer work. */
export const UNSAVED_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const MAX_EDITS = 200;

const keyOf = (siteId: string) => `canopy:unsaved-edits:${siteId}`;

function read(storage: EditStorage, siteId: string): Stash | null {
  try {
    const raw = storage.getItem(keyOf(siteId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stash>;
    if (typeof parsed.at !== "number" || !Array.isArray(parsed.edits)) return null;
    const edits = parsed.edits.filter(
      (e): e is UnsavedEdit => Boolean(e) && typeof e.address === "string" && (typeof e.value === "string" || e.value === null),
    );
    return { at: parsed.at, edits };
  } catch {
    return null;
  }
}

/** The edits waiting for this site, oldest first; none once they are too old to trust. */
export function unsavedEdits(storage: EditStorage, siteId: string, now: number): UnsavedEdit[] {
  const stash = read(storage, siteId);
  if (!stash || now - stash.at > UNSAVED_MAX_AGE_MS) return [];
  return stash.edits;
}

/**
 * Adds edits to the ones waiting. A later edit to a field replaces an earlier
 * one, and takes its place at the end, so the order is the order of last change.
 * Returns how many are waiting. Storage that refuses (private mode, full) keeps nothing.
 */
export function keepUnsavedEdits(storage: EditStorage, siteId: string, edits: UnsavedEdit[], now: number): number {
  const kept = unsavedEdits(storage, siteId, now);
  const addresses = new Set(edits.map((e) => e.address));
  const all = [...kept.filter((e) => !addresses.has(e.address)), ...edits].slice(-MAX_EDITS);
  try {
    storage.setItem(keyOf(siteId), JSON.stringify({ at: now, edits: all } satisfies Stash));
    return all.length;
  } catch {
    return 0;
  }
}

export function clearUnsavedEdits(storage: EditStorage, siteId: string): void {
  try {
    storage.removeItem(keyOf(siteId));
  } catch {
    // Nothing to clear from storage that can't be reached.
  }
}

const NOTHING: EditStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

/** The browser's localStorage, or storage that keeps nothing where a browser withholds it (reading the property can throw). */
export function browserEditStorage(): EditStorage {
  try {
    return window.localStorage ?? NOTHING;
  } catch {
    return NOTHING;
  }
}

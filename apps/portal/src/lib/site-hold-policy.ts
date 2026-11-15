/**
 * When an editing page keeps the site's hold (PRD D64). The hold itself, and
 * who may write, is the tool layer's (`site-tools/hold.ts`); this is only how
 * often a page asks, and when it stops asking. Kept apart from the component
 * so it can be tested without a browser.
 */

/** How often a page keeps the hold. Well inside the hold's 90 seconds, so a missed call or two costs nothing. */
export const KEEP_EVERY_MS = 25_000;

/** A page stops keeping the hold once nobody has touched it for this long. */
export const IDLE_AFTER_MS = 10 * 60_000;

/**
 * Whether a page asks for the hold now. A page whose person has gone quiet
 * stops, so the site frees itself. A page waiting its turn asks only while it
 * is in view: a tab left open in the background never takes the site.
 */
export function shouldKeep(page: { now: number; lastActive: number; waiting: boolean; visible: boolean }): boolean {
  if (page.now - page.lastActive >= IDLE_AFTER_MS) return false;
  return page.waiting ? page.visible : true;
}

/** Whether a page that hears from its person now had gone quiet, and so asks at once instead of at its next turn. */
export function wasIdle(now: number, lastActive: number): boolean {
  return now - lastActive >= IDLE_AFTER_MS;
}

/** What the canvas and the preview page's frames report when their person does something, as against the page settling. */
const PERSON_MESSAGES = new Set(["select", "input", "scroll", "commit", "cancel", "deselect", "navigate", "external"]);

/** Whether a message from a site frame is its person at work: keys and clicks inside the frame never reach this window. */
export function isActivityMessage(data: unknown): boolean {
  const m = data as { source?: unknown; type?: unknown } | null;
  return Boolean(m) && typeof m === "object" && m!.source === "canopy-canvas" && typeof m!.type === "string" && PERSON_MESSAGES.has(m!.type);
}

/**
 * How an editing page follows the site's hold (PRD D64). Who may write, and
 * when a hold starts and ends, is the tool layer's (`site-tools/hold.ts`);
 * this is only how often a page asks who has the site, when it stops asking,
 * and what it calls the person who has it. Kept apart from the component so
 * it can be tested without a browser.
 */

/** How often a page asks. Well inside the hold's 90 seconds, so a missed call or two costs its holder nothing. */
export const ASK_EVERY_MS = 25_000;

/** A page stops asking once nobody has touched it for this long, which is how a hold runs out under a person who has gone quiet. */
export const IDLE_AFTER_MS = 10 * 60_000;

/**
 * Whether a page asks now. A page whose person has gone quiet stops. The
 * holder's page asks in view or not (they may be in another tab, copying
 * something to paste in), since asking is what keeps their hold; anyone
 * else's page only needs the answer while someone is looking at it.
 */
export function shouldAsk(page: { now: number; lastActive: number; holding: boolean; visible: boolean }): boolean {
  if (page.now - page.lastActive >= IDLE_AFTER_MS) return false;
  return page.holding || page.visible;
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

/** What everyone else on the account is told while a person has the site. One wording, wherever it shows. */
export function editingNotice(by: string): string {
  return `${by} is currently making edits`;
}

/** What a draft is called to anyone but the person who made it. */
export function theirChanges(by: string): string {
  return `${by}'s unpublished changes`;
}

/** What everyone else is told while a person's draft waits to be published or discarded, where they would edit. */
export function draftNotice(by: string): string {
  return `${by} has unpublished changes`;
}

/**
 * Quick Edit's example requests, built from the site's own content so they
 * name its real classes, prices, and people, never another business's. A
 * click puts one in the message box for the owner to change before sending:
 * each example proposes a change the owner didn't ask for yet.
 */

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const list = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter(isObj) : []);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** "7:30 PM" from minutes after midnight. */
function clock(minutes: number, meridiem = true): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = String(minutes % 60).padStart(2, "0");
  const text = `${h % 12 || 12}:${m}`;
  return meridiem ? `${text} ${h < 12 ? "AM" : "PM"}` : text;
}
const minutesOf = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

function dayPhrase(days: string[]): string {
  const set = new Set(days);
  if (WEEKDAYS.every((d) => set.has(d)) && set.size === 5) return "weekdays";
  if (set.size === 2 && set.has("saturday") && set.has("sunday")) return "weekends";
  return DAYS.filter((d) => set.has(d))
    .map((d) => `${title(d)}s`)
    .join(" and ");
}

/** A closure on the first Saturday at least a week out, for a site that has announcements. */
function closure(today: string): string {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 7);
  while (date.getUTCDay() !== 6) date.setUTCDate(date.getUTCDate() + 1);
  return `We're closed Saturday the ${ordinal(date.getUTCDate())}`;
}

/** The first service on the menu priced as a whole dollar amount, five dollars up. */
function price(services: unknown): string | null {
  const walk = (node: Obj): Obj[] => [
    ...list(node.services),
    ...list(node.groups).flatMap(walk),
    ...list(node.sections).flatMap(walk),
  ];
  for (const service of list(services).flatMap(walk)) {
    const name = str(service.name);
    const match = /^\$(\d+)$/.exec(str(service.priceLabel) ?? "");
    if (name && match) return `Raise the ${name} price to $${Number(match[1]) + 5}`;
  }
  return null;
}

/** The first class's first session, half an hour later. */
function session(classes: unknown): string | null {
  for (const c of list(classes)) {
    const s = list(c.sessions)[0];
    const name = str(c.shortName) ?? str(c.name);
    if (!s || !name || typeof s.starts !== "string" || typeof s.ends !== "string" || !Array.isArray(s.days)) continue;
    const starts = minutesOf(s.starts) + 30;
    const ends = minutesOf(s.ends) + 30;
    if (ends >= 24 * 60) continue;
    const sameHalf = starts < 12 * 60 === ends < 12 * 60;
    const range = sameHalf ? `${clock(starts, false)} to ${clock(ends)}` : `${clock(starts)} to ${clock(ends)}`;
    return `${name} is moving to ${range} on ${dayPhrase(s.days as string[])}`;
  }
  return null;
}

/** The last open day of a weekly schedule, an hour later. */
function hours(site: unknown): string | null {
  const h = isObj(site) ? site.hours : null;
  if (!isObj(h)) return null;
  if (h.kind === "freeform") return "Update our hours";
  const days = list(h.days);
  const last = days[days.length - 1];
  if (!last || typeof last.day !== "string" || typeof last.closes !== "string") return null;
  const closes = minutesOf(last.closes) + 60;
  if (closes >= 24 * 60) return null;
  return `We're open until ${clock(closes)} on ${title(last.day)}s now`;
}

function teamBio(team: unknown): string | null {
  const name = str(list(team)[0]?.name);
  return name ? `Update ${name}'s bio` : null;
}

function faqAnswer(faqs: unknown): string | null {
  const question = str(list(faqs)[0]?.question);
  return question ? `Change the answer to "${question}"` : null;
}

/** Up to three examples, in this order of preference, from what the site has. */
export function exampleRequests(content: Obj, today: string): string[] {
  const candidates = [
    "announcements" in content ? closure(today) : null,
    price(content.services),
    session(content.classes),
    hours(content.site),
    teamBio(content.team),
    faqAnswer(content.faqs),
  ];
  return candidates.filter((c): c is string => Boolean(c)).slice(0, 3);
}

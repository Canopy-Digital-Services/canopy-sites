// Formatting shared by the server-rendered Stats parts and the client chart.
// Fixed locale and UTC so the server render and hydration always agree, and
// a stats day (a UTC date) never shifts with the viewer's time zone.

const count = new Intl.NumberFormat("en-US");
const ratio = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

const utc = (date: string) => new Date(`${date}T00:00:00Z`);

export const formatCount = (n: number) => count.format(n);
export const formatRatio = (n: number) => ratio.format(n);
/** "Oct 16" */
export const formatShortDate = (date: string) => shortDate.format(utc(date));
/** "Fri, Oct 16" */
export const formatLongDate = (date: string) => longDate.format(utc(date));

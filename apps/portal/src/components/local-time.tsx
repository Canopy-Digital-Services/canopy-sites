"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useSyncExternalStore } from "react";

const FORMATS = {
  date: { dateStyle: "medium" },
  dateTime: { dateStyle: "medium", timeStyle: "short" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

const subscribe = () => () => {};

/**
 * A moment in the viewer's own time zone, which only the browser knows: the server's is UTC,
 * and React keeps the server's text through hydration whatever the browser would have written.
 * So the server's time is a hidden stand-in that holds the space, and the browser's replaces it.
 */
export function LocalTime({ value, format = "dateTime" }: { value: Date | string; format?: keyof typeof FORMATS }) {
  const date = new Date(value);
  const local = useSyncExternalStore(
    subscribe,
    () => date.toLocaleString("en-US", FORMATS[format]),
    () => null
  );
  return (
    // The stand-in is never shown, so a server and a browser that write the same time differently don't matter.
    <time dateTime={date.toISOString()} className={local === null ? "invisible" : undefined} suppressHydrationWarning>
      {local ?? date.toLocaleString("en-US", { ...FORMATS[format], timeZone: "UTC" })}
    </time>
  );
}

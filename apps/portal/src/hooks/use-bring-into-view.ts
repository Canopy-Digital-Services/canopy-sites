"use client";

// UI: see docs/UX_PATTERNS.md ("Focus mark").
//
// Keeps what the user is working on in view in a scroll container they
// aren't scrolling: the live preview, while they edit in the column beside
// it. When what's being worked on changes, the container scrolls the least
// it can to show it.

import { useEffect, useRef } from "react";

/** Room kept between what's shown and the container's edge, CSS px. */
const MARGIN = 24;

/** The nearest ancestor of `el` that scrolls vertically. */
function scrollerOf(el: HTMLElement) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (/auto|scroll/.test(getComputedStyle(p).overflowY)) return p;
  }
  return null;
}

/** Scrolls `el`'s container the least it can to show all of `el`, or as
    much as fits from its top. */
function bringIntoView(el: HTMLElement) {
  const box = scrollerOf(el);
  // A hidden container (the preview column on a narrow screen) has no view.
  if (!box?.clientHeight) return;
  const view = box.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  // Below zero, its top is cut off; above zero, its bottom.
  const top = rect.top - (view.top + box.clientTop + MARGIN);
  const bottom = rect.bottom - (view.top + box.clientTop + box.clientHeight - MARGIN);
  let by = 0;
  if (rect.height <= box.clientHeight - 2 * MARGIN) by = top < 0 ? top : Math.max(0, bottom);
  // Too tall to show whole: from its top, unless it already fills the view.
  else if (top > 0 || bottom < 0) by = top;
  if (!by) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  box.scrollBy({ top: by, behavior: still ? "auto" : "smooth" });
}

/**
 * Brings what `selector` matches inside `host` into view whenever `selector`
 * changes. Its element may not be rendered yet (a field just added): it's
 * brought in on the render that adds it, which changes `renderKey`.
 */
export function useBringIntoView(
  host: React.RefObject<HTMLElement | null>,
  selector: string | null,
  renderKey: number
) {
  const shown = useRef<string | null>(null);
  useEffect(() => {
    if (selector === shown.current) return;
    if (!selector) {
      shown.current = null;
      return;
    }
    const el = host.current?.querySelector<HTMLElement>(selector);
    if (!el) return;
    shown.current = selector;
    bringIntoView(el);
  }, [host, selector, renderKey]);
}

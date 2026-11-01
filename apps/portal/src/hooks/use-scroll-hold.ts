"use client";

// UI: see docs/UX_PATTERNS.md ("Form editor").
//
// Keeps a scroll container's content still when it shrinks under the user.
// A browser can't stay scrolled past the end, so content that collapses near
// the bottom (a field row closing, a list of options hiding) pulls the scroll
// position back and slides everything down under the pointer. Instead, a
// spacer at the end takes up what was removed and the position is restored
// before paint; scrolling back up shrinks the spacer away.

import { useEffect, useRef } from "react";

/**
 * `scroller` is the scroll container, `content` everything it scrolls but the
 * spacer, and `spacer` an empty element after the content. A change of
 * `resetKey` (a new step) drops the spacer and returns to the top.
 */
export function useScrollHold(
  scroller: React.RefObject<HTMLElement | null>,
  content: React.RefObject<HTMLElement | null>,
  spacer: React.RefObject<HTMLElement | null>,
  resetKey: string
) {
  const lastTop = useRef(0);

  useEffect(() => {
    const box = scroller.current;
    const inner = content.current;
    const pad = spacer.current;
    if (!box || !inner || !pad) return;

    // The spacer just tall enough for the box to stay scrolled to `top`.
    const fit = (top: number) => {
      const natural = box.scrollHeight - pad.offsetHeight;
      return Math.max(0, Math.ceil(top + box.clientHeight - natural));
    };

    const onScroll = () => {
      lastTop.current = box.scrollTop;
      // Scrolling up gives back the spacer, never showing its edge move.
      const height = fit(box.scrollTop);
      if (height < pad.offsetHeight) pad.style.height = `${height}px`;
    };

    // Runs after layout and before paint, so the clamp is undone unseen.
    const observer = new ResizeObserver(() => {
      pad.style.height = `${fit(lastTop.current)}px`;
      if (box.scrollTop !== lastTop.current) box.scrollTop = lastTop.current;
    });

    lastTop.current = box.scrollTop;
    box.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(inner);
    observer.observe(box);
    return () => {
      box.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
    // The key also re-attaches to a container mounted anew (back on its tab).
  }, [scroller, content, spacer, resetKey]);

  // A new step starts at its top, with nothing held.
  useEffect(() => {
    const box = scroller.current;
    const pad = spacer.current;
    if (!box || !pad) return;
    pad.style.setProperty("height", "0px");
    lastTop.current = 0;
    box.scrollTo({ top: 0 });
  }, [scroller, spacer, resetKey]);
}

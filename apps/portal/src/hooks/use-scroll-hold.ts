"use client";

// UI: see docs/UX_PATTERNS.md ("Form editor").
//
// Keeps a scroll container's content still when it shrinks under the user.
// A browser can't stay scrolled past the end, so content that collapses near
// the bottom (a field row closing, a list of options hiding) pulls the scroll
// position back and slides everything down under the pointer. Instead, a
// spacer at the end takes up what was removed and the position is restored
// before paint; scrolling back up shrinks the spacer away.
//
// Content that folds from where the pointer is (a field row closed from the
// foot of its settings) is the other way round: what was clicked goes, and
// holding would leave the user looking at empty space below the content.
// Dispatching SCROLL_HOLD_RELEASE from inside the container hands the scroll
// to the fold until SCROLL_HOLD_RESUME: it moves with the fold, frame by
// frame, to bring the fold's anchor into view.

import { useEffect, useRef } from "react";

export const SCROLL_HOLD_RELEASE = "scroll-hold-release";
export const SCROLL_HOLD_RESUME = "scroll-hold-resume";

/** SCROLL_HOLD_RELEASE's detail: what folds, and what to bring into view
    (with its scroll-margin-top above it) once it has. */
export type ScrollHoldFold = { folding: Element; anchor: Element };

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

    // Where a part of the content sits, in the box's scroll coordinates.
    const offset = (el: Element) =>
      el.getBoundingClientRect().top - box.getBoundingClientRect().top - box.clientTop + box.scrollTop;
    // Where the content ends: where the spacer starts, plus the box's own
    // padding. scrollHeight can't say, since it never reads less than the box.
    const contentEnd = () => offset(pad) + parseFloat(getComputedStyle(box).paddingBottom);
    // The spacer just tall enough for the box to stay scrolled to `top`. At
    // the top there's nothing to hold: content shorter than the box would
    // otherwise get a spacer filling it (plus a pixel of rounding), and with
    // it a scrollbar for nothing.
    const fit = (top: number) => (top <= 0 ? 0 : Math.max(0, Math.ceil(top + box.clientHeight - contentEnd())));

    // Holds the box where the user left it, the spacer taking up the slack.
    // Only a clamp is undone (the content got too short to stay scrolled
    // there), never a scroll on its way that no event has reported yet:
    // restoring would cancel it.
    let seenHeight = box.scrollHeight;
    let released = false;

    // Takes the scroll where it is, the user's or a clamp's, and gives back
    // spacer it no longer needs.
    const follow = () => {
      lastTop.current = box.scrollTop;
      // Scrolling up gives back the spacer, never showing its edge move.
      const height = fit(box.scrollTop);
      if (height < pad.offsetHeight) pad.style.height = `${height}px`;
      seenHeight = box.scrollHeight;
    };

    // A released fold's course: from where the scroll was to where the
    // anchor shows, at the fold's own pace (its share folded so far), so the
    // two read as one motion. A smooth scroll beside the fold ran on its own
    // curve, finishing before the fold's fast end and then jumping with it.
    let course: { from: number; to: number; folding: Element; height: number } | null = null;
    const steer = (done = false) => {
      if (!course) return;
      const { from, to, folding, height } = course;
      const left = done || !folding.isConnected ? 0 : folding.getBoundingClientRect().height;
      const top = from + (to - from) * Math.min(1, Math.max(0, 1 - left / height));
      pad.style.height = `${fit(top)}px`;
      box.scrollTop = top;
      lastTop.current = top;
      seenHeight = box.scrollHeight;
    };

    const hold = () => {
      if (released) return course ? steer() : follow();
      const clamped = box.scrollHeight - box.clientHeight < lastTop.current - 1;
      pad.style.height = `${fit(lastTop.current)}px`;
      if (clamped) box.scrollTop = lastTop.current;
      seenHeight = box.scrollHeight;
    };

    const onScroll = () => {
      // The steered fold's own scrolling.
      if (course) return;
      // Content that shrank pulled the scroll back, and Chrome can report it
      // before the observer below gets to hold it (a field row folding up
      // over several frames): that's no scroll of the user's.
      if (!released && box.scrollHeight < seenHeight && box.scrollTop < lastTop.current) {
        hold();
        return;
      }
      follow();
    };

    const release = (event: Event) => {
      released = true;
      follow();
      const fold = (event as CustomEvent<ScrollHoldFold | undefined>).detail;
      const height = fold?.folding.getBoundingClientRect().height ?? 0;
      if (!fold || !height) return;
      const from = box.scrollTop;
      const margin = parseFloat(getComputedStyle(fold.anchor).scrollMarginTop) || 0;
      // Up to the anchor if it's above the view (or too near its top), and
      // no further than the folded content lets the box scroll.
      const shown = Math.min(from, offset(fold.anchor) - margin);
      const to = Math.max(0, Math.min(shown, contentEnd() - height - box.clientHeight));
      course = { from, to, folding: fold.folding, height };
    };
    const resume = () => {
      steer(true);
      course = null;
      released = false;
      follow();
    };

    // Runs after layout and before paint, so the clamp is undone unseen.
    const observer = new ResizeObserver(hold);

    // This hook decides where the box scrolls as its content changes; the
    // browser's scroll anchoring would add adjustments of its own on top.
    box.style.setProperty("overflow-anchor", "none");
    lastTop.current = box.scrollTop;
    box.addEventListener("scroll", onScroll, { passive: true });
    box.addEventListener(SCROLL_HOLD_RELEASE, release);
    box.addEventListener(SCROLL_HOLD_RESUME, resume);
    observer.observe(inner);
    observer.observe(box);
    return () => {
      box.removeEventListener("scroll", onScroll);
      box.removeEventListener(SCROLL_HOLD_RELEASE, release);
      box.removeEventListener(SCROLL_HOLD_RESUME, resume);
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

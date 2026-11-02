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
// holding would leave the user looking at empty space. Such a fold hands its
// animation to `fold`, which moves the scroll along the animation's own
// progress to bring an anchor into view, so the two read as one motion.

import { createContext, useEffect, useRef, useState } from "react";

export type ScrollHold = {
  /** Scroll along `animation` (folding `folding` away) to show `anchor`,
      with its scroll-margin-top above it, instead of holding still. */
  fold: (animation: Animation, folding: Element, anchor: Element) => void;
};

/** The editor column's hold, for what folds inside it. */
export const ScrollHoldContext = createContext<ScrollHold | null>(null);

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
): ScrollHold {
  const lastTop = useRef(0);
  const foldImpl = useRef<ScrollHold["fold"] | null>(null);
  const [hold] = useState<ScrollHold>(() => ({
    fold: (...args) => foldImpl.current?.(...args),
  }));

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

    let seenHeight = box.scrollHeight;
    let steering = false;

    // Takes the scroll where it is, the user's or a clamp's, and gives back
    // spacer it no longer needs.
    const follow = () => {
      lastTop.current = box.scrollTop;
      // Scrolling up gives back the spacer, never showing its edge move.
      const height = fit(box.scrollTop);
      if (height < pad.offsetHeight) pad.style.height = `${height}px`;
      seenHeight = box.scrollHeight;
    };

    // Holds the box where the user left it, the spacer taking up the slack.
    // Only a clamp is undone (the content got too short to stay scrolled
    // there), never a scroll on its way that no event has reported yet:
    // restoring would cancel it.
    const hold = () => {
      if (steering) return;
      const clamped = box.scrollHeight - box.clientHeight < lastTop.current - 1;
      pad.style.height = `${fit(lastTop.current)}px`;
      if (clamped) box.scrollTop = lastTop.current;
      seenHeight = box.scrollHeight;
    };

    const onScroll = () => {
      if (steering) return;
      // Content that shrank pulled the scroll back, and Chrome can report it
      // before the observer below gets to hold it (a field row folding up
      // over several frames): that's no scroll of the user's.
      if (box.scrollHeight < seenHeight && box.scrollTop < lastTop.current) {
        hold();
        return;
      }
      follow();
    };

    foldImpl.current = (animation, folding, anchor) => {
      const height = folding.getBoundingClientRect().height;
      if (!height) return;
      const from = box.scrollTop;
      const margin = parseFloat(getComputedStyle(anchor).scrollMarginTop) || 0;
      // Up to the anchor if it's above the view (or too near its top), and
      // no further than the folded content lets the box scroll.
      const shown = Math.min(from, offset(anchor) - margin);
      const to = Math.max(0, Math.min(shown, contentEnd() - height - box.clientHeight));
      // Each frame, before its layout, at the animation's own eased progress.
      const place = (progress: number) => {
        const top = from + (to - from) * progress;
        pad.style.height = `${fit(top)}px`;
        box.scrollTop = top;
        lastTop.current = top;
        seenHeight = box.scrollHeight;
      };
      steering = true;
      const step = () => {
        if (!steering) return;
        // No progress yet is a fold not started (it starts with the next frame).
        place(animation.effect?.getComputedTiming().progress ?? 0);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      const end = () => {
        steering = false;
        follow();
      };
      animation.finished.then(() => {
        place(1);
        end();
      }, end);
    };

    // Runs after layout and before paint, so the clamp is undone unseen.
    const observer = new ResizeObserver(hold);

    // This hook decides where the box scrolls as its content changes; the
    // browser's scroll anchoring would add adjustments of its own on top.
    box.style.setProperty("overflow-anchor", "none");
    lastTop.current = box.scrollTop;
    box.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(inner);
    observer.observe(box);
    return () => {
      steering = false;
      foldImpl.current = null;
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

  return hold;
}

"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// The settings of a row in the editor's lists (Fields, Styling): they open
// below the row's summary and fold back into it. The animation runs on
// grid-template-rows (0fr to 1fr), which follows the settings' height as it
// changes (a Name's parts revealing, an option added) without measuring it,
// through the Web Animations API, so a fold's progress can steer the scroll
// (onFold) and its end can unmount the settings.

import { useLayoutEffect, useRef, useState } from "react";

/** A CSS time in milliseconds: the built stylesheet may write 260ms as ".26s". */
const ms = (time: string) => parseFloat(time) * (/ms$/.test(time) ? 1 : 1000);

export function RowBody({
  open,
  onFold,
  children,
}: {
  open: boolean;
  /** Called as the settings start folding away, with the fold and the element folding. */
  onFold?: (fold: Animation, body: HTMLElement) => void;
  children: React.ReactNode;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const latestOnFold = useRef(onFold);
  useLayoutEffect(() => {
    latestOnFold.current = onFold;
  });

  // The settings stay mounted while they fold away.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  // A row that is open when it first renders (a field just added) doesn't animate.
  const wasOpen = useRef(open);
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (wasOpen.current === open || !body) return;
    wasOpen.current = open;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (open) {
      // editor-reveal's curve (globals.css): a height that springs past its
      // target reads as a glitch.
      const opening = body.animate(
        { gridTemplateRows: ["0fr", "1fr"], opacity: [0, 1] },
        { duration: still ? 1 : 380, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
      );
      return () => opening.cancel();
    }
    const token = (name: string) => getComputedStyle(body).getPropertyValue(name).trim();
    const folding = body.animate(
      { gridTemplateRows: ["1fr", "0fr"], opacity: [1, 0] },
      {
        duration: still ? 1 : ms(token("--duration-flow-out")),
        easing: token("--ease-flow-out"),
        fill: "forwards",
      }
    );
    latestOnFold.current?.(folding, body);
    folding.finished.then(
      () => setMounted(false),
      // Reopened mid-fold: the settings stay.
      () => {}
    );
    return () => folding.cancel();
  }, [open]);

  if (!mounted) return null;
  return (
    <div ref={bodyRef} className="grid grid-rows-[1fr]">
      {/* -mx-1/px-1 keeps focus rings clear of the fold's clip. White
          controls stand off the open row's tint. */}
      <div className="min-h-0 overflow-hidden -mx-1 px-1 [&_input]:bg-card [&_textarea]:bg-card [&_[role=combobox]:not(:hover)]:bg-card">
        {children}
      </div>
    </div>
  );
}

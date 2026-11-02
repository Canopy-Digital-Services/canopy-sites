"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// A box whose text is a stand-in (a new field's label, a starter option) is
// selected whole when a click focuses it, so typing replaces the text rather
// than adding to it. Tabbing in selects it already; focus from code is left
// to the code.

import { useRef } from "react";

/** Props for a text box whose text is a stand-in while `isStandIn` says so. */
export function useSelectStandIn(isStandIn: (text: string) => boolean) {
  const focusedBefore = useRef(false);
  return {
    onMouseDown: (e: React.MouseEvent<HTMLInputElement>) => {
      focusedBefore.current = document.activeElement === e.currentTarget;
    },
    // Selected on mouseup: one made as the press focuses the box drops to a
    // caret when it ends. A drag that selected part of the text stands.
    onMouseUp: (e: React.MouseEvent<HTMLInputElement>) => {
      const box = e.currentTarget;
      if (focusedBefore.current || box.selectionStart !== box.selectionEnd || !isStandIn(box.value)) return;
      e.preventDefault();
      box.select();
    },
  };
}

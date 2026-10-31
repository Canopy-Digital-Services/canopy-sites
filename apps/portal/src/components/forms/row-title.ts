"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows", "Styling panel").
//
// The title of a row in the editor's lists (Fields, Styling): one look for
// both, and the coral marker underline under the open row's title.

import { useEffect } from "react";
import { buildMark, loadBrush, measure, seeded, shapes } from "@/lib/marker-brush";

/** A list row's title. Positioned, for the underline's canvas. */
export const ROW_TITLE = "relative text-left font-heading font-semibold text-base";

/** Marker body thickness for a row title's underline, CSS px. */
const UNDERLINE_PEN = 3;

/** Underlines `ref`'s text with the coral marker, drawn by hand, while `show`
    is on. The element must be positioned: the canvas sits inside it. */
export function useMarkerUnderline(ref: React.RefObject<HTMLElement | null>, show: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !show) return;
    let cancelled = false;
    let raf = 0;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "absolute",
      maxWidth: "none",
      pointerEvents: "none",
      color: "var(--canopy-coral)",
    });
    (async () => {
      // Measure after web fonts load: fallbacks sit differently.
      const [brush] = await Promise.all([loadBrush(), document.fonts?.ready]);
      if (cancelled) return;
      el.appendChild(canvas);
      const mark = buildMark(
        canvas,
        brush,
        shapes.underline(measure(el), UNDERLINE_PEN, seeded(el.textContent ?? "")),
        {
          pen: UNDERLINE_PEN,
          color: getComputedStyle(canvas).color,
          dpr: Math.min(window.devicePixelRatio || 1, 3),
        }
      );
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return mark.paint(1);
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / mark.duration);
        mark.paint(t);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })().catch(() => {});
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      canvas.remove();
    };
  }, [ref, show]);
}

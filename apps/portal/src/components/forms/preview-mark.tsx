"use client";

import { useEffect, useRef } from "react";
import { buildMark, loadBrush, measure, seeded, shapes, type Mark } from "@/lib/marker-brush";

/** Marker body thickness, CSS px. */
const PEN = 4;

type PreviewMarkProps = {
  /** The element the embed renders into. Must be positioned and isolated
      (`relative isolate`), so the mark can sit behind its text. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** CSS selector, inside the container, of the element to box. Null clears the mark. */
  target: string | null;
  /** Changes whenever the embed re-renders, so the mark follows the new layout. */
  renderKey: number;
};

/**
 * Sketches a coral marker box round one element of the live preview: drawn by
 * hand when the target changes, redrawn finished when the preview re-renders
 * under it (the user typing).
 *
 * The canvas lives inside the embed's container, behind its content
 * (z-index -1 in the container's stacking context), so the stroke shows over
 * the form's background but never over text it grazes: the header's title
 * and description sit closer together than the pen is wide. The embed wipes
 * the container on every render, so the canvas is made here, outside React,
 * and put back before each draw.
 */
export function PreviewMark({ containerRef, target, renderKey }: PreviewMarkProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawn = useRef<string | null>(null);
  // The hand-drawing animation, shared so a redraw can cut it short.
  const raf = useRef(0);

  // Build the box round `selector` as laid out now. Null if it isn't rendered.
  const build = async (selector: string): Promise<Mark | null> => {
    const [brush] = await Promise.all([loadBrush(), document.fonts?.ready]);
    const host = containerRef.current;
    const el = host?.querySelector<HTMLElement>(selector);
    if (!host || !el) return null;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = canvasRef.current = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      Object.assign(canvas.style, {
        position: "absolute",
        zIndex: "-1",
        maxWidth: "none",
        pointerEvents: "none",
        transition: "opacity 200ms",
        color: "var(--canopy-coral)",
      });
    }
    if (canvas.parentElement !== host) host.appendChild(canvas);
    const hostBox = host.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const ox = box.left - hostBox.left, oy = box.top - hostBox.top;
    const strokes = shapes
      .box(measure(el), PEN, seeded(selector))
      .map((st) => st.map(([x, y]) => [x + ox, y + oy] as [number, number]));
    return buildMark(canvas, brush, strokes, {
      pen: PEN,
      color: getComputedStyle(canvas).color,
      dpr: Math.min(window.devicePixelRatio || 1, 3),
    });
  };

  // A new target: draw it in by hand. No target: lift the mark off.
  useEffect(() => {
    if (!target) {
      drawn.current = null;
      if (canvasRef.current) canvasRef.current.style.opacity = "0";
      return;
    }
    let cancelled = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    build(target)
      .then((mark) => {
        const canvas = canvasRef.current;
        if (cancelled || !mark || !canvas) return;
        drawn.current = target;
        canvas.style.opacity = "1";
        if (reduced) return mark.paint(1);
        const t0 = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - t0) / mark.duration);
          mark.paint(t);
          if (t < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf.current);
    };
    // build reads refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // The preview re-rendered under the mark: redraw it, finished, to fit.
  useEffect(() => {
    const selector = drawn.current;
    if (!selector) return;
    let cancelled = false;
    build(selector)
      .then((mark) => {
        if (cancelled || drawn.current !== selector || !mark) return;
        cancelAnimationFrame(raf.current);
        mark.paint(1);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderKey]);

  // Unmounted: take the canvas out of the embed's container.
  useEffect(() => () => canvasRef.current?.remove(), []);

  return null;
}

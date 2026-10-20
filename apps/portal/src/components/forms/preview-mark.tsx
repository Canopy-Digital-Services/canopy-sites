"use client";

import { useEffect, useRef } from "react";
import { buildMark, loadBrush, measure, seeded, shapes, type Mark } from "@/lib/marker-brush";

/** Marker body thickness, CSS px. */
const PEN = 4;

type PreviewMarkProps = {
  /** The element the embed renders into. Must be positioned, since the
      mark is placed inside it. */
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
 * The canvas lives inside the embed's container, on top of the form, as ink
 * on the page would: it may cross a field's edge or graze neighboring text.
 * The embed wipes the container on every render, so the canvas is made here,
 * outside React, and put back before each draw.
 */
export function PreviewMark({ containerRef, target, renderKey }: PreviewMarkProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  /** The target as of the last render, and the one the canvas shows. */
  const wanted = useRef<string | null>(null);
  const drawn = useRef<string | null>(null);
  /** Bumped by every draw, so an older one stops before touching the canvas. */
  const run = useRef(0);
  // The hand-drawing animation, shared so a redraw can cut it short.
  const raf = useRef(0);

  // Build the box round `selector` as laid out now. Null if it isn't rendered
  // yet, or if draw `id` has been overtaken.
  const build = async (selector: string, id: number): Promise<Mark | null> => {
    const [brush] = await Promise.all([loadBrush(), document.fonts?.ready]);
    const host = containerRef.current;
    const el = host?.querySelector<HTMLElement>(selector);
    if (id !== run.current || !host || !el) return null;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = canvasRef.current = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      Object.assign(canvas.style, {
        position: "absolute",
        zIndex: "1",
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

  // Box `selector`: by hand when it is new, finished when it is already drawn
  // and the preview re-rendered under it. A target the preview hasn't
  // rendered yet (a field just added) is drawn on the render that adds it.
  const draw = async (selector: string) => {
    const id = ++run.current;
    const mark = await build(selector, id);
    const canvas = canvasRef.current;
    if (!mark || !canvas || id !== run.current) return;
    cancelAnimationFrame(raf.current);
    canvas.style.opacity = "1";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fresh = drawn.current !== selector;
    drawn.current = selector;
    if (!fresh || reduced) return mark.paint(1);
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / mark.duration);
      mark.paint(t);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  // A new target draws in; no target lifts the mark off.
  useEffect(() => {
    wanted.current = target;
    if (target) {
      void draw(target).catch(() => {});
      return;
    }
    run.current++;
    drawn.current = null;
    cancelAnimationFrame(raf.current);
    if (canvasRef.current) canvasRef.current.style.opacity = "0";
    // draw reads refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // The preview re-rendered: follow the new layout.
  useEffect(() => {
    if (wanted.current) void draw(wanted.current).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderKey]);

  // Unmounted: take the canvas out of the embed's container.
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      canvasRef.current?.remove();
    },
    []
  );

  return null;
}

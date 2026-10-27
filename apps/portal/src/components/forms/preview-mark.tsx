"use client";

import { useEffect, useRef } from "react";
import { buildMark, loadBrush, seeded, shapes, type Mark, type Metrics } from "@/lib/marker-brush";

/** Marker body thickness, CSS px. */
const PEN = 4;

/** Target selector meaning the host itself, boxed inside its edges. */
export const MARK_HOST = ":scope";

/** How far inside its edges the host's own box is drawn, CSS px. */
const HOST_INSET = 24;

/** Between one box starting and the next, when a group draws by hand, ms. */
const STAGGER = 70;

type PreviewMarkProps = {
  /** The positioned element the marks are drawn in, over the targets. */
  hostRef: React.RefObject<HTMLDivElement | null>;
  /** CSS selector, inside the host, of every element to box (or MARK_HOST).
      Null clears the marks. */
  target: string | null;
  /** Changes whenever the marks should be drawn by hand; any other redraw
      paints them finished. */
  drawKey: string;
  /** Changes whenever the embed re-renders, so the marks follow the new layout. */
  renderKey: number;
};

/** What the box shape reads of a target: its size and font size. */
function boxMetrics(el: HTMLElement, w: number, h: number): Metrics {
  const em = parseFloat(getComputedStyle(el).fontSize) || 16;
  return { w, h, em, baseline: h, xHeight: em / 2 };
}

/**
 * Sketches a coral marker box round every element of the live preview that
 * matches `target`: drawn by hand when `drawKey` changes, painted finished on
 * any other redraw (the preview re-rendering under typing).
 *
 * The canvases sit on top of the form, as ink on the page would: a box may
 * cross a field's edge or graze neighboring text. One canvas per box, made
 * here outside React and appended to the host.
 */
export function PreviewMark({ hostRef, target, drawKey, renderKey }: PreviewMarkProps) {
  const canvases = useRef<HTMLCanvasElement[]>([]);
  /** The target as of the last render. */
  const wanted = useRef<string | null>(null);
  /** The drawKey last drawn by hand. */
  const drawn = useRef<string | null>(null);
  /** Bumped by every draw, so an older one stops before touching the canvases. */
  const run = useRef(0);
  // The hand-drawing animation, shared so a redraw can cut it short.
  const raf = useRef(0);

  const canvasAt = (host: HTMLElement, i: number) => {
    let canvas = canvases.current[i];
    if (!canvas) {
      canvas = canvases.current[i] = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      // Left out of thumbnails (useThumbnailCapture).
      canvas.dataset.previewMark = "";
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
    return canvas;
  };

  // Build a box round each element matching `selector` as laid out now.
  // Null if draw `id` has been overtaken.
  const build = async (selector: string, id: number): Promise<Mark[] | null> => {
    const [brush] = await Promise.all([loadBrush(), document.fonts?.ready]);
    const host = hostRef.current;
    if (id !== run.current || !host) return null;
    const els =
      selector === MARK_HOST ? [host] : Array.from(host.querySelectorAll<HTMLElement>(selector));
    for (const extra of canvases.current.splice(els.length)) extra.remove();
    const hostBox = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    return els.map((el, i) => {
      const canvas = canvasAt(host, i);
      let ox: number, oy: number, m: Metrics;
      if (el === host) {
        ox = oy = HOST_INSET;
        m = boxMetrics(el, host.clientWidth - 2 * HOST_INSET, host.clientHeight - 2 * HOST_INSET);
      } else {
        const box = el.getBoundingClientRect();
        ox = box.left - hostBox.left;
        oy = box.top - hostBox.top;
        m = boxMetrics(el, box.width, box.height);
      }
      const strokes = shapes
        .box(m, PEN, seeded(`${selector}#${i}`))
        .map((st) => st.map(([x, y]) => [x + ox, y + oy] as [number, number]));
      return buildMark(canvas, brush, strokes, {
        pen: PEN,
        color: getComputedStyle(canvas).color,
        dpr,
      });
    });
  };

  // Box every match of `selector`: by hand when `key` hasn't been drawn by
  // hand yet, finished otherwise. A key whose targets aren't rendered yet (a
  // field just added) is drawn by hand on the render that adds them.
  const draw = async (selector: string, key: string) => {
    const id = ++run.current;
    const marks = await build(selector, id);
    if (!marks || id !== run.current) return;
    cancelAnimationFrame(raf.current);
    canvases.current.forEach((c) => (c.style.opacity = "1"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fresh = marks.length > 0 && drawn.current !== key;
    if (fresh) drawn.current = key;
    if (!fresh || reduced) return marks.forEach((mark) => mark.paint(1));
    const t0 = performance.now();
    const tick = (now: number) => {
      let done = true;
      marks.forEach((mark, i) => {
        const t = Math.min(1, Math.max(0, (now - t0 - i * STAGGER) / mark.duration));
        mark.paint(t);
        if (t < 1) done = false;
      });
      if (!done) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  // A new target or key draws; no target lifts the marks off.
  useEffect(() => {
    wanted.current = target;
    if (target) {
      void draw(target, drawKey).catch(() => {});
      return;
    }
    run.current++;
    drawn.current = null;
    cancelAnimationFrame(raf.current);
    canvases.current.forEach((c) => (c.style.opacity = "0"));
    // draw reads refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, drawKey]);

  // The preview re-rendered: follow the new layout.
  useEffect(() => {
    if (wanted.current) void draw(wanted.current, drawKey).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderKey]);

  // Unmounted: take the canvases out of the host.
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      canvases.current.forEach((c) => c.remove());
    },
    []
  );

  return null;
}

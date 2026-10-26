"use client";

import { useLayoutEffect, useState } from "react";
import { MARK_HOST } from "@/components/forms/preview-mark";

/** Gap between an element and its outline, CSS px. */
const GAP = 3;

/** How far inside its edges the host's own outline sits, CSS px. */
const HOST_INSET = 8;

type Box = { left: number; top: number; width: number; height: number; radius: number };

type PreviewOutlineProps = {
  /** The positioned element the outlines are drawn in; render this inside it. */
  hostRef: React.RefObject<HTMLDivElement | null>;
  /** The element to outline, or a selector inside the host for every match
      (MARK_HOST for the host itself). Null clears the outlines. */
  target: HTMLElement | string | null;
  /** Changes whenever the embed re-renders, so the outlines follow the new layout. */
  renderKey: number;
};

/**
 * A thin outline hugging each target in the live preview: what styling mode
 * shows on hover, as builders and the browser's inspector do. It follows the
 * element's own corner radius, a few px out.
 */
export function PreviewOutline({ hostRef, target, renderKey }: PreviewOutlineProps) {
  const [boxes, setBoxes] = useState<Box[]>([]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const measure = () => {
      if (!host || !target) return setBoxes([]);
      const els =
        typeof target !== "string"
          ? target.isConnected ? [target] : []
          : target === MARK_HOST
            ? [host]
            : Array.from(host.querySelectorAll<HTMLElement>(target));
      const hostBox = host.getBoundingClientRect();
      setBoxes(
        els.map((el) => {
          if (el === host) {
            return {
              left: HOST_INSET,
              top: HOST_INSET,
              width: host.clientWidth - 2 * HOST_INSET,
              height: host.clientHeight - 2 * HOST_INSET,
              radius: 6,
            };
          }
          const box = el.getBoundingClientRect();
          const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
          return {
            left: box.left - hostBox.left - GAP,
            top: box.top - hostBox.top - GAP,
            width: box.width + 2 * GAP,
            height: box.height + 2 * GAP,
            radius: radius + GAP,
          };
        })
      );
    };
    measure();
    if (!host || !target) return;
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [hostRef, target, renderKey]);

  return boxes.map((box, i) => (
    <div
      key={i}
      aria-hidden
      className="pointer-events-none absolute z-[2] border-[1.5px] border-primary"
      style={{
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        borderRadius: box.radius,
      }}
    />
  ));
}

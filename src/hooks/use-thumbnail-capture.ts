"use client";

import { useEffect, useRef, useCallback } from "react";
import { toJpeg } from "html-to-image";
import { updateFormThumbnail } from "@/actions/forms";
import type { SaveStatus } from "@/components/forms/form-context";

export function useThumbnailCapture({
  formId,
  saveStatus,
  previewRef,
  enabled = true,
}: {
  formId: string;
  saveStatus: SaveStatus;
  previewRef: React.RefObject<HTMLDivElement | null>;
  enabled?: boolean;
}) {
  const lastCaptureRef = useRef(0);
  const inFlightRef = useRef(false);

  const capture = useCallback(async ({ throttle = true } = {}) => {
    const el = previewRef.current;
    if (!el || inFlightRef.current) return;
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return;

    const now = Date.now();
    if (throttle && now - lastCaptureRef.current < 10_000) return;

    inFlightRef.current = true;
    if (throttle) lastCaptureRef.current = now;

    try {
      const dataUrl = await toJpeg(el, {
        quality: 0.9,
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
      });
      const base64 = dataUrl.split(",")[1];
      if (base64) await updateFormThumbnail(formId, base64);
    } catch (err) {
      console.warn("[thumbnail] capture failed:", err);
    } finally {
      inFlightRef.current = false;
    }
  }, [formId, previewRef]);

  // Stored thumbnails only refresh on save, so one captured under older
  // settings or styles would otherwise stay stale until the form is edited.
  // Recapture once per editor visit, after the embed preview has rendered.
  // Unthrottled so an edit made right after opening still captures.
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => void capture({ throttle: false }), 1500);
    return () => clearTimeout(timer);
  }, [enabled, capture]);

  useEffect(() => {
    if (!enabled || saveStatus !== "saved") return;
    const timer = setTimeout(() => void capture(), 500);
    return () => clearTimeout(timer);
  }, [saveStatus, enabled, capture]);
}

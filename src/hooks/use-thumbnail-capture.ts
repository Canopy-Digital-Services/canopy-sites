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

  const capture = useCallback(async () => {
    const el = previewRef.current;
    if (!el || inFlightRef.current) return;
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return;

    const now = Date.now();
    if (now - lastCaptureRef.current < 10_000) return;

    inFlightRef.current = true;
    lastCaptureRef.current = now;

    try {
      const dataUrl = await toJpeg(el, {
        quality: 0.7,
        pixelRatio: 0.5,
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

  useEffect(() => {
    if (!enabled || saveStatus !== "saved") return;
    const timer = setTimeout(() => void capture(), 500);
    return () => clearTimeout(timer);
  }, [saveStatus, enabled, capture]);
}

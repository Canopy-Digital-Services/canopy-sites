"use client";

import { useEffect, useRef, useState } from "react";
import type { EmbedFormInstance } from "@/lib/embed-preview";

type EmbedFormConstructorOptions = {
  formId?: string;
  preview?: boolean;
};

type CanopyFormsGlobal = {
  init: () => void;
  CanopyForm: new (
    container: HTMLElement,
    options: EmbedFormConstructorOptions
  ) => EmbedFormInstance;
};

/**
 * Load the embed script and create a CanopyForm instance in the given container.
 * Returns { formInstanceRef, ready } so callers can call renderFromDefinition().
 *
 * Pass `{ preview: true }` from admin previews — Submit is intercepted (no
 * fetch, no submission row) and the button gets a tooltip explaining why.
 */
export function useEmbedScript(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: EmbedFormConstructorOptions = {}
) {
  const { preview } = options;
  const formInstanceRef = useRef<EmbedFormInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [embedUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getGlobal = () =>
      (window as unknown as { CanopyForms?: CanopyFormsGlobal }).CanopyForms;

    const createInstance = () => {
      const cf = getGlobal();
      if (!cf?.CanopyForm || !containerRef.current) return;
      formInstanceRef.current = new cf.CanopyForm(containerRef.current, {
        preview,
      });
      setReady(true);
    };

    // Check if already loaded
    if (getGlobal()?.CanopyForm) {
      createInstance();
      return;
    }

    // Check if script tag exists but not yet loaded
    let script = document.querySelector(
      'script[src*="/embed.js"]'
    ) as HTMLScriptElement | null;

    if (script) {
      if (getGlobal()?.CanopyForm) {
        createInstance();
      } else {
        script.addEventListener("load", () => setTimeout(createInstance, 50));
      }
    } else {
      script = document.createElement("script");
      script.src = `${embedUrl}/embed.js`;
      script.onload = () => setTimeout(createInstance, 50);
      script.onerror = () => {
        console.error("[useEmbedScript] Failed to load embed script");
      };
      document.head.appendChild(script);
    }
  }, [embedUrl, containerRef, preview]);

  return { formInstanceRef, ready };
}

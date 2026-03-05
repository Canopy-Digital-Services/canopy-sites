"use client";

import { useEffect, useRef } from "react";
import { useEmbedScript } from "@/hooks/use-embed-script";
import { formToEmbedDefinition, type EmbedFormInput } from "@/lib/embed-preview";
import { useOptionalFormContext } from "@/components/forms/form-context";
import { cn } from "@/lib/utils";
import { extractPageTheme, CONTENT_WIDTH_MAP, cardWrapperStyle } from "@/lib/page-theme";

type FormPreviewProps = {
  /** Static form data — used when live=false (default). */
  form?: EmbedFormInput;
  mode: "embed" | "page";
  /** When true, reads live state from FormContext and debounces re-renders. */
  live?: boolean;
};

export function FormPreview({ form, mode, live = false }: FormPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { formInstanceRef, ready } = useEmbedScript(containerRef);

  // Always call the hook (Rules of Hooks) — returns null outside a FormProvider
  const ctx = useOptionalFormContext();
  const source = live && ctx ? ctx.state : form;

  // Extract page-level theme for "page" mode
  const themeObj =
    source && typeof source.defaultTheme === "object" && source.defaultTheme !== null
      ? (source.defaultTheme as Record<string, unknown>)
      : null;
  const page = extractPageTheme(themeObj);

  // Render from static form prop (no debounce)
  useEffect(() => {
    if (live || !ready || !formInstanceRef.current || !form) return;
    formInstanceRef.current.renderFromDefinition(formToEmbedDefinition(form));
  }, [live, ready, formInstanceRef, form]);

  // Render from live context state (debounced 150ms)
  useEffect(() => {
    if (!live || !ready || !formInstanceRef.current || !source) return;

    const definition = formToEmbedDefinition(source as EmbedFormInput);
    const timer = setTimeout(() => {
      formInstanceRef.current?.renderFromDefinition(definition);
    }, 150);

    return () => clearTimeout(timer);
  }, [live, ready, formInstanceRef, source]);

  const preview = (
    <div ref={containerRef}>
      {!ready && (
        <div className="text-muted-foreground text-sm p-4">
          Loading preview...
        </div>
      )}
    </div>
  );

  if (mode === "embed") {
    return (
      <div
        className="flex-1 flex items-start justify-center p-6"
        style={{ backgroundColor: page.formBackground }}
      >
        <div className="w-full max-w-lg">{preview}</div>
      </div>
    );
  }

  // Page mode — apply page-theme styling
  return (
    <div
      className={cn(
        "flex-1 flex justify-center p-6",
        page.verticalAlign === "center" ? "items-center" : "items-start",
        !page.pageBackground && "bg-muted/40",
      )}
      style={page.pageBackground ? { backgroundColor: page.pageBackground } : undefined}
    >
      <div className="w-full" style={{ maxWidth: CONTENT_WIDTH_MAP[page.contentWidth] }}>
        <div style={cardWrapperStyle(page)}>
          {preview}
        </div>
      </div>
    </div>
  );
}

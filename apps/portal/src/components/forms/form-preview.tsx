"use client";

import { useEffect, useRef, useState } from "react";
import { useEmbedScript } from "@/hooks/use-embed-script";
import { formToEmbedDefinition, type EmbedFormInput } from "@/lib/embed-preview";
import { useOptionalFormContext, HEADER_PLACEHOLDERS, FIELD_PLACEHOLDERS } from "@/components/forms/form-context";
import { PreviewMark } from "@/components/forms/preview-mark";
import { defaultLabel } from "@/components/forms/field-row";
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
  const { formInstanceRef, ready } = useEmbedScript(containerRef, { preview: true });

  // Always call the hook (Rules of Hooks) — returns null outside a FormProvider
  const ctx = useOptionalFormContext();
  const source = live && ctx ? ctx.state : form;

  // Extract page-level theme for "page" mode
  const themeObj =
    source && typeof source.defaultTheme === "object" && source.defaultTheme !== null
      ? (source.defaultTheme as Record<string, unknown>)
      : null;
  const page = extractPageTheme(themeObj);

  // Bumped after each live render, so the marker box can follow the layout.
  const [renderKey, setRenderKey] = useState(0);
  const focus = live ? (ctx?.previewFocus ?? null) : null;
  const markTarget =
    focus === "title"
      ? ".canopy-title"
      : focus === "description"
        ? ".canopy-description"
        : focus?.startsWith("field:")
          ? `.canopy-field[data-field-name="${CSS.escape(focus.slice(6))}"]`
          : null;

  // Render from static form prop (no debounce)
  useEffect(() => {
    if (live || !ready || !formInstanceRef.current || !form) return;
    formInstanceRef.current.renderFromDefinition(formToEmbedDefinition(form));
  }, [live, ready, formInstanceRef, form]);

  // Render from live context state (debounced 150ms)
  useEffect(() => {
    if (!live || !ready || !formInstanceRef.current || !source) return;

    // Empty parts show stand-ins, so the user always has a form to look at:
    // the header on its own step, the fields on every step after it. Stand-ins
    // shimmer like a skeleton so they don't read as saved; they never are.
    const step = ctx?.editorStep ?? null;
    const headerStandIn = step === "header";
    const fieldStandIns = step !== null && step !== "header" && source.fields.length === 0;
    const definition = formToEmbedDefinition({
      ...(source as EmbedFormInput),
      title: source.title || (headerStandIn ? HEADER_PLACEHOLDERS.title : null),
      description: source.description || (headerStandIn ? HEADER_PLACEHOLDERS.description : null),
      // A blank label shows as the default it will save as.
      fields: fieldStandIns
        ? FIELD_PLACEHOLDERS
        : source.fields.map((f) => ({ ...f, label: f.label.trim() || defaultLabel(f.type) })),
    });
    const timer = setTimeout(() => {
      formInstanceRef.current?.renderFromDefinition(definition);
      const root = containerRef.current;
      root?.querySelector(".canopy-title")?.classList.toggle("preview-placeholder", !source.title);
      root?.querySelector(".canopy-description")?.classList.toggle("preview-placeholder", !source.description);
      if (fieldStandIns) {
        root?.querySelectorAll(".canopy-field").forEach((f) => f.classList.add("preview-placeholder-field"));
        root?.querySelectorAll(".canopy-label").forEach((l) => l.classList.add("preview-placeholder"));
      }
      setRenderKey((k) => k + 1);
    }, 150);

    return () => clearTimeout(timer);
  }, [live, ready, formInstanceRef, source, ctx?.editorStep]);

  const preview = (
    <>
      {/* Positioned for PreviewMark, which draws inside it. */}
      <div ref={containerRef} className="relative">
        {!ready && (
          <div className="text-muted-foreground text-sm p-4">
            Loading preview...
          </div>
        )}
      </div>
      {live && <PreviewMark containerRef={containerRef} target={markTarget} renderKey={renderKey} />}
    </>
  );

  if (mode === "embed") {
    return (
      <div
        className="flex-1 flex items-start justify-center p-10"
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
        "flex-1 flex justify-center p-10",
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

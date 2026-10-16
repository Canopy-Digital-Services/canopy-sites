"use client";

import { useEffect, useRef } from "react";
import { useEmbedScript } from "@/hooks/use-embed-script";
import { useOptionalFormContext } from "@/components/forms/form-context";
import { extractPageTheme, CONTENT_WIDTH_MAP } from "@/lib/page-theme";
import type { EmbedDefinition } from "@/lib/embed-preview";

/** Field types whose editor modal shows a live single-field preview. */
export const FIELD_PREVIEW_TYPES = new Set(["NAME"]);

/** Matches FormPreview's embed container (max-w-lg). */
const EMBED_FORM_WIDTH = 512;
/** Hosted card padding from cardWrapperStyle (1.5rem each side). */
const CARD_PADDING = 48;

type FieldPreviewField = EmbedDefinition["fields"][number];

/**
 * Width the field gets on the live form. Composite fields (NAME) lay their
 * parts out in an auto-fit grid, so the preview must match this to wrap the
 * same way.
 */
export function useLiveFieldWidth(): number {
  const ctx = useOptionalFormContext();
  if (ctx?.state.type !== "HOSTED") return EMBED_FORM_WIDTH;
  const page = extractPageTheme(ctx.state.defaultTheme);
  const contentWidth = parseInt(CONTENT_WIDTH_MAP[page.contentWidth], 10);
  return page.cardEnabled ? contentWidth - CARD_PADDING : contentWidth;
}

/**
 * Renders one field through the embed script with the form's live theme, at
 * the width it gets on the live form. Used beside the field editor modal.
 */
export function FieldPreview({ field }: { field: FieldPreviewField }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { formInstanceRef, ready } = useEmbedScript(containerRef, {
    preview: true,
    fieldsOnly: true,
  });
  const ctx = useOptionalFormContext();
  const theme = ctx?.state.defaultTheme ?? null;
  const page = extractPageTheme(theme);
  const width = useLiveFieldWidth();

  useEffect(() => {
    if (!ready || !formInstanceRef.current) return;
    formInstanceRef.current.renderFromDefinition({
      formId: ctx?.state.id ?? "preview",
      slug: "preview",
      fields: [field],
      defaultTheme: theme ?? undefined,
    });
  }, [ready, formInstanceRef, field, theme, ctx?.state.id]);

  return (
    <div
      className="rounded-md border p-6"
      style={{ backgroundColor: page.formBackground }}
    >
      <div ref={containerRef} className="mx-auto max-w-full" style={{ width }}>
        {!ready && (
          <div className="text-muted-foreground text-sm">Loading preview...</div>
        )}
      </div>
    </div>
  );
}

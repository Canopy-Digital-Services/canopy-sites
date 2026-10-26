"use client";

import { useEffect, useRef, useState } from "react";
import { useEmbedScript } from "@/hooks/use-embed-script";
import { formToEmbedDefinition, type EmbedFormInput } from "@/lib/embed-preview";
import {
  useOptionalFormContext,
  HEADER_PLACEHOLDERS,
  FIELD_PLACEHOLDERS,
  type StyleGroup,
} from "@/components/forms/form-context";
import { PreviewMark, MARK_HOST } from "@/components/forms/preview-mark";
import { defaultLabel } from "@/components/forms/field-row";
import { cn } from "@/lib/utils";
import { extractPageTheme, CONTENT_WIDTH_MAP, cardWrapperStyle } from "@/lib/page-theme";

/** A part of the preview that picks a styling group, and the marks showing
    everything that group changes. The first zone an element is in wins. */
type Zone = { match: string; group: StyleGroup; marks: string };

const INPUTS = ".canopy-input, .canopy-select, .canopy-textarea";
const BODY_TEXT =
  ".canopy-description, .canopy-help-text, .canopy-checkbox, .canopy-name-part-label, .canopy-address-part-label";
const FORM_ZONE: Zone = { match: ".canopy-root, [data-preview-card]", group: "form", marks: ".canopy-root" };
const PAGE_ZONE: Zone = { match: MARK_HOST, group: "page", marks: MARK_HOST };

const ZONES: Zone[] = [
  { match: ".canopy-submit", group: "button", marks: ".canopy-submit" },
  { match: ".canopy-title, .canopy-label", group: "headings", marks: ".canopy-title, .canopy-label" },
  { match: BODY_TEXT, group: "body", marks: BODY_TEXT },
  { match: INPUTS, group: "form", marks: INPUTS },
  FORM_ZONE,
];

/** The zone a group opened from the styling panel marks. */
const GROUP_ZONES: Record<StyleGroup, Zone> = {
  page: PAGE_ZONE,
  form: FORM_ZONE,
  headings: ZONES[1],
  body: ZONES[2],
  button: ZONES[0],
};

type FormPreviewProps = {
  /** Static form data — used when live=false (default). */
  form?: EmbedFormInput;
  mode: "embed" | "page";
  /** When true, reads live state from FormContext and debounces re-renders. */
  live?: boolean;
};

export function FormPreview({ form, mode, live = false }: FormPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // The whole preview surface: what the marks are drawn in, and what styling
  // mode picks from.
  const surfaceRef = useRef<HTMLDivElement>(null);
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
  const focusTarget =
    focus === "title"
      ? ".canopy-title"
      : focus === "description"
        ? ".canopy-description"
        : focus?.startsWith("field:")
          ? `.canopy-field[data-field-name="${CSS.escape(focus.slice(6))}"]`
          : null;

  // Styling mode: hovering marks what a click would style, finished; a click
  // picks it and draws the marks by hand.
  const styling = live && !!ctx?.styling;
  const styleGroup = ctx?.styleGroup ?? null;
  const [hovered, setHovered] = useState<Zone | null>(null);
  const [picked, setPicked] = useState<{ zone: Zone; count: number }>({ zone: FORM_ZONE, count: 0 });
  const selected = styleGroup
    ? picked.zone.group === styleGroup ? picked.zone : GROUP_ZONES[styleGroup]
    : null;

  const zoneAt = (el: EventTarget): Zone => {
    const node = el instanceof Element ? el : null;
    const zone = node && ZONES.find((z) => node.closest(z.match));
    return zone ?? (mode === "page" ? PAGE_ZONE : FORM_ZONE);
  };
  const stylingHandlers = styling
    ? {
        onPointerMove: (e: React.PointerEvent) => setHovered(zoneAt(e.target)),
        onPointerLeave: () => setHovered(null),
        // Clicks pick a group and never reach the form: no typing, no
        // dropdowns, no focus.
        onMouseDownCapture: (e: React.MouseEvent) => e.preventDefault(),
        onClickCapture: (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          const zone = zoneAt(e.target);
          setPicked((p) => ({ zone, count: p.count + 1 }));
          ctx?.setStyleGroup(zone.group);
        },
      }
    : {};

  const shown = styling ? (hovered ?? selected) : null;
  const markTarget = styling ? (shown?.marks ?? null) : focusTarget;
  const drawKey = !styling ? focusTarget : shown === selected ? `${styleGroup}:${picked.count}` : null;

  // Render from static form prop (no debounce)
  useEffect(() => {
    if (live || !ready || !formInstanceRef.current || !form) return;
    formInstanceRef.current.renderFromDefinition(formToEmbedDefinition(form));
  }, [live, ready, formInstanceRef, form]);

  // Render from live context state (debounced 150ms)
  useEffect(() => {
    if (!live || !ready || !formInstanceRef.current || !source) return;

    // Empty parts show stand-ins, so the user always has a form to look at:
    // the header on its own step, the fields on every step after it, and both
    // while styling. Stand-ins shimmer like a skeleton so they don't read as
    // saved; they never are.
    const step = ctx?.editorStep ?? null;
    const headerStandIn = step === "header" || styling;
    const fieldStandIns =
      (styling || (step !== null && step !== "header")) && source.fields.length === 0;
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
  }, [live, ready, formInstanceRef, source, ctx?.editorStep, styling]);

  const preview = (
    <>
      <div ref={containerRef}>
        {!ready && (
          <div className="text-muted-foreground text-sm p-4">
            Loading preview...
          </div>
        )}
      </div>
      {live && (
        <PreviewMark hostRef={surfaceRef} target={markTarget} drawKey={drawKey} renderKey={renderKey} />
      )}
    </>
  );

  // Positioned for PreviewMark, which draws inside it.
  const surfaceProps = {
    ref: surfaceRef,
    ...stylingHandlers,
  };

  if (mode === "embed") {
    return (
      <div
        {...surfaceProps}
        className={cn("relative flex-1 flex items-start justify-center p-10", styling && "preview-styling")}
        style={{ backgroundColor: page.formBackground }}
      >
        <div className="w-full max-w-lg">{preview}</div>
      </div>
    );
  }

  // Page mode — apply page-theme styling
  return (
    <div
      {...surfaceProps}
      className={cn(
        "relative flex-1 flex justify-center p-10",
        page.verticalAlign === "center" ? "items-center" : "items-start",
        !page.pageBackground && "bg-muted/40",
        styling && "preview-styling",
      )}
      style={page.pageBackground ? { backgroundColor: page.pageBackground } : undefined}
    >
      <div className="w-full" style={{ maxWidth: CONTENT_WIDTH_MAP[page.contentWidth] }}>
        <div data-preview-card style={cardWrapperStyle(page)}>
          {preview}
        </div>
      </div>
    </div>
  );
}

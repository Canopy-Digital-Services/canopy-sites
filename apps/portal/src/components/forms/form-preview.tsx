"use client";

import { useEffect, useRef, useState } from "react";
import { useBringIntoView } from "@/hooks/use-bring-into-view";
import { useEmbedScript } from "@/hooks/use-embed-script";
import { formToEmbedDefinition, type EmbedFormInput } from "@/lib/embed-preview";
import {
  useOptionalFormContext,
  HEADER_PLACEHOLDERS,
  FIELD_PLACEHOLDERS,
  type StyleGroup,
} from "@/components/forms/form-context";
import { PreviewMark, MARK_HOST } from "@/components/forms/preview-mark";
import { PreviewOutline } from "@/components/forms/preview-outline";
import { defaultLabel } from "@/lib/field-rules";
import { cn } from "@/lib/utils";
import { extractPageTheme, CONTENT_WIDTH_MAP, cardWrapperStyle } from "@/lib/page-theme";

const INPUTS = ".canopy-input, .canopy-select, .canopy-textarea";
const BODY_TEXT =
  ".canopy-description, .canopy-help-text, .canopy-checkbox, .canopy-name-part-label, .canopy-address-part-label, .canopy-dob-part-label";
/** Body text as marked and outlined: a field's checkbox options as one list,
    not each option. */
const BODY_TEXT_GROUPS =
  ".canopy-description, .canopy-help-text, .canopy-checkboxes, .canopy-checkbox:not(.canopy-checkboxes > *), .canopy-name-part-label, .canopy-address-part-label, .canopy-dob-part-label";
const OPTION_LIST = ".canopy-checkboxes";

/** A field focus (`<name>` or `<name>#<part>`) as a selector. */
const fieldTarget = (focus: string) => {
  const [name, part] = focus.split("#");
  const field = `.canopy-field[data-field-name="${CSS.escape(name)}"]`;
  return part ? `${field} [data-field-part="${CSS.escape(part)}"]` : field;
};
const CARD = "[data-preview-card]";

/** A hosted form's content width in the preview, as a share of the pane:
    Wide fills it edge to edge, and the others keep their proportion to Wide.
    The pane is Wide's width, so each renders at its real width until a
    narrow window shrinks the pane. */
const previewWidth = (width: keyof typeof CONTENT_WIDTH_MAP) =>
  `${(parseInt(CONTENT_WIDTH_MAP[width], 10) / parseInt(CONTENT_WIDTH_MAP.lg, 10)) * 100}%`;

/** Which appearance group each part of the preview picks. The first match wins;
    anywhere else is the page (hosted) or the form (embedded). */
const ZONES: { match: string; group: StyleGroup }[] = [
  { match: ".canopy-submit", group: "button" },
  { match: ".canopy-title", group: "title" },
  { match: ".canopy-label", group: "labels" },
  { match: BODY_TEXT, group: "text" },
  { match: INPUTS, group: "fields" },
  { match: `.canopy-root, ${CARD}`, group: "form" },
];

/** Everything a group styles: marked when it is picked, outlined when its
    panel row is hovered. A hosted form's card is the form. */
const groupTargets = (mode: "embed" | "page"): Record<StyleGroup, string> => ({
  page: MARK_HOST,
  form: mode === "page" ? CARD : ".canopy-root",
  title: ".canopy-title",
  text: BODY_TEXT_GROUPS,
  labels: ".canopy-label",
  fields: INPUTS,
  button: ".canopy-submit",
});

type FormPreviewProps = {
  /** Static form data — used when live=false (default). */
  form?: EmbedFormInput;
  mode: "embed" | "page";
  /** When true, reads live state from FormContext and debounces re-renders. */
  live?: boolean;
};

export function FormPreview({ form, mode, live = false }: FormPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // The whole preview surface: what the marks are drawn in, and what appearance
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
          ? fieldTarget(focus.slice(6))
          : null;

  // Appearance mode: hovering outlines the part of the form under the pointer
  // (or every part a hovered panel row styles); a click picks its group and
  // draws the marks round everything that group styles, by hand.
  const appearanceMode = live && !!ctx?.appearanceMode;
  const styleGroup = ctx?.styleGroup ?? null;
  const targets = groupTargets(mode);
  const [hovered, setHovered] = useState<HTMLElement | string | null>(null);
  const [picks, setPicks] = useState(0);

  // The group under `node`, and what to outline for it: the element itself,
  // or the card, form or page as a whole.
  const pickAt = (node: EventTarget): { group: StyleGroup; target: HTMLElement | string } => {
    const el = node instanceof Element ? node : null;
    for (const zone of ZONES) {
      const hit = el?.closest<HTMLElement>(zone.match);
      if (!hit) continue;
      const target =
        zone.group === "form"
          ? targets.form
          : zone.group === "text"
            ? (hit.closest<HTMLElement>(OPTION_LIST) ?? hit)
            : hit;
      return { group: zone.group, target };
    }
    return mode === "page" ? { group: "page", target: MARK_HOST } : { group: "form", target: targets.form };
  };
  const appearanceHandlers = appearanceMode
    ? {
        onPointerMove: (e: React.PointerEvent) => setHovered(pickAt(e.target).target),
        onPointerLeave: () => setHovered(null),
        // Clicks pick a group and never reach the form: no typing, no
        // dropdowns, no focus.
        onMouseDownCapture: (e: React.MouseEvent) => e.preventDefault(),
        onClickCapture: (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setPicks((n) => n + 1);
          ctx?.setStyleGroup(pickAt(e.target).group);
        },
      }
    : {};

  const rowHover = appearanceMode ? (ctx?.styleHover ?? null) : null;
  const outlineTarget = !appearanceMode ? null : rowHover ? targets[rowHover] : hovered;
  const markTarget = appearanceMode ? (styleGroup ? targets[styleGroup] : null) : focusTarget;
  const drawKey = appearanceMode ? `${styleGroup}:${picks}` : (focusTarget ?? "");

  // What's being edited stays in view.
  useBringIntoView(surfaceRef, appearanceMode ? null : focusTarget, renderKey);

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
    // in appearance mode. Stand-ins shimmer like a skeleton so they don't read as
    // saved; they never are.
    const step = ctx?.editorStep ?? null;
    const headerStandIn = step === "header" || appearanceMode;
    const fieldStandIns =
      (appearanceMode || (step !== null && step !== "header")) && source.fields.length === 0;
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
  }, [live, ready, formInstanceRef, source, ctx?.editorStep, appearanceMode]);

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

  const outline = live && (
    <PreviewOutline hostRef={surfaceRef} target={outlineTarget} renderKey={renderKey} />
  );

  // Positioned for PreviewMark and PreviewOutline, which draw inside it.
  const surfaceProps = {
    ref: surfaceRef,
    ...appearanceHandlers,
  };

  if (mode === "embed") {
    return (
      <div
        {...surfaceProps}
        className={cn("relative flex-1 flex items-start justify-center p-10", appearanceMode && "preview-appearance")}
        style={{ backgroundColor: page.formBackground }}
      >
        <div className="w-full max-w-lg">{preview}</div>
        {outline}
      </div>
    );
  }

  // Page mode: apply the page theme's styles
  return (
    <div
      {...surfaceProps}
      className={cn(
        "relative flex-1",
        !page.pageBackground && "bg-muted/40",
        appearanceMode && "preview-appearance",
      )}
      style={page.pageBackground ? { backgroundColor: page.pageBackground } : undefined}
    >
      <div className="flex items-start justify-center py-10">
        <div className="w-full" style={{ maxWidth: previewWidth(page.contentWidth) }}>
          <div data-preview-card style={cardWrapperStyle(page)}>
            {preview}
          </div>
        </div>
      </div>
      {outline}
    </div>
  );
}

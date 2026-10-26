"use client";

// UI: see docs/UX_PATTERNS.md ("Styling mode", "Styling panel").
//
// The styling-mode panel: one row per part of the form you can click in the
// preview, in the order they appear there, built like the Fields list. One
// row is open at a time (styleGroup in FormContext), and the preview marks
// what the open row styles.

import { useEffect, useRef } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, Save, Check } from "lucide-react";
import { FontPicker } from "@/components/ui/font-picker";
import { useFormContext, type StyleGroup } from "@/components/forms/form-context";
import { FONTS_WITH_LIGHT } from "@/lib/google-fonts";
import { buildMark, loadBrush, measure, seeded, shapes } from "@/lib/marker-brush";
import { cn } from "@/lib/utils";

/** Add '#' prefix if missing from a hex color string. */
function normalizeHex(value: string): string {
  const v = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v;
  if (/^[0-9a-f]{3,8}$/i.test(v)) return `#${v}`;
  return v;
}

/** Return a valid #rrggbb for the native color picker, or fallback. */
function toColorInputValue(value: string, fallback: string): string {
  const n = normalizeHex(value);
  return /^#[0-9a-f]{6}$/i.test(n) ? n : fallback;
}

const SIZE_LABELS: Record<string, string> = { sm: "S", md: "M", lg: "L", xl: "XL" };
const WEIGHT_LABELS: Record<string, string> = { light: "Light", normal: "Regular", bold: "Bold" };
const WIDTH_LABELS: Record<string, string> = { sm: "Narrow", md: "Medium", lg: "Wide" };
const SHADOW_LABELS: Record<string, string> = { none: "No shadow", sm: "Light shadow", lg: "Heavy shadow" };

/** Marker body thickness for a row title's underline, CSS px. */
const UNDERLINE_PEN = 3;

/** Underlines `ref`'s text with the coral marker, drawn by hand, while `show`
    is on. The element must be positioned: the canvas sits inside it. */
function useMarkerUnderline(ref: React.RefObject<HTMLElement | null>, show: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !show) return;
    let cancelled = false;
    let raf = 0;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "absolute",
      maxWidth: "none",
      pointerEvents: "none",
      color: "var(--canopy-coral)",
    });
    (async () => {
      // Measure after web fonts load: fallbacks sit differently.
      const [brush] = await Promise.all([loadBrush(), document.fonts?.ready]);
      if (cancelled) return;
      el.appendChild(canvas);
      const mark = buildMark(
        canvas,
        brush,
        shapes.underline(measure(el), UNDERLINE_PEN, seeded(el.textContent ?? "")),
        {
          pen: UNDERLINE_PEN,
          color: getComputedStyle(canvas).color,
          dpr: Math.min(window.devicePixelRatio || 1, 3),
        }
      );
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return mark.paint(1);
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / mark.duration);
        mark.paint(t);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })().catch(() => {});
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      canvas.remove();
    };
  }, [ref, show]);
}

// ─── Helper UI components ────────────────────────────────────────────────────

function ColorDot({ color, fallback }: { color: string; fallback: string }) {
  return (
    <span
      className="inline-block h-3 w-3 shrink-0 rounded-full border border-border"
      style={{ background: toColorInputValue(color, fallback) }}
    />
  );
}

/** A collapsed row's summary: muted words, then color dots. */
function Summary({ words, colors = [] }: { words: (string | false)[]; colors?: [string, string][] }) {
  const text = words.filter(Boolean).join(" · ");
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {text && <span className="truncate text-xs text-muted-foreground/60">{text}</span>}
      {colors.map(([color, fallback], i) => (
        <ColorDot key={i} color={color} fallback={fallback} />
      ))}
    </span>
  );
}

function ColorField({
  id,
  label,
  value,
  fallback,
  placeholder = fallback,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  fallback: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={toColorInputValue(value, fallback)}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onChange(value ? normalizeHex(value) : "")}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function ChoiceField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, text]) => (
            <SelectItem key={v} value={v}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const SIZE_OPTIONS: [string, string][] = [
  ["sm", "Small"],
  ["md", "Medium"],
  ["lg", "Large"],
  ["xl", "Extra Large"],
];
const CASE_OPTIONS: [string, string][] = [
  ["none", "Normal"],
  ["uppercase", "Uppercase"],
];
const weightOptions = (light: boolean): [string, string][] => [
  ...(light ? [["light", "Light"] as [string, string]] : []),
  ["normal", "Regular"],
  ["bold", "Bold"],
];

function StyleRow({
  group,
  title,
  summary,
  children,
}: {
  group: StyleGroup;
  title: string;
  summary: React.ReactNode;
  children: React.ReactNode;
}) {
  const { styleGroup, setStyleGroup, setStyleHover } = useFormContext();
  const open = styleGroup === group;
  const rowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLButtonElement>(null);
  useMarkerUnderline(titleRef, open);

  // Opened from the preview, the row may be out of view in the column.
  useEffect(() => {
    if (open) rowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open]);

  return (
    <Collapsible
      open={open}
      className={cn(
        "border-b border-border/50 last:border-b-0 transition-colors",
        open && "bg-muted/30"
      )}
    >
      {/* The whole summary toggles the row; hovering it outlines its part of
          the preview. */}
      <div
        ref={rowRef}
        className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-muted/50"
        onClick={() => setStyleGroup(open ? null : group)}
        onMouseEnter={() => setStyleHover(group)}
        onMouseLeave={() => setStyleHover(null)}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <button
            ref={titleRef}
            type="button"
            className="relative shrink-0 text-left font-heading font-semibold text-base"
            aria-expanded={open}
          >
            {title}
          </button>
          {!open && summary}
        </div>
        {open && <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground mr-1.5" aria-hidden />}
      </div>
      <CollapsibleContent className="field-row-body">
        {/* -mx-1/px-1 keeps focus rings clear of the animation's clip. White
            controls stand off the open row's tint. */}
        <div className="-mx-1 px-1 [&_input]:bg-card [&_[role=combobox]:not(:hover)]:bg-card">
          <div className="space-y-4 px-3 pb-4 pt-2">{children}</div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function StylingPanel() {
  const { state, saveStatus, updateTheme } = useFormContext();
  const isHosted = state.type === "HOSTED";

  const theme = state.defaultTheme ?? {};
  const str = (key: string, fallback = "") => String(theme[key] || fallback);

  // Page
  const pageBackground = str("pageBackground");
  const cardEnabled = theme.cardEnabled !== false; // default true
  const cardShadow = str("cardShadow", "md");
  const contentWidth = str("contentWidth", "md");
  const verticalAlign = str("verticalAlign", "top");
  // Form
  const background = str("background");
  const radius = str("radius");
  const density = str("density", "normal");
  // Title
  const titleFont = str("titleFont", "inherit");
  const titleWeight = str("titleWeight", "normal") === "semibold" ? "bold" : str("titleWeight", "normal");
  const titleColor = str("titleColor");
  const titleSize = str("titleSize", "md");
  const titleTransform = str("titleTransform", "none");
  // Text
  const bodyFont = str("bodyFont", "inherit");
  const fontSize = str("fontSize");
  const text = str("text");
  // Labels
  const labelFont = str("labelFont", "inherit");
  const labelWeight = str("labelWeight", "normal") === "semibold" ? "bold" : str("labelWeight", "normal");
  const labelColor = str("labelColor");
  const labelSize = str("labelSize", "md");
  const labelTransform = str("labelTransform", "none");
  // Fields
  const fieldBackground = str("fieldBackground");
  const border = str("border");
  // Button
  const buttonText = str("buttonText");
  const primary = str("primary");
  const buttonWidth = str("buttonWidth", "full");
  const buttonAlign = str("buttonAlign", "left");

  // Light is offered only where the chosen font has a genuine 300 weight.
  const hasLight = (font: string) => font !== "inherit" && FONTS_WITH_LIGHT.has(font);
  const shownWeight = (weight: string, font: string) =>
    weight === "light" && !hasLight(font) ? "normal" : weight;

  // Build a new theme object from all current values, applying any single field change
  const buildTheme = (overrides: Record<string, string | boolean>) => {
    const merged: Record<string, string | boolean> = {
      pageBackground, cardEnabled, cardShadow, contentWidth, verticalAlign,
      background, radius, density,
      titleFont, titleWeight, titleColor, titleSize, titleTransform,
      bodyFont, fontSize, text,
      labelFont, labelWeight, labelColor, labelSize, labelTransform,
      fieldBackground, border,
      buttonText, primary, buttonWidth, buttonAlign,
      ...overrides,
    };

    const newTheme: Record<string, string | number | boolean> = {};
    const s = (key: string) => merged[key] as string;
    // Colors and free text only when set; choices only when not the default.
    const color = (key: string) => {
      if (s(key)) newTheme[key] = normalizeHex(s(key));
    };
    const choice = (key: string, fallback: string) => {
      if (s(key) && s(key) !== fallback) newTheme[key] = s(key);
    };

    color("pageBackground");
    if (merged.cardEnabled === false) newTheme.cardEnabled = false;
    choice("cardShadow", "md");
    choice("contentWidth", "md");
    choice("verticalAlign", "top");

    color("background");
    if (s("radius")) newTheme.radius = parseInt(s("radius"), 10);
    choice("density", "normal");

    newTheme.titleFont = s("titleFont") || "inherit";
    choice("titleWeight", "normal");
    color("titleColor");
    choice("titleSize", "md");
    choice("titleTransform", "none");

    newTheme.bodyFont = s("bodyFont") || "inherit";
    if (s("fontSize")) newTheme.fontSize = parseInt(s("fontSize"), 10);
    color("text");

    newTheme.labelFont = s("labelFont") || "inherit";
    choice("labelWeight", "normal");
    color("labelColor");
    choice("labelSize", "md");
    choice("labelTransform", "none");

    color("fieldBackground");
    color("border");

    if (s("buttonText")) newTheme.buttonText = s("buttonText");
    color("primary");
    choice("buttonWidth", "full");
    choice("buttonAlign", "left");

    return newTheme;
  };

  const set = (key: string, value: string | boolean) => {
    updateTheme(buildTheme({ [key]: value }));
  };

  const fontWord = (font: string) => font !== "inherit" && font;
  const sizeWord = (size: string) => size !== "md" && `Size ${SIZE_LABELS[size] ?? size}`;
  const weightWord = (weight: string, font: string) =>
    shownWeight(weight, font) !== "normal" && WEIGHT_LABELS[shownWeight(weight, font)];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Styling</CardTitle>
          {saveStatus === "saving" && (
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Save className="h-4 w-4 animate-pulse" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-sm text-success-strong flex items-center gap-2">
              <Check className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          {isHosted && (
            <StyleRow
              group="page"
              title="Page"
              summary={
                <Summary
                  words={[
                    !cardEnabled ? "No card" : cardShadow !== "md" && SHADOW_LABELS[cardShadow],
                    contentWidth !== "md" && WIDTH_LABELS[contentWidth],
                    verticalAlign === "center" && "Centered",
                  ]}
                  colors={[[pageBackground, "#f4f4f5"]]}
                />
              }
            >
              <ColorField
                id="pageBackground"
                label="Background"
                value={pageBackground}
                fallback="#f4f4f5"
                onChange={(v) => set("pageBackground", v)}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cardEnabled"
                  checked={cardEnabled}
                  onCheckedChange={(checked) => set("cardEnabled", checked === true)}
                />
                <Label htmlFor="cardEnabled">Wrap form in a card</Label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {cardEnabled && (
                  <ChoiceField
                    id="cardShadow"
                    label="Card Shadow"
                    value={cardShadow}
                    options={[["none", "None"], ["sm", "Light"], ["md", "Medium"], ["lg", "Heavy"]]}
                    onChange={(v) => set("cardShadow", v)}
                  />
                )}
                <ChoiceField
                  id="contentWidth"
                  label="Content Width"
                  value={contentWidth}
                  options={[["sm", "Narrow (480px)"], ["md", "Medium (640px)"], ["lg", "Wide (768px)"]]}
                  onChange={(v) => set("contentWidth", v)}
                />
                <ChoiceField
                  id="verticalAlign"
                  label="Vertical Alignment"
                  value={verticalAlign}
                  options={[["top", "Top"], ["center", "Center"]]}
                  onChange={(v) => set("verticalAlign", v)}
                />
              </div>
            </StyleRow>
          )}

          <StyleRow
            group="form"
            title="Form"
            summary={
              <Summary
                words={[radius && `Radius ${radius}`, density !== "normal" && density[0].toUpperCase() + density.slice(1)]}
                colors={[[background, "#ffffff"]]}
              />
            }
          >
            <ColorField
              id="background"
              label="Background"
              value={background}
              fallback="#ffffff"
              onChange={(v) => set("background", v)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="radius">Corner Radius (px)</Label>
                <Input
                  id="radius"
                  value={radius}
                  onChange={(e) => set("radius", e.target.value)}
                  placeholder="4"
                />
              </div>
              <ChoiceField
                id="density"
                label="Density"
                value={density}
                options={[["compact", "Compact"], ["normal", "Normal"], ["comfortable", "Comfortable"]]}
                onChange={(v) => set("density", v)}
              />
            </div>
          </StyleRow>

          <StyleRow
            group="title"
            title="Title"
            summary={
              <Summary
                words={[fontWord(titleFont), weightWord(titleWeight, titleFont), sizeWord(titleSize), titleTransform === "uppercase" && "Uppercase"]}
                colors={[[titleColor || text, "#18181b"]]}
              />
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titleFont">Font</Label>
                <FontPicker
                  id="titleFont"
                  value={titleFont}
                  onChange={(v) => set("titleFont", v)}
                  variant="heading"
                  showInherit={!isHosted}
                />
              </div>
              <ChoiceField
                id="titleWeight"
                label="Weight"
                value={shownWeight(titleWeight, titleFont)}
                options={weightOptions(hasLight(titleFont))}
                onChange={(v) => set("titleWeight", v)}
              />
              <ColorField
                id="titleColor"
                label="Color"
                value={titleColor}
                fallback={toColorInputValue(text, "#18181b")}
                placeholder="Text color"
                onChange={(v) => set("titleColor", v)}
              />
              <ChoiceField
                id="titleSize"
                label="Size"
                value={titleSize}
                options={SIZE_OPTIONS}
                onChange={(v) => set("titleSize", v)}
              />
              <ChoiceField
                id="titleTransform"
                label="Case"
                value={titleTransform}
                options={CASE_OPTIONS}
                onChange={(v) => set("titleTransform", v)}
              />
            </div>
          </StyleRow>

          <StyleRow
            group="text"
            title="Text"
            summary={
              <Summary
                words={[fontWord(bodyFont), fontSize && `${fontSize}px`]}
                colors={[[text, "#18181b"]]}
              />
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bodyFont">Font</Label>
                <FontPicker
                  id="bodyFont"
                  value={bodyFont}
                  onChange={(v) => set("bodyFont", v)}
                  showInherit={!isHosted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontSize">Size (px)</Label>
                <Input
                  id="fontSize"
                  type="number"
                  min="10"
                  max="24"
                  value={fontSize}
                  onChange={(e) => set("fontSize", e.target.value)}
                  placeholder="14"
                />
              </div>
              <ColorField
                id="text"
                label="Color"
                value={text}
                fallback="#18181b"
                onChange={(v) => set("text", v)}
              />
            </div>
          </StyleRow>

          <StyleRow
            group="labels"
            title="Labels"
            summary={
              <Summary
                words={[fontWord(labelFont), weightWord(labelWeight, labelFont), sizeWord(labelSize), labelTransform === "uppercase" && "Uppercase"]}
                colors={[[labelColor || text, "#18181b"]]}
              />
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="labelFont">Font</Label>
                <FontPicker
                  id="labelFont"
                  value={labelFont}
                  onChange={(v) => set("labelFont", v)}
                  variant="heading"
                  showInherit={!isHosted}
                />
              </div>
              <ChoiceField
                id="labelWeight"
                label="Weight"
                value={shownWeight(labelWeight, labelFont)}
                options={weightOptions(hasLight(labelFont))}
                onChange={(v) => set("labelWeight", v)}
              />
              <ColorField
                id="labelColor"
                label="Color"
                value={labelColor}
                fallback={toColorInputValue(text, "#18181b")}
                placeholder="Text color"
                onChange={(v) => set("labelColor", v)}
              />
              <ChoiceField
                id="labelSize"
                label="Size"
                value={labelSize}
                options={SIZE_OPTIONS}
                onChange={(v) => set("labelSize", v)}
              />
              <ChoiceField
                id="labelTransform"
                label="Case"
                value={labelTransform}
                options={CASE_OPTIONS}
                onChange={(v) => set("labelTransform", v)}
              />
            </div>
          </StyleRow>

          <StyleRow
            group="fields"
            title="Fields"
            summary={<Summary words={[]} colors={[[fieldBackground, "#ffffff"], [border, "#e4e4e7"]]} />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                id="fieldBackground"
                label="Background"
                value={fieldBackground}
                fallback="#ffffff"
                onChange={(v) => set("fieldBackground", v)}
              />
              <ColorField
                id="border"
                label="Border"
                value={border}
                fallback="#e4e4e7"
                onChange={(v) => set("border", v)}
              />
            </div>
          </StyleRow>

          <StyleRow
            group="button"
            title="Button"
            summary={
              <Summary
                words={[buttonText, buttonWidth === "auto" && "Auto width"]}
                colors={[[primary, "#005F6A"]]}
              />
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buttonText">Text</Label>
                <Input
                  id="buttonText"
                  value={buttonText}
                  onChange={(e) => set("buttonText", e.target.value)}
                  placeholder="Submit"
                />
              </div>
              <ColorField
                id="primary"
                label="Color"
                value={primary}
                fallback="#005F6A"
                onChange={(v) => set("primary", v)}
              />
              <ChoiceField
                id="buttonWidth"
                label="Width"
                value={buttonWidth}
                options={[["full", "Full Width"], ["auto", "Auto"]]}
                onChange={(v) => set("buttonWidth", v)}
              />
              {buttonWidth === "auto" && (
                <ChoiceField
                  id="buttonAlign"
                  label="Alignment"
                  value={buttonAlign}
                  options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]}
                  onChange={(v) => set("buttonAlign", v)}
                />
              )}
            </div>
          </StyleRow>
        </div>
      </CardContent>
    </Card>
  );
}

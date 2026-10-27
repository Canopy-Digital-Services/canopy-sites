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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AlignCenter,
  AlignLeft,
  Check,
  ChevronUp,
  RotateCcw,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
/** Corner radius presets, px. The embed's default is Slight. */
const CORNER_OPTIONS: [string, string][] = [
  ["0", "Square"],
  ["4", "Slight"],
  ["8", "Round"],
  ["16", "Rounder"],
];
const SPACING_OPTIONS: [string, string][] = [
  ["compact", "Compact"],
  ["normal", "Normal"],
  ["comfortable", "Roomy"],
];

const CARD_OPTIONS: [string, string][] = [
  ["off", "No card"],
  ["none", "Flat"],
  ["sm", "Light shadow"],
  ["md", "Medium shadow"],
  ["lg", "Heavy shadow"],
];

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

/** A color is the native swatch alone: every platform's picker takes hex.
    Once a color is set, a reset button returns it to unset: the default, or
    for the title and labels, following the text color (`resetLabel`). */
function ColorSwatch({
  id,
  value,
  fallback,
  resetLabel = "Reset to default",
  label,
  className,
  onChange,
}: {
  id: string;
  value: string;
  fallback: string;
  resetLabel?: string;
  /** Spoken and tooltip name, for a swatch with no visible label. */
  label?: string;
  className?: string;
  onChange: (value: string) => void;
}) {
  const swatch = (
    <input
      id={id}
      type="color"
      aria-label={label}
      value={toColorInputValue(value, fallback)}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-7 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-card p-0.5", className)}
    />
  );
  // The reset sits before the swatch, so the swatch keeps its place at the
  // row's right edge whether or not the reset shows.
  return (
    <div className="flex items-center gap-1">
      {value && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={resetLabel}
              onClick={() => onChange("")}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{resetLabel}</TooltipContent>
        </Tooltip>
      )}
      {label ? <Tip text={label}>{swatch}</Tip> : swatch}
    </div>
  );
}

/** A color under its label, for rows not yet in the one-line layout. */
function ColorField({
  id,
  label,
  ...swatch
}: React.ComponentProps<typeof ColorSwatch> & { label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <ColorSwatch id={id} {...swatch} />
    </div>
  );
}

/** One setting on one line: its label on the left, its control on the right. */
function SettingRow({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-4">
      <Label id={`${id}-label`} htmlFor={id}>
        {label}
      </Label>
      {children}
    </div>
  );
}

/** Toolbar tooltips wait a beat, as a word processor's do, so sweeping the
    pointer across the controls doesn't flash a run of them. */
const TIP_DELAY = 500;

/** A control in a toolbar row, named by a tooltip instead of a label. */
function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <Tooltip delayDuration={TIP_DELAY}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

/** A small exclusive choice as a row of buttons. Given a `label`, the row is
    a toolbar group: no visible label, each option named in a tooltip. */
function Segmented({
  id,
  label,
  value,
  options,
  names,
  onChange,
}: {
  id: string;
  label?: string;
  value: string;
  options: [string, string, React.ReactNode?][];
  /** Spoken names for options whose visible text is terse ("S", "AA"). */
  names?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <ToggleGroup
      id={id}
      type="single"
      value={value}
      // Pressing the pressed button would clear the choice; a setting always has one.
      onValueChange={(v) => v && onChange(v)}
      aria-label={label}
      aria-labelledby={label ? undefined : `${id}-label`}
    >
      {options.map(([v, text, icon]) => {
        const item = (
          <ToggleGroupItem
            key={v}
            value={v}
            aria-label={names?.[v]}
            className={label ? "min-w-7 px-1.5" : undefined}
          >
            {icon}
            {text}
          </ToggleGroupItem>
        );
        return label ? (
          <Tip key={v} text={names?.[v] ?? text}>
            {item}
          </Tip>
        ) : (
          item
        );
      })}
    </ToggleGroup>
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
/** Size as a button group: terse visible text, full spoken names. */
const SIZE_SEGMENTS: [string, string][] = [
  ["sm", "S"],
  ["md", "M"],
  ["lg", "L"],
  ["xl", "XL"],
];
const SIZE_NAMES: Record<string, string> = { sm: "Small", md: "Medium", lg: "Large", xl: "Extra large" };
const CASE_OPTIONS: [string, string][] = [
  ["none", "Normal"],
  ["uppercase", "Uppercase"],
];
const weightOptions = (light: boolean): [string, string][] => [
  ...(light ? [["light", "Light"] as [string, string]] : []),
  ["normal", "Regular"],
  ["bold", "Bold"],
];
/** Weight in a toolbar: a B drawn at each weight, the bold one the word
    processor's Bold button. */
const WEIGHT_GLYPH: Record<string, string> = { light: "font-light", normal: "font-normal", bold: "font-bold" };
const weightGlyphs = (light: boolean): [string, string, React.ReactNode][] =>
  weightOptions(light).map(([v]) => [
    v,
    "",
    <span key="b" className={WEIGHT_GLYPH[v]}>
      B
    </span>,
  ]);

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
  // Only a missing value falls back: a saved 0 (square corners) is a value.
  const str = (key: string, fallback = "") => {
    const v = theme[key];
    return v === undefined || v === null || v === "" ? fallback : String(v);
  };

  // Page
  const pageBackground = str("pageBackground");
  const cardEnabled = theme.cardEnabled !== false; // default true
  const cardShadow = str("cardShadow", "md");
  const contentWidth = str("contentWidth", "md");
  // Form
  const background = str("background");
  const radius = str("radius");
  const density = str("density", "normal");
  const corners = radius || "4";
  // Title
  const titleFont = str("titleFont", "inherit");
  const titleWeight = str("titleWeight", "normal") === "semibold" ? "bold" : str("titleWeight", "normal");
  const titleColor = str("titleColor");
  const titleSize = str("titleSize", "md");
  const titleAlign = str("titleAlign", "left");
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
      pageBackground, cardEnabled, cardShadow, contentWidth,
      background, radius, density,
      titleFont, titleWeight, titleColor, titleSize, titleAlign,
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

    color("background");
    if (s("radius")) newTheme.radius = parseInt(s("radius"), 10);
    choice("density", "normal");

    newTheme.titleFont = s("titleFont") || "inherit";
    choice("titleWeight", "normal");
    color("titleColor");
    choice("titleSize", "md");
    choice("titleAlign", "left");

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
  const setMany = (values: Record<string, string | boolean>) => {
    updateTheme(buildTheme(values));
  };

  // One Card choice covers both tokens: "off" is no card, the rest its shadow.
  const card = cardEnabled ? cardShadow : "off";
  const setCard = (v: string) =>
    setMany(v === "off" ? { cardEnabled: false } : { cardEnabled: true, cardShadow: v });

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
                    card !== "md" && (CARD_OPTIONS.find(([v]) => v === card)?.[1] ?? false),
                    contentWidth !== "md" && WIDTH_LABELS[contentWidth],
                  ]}
                  colors={[[pageBackground, "#f4f4f5"]]}
                />
              }
            >
              <div className="space-y-2">
                <SettingRow id="pageBackground" label="Background">
                  <ColorSwatch
                    id="pageBackground"
                    value={pageBackground}
                    fallback="#f4f4f5"
                    onChange={(v) => set("pageBackground", v)}
                  />
                </SettingRow>
                <SettingRow id="card" label="Card">
                  <Select value={card} onValueChange={setCard}>
                    <SelectTrigger id="card" className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_OPTIONS.map(([v, text]) => (
                        <SelectItem key={v} value={v}>
                          {text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow id="contentWidth" label="Width">
                  <Segmented
                    id="contentWidth"
                    value={contentWidth}
                    options={[["sm", "Narrow"], ["md", "Medium"], ["lg", "Wide"]]}
                    onChange={(v) => set("contentWidth", v)}
                  />
                </SettingRow>
              </div>
            </StyleRow>
          )}

          <StyleRow
            group="form"
            title="Form"
            summary={
              <Summary
                words={[
                  corners !== "4" &&
                    (CORNER_OPTIONS.find(([v]) => v === corners)?.[1] ?? `${corners}px corners`),
                  density !== "normal" && (SPACING_OPTIONS.find(([v]) => v === density)?.[1] ?? false),
                ]}
                colors={[[background, "#ffffff"]]}
              />
            }
          >
            <div className="space-y-2">
              <SettingRow id="background" label="Background">
                <ColorSwatch
                  id="background"
                  value={background}
                  fallback="#ffffff"
                  onChange={(v) => set("background", v)}
                />
              </SettingRow>
              <SettingRow id="radius" label="Corners">
                {/* A saved radius between presets presses none until changed. */}
                <Segmented
                  id="radius"
                  value={corners}
                  options={CORNER_OPTIONS}
                  onChange={(v) => set("radius", v)}
                />
              </SettingRow>
              <SettingRow id="density" label="Spacing">
                <Segmented
                  id="density"
                  value={density}
                  options={SPACING_OPTIONS}
                  onChange={(v) => set("density", v)}
                />
              </SettingRow>
            </div>
          </StyleRow>

          <StyleRow
            group="title"
            title="Title"
            summary={
              <Summary
                words={[fontWord(titleFont), weightWord(titleWeight, titleFont), sizeWord(titleSize), titleAlign === "center" && "Centered"]}
                colors={[[titleColor || text, "#18181b"]]}
              />
            }
          >
            {/* A word processor's toolbar: one line, no labels, tooltips name
                each control. The font takes the slack; past it, the line wraps. */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Tip text="Font">
                <div className="min-w-32 flex-1">
                  <FontPicker
                    id="titleFont"
                    value={titleFont}
                    onChange={(v) => set("titleFont", v)}
                    variant="heading"
                    showInherit={!isHosted}
                  />
                </div>
              </Tip>
              <ColorSwatch
                id="titleColor"
                label="Color"
                value={titleColor}
                fallback={toColorInputValue(text, "#18181b")}
                resetLabel="Use text color"
                className="h-9"
                onChange={(v) => set("titleColor", v)}
              />
              <Segmented
                id="titleSize"
                label="Size"
                value={titleSize}
                options={SIZE_SEGMENTS}
                names={SIZE_NAMES}
                onChange={(v) => set("titleSize", v)}
              />
              <Segmented
                id="titleWeight"
                label="Weight"
                value={shownWeight(titleWeight, titleFont)}
                options={weightGlyphs(hasLight(titleFont))}
                names={WEIGHT_LABELS}
                onChange={(v) => set("titleWeight", v)}
              />
              <Segmented
                id="titleAlign"
                label="Alignment"
                value={titleAlign}
                options={[
                  ["left", "", <AlignLeft key="i" />],
                  ["center", "", <AlignCenter key="i" />],
                ]}
                names={{ left: "Align left", center: "Center" }}
                onChange={(v) => set("titleAlign", v)}
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
                resetLabel="Use text color"
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

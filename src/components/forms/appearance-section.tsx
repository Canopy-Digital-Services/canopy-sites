"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChevronDown, ChevronRight, Save, Check } from "lucide-react";
import { FontPicker } from "@/components/ui/font-picker";
import { useFormContext } from "@/components/forms/form-context";
import { FONTS_WITH_LIGHT } from "@/lib/google-fonts";

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

// ─── Helper UI components ────────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
      {children}
    </span>
  );
}

function ColorDot({ color, fallback }: { color: string; fallback: string }) {
  return (
    <span
      className="inline-block h-3 w-3 rounded-full border border-border"
      style={{ background: toColorInputValue(color, fallback) }}
    />
  );
}

function SubSection({
  title,
  open,
  onOpenChange,
  chips,
  children,
  className,
}: {
  title: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  chips?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={`flex w-full items-center justify-between py-2 text-left border-t ${className ?? ""}`}
        >
          <span className="text-base font-heading font-semibold text-primary">{title}</span>
          <div className="flex items-center gap-1.5">
            {!open && chips}
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 pb-3 pt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

type AppearanceSectionProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AppearanceSection({ open, onOpenChange }: AppearanceSectionProps) {
  const { state, saveStatus, updateTheme } = useFormContext();

  const theme = state.defaultTheme ?? {};

  // Read current theme values
  const pageBackground = String(theme.pageBackground || "");
  const bodyFont = String(theme.bodyFont || "inherit");
  const headingFont = String(theme.headingFont || "inherit");
  const fontSize = String(theme.fontSize || "");
  const background = String(theme.background || "");
  const fieldBackground = String(theme.fieldBackground || "");
  const border = String(theme.border || "");
  const text = String(theme.text || "");
  const primary = String(theme.primary || "");
  const radius = String(theme.radius || "");
  const density = String(theme.density || "");
  const buttonWidth = String(theme.buttonWidth || "full");
  const buttonAlign = String(theme.buttonAlign || "left");
  const buttonText = String(theme.buttonText || "");
  const titleSize = String(theme.titleSize || "md");
  // Normalize legacy "semibold" to "bold" for display; default is "normal"
  const titleWeight = (() => {
    const w = String(theme.titleWeight ?? "normal");
    return w === "semibold" ? "bold" : w;
  })();
  // Whether the selected heading font has a genuine 300 (Light) weight
  const headingFontHasLight = headingFont === "inherit"
    ? false
    : FONTS_WITH_LIGHT.has(headingFont);
  const titleColor = String(theme.titleColor || "");
  const labelSize = String(theme.labelSize ?? "md");
  const labelTransform = String(theme.labelTransform || "none");
  const cardEnabled = theme.cardEnabled !== false; // default true
  const cardShadow = String(theme.cardShadow || "md");
  const contentWidth = String(theme.contentWidth || "md");
  const verticalAlign = String(theme.verticalAlign || "top");

  // Build a new theme object from all current values, applying any single field change
  const buildTheme = (overrides: Record<string, string | boolean>) => {
    const merged: Record<string, string | boolean> = {
      pageBackground, bodyFont, headingFont, fontSize, background, fieldBackground,
      border, text, primary, radius, density, buttonWidth, buttonAlign,
      buttonText, titleSize, titleWeight, titleColor, labelSize, labelTransform,
      cardEnabled, cardShadow, contentWidth, verticalAlign,
      ...overrides,
    };

    const newTheme: Record<string, string | number | boolean> = {};

    const s = (key: string) => merged[key] as string;

    if (s("pageBackground")) newTheme.pageBackground = normalizeHex(s("pageBackground"));
    newTheme.bodyFont = s("bodyFont") || "inherit";
    newTheme.headingFont = s("headingFont") || "inherit";

    if (s("fontSize")) newTheme.fontSize = parseInt(s("fontSize"), 10);
    if (s("background")) newTheme.background = normalizeHex(s("background"));
    if (s("fieldBackground")) newTheme.fieldBackground = normalizeHex(s("fieldBackground"));
    if (s("border")) newTheme.border = normalizeHex(s("border"));
    if (s("text")) newTheme.text = normalizeHex(s("text"));
    if (s("primary")) newTheme.primary = normalizeHex(s("primary"));
    if (s("radius")) newTheme.radius = parseInt(s("radius"), 10);
    if (s("density")) newTheme.density = s("density");
    if (s("buttonWidth")) newTheme.buttonWidth = s("buttonWidth");
    if (s("buttonAlign")) newTheme.buttonAlign = s("buttonAlign");
    if (s("buttonText")) newTheme.buttonText = s("buttonText");
    if (s("titleSize") && s("titleSize") !== "md") newTheme.titleSize = s("titleSize");
    if (s("titleWeight") && s("titleWeight") !== "normal") newTheme.titleWeight = s("titleWeight");
    if (s("titleColor")) newTheme.titleColor = normalizeHex(s("titleColor"));
    if (s("labelSize") && s("labelSize") !== "md") newTheme.labelSize = s("labelSize");
    if (s("labelTransform") && s("labelTransform") !== "none") newTheme.labelTransform = s("labelTransform");

    // Page-level tokens (only store non-default values)
    if (merged.cardEnabled === false) newTheme.cardEnabled = false;
    if (merged.cardShadow && merged.cardShadow !== "md") newTheme.cardShadow = merged.cardShadow as string;
    if (merged.contentWidth && merged.contentWidth !== "md") newTheme.contentWidth = merged.contentWidth as string;
    if (merged.verticalAlign && merged.verticalAlign !== "top") newTheme.verticalAlign = merged.verticalAlign as string;

    return newTheme;
  };

  const set = (key: string, value: string | boolean) => {
    updateTheme(buildTheme({ [key]: value }));
  };

  // Subsection open states
  const [pageOpen, setPageOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [headingsOpen, setHeadingsOpen] = useState(false);
  const [bodyOpen, setBodyOpen] = useState(false);
  const [buttonOpen, setButtonOpen] = useState(false);

  // ─── Summary chips for collapsed subsections ───────────────────────────────

  const widthLabels: Record<string, string> = { sm: "narrow", md: "medium", lg: "wide" };
  const pageChips = (
    <>
      <ColorDot color={pageBackground} fallback="#f4f4f5" />
      {!cardEnabled && <Chip>no card</Chip>}
      {cardEnabled && cardShadow !== "md" && <Chip>shadow {cardShadow === "sm" ? "light" : cardShadow === "lg" ? "heavy" : cardShadow}</Chip>}
      {contentWidth !== "md" && <Chip>{widthLabels[contentWidth] ?? contentWidth}</Chip>}
      {verticalAlign === "center" && <Chip>centered</Chip>}
    </>
  );

  const formChips = (
    <>
      <ColorDot color={background} fallback="#ffffff" />
      <ColorDot color={fieldBackground} fallback="#ffffff" />
      <ColorDot color={border} fallback="#e4e4e7" />
      <Chip>radius {radius || "8"}</Chip>
      {density && density !== "normal" && <Chip>{density}</Chip>}
    </>
  );

  const titleSizeLabels: Record<string, string> = { sm: "S", md: "M", lg: "L", xl: "XL" };

  const headingsChips = (
    <>
      {headingFont !== "inherit" && <Chip>{headingFont}</Chip>}
      {titleSize !== "md" && <Chip>title {titleSizeLabels[titleSize] ?? titleSize}</Chip>}
      {labelSize !== "md" && <Chip>label {titleSizeLabels[labelSize] ?? labelSize}</Chip>}
      {titleWeight !== "normal" && (headingFontHasLight || titleWeight !== "light") && <Chip>{titleWeight === "light" ? "Light" : titleWeight === "bold" ? "Bold" : titleWeight}</Chip>}
      <ColorDot color={titleColor} fallback="#18181b" />
      {labelTransform === "uppercase" && <Chip>uppercase</Chip>}
    </>
  );

  const bodyChips = (
    <>
      {bodyFont !== "inherit" && <Chip>{bodyFont}</Chip>}
      {fontSize && <Chip>{fontSize}px</Chip>}
      <ColorDot color={text} fallback="#18181b" />
    </>
  );

  const buttonChips = (
    <>
      {buttonText && <Chip>{buttonText}</Chip>}
      <ColorDot color={primary} fallback="#005F6A" />
    </>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Card>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CardHeader className="cursor-pointer" onClick={() => onOpenChange(!open)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how your form looks</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {saveStatus === "saving" && (
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Save className="h-4 w-4 animate-pulse" />
                    Saving...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-sm text-success flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Saved
                  </span>
                )}
                {open ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-1">

        {/* ── Page ──────────────────────────────────────────────────── */}
        <SubSection
          title="Page"
          open={pageOpen}
          onOpenChange={setPageOpen}
          chips={pageChips}
          className="border-t-0"
        >
          <p className="text-xs text-muted-foreground">
            Applied when the form is hosted as a standalone page.
          </p>
          <div className="space-y-2">
            <Label htmlFor="pageBackground">Page Background Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={toColorInputValue(pageBackground, "#f4f4f5")}
                onChange={(e) => set("pageBackground", e.target.value)}
                className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
              />
              <Input
                id="pageBackground"
                value={pageBackground}
                onChange={(e) => set("pageBackground", e.target.value)}
                onBlur={() => set("pageBackground", pageBackground ? normalizeHex(pageBackground) : "")}
                placeholder="#f4f4f5"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="cardEnabled"
              checked={cardEnabled}
              onCheckedChange={(checked) => set("cardEnabled", checked === true)}
            />
            <Label htmlFor="cardEnabled">Wrap form in a card</Label>
          </div>
          {cardEnabled && (
            <div className="space-y-2">
              <Label htmlFor="cardShadow">Card Shadow</Label>
              <Select value={cardShadow} onValueChange={(v) => set("cardShadow", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select shadow" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="sm">Light</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="contentWidth">Content Width</Label>
            <Select value={contentWidth} onValueChange={(v) => set("contentWidth", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select width" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Narrow (480px)</SelectItem>
                <SelectItem value="md">Medium (640px)</SelectItem>
                <SelectItem value="lg">Wide (768px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="verticalAlign">Vertical Alignment</Label>
            <Select value={verticalAlign} onValueChange={(v) => set("verticalAlign", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="center">Center</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SubSection>

        {/* ── Form ──────────────────────────────────────────────────── */}
        <SubSection
          title="Form"
          open={formOpen}
          onOpenChange={setFormOpen}
          chips={formChips}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="background">Background</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={toColorInputValue(background, "#ffffff")}
                  onChange={(e) => set("background", e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <Input
                  id="background"
                  value={background}
                  onChange={(e) => set("background", e.target.value)}
                  onBlur={() => set("background", normalizeHex(background))}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldBackground">Field Background</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={toColorInputValue(fieldBackground, "#ffffff")}
                  onChange={(e) => set("fieldBackground", e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <Input
                  id="fieldBackground"
                  value={fieldBackground}
                  onChange={(e) => set("fieldBackground", e.target.value)}
                  onBlur={() => set("fieldBackground", normalizeHex(fieldBackground))}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="border">Field Border</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={toColorInputValue(border, "#e4e4e7")}
                  onChange={(e) => set("border", e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <Input
                  id="border"
                  value={border}
                  onChange={(e) => set("border", e.target.value)}
                  onBlur={() => set("border", normalizeHex(border))}
                  placeholder="#e4e4e7"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="radius">Border Radius (px)</Label>
              <Input
                id="radius"
                value={radius}
                onChange={(e) => set("radius", e.target.value)}
                placeholder="8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="density">Density</Label>
              <Select value={density || "normal"} onValueChange={(v) => set("density", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select density" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonWidth">Button Width</Label>
              <Select value={buttonWidth || "full"} onValueChange={(v) => set("buttonWidth", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select width" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {buttonWidth === "auto" && (
              <div className="space-y-2">
                <Label htmlFor="buttonAlign">Button Alignment</Label>
                <Select value={buttonAlign || "left"} onValueChange={(v) => set("buttonAlign", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select alignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </SubSection>

        {/* ── Headings ─────────────────────────────────────────────── */}
        <SubSection
          title="Headings"
          open={headingsOpen}
          onOpenChange={setHeadingsOpen}
          chips={headingsChips}
        >
          <p className="text-xs text-muted-foreground">
            Applied to the form title and all field labels.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="headingFont">Font</Label>
              <FontPicker
                id="headingFont"
                value={headingFont}
                onChange={(v) => set("headingFont", v)}
                variant="heading"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleWeight">Weight</Label>
              <Select
                value={!headingFontHasLight && titleWeight === "light" ? "normal" : titleWeight}
                onValueChange={(v) => set("titleWeight", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select weight" />
                </SelectTrigger>
                <SelectContent>
                  {headingFontHasLight && <SelectItem value="light">Light</SelectItem>}
                  <SelectItem value="normal">Regular</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleColor">Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={toColorInputValue(titleColor, "#18181b")}
                  onChange={(e) => set("titleColor", e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <Input
                  id="titleColor"
                  value={titleColor}
                  onChange={(e) => set("titleColor", e.target.value)}
                  onBlur={() => set("titleColor", titleColor ? normalizeHex(titleColor) : "")}
                  placeholder="inherit"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="labelTransform">Case</Label>
              <Select value={labelTransform} onValueChange={(v) => set("labelTransform", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select transform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Normal</SelectItem>
                  <SelectItem value="uppercase">Uppercase</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleSize">Title Size</Label>
              <Select value={titleSize} onValueChange={(v) => set("titleSize", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">S — Small</SelectItem>
                  <SelectItem value="md">M — Medium</SelectItem>
                  <SelectItem value="lg">L — Large</SelectItem>
                  <SelectItem value="xl">XL — Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="labelSize">Label Size</Label>
              <Select value={labelSize} onValueChange={(v) => set("labelSize", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">S — Small</SelectItem>
                  <SelectItem value="md">M — Medium</SelectItem>
                  <SelectItem value="lg">L — Large</SelectItem>
                  <SelectItem value="xl">XL — Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SubSection>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <SubSection
          title="Body"
          open={bodyOpen}
          onOpenChange={setBodyOpen}
          chips={bodyChips}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bodyFont">Font</Label>
              <FontPicker
                id="bodyFont"
                value={bodyFont}
                onChange={(v) => set("bodyFont", v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fontSize">Base Font Size (px)</Label>
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
            <div className="space-y-2">
              <Label htmlFor="text">Text Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={toColorInputValue(text, "#18181b")}
                  onChange={(e) => set("text", e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <Input
                  id="text"
                  value={text}
                  onChange={(e) => set("text", e.target.value)}
                  onBlur={() => set("text", normalizeHex(text))}
                  placeholder="#18181b"
                />
              </div>
            </div>
          </div>
        </SubSection>

        {/* ── Button ───────────────────────────────────────────────── */}
        <SubSection
          title="Button"
          open={buttonOpen}
          onOpenChange={setButtonOpen}
          chips={buttonChips}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={buttonText}
                onChange={(e) => set("buttonText", e.target.value)}
                placeholder="Submit"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary">Button Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={toColorInputValue(primary, "#005F6A")}
                  onChange={(e) => set("primary", e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <Input
                  id="primary"
                  value={primary}
                  onChange={(e) => set("primary", e.target.value)}
                  onBlur={() => set("primary", normalizeHex(primary))}
                  placeholder="#005F6A"
                />
              </div>
            </div>
          </div>
        </SubSection>

      </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

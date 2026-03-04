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
import { ChevronDown, ChevronRight, Save, Check } from "lucide-react";
import { FontPicker } from "@/components/ui/font-picker";
import { useFormContext } from "@/components/forms/form-context";

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
          <span className="text-sm font-heading font-medium">{title}</span>
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

export function AppearanceSection() {
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
  const titleWeight = String(theme.titleWeight || "semibold");
  const titleColor = String(theme.titleColor || "");
  const labelWeight = String(theme.labelWeight || "medium");
  const labelTransform = String(theme.labelTransform || "none");

  // Build a new theme object from all current values, applying any single field change
  const buildTheme = (overrides: Record<string, string>) => {
    const merged = {
      pageBackground, bodyFont, headingFont, fontSize, background, fieldBackground,
      border, text, primary, radius, density, buttonWidth, buttonAlign,
      buttonText, titleSize, titleWeight, titleColor, labelWeight, labelTransform,
      ...overrides,
    };

    const newTheme: Record<string, string | number> = {};

    if (merged.pageBackground) newTheme.pageBackground = normalizeHex(merged.pageBackground);
    newTheme.bodyFont = merged.bodyFont || "inherit";
    newTheme.headingFont = merged.headingFont || "inherit";

    if (merged.fontSize) newTheme.fontSize = parseInt(merged.fontSize, 10);
    if (merged.background) newTheme.background = normalizeHex(merged.background);
    if (merged.fieldBackground) newTheme.fieldBackground = normalizeHex(merged.fieldBackground);
    if (merged.border) newTheme.border = normalizeHex(merged.border);
    if (merged.text) newTheme.text = normalizeHex(merged.text);
    if (merged.primary) newTheme.primary = normalizeHex(merged.primary);
    if (merged.radius) newTheme.radius = parseInt(merged.radius, 10);
    if (merged.density) newTheme.density = merged.density;
    if (merged.buttonWidth) newTheme.buttonWidth = merged.buttonWidth;
    if (merged.buttonAlign) newTheme.buttonAlign = merged.buttonAlign;
    if (merged.buttonText) newTheme.buttonText = merged.buttonText;
    if (merged.titleSize && merged.titleSize !== "md") newTheme.titleSize = merged.titleSize;
    if (merged.titleWeight && merged.titleWeight !== "semibold") newTheme.titleWeight = merged.titleWeight;
    if (merged.titleColor) newTheme.titleColor = normalizeHex(merged.titleColor);
    if (merged.labelWeight && merged.labelWeight !== "medium") newTheme.labelWeight = merged.labelWeight;
    if (merged.labelTransform && merged.labelTransform !== "none") newTheme.labelTransform = merged.labelTransform;

    return newTheme;
  };

  const set = (key: string, value: string) => {
    updateTheme(buildTheme({ [key]: value }));
  };

  // Subsection open states
  const [pageOpen, setPageOpen] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);

  // ─── Summary chips for collapsed subsections ───────────────────────────────

  const pageChips = (
    <>
      {pageBackground && <ColorDot color={pageBackground} fallback="#f4f4f5" />}
    </>
  );

  const colorsChips = (
    <>
      {background && <ColorDot color={background} fallback="#ffffff" />}
      {primary && <ColorDot color={primary} fallback="#005F6A" />}
      {titleColor && <ColorDot color={titleColor} fallback="#18181b" />}
    </>
  );

  const layoutChips = (
    <>
      <Chip>radius {radius || "8"}</Chip>
      {density && density !== "normal" && <Chip>{density}</Chip>}
      {buttonWidth === "auto" && <Chip>auto btn</Chip>}
    </>
  );

  const titleSizeLabels: Record<string, string> = { sm: "S", md: "M", lg: "L", xl: "XL" };
  const textChips = (
    <>
      {bodyFont !== "inherit" && <Chip>{bodyFont}</Chip>}
      {fontSize && <Chip>{fontSize}px</Chip>}
      {titleSize !== "md" && <Chip>title {titleSizeLabels[titleSize] ?? titleSize}</Chip>}
      {labelTransform === "uppercase" && <Chip>UPPERCASE</Chip>}
    </>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader>
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
          </div>
        </div>
      </CardHeader>
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
        </SubSection>

        {/* ── Colors ───────────────────────────────────────────────── */}
        <SubSection
          title="Colors"
          open={colorsOpen}
          onOpenChange={setColorsOpen}
          chips={colorsChips}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="background">Form Background</Label>
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
            <div className="space-y-2">
              <Label htmlFor="titleColor">Title Color</Label>
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
          </div>
        </SubSection>

        {/* ── Layout ───────────────────────────────────────────────── */}
        <SubSection
          title="Layout"
          open={layoutOpen}
          onOpenChange={setLayoutOpen}
          chips={layoutChips}
        >
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

        {/* ── Text ─────────────────────────────────────────────────── */}
        <SubSection
          title="Text"
          open={textOpen}
          onOpenChange={setTextOpen}
          chips={textChips}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bodyFont">Body Font</Label>
              <FontPicker
                id="bodyFont"
                value={bodyFont}
                onChange={(v) => set("bodyFont", v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headingFont">Heading Font</Label>
              <FontPicker
                id="headingFont"
                value={headingFont}
                onChange={(v) => set("headingFont", v)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          {/* ── Title sub-area ─────────────────────────────────────── */}
          <div className="border-t pt-3">
            <h5 className="text-xs font-heading font-medium text-muted-foreground mb-3">Title</h5>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titleSize">Size</Label>
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
                <Label htmlFor="titleWeight">Weight</Label>
                <Select value={titleWeight} onValueChange={(v) => set("titleWeight", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Regular</SelectItem>
                    <SelectItem value="semibold">Semibold</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Labels sub-area ────────────────────────────────────── */}
          <div className="border-t pt-3">
            <h5 className="text-xs font-heading font-medium text-muted-foreground mb-3">Labels</h5>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="labelWeight">Weight</Label>
                <Select value={labelWeight} onValueChange={(v) => set("labelWeight", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="semibold">Semibold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="labelTransform">Transform</Label>
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
            </div>
          </div>

          {/* ── Button Text sub-area ───────────────────────────────── */}
          <div className="border-t pt-3">
            <h5 className="text-xs font-heading font-medium text-muted-foreground mb-3">Button</h5>
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
            </div>
          </div>
        </SubSection>

      </CardContent>
    </Card>
  );
}

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

function SubSection({
  title,
  open,
  onOpenChange,
  chips,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  chips?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between py-2 text-left border-t"
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
  const [isOpen, setIsOpen] = useState(false);

  const theme = state.defaultTheme ?? {};

  // Read current theme values
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
      bodyFont, headingFont, fontSize, background, fieldBackground,
      border, text, primary, radius, density, buttonWidth, buttonAlign,
      buttonText, titleSize, titleWeight, titleColor, labelWeight, labelTransform,
      ...overrides,
    };

    const newTheme: Record<string, string | number> = {};

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

  // Subsection open states (UI-only)
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [titleStyleOpen, setTitleStyleOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [buttonOpen, setButtonOpen] = useState(false);

  // ─── Summary chips for collapsed subsections ───────────────────────────────

  const typographyChips = (
    <>
      {bodyFont !== "inherit" && <Chip>{bodyFont}</Chip>}
      {headingFont !== "inherit" && headingFont !== bodyFont && <Chip>{headingFont} (heading)</Chip>}
      {fontSize && <Chip>{fontSize}px</Chip>}
    </>
  );

  const titleSizeLabels: Record<string, string> = { sm: "S", md: "M", lg: "L", xl: "XL" };
  const titleWeightLabels: Record<string, string> = {
    normal: "Regular",
    semibold: "Semibold",
    bold: "Bold",
  };
  const titleStyleChips = (
    <>
      {titleSize !== "md" && <Chip>{titleSizeLabels[titleSize] ?? titleSize}</Chip>}
      {titleWeight !== "semibold" && <Chip>{titleWeightLabels[titleWeight] ?? titleWeight}</Chip>}
      {titleColor && (
        <span
          className="inline-block h-3 w-3 rounded-full border border-border"
          style={{ background: toColorInputValue(titleColor, "#18181b") }}
        />
      )}
    </>
  );

  const labelWeightLabels: Record<string, string> = {
    normal: "Normal",
    medium: "Medium",
    semibold: "Semibold",
  };
  const labelsChips = (
    <>
      {labelTransform === "uppercase" && <Chip>UPPERCASE</Chip>}
      {labelWeight !== "medium" && <Chip>{labelWeightLabels[labelWeight] ?? labelWeight}</Chip>}
    </>
  );

  const buttonChips = (
    <>
      {buttonWidth === "auto" && <Chip>Auto</Chip>}
      {buttonText && <Chip>{buttonText.length > 12 ? buttonText.slice(0, 12) + "…" : buttonText}</Chip>}
    </>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="cursor-pointer hover:bg-transparent" onClick={() => setIsOpen(!isOpen)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how your form looks when embedded</CardDescription>
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
                {isOpen ? (
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

            {/* ── Global: Colors ─────────────────────────────────────────── */}
            <div className="space-y-3 pb-3">
              <h4 className="text-sm font-heading font-medium">Colors</h4>
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
              </div>
            </div>

            {/* ── Global: Radius + Density ────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2 pb-2">
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
            </div>

            {/* ── Collapsible: Typography ─────────────────────────────────── */}
            <SubSection
              title="Typography"
              open={typographyOpen}
              onOpenChange={setTypographyOpen}
              chips={typographyChips}
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
            </SubSection>

            {/* ── Collapsible: Title Style ────────────────────────────────── */}
            <SubSection
              title="Title Style"
              open={titleStyleOpen}
              onOpenChange={setTitleStyleOpen}
              chips={titleStyleChips}
            >
              <div className="grid gap-4 sm:grid-cols-3">
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
              </div>
            </SubSection>

            {/* ── Collapsible: Labels ─────────────────────────────────────── */}
            <SubSection
              title="Labels"
              open={labelsOpen}
              onOpenChange={setLabelsOpen}
              chips={labelsChips}
            >
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
            </SubSection>

            {/* ── Collapsible: Submit Button ──────────────────────────────── */}
            <SubSection
              title="Submit Button"
              open={buttonOpen}
              onOpenChange={setButtonOpen}
              chips={buttonChips}
            >
              <div className="grid gap-4 sm:grid-cols-3">
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
            </SubSection>

          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

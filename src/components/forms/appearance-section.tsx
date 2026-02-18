"use client";

import { useState, useTransition, useEffect } from "react";
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
import { updateFormAppearance } from "@/actions/forms";
import { useToast } from "@/hooks/use-toast";
import { FontPicker } from "@/components/ui/font-picker";


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

type AppearanceSectionProps = {
  formId: string;
  defaultTheme: unknown;
};

export function AppearanceSection({
  formId,
  defaultTheme: initialTheme,
}: AppearanceSectionProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const theme =
    typeof initialTheme === "object" && initialTheme !== null
      ? (initialTheme as Record<string, string | number>)
      : {};

  // Store initial values for comparison
  const initialBodyFont = String(theme.bodyFont || "inherit");
  const initialHeadingFont = String(theme.headingFont || "inherit");
  const initialFontSize = String(theme.fontSize || "");
  const initialBackground = String(theme.background || "");
  const initialFieldBackground = String(theme.fieldBackground || "");
  const initialBorder = String(theme.border || "");
  const initialText = String(theme.text || "");
  const initialPrimary = String(theme.primary || "");
  const initialRadius = String(theme.radius || "");
  const initialDensity = String(theme.density || "");
  const initialButtonWidth = String(theme.buttonWidth || "full");
  const initialButtonAlign = String(theme.buttonAlign || "left");
  const initialButtonText = String(theme.buttonText || "");

  const [bodyFont, setBodyFont] = useState(initialBodyFont);
  const [headingFont, setHeadingFont] = useState(initialHeadingFont);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [background, setBackground] = useState(initialBackground);
  const [fieldBackground, setFieldBackground] = useState(initialFieldBackground);
  const [border, setBorder] = useState(initialBorder);
  const [text, setText] = useState(initialText);
  const [primary, setPrimary] = useState(initialPrimary);
  const [radius, setRadius] = useState(initialRadius);
  const [density, setDensity] = useState(initialDensity);
  const [buttonWidth, setButtonWidth] = useState(initialButtonWidth);
  const [buttonAlign, setButtonAlign] = useState(initialButtonAlign);
  const [buttonText, setButtonText] = useState(initialButtonText);

  // Auto-save with debouncing
  useEffect(() => {
    // Check if any values have changed from initial state
    const hasChanges =
      bodyFont !== initialBodyFont ||
      headingFont !== initialHeadingFont ||
      fontSize !== initialFontSize ||
      background !== initialBackground ||
      fieldBackground !== initialFieldBackground ||
      border !== initialBorder ||
      text !== initialText ||
      primary !== initialPrimary ||
      radius !== initialRadius ||
      density !== initialDensity ||
      buttonWidth !== initialButtonWidth ||
      buttonAlign !== initialButtonAlign ||
      buttonText !== initialButtonText;

    if (!hasChanges) return;

    setSaveStatus("saving");

    const timeoutId = setTimeout(() => {
      startTransition(() => {
        void (async () => {
          try {
            const newTheme: Record<string, string | number> = {};

            newTheme.bodyFont = bodyFont || "inherit";
            newTheme.headingFont = headingFont || "inherit";

            if (fontSize) newTheme.fontSize = parseInt(fontSize, 10);
            if (background) newTheme.background = normalizeHex(background);
            if (fieldBackground) newTheme.fieldBackground = normalizeHex(fieldBackground);
            if (border) newTheme.border = normalizeHex(border);
            if (text) newTheme.text = normalizeHex(text);
            if (primary) newTheme.primary = normalizeHex(primary);
            if (radius) newTheme.radius = parseInt(radius, 10);
            if (density) newTheme.density = density;
            if (buttonWidth) newTheme.buttonWidth = buttonWidth;
            if (buttonAlign) newTheme.buttonAlign = buttonAlign;
            if (buttonText) newTheme.buttonText = buttonText;

            await updateFormAppearance(formId, {
              defaultTheme: newTheme,
            });
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          } catch (error) {
            console.error("Failed to save appearance settings:", error);
            toast.error("Failed to save settings");
            setSaveStatus("idle");
          }
        })();
      });
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [
    formId,
    bodyFont,
    headingFont,
    fontSize,
    background,
    fieldBackground,
    border,
    text,
    primary,
    radius,
    density,
    buttonWidth,
    buttonAlign,
    buttonText,
    initialBodyFont,
    initialHeadingFont,
    initialFontSize,
    initialBackground,
    initialFieldBackground,
    initialBorder,
    initialText,
    initialPrimary,
    initialRadius,
    initialDensity,
    initialButtonWidth,
    initialButtonAlign,
    initialButtonText,
    toast,
  ]);

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
          <CardContent className="space-y-4">
            <div className="space-y-4 pb-2">
              <h4 className="text-sm font-heading font-medium">Typography</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bodyFont">Body Font</Label>
                  <FontPicker
                    id="bodyFont"
                    value={bodyFont}
                    onChange={setBodyFont}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headingFont">Heading Font</Label>
                  <FontPicker
                    id="headingFont"
                    value={headingFont}
                    onChange={setHeadingFont}
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
                    onChange={(e) => setFontSize(e.target.value)}
                    placeholder="14"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-heading font-medium">Colors</h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="background">Form Background</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={toColorInputValue(background, "#ffffff")}
                      onChange={(e) => setBackground(e.target.value)}
                      className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                    />
                    <Input
                      id="background"
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      onBlur={() => setBackground(normalizeHex(background))}
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
                      onChange={(e) => setFieldBackground(e.target.value)}
                      className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                    />
                    <Input
                      id="fieldBackground"
                      value={fieldBackground}
                      onChange={(e) => setFieldBackground(e.target.value)}
                      onBlur={() => setFieldBackground(normalizeHex(fieldBackground))}
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
                      onChange={(e) => setBorder(e.target.value)}
                      className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                    />
                    <Input
                      id="border"
                      value={border}
                      onChange={(e) => setBorder(e.target.value)}
                      onBlur={() => setBorder(normalizeHex(border))}
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
                      onChange={(e) => setText(e.target.value)}
                      className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                    />
                    <Input
                      id="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onBlur={() => setText(normalizeHex(text))}
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
                      onChange={(e) => setPrimary(e.target.value)}
                      className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                    />
                    <Input
                      id="primary"
                      value={primary}
                      onChange={(e) => setPrimary(e.target.value)}
                      onBlur={() => setPrimary(normalizeHex(primary))}
                      placeholder="#005F6A"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="radius">Border Radius (px)</Label>
                <Input
                  id="radius"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  placeholder="8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="density">Density</Label>
                <Select value={density || "normal"} onValueChange={setDensity}>
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

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-heading font-medium">Submit Button</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="buttonWidth">Button Width</Label>
                  <Select value={buttonWidth || "full"} onValueChange={setButtonWidth}>
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
                    <Select value={buttonAlign || "left"} onValueChange={setButtonAlign}>
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
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Submit"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

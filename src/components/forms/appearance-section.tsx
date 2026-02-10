"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { ChevronDown, ChevronRight, Save, Check } from "lucide-react";
import { updateFormAppearance } from "@/actions/forms";
import { useToast } from "@/hooks/use-toast";

const GOOGLE_FONTS = [
  { name: "System Default", family: "inherit", url: "" },
  { name: "Inter", family: "Inter, sans-serif", url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" },
  { name: "Roboto", family: "Roboto, sans-serif", url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;600&display=swap" },
  { name: "Open Sans", family: "'Open Sans', sans-serif", url: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" },
  { name: "Lato", family: "Lato, sans-serif", url: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" },
  { name: "Montserrat", family: "Montserrat, sans-serif", url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap" },
  { name: "Poppins", family: "Poppins, sans-serif", url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" },
  { name: "Raleway", family: "Raleway, sans-serif", url: "https://fonts.googleapis.com/css2?family=Raleway:wght@400;600&display=swap" },
  { name: "Nunito", family: "Nunito, sans-serif", url: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600&display=swap" },
  { name: "Playfair Display", family: "'Playfair Display', serif", url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap" },
  { name: "Merriweather", family: "Merriweather, serif", url: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" },
  { name: "Ubuntu", family: "Ubuntu, sans-serif", url: "https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500&display=swap" },
  { name: "Urbanist", family: "Urbanist, sans-serif", url: "https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600&display=swap" },
  { name: "Custom", family: "custom", url: "" },
] as const;

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

  // Find the matching Google Font or default to custom
  const findFontOption = () => {
    const currentFamily = String(theme.fontFamily || "");
    const match = GOOGLE_FONTS.find(f => f.family === currentFamily);
    return match ? match.name : "Custom";
  };

  // Store initial values for comparison
  const initialFont = findFontOption();
  const initialCustomFontFamily = initialFont === "Custom" ? String(theme.fontFamily || "") : "";
  const initialFontSize = String(theme.fontSize || "");
  const initialFontUrl = String(theme.fontUrl || "");
  const initialPrimary = String(theme.primary || "");
  const initialRadius = String(theme.radius || "");
  const initialDensity = String(theme.density || "");
  const initialButtonWidth = String(theme.buttonWidth || "full");
  const initialButtonAlign = String(theme.buttonAlign || "left");
  const initialButtonText = String(theme.buttonText || "");

  const [selectedFont, setSelectedFont] = useState<string>(initialFont);
  const [customFontFamily, setCustomFontFamily] = useState(initialCustomFontFamily);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [fontUrl, setFontUrl] = useState(initialFontUrl);

  const handleFontChange = (fontName: string) => {
    setSelectedFont(fontName);
    const selected = GOOGLE_FONTS.find(f => f.name === fontName);
    if (selected && selected.name !== "Custom") {
      setFontUrl(selected.url);
    }
  };
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
      selectedFont !== initialFont ||
      customFontFamily !== initialCustomFontFamily ||
      fontSize !== initialFontSize ||
      fontUrl !== initialFontUrl ||
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
            
            // Handle font selection
            if (selectedFont !== "Custom") {
              const selected = GOOGLE_FONTS.find(f => f.name === selectedFont);
              if (selected) {
                newTheme.fontFamily = selected.family;
                if (selected.url) newTheme.fontUrl = selected.url;
              }
            } else if (customFontFamily) {
              newTheme.fontFamily = customFontFamily;
              if (fontUrl) newTheme.fontUrl = fontUrl;
            }
            
            if (fontSize) newTheme.fontSize = parseInt(fontSize, 10);
            if (primary) newTheme.primary = primary;
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
    selectedFont,
    customFontFamily,
    fontSize,
    fontUrl,
    primary,
    radius,
    density,
    buttonWidth,
    buttonAlign,
    buttonText,
    initialFont,
    initialCustomFontFamily,
    initialFontSize,
    initialFontUrl,
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
        <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between">
              <CardTitle>Appearance</CardTitle>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select value={selectedFont} onValueChange={handleFontChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOOGLE_FONTS.map((font) => (
                      <SelectItem key={font.name} value={font.name}>
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Size (px)</Label>
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

            {selectedFont === "Custom" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customFontFamily">Custom Font Family</Label>
                  <Input
                    id="customFontFamily"
                    value={customFontFamily}
                    onChange={(e) => setCustomFontFamily(e.target.value)}
                    placeholder="'My Font', sans-serif"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontUrl">Font CSS URL</Label>
                  <Input
                    id="fontUrl"
                    value={fontUrl}
                    onChange={(e) => setFontUrl(e.target.value)}
                    placeholder="https://fonts.googleapis.com/..."
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="primary">Primary Color</Label>
                <Input
                  id="primary"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  placeholder="#0ea5e9"
                />
              </div>
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

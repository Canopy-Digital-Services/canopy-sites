"use client";

import { useState, useTransition } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronRight } from "lucide-react";
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

  const [selectedFont, setSelectedFont] = useState<string>(findFontOption());
  const [customFontFamily, setCustomFontFamily] = useState(
    selectedFont === "Custom" ? String(theme.fontFamily || "") : ""
  );
  const [fontSize, setFontSize] = useState(String(theme.fontSize || ""));
  const [fontUrl, setFontUrl] = useState(String(theme.fontUrl || ""));

  const handleFontChange = (fontName: string) => {
    setSelectedFont(fontName);
    const selected = GOOGLE_FONTS.find(f => f.name === fontName);
    if (selected && selected.name !== "Custom") {
      setFontUrl(selected.url);
    }
  };
  const [primary, setPrimary] = useState(String(theme.primary || ""));
  const [radius, setRadius] = useState(String(theme.radius || ""));
  const [density, setDensity] = useState(String(theme.density || ""));
  const [buttonWidth, setButtonWidth] = useState(String(theme.buttonWidth || "full"));
  const [buttonAlign, setButtonAlign] = useState(String(theme.buttonAlign || "left"));
  const [buttonText, setButtonText] = useState(String(theme.buttonText || ""));

  const handleSave = () => {
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
          toast.success("Appearance settings updated successfully");
        } catch (error) {
          console.error(error);
          toast.error("Failed to update appearance settings");
        }
      })();
    });
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between">
              <CardTitle>Appearance</CardTitle>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
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
              <h4 className="text-sm font-medium">Submit Button</h4>
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

            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save Appearance"}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

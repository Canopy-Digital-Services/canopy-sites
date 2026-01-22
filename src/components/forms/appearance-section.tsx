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
import { ChevronDown, ChevronRight } from "lucide-react";
import { updateFormAppearance } from "@/actions/forms";
import { useToast } from "@/hooks/use-toast";

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

  const [fontFamily, setFontFamily] = useState(String(theme.fontFamily || ""));
  const [fontUrl, setFontUrl] = useState(String(theme.fontUrl || ""));
  const [primary, setPrimary] = useState(String(theme.primary || ""));
  const [radius, setRadius] = useState(String(theme.radius || ""));
  const [density, setDensity] = useState(String(theme.density || ""));

  const handleSave = () => {
    startTransition(() => {
      void (async () => {
        try {
          const newTheme: Record<string, string | number> = {};
          if (fontFamily) newTheme.fontFamily = fontFamily;
          if (fontUrl) newTheme.fontUrl = fontUrl;
          if (primary) newTheme.primary = primary;
          if (radius) newTheme.radius = parseInt(radius, 10);
          if (density) newTheme.density = density;

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
                <Input
                  id="fontFamily"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  placeholder="Inter, system-ui"
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
                <Input
                  id="density"
                  value={density}
                  onChange={(e) => setDensity(e.target.value)}
                  placeholder="compact | normal | comfortable"
                />
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

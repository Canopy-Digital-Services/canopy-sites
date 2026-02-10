"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NameOptions } from "@/types/field-config";
import { ConfigComponentProps } from "./types";

type NamePart = "first" | "last" | "middle" | "middleInitial" | "single";

const PART_LABELS: Record<NamePart, string> = {
  first: "First Name",
  last: "Last Name",
  middle: "Middle Name",
  middleInitial: "Middle Initial",
  single: "Full Name (Single Field)",
};

export function NameConfig({
  value,
  onChange,
}: ConfigComponentProps<NameOptions>) {
  const options = value || { parts: ["first", "last"] };

  const handlePartToggle = (part: NamePart) => {
    const currentParts = options.parts || [];
    
    // Single is mutually exclusive with other parts
    if (part === "single") {
      onChange({
        ...options,
        parts: currentParts.includes("single") ? [] : ["single"],
      });
      return;
    }
    
    // If single is currently selected, replace it
    if (currentParts.includes("single")) {
      onChange({
        ...options,
        parts: [part],
      });
      return;
    }
    
    // Toggle the part
    const updated = currentParts.includes(part)
      ? currentParts.filter((p) => p !== part)
      : [...currentParts, part];
    
    onChange({
      ...options,
      parts: updated,
    });
  };

  const handlePartLabelChange = (part: NamePart, label: string) => {
    const updated = { ...options };
    if (!updated.partLabels) {
      updated.partLabels = {};
    }
    
    if (label.trim()) {
      updated.partLabels[part] = label.trim();
    } else {
      delete updated.partLabels[part];
      if (Object.keys(updated.partLabels).length === 0) {
        delete updated.partLabels;
      }
    }
    
    onChange(updated);
  };

  const handlePartRequiredToggle = (part: NamePart) => {
    const updated = { ...options };
    if (!updated.partsRequired) {
      updated.partsRequired = {};
    }
    
    const currentValue = updated.partsRequired[part];
    if (currentValue) {
      delete updated.partsRequired[part];
      if (Object.keys(updated.partsRequired).length === 0) {
        delete updated.partsRequired;
      }
    } else {
      updated.partsRequired[part] = true;
    }
    
    onChange(updated);
  };

  const selectedParts = options.parts || [];
  const isSingleMode = selectedParts.includes("single");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name Parts to Capture</Label>
        <p className="text-xs text-muted-foreground">
          Select which name parts to collect. Choose "Full Name" for a single input field,
          or select multiple parts for separate fields.
        </p>
        <div className="space-y-2">
          {(Object.keys(PART_LABELS) as NamePart[]).map((part) => (
            <div key={part} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`name-part-${part}`}
                checked={selectedParts.includes(part)}
                onChange={() => handlePartToggle(part)}
                className="h-4 w-4"
              />
              <Label
                htmlFor={`name-part-${part}`}
                className="text-sm font-normal cursor-pointer"
              >
                {PART_LABELS[part]}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {selectedParts.length > 0 && !isSingleMode && (
        <>
          <div className="space-y-3">
            <Label>Custom Labels (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Override the default labels for each part.
            </p>
            {selectedParts.map((part) => (
              <div key={part} className="space-y-1">
                <Label htmlFor={`name-label-${part}`} className="text-xs font-normal">
                  {PART_LABELS[part]}
                </Label>
                <Input
                  id={`name-label-${part}`}
                  value={options.partLabels?.[part] ?? ""}
                  onChange={(e) => handlePartLabelChange(part, e.target.value)}
                  placeholder={PART_LABELS[part]}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Required Parts</Label>
            <p className="text-xs text-muted-foreground">
              Mark specific parts as required (by default, all parts inherit the field's required setting).
            </p>
            {selectedParts.map((part) => (
              <div key={part} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`name-required-${part}`}
                  checked={options.partsRequired?.[part] || false}
                  onChange={() => handlePartRequiredToggle(part)}
                  className="h-4 w-4"
                />
                <Label
                  htmlFor={`name-required-${part}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {options.partLabels?.[part] || PART_LABELS[part]} is required
                </Label>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

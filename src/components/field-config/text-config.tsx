"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BaseValidation } from "@/types/field-config";
import { ConfigComponentProps } from "./types";

const FORMAT_OPTIONS = [
  { value: "alphanumeric", label: "Letters and numbers (default)" },
  { value: "numbers", label: "Numbers only" },
  { value: "letters", label: "Letters only" },
  { value: "url", label: "URL" },
  { value: "postal-us", label: "US Postal Code" },
  { value: "postal-ca", label: "Canadian Postal Code" },
] as const;

export function TextConfig({
  value,
  onChange,
}: ConfigComponentProps<BaseValidation | undefined>) {
  const validation = value || {};

  const handleChange = (key: keyof BaseValidation, newValue: string) => {
    const updated = { ...validation };
    
    if (key === "minLength" || key === "maxLength") {
      if (newValue.trim()) {
        updated[key] = Number(newValue);
      } else {
        delete updated[key];
      }
    } else if (key === "format") {
      // Store format, or remove if it's the default (alphanumeric)
      if (newValue && newValue !== "alphanumeric") {
        updated[key] = newValue as BaseValidation["format"];
      } else {
        delete updated[key];
      }
    } else {
      if (newValue.trim()) {
        updated[key] = newValue.trim();
      } else {
        delete updated[key];
      }
    }
    
    onChange(Object.keys(updated).length > 0 ? updated : undefined);
  };

  return (
    <div className="space-y-4">
      {/* Format */}
      <div className="space-y-2">
        <Label htmlFor="format">Format</Label>
        <Select
          value={validation.format ?? "alphanumeric"}
          onValueChange={(value) => handleChange("format", value)}
        >
          <SelectTrigger id="format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMAT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Min/Max Length */}
      <div className="space-y-2">
        <Label>Length Limits</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="number"
            min={0}
            value={validation.minLength?.toString() ?? ""}
            onChange={(e) => handleChange("minLength", e.target.value)}
            placeholder="Min length"
          />
          <Input
            type="number"
            min={0}
            value={validation.maxLength?.toString() ?? ""}
            onChange={(e) => handleChange("maxLength", e.target.value)}
            placeholder="Max length"
          />
        </div>
      </div>
    </div>
  );
}

// Textarea uses the same config as Text
export const TextareaConfig = TextConfig;

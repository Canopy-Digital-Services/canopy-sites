"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneValidation } from "@/types/field-config";
import { ConfigComponentProps } from "./types";

// TODO: International number validation not yet supported. Currently assumes US-centric formatting.

export function PhoneConfig({
  value,
  onChange,
}: ConfigComponentProps<PhoneValidation | undefined>) {
  const validation = value || {};

  const handleChange = (newValue: string) => {
    if (newValue && newValue !== "lenient") {
      onChange({ format: newValue as "lenient" | "strict" });
    } else {
      onChange(undefined); // Default to lenient
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone-format">Validation</Label>
        <Select
          value={validation.format || "lenient"}
          onValueChange={handleChange}
        >
          <SelectTrigger id="phone-format">
            <SelectValue placeholder="Select validation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lenient">
              Lenient (allow any format)
            </SelectItem>
            <SelectItem value="strict">
              Strict US format
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {validation.format === "strict"
            ? "Validates and normalizes US phone numbers (10 digits). Stored as +1XXXXXXXXXX."
            : "Accepts any format with at least 7 characters. No validation or normalization."}
        </p>
      </div>
    </div>
  );
}

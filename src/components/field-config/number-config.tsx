"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberValidation } from "@/types/field-config";
import { ConfigComponentProps } from "./types";

export function NumberConfig({
  value,
  onChange,
}: ConfigComponentProps<NumberValidation | undefined>) {
  const validation = value || {};

  const handleChange = (key: keyof NumberValidation, newValue: string | boolean) => {
    const updated = { ...validation };

    if (key === "integer") {
      if (newValue) {
        updated.integer = true;
      } else {
        delete updated.integer;
      }
    } else {
      if (typeof newValue === "string" && newValue.trim() !== "") {
        updated[key] = Number(newValue);
      } else {
        delete updated[key];
      }
    }

    onChange(Object.keys(updated).length > 0 ? updated : undefined);
  };

  return (
    <div className="space-y-4">
      {/* Min/Max Value */}
      <div className="space-y-2">
        <Label>Value Range</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="number"
            value={validation.min?.toString() ?? ""}
            onChange={(e) => handleChange("min", e.target.value)}
            placeholder="Minimum value"
          />
          <Input
            type="number"
            value={validation.max?.toString() ?? ""}
            onChange={(e) => handleChange("max", e.target.value)}
            placeholder="Maximum value"
          />
        </div>
      </div>

      {/* Integers only */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="integer-only"
          checked={validation.integer ?? false}
          onCheckedChange={(checked) => handleChange("integer", !!checked)}
        />
        <Label htmlFor="integer-only" className="font-normal">
          Integers only (no decimals)
        </Label>
      </div>
    </div>
  );
}

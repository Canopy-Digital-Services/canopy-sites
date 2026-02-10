"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateValidation } from "@/types/field-config";
import { ConfigComponentProps } from "./types";

export function DateConfig({
  value,
  onChange,
}: ConfigComponentProps<DateValidation | undefined>) {
  const validation = value || {};

  const handleChange = (key: keyof DateValidation, newValue: string | boolean) => {
    const updated = { ...validation };

    if (typeof newValue === "boolean") {
      if (newValue) {
        (updated as any)[key] = true;
      } else {
        delete (updated as any)[key];
      }
    } else {
      if (newValue.trim()) {
        (updated as any)[key] = newValue.trim();
      } else {
        delete (updated as any)[key];
      }
    }

    onChange(Object.keys(updated).length > 0 ? updated : undefined);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Date Range</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="date-min"
            type="date"
            value={
              validation.minDate && validation.minDate !== "today"
                ? validation.minDate
                : ""
            }
            onChange={(e) => handleChange("minDate", e.target.value)}
            placeholder="Min date"
          />
          <Input
            id="date-max"
            type="date"
            value={
              validation.maxDate && validation.maxDate !== "today"
                ? validation.maxDate
                : ""
            }
            onChange={(e) => handleChange("maxDate", e.target.value)}
            placeholder="Max date"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Leave empty or use "today" for current date
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="date-no-future"
            checked={validation.noFuture || false}
            onChange={(e) => handleChange("noFuture", e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="date-no-future" className="text-sm font-normal cursor-pointer">
            No future dates (max is today)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="date-no-past"
            checked={validation.noPast || false}
            onChange={(e) => handleChange("noPast", e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="date-no-past" className="text-sm font-normal cursor-pointer">
            No past dates (min is today)
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          These shortcuts override min/max date settings.
        </p>
      </div>
    </div>
  );
}

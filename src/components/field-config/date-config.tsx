"use client";

import { useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateValidation } from "@/types/field-config";
import { ConfigComponentProps } from "./types";

export function DateConfig({
  value,
  onChange,
}: ConfigComponentProps<DateValidation | undefined>) {
  const validation = value || {};

  // Stash the last specific date so it can be restored when unchecking "today"
  const stashedMin = useRef<string | undefined>(undefined);
  const stashedMax = useRef<string | undefined>(undefined);

  const handleDateChange = (key: "minDate" | "maxDate", newValue: string) => {
    const updated = { ...validation };
    if (newValue.trim()) {
      updated[key] = newValue.trim();
    } else {
      delete updated[key];
    }
    onChange(Object.keys(updated).length > 0 ? updated : undefined);
  };

  const handleTodayToggle = (key: "minDate" | "maxDate", checked: boolean) => {
    const other = key === "minDate" ? "maxDate" : "minDate";
    const stash = key === "minDate" ? stashedMin : stashedMax;
    const updated = { ...validation };

    if (checked) {
      // Stash the current specific date before overwriting
      if (updated[key] && updated[key] !== "today") {
        stash.current = updated[key];
      }
      updated[key] = "today";
      if (updated[other] === "today") {
        delete updated[other];
      }
    } else {
      // Restore stashed date, or clear
      if (stash.current) {
        updated[key] = stash.current;
      } else {
        delete updated[key];
      }
    }

    onChange(Object.keys(updated).length > 0 ? updated : undefined);
  };

  const minIsToday = validation.minDate === "today";
  const maxIsToday = validation.maxDate === "today";

  return (
    <div className="space-y-4">
      <Label>Date Limits</Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date-min" className="text-sm font-normal">
            Min Date
          </Label>
          <Input
            id="date-min"
            type="date"
            value={!minIsToday ? (validation.minDate ?? "") : ""}
            onChange={(e) => handleDateChange("minDate", e.target.value)}
            disabled={minIsToday}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="date-min-today"
              checked={minIsToday}
              onCheckedChange={(checked) => handleTodayToggle("minDate", checked === true)}
            />
            <Label htmlFor="date-min-today" className="text-sm font-normal cursor-pointer">
              No past dates
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-max" className="text-sm font-normal">
            Max Date
          </Label>
          <Input
            id="date-max"
            type="date"
            value={!maxIsToday ? (validation.maxDate ?? "") : ""}
            onChange={(e) => handleDateChange("maxDate", e.target.value)}
            disabled={maxIsToday}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="date-max-today"
              checked={maxIsToday}
              onCheckedChange={(checked) => handleTodayToggle("maxDate", checked === true)}
            />
            <Label htmlFor="date-max-today" className="text-sm font-normal cursor-pointer">
              No future dates
            </Label>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Leave either field empty for no limit.
      </p>
    </div>
  );
}

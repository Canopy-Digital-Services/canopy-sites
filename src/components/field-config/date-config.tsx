"use client";

import { useRef } from "react";
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={minIsToday}
              onChange={(e) => handleTodayToggle("minDate", e.target.checked)}
              className="h-4 w-4"
            />
            No past dates
          </label>
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={maxIsToday}
              onChange={(e) => handleTodayToggle("maxDate", e.target.checked)}
              className="h-4 w-4"
            />
            No future dates
          </label>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Leave either field empty for no limit.
      </p>
    </div>
  );
}

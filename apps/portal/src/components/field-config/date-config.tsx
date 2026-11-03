"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// Which dates a Date field takes: today or earlier, today or later, or any.

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { dateRule, dateWhen, type DateWhen } from "@/lib/field-rules";
import { DateValidation } from "@/types/field-config";
import { ConfigComponentProps } from "./types";

export function DateConfig({ value, onChange }: ConfigComponentProps<DateValidation | undefined>) {
  return (
    <ToggleGroup
      type="single"
      value={dateWhen(value)}
      // Pressing the pressed button would clear the choice; a setting always has one.
      onValueChange={(when) => when && onChange(dateRule(when as DateWhen) ?? undefined)}
      aria-label="Dates accepted"
    >
      <ToggleGroupItem value="past">Past Date</ToggleGroupItem>
      <ToggleGroupItem value="future">Future Date</ToggleGroupItem>
      <ToggleGroupItem value="any">Any Date</ToggleGroupItem>
    </ToggleGroup>
  );
}

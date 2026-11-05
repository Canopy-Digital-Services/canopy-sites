"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// A Number's kind (whole or decimal) and the range it takes, either end
// optional.

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { rangeBackwards } from "@/lib/field-rules";
import { NumberValidation } from "@/types/field-config";
import { numberAnswer } from "../../../embed/src/validation";
import { ConfigComponentProps } from "./types";

export function NumberConfig({ value, onChange }: ConfigComponentProps<NumberValidation | undefined>) {
  const id = useId();
  const rule = value || {};
  // The bounds as typed: "-" or "1." on the way to a number isn't one yet.
  const [typed, setTyped] = useState({ min: rule.min?.toString() ?? "", max: rule.max?.toString() ?? "" });

  const backwards = rangeBackwards(rule);

  const save = (next: NumberValidation) => onChange(Object.keys(next).length > 0 ? next : undefined);

  const setWhole = (whole: boolean) => {
    const next = { ...rule };
    if (whole) next.integer = true;
    else delete next.integer;
    save(next);
  };

  const setBound = (key: "min" | "max", text: string) => {
    setTyped((now) => ({ ...now, [key]: text }));
    const bound = numberAnswer(text);
    if (bound === null && text.trim()) return;
    const next = { ...rule };
    if (bound === null) delete next[key];
    else next[key] = Number(bound);
    save(next);
  };

  return (
    <div className="space-y-4">
      <ToggleGroup
        type="single"
        value={rule.integer ? "whole" : "decimal"}
        // Pressing the pressed button would clear the choice; a setting always has one.
        onValueChange={(kind) => kind && setWhole(kind === "whole")}
        aria-label="Kind of number"
      >
        <ToggleGroupItem value="whole">Whole Number</ToggleGroupItem>
        <ToggleGroupItem value="decimal">Decimal</ToggleGroupItem>
      </ToggleGroup>

      {/* Text boxes, as the form's own Number is (a scroll wheel can't change
          them), and no number pad: a bound may be below zero, and iPhone pads
          have no minus key. */}
      <div className="grid grid-cols-2 gap-3">
        {(["min", "max"] as const).map((key) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`${id}-${key}`}>{key === "min" ? "Minimum" : "Maximum"}</Label>
            <Input
              id={`${id}-${key}`}
              spellCheck={false}
              value={typed[key]}
              aria-invalid={backwards || undefined}
              onChange={(e) => setBound(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// An Email's one setting: whether it takes only work addresses.

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EmailValidation } from "@/types/field-config";
import { ConfigComponentProps } from "./types";

export function EmailConfig({ value, onChange }: ConfigComponentProps<EmailValidation | undefined>) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={value?.workOnly === true}
        onCheckedChange={(checked) => onChange(checked === true ? { workOnly: true } : undefined)}
      />
      <Label htmlFor={id} className="cursor-pointer font-normal">
        Work emails only
      </Label>
    </div>
  );
}

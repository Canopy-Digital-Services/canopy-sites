"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// A Paragraph's character limit, which the form counts down under its box.
// Text has no settings of its own.

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { limitOutOfRange } from "@/lib/field-rules";
import { ParagraphValidation } from "@/types/field-config";
import { numberAnswer } from "../../../embed/src/validation";
import { ConfigComponentProps } from "./types";

export function ParagraphConfig({ value, onChange }: ConfigComponentProps<ParagraphValidation | undefined>) {
  const id = useId();
  // The limit as typed, which "1,0" on the way to 1,000 isn't yet.
  const [typed, setTyped] = useState(value?.maxLength?.toString() ?? "");

  const setLimit = (text: string) => {
    setTyped(text);
    const limit = numberAnswer(text);
    if (limit === null && text.trim()) return;
    onChange(limit === null ? undefined : { maxLength: Number(limit) });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Character limit</Label>
      <Input
        id={id}
        inputMode="numeric"
        spellCheck={false}
        className="w-32"
        value={typed}
        aria-invalid={limitOutOfRange(value) || undefined}
        onChange={(e) => setLimit(e.target.value)}
      />
    </div>
  );
}

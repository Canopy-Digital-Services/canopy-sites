"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { InlineRename } from "@/components/forms/inline-rename";
import { NameOptions } from "@/types/field-config";
import {
  DEFAULT_NAME_PARTS,
  NAME_PART_LABELS,
  orderNameParts,
  type NamePart,
} from "../../../embed/src/name";
import { ConfigComponentProps } from "./types";

type Row = "first" | "middle" | "last";

const ROWS: [Row, string][] = [
  ["first", "First"],
  ["middle", "Middle"],
  ["last", "Last"],
];

export function NameConfig({ value, onChange, onFocusPart }: ConfigComponentProps<NameOptions>) {
  const parts: NamePart[] = value?.parts ?? DEFAULT_NAME_PARTS;
  const partLabels = value?.partLabels ?? {};
  const single = parts.includes("single");
  // A middle is a name or an initial, never both; one saved with both shows as the name.
  const middle: NamePart | null = parts.includes("middle")
    ? "middle"
    : parts.includes("middleInitial")
      ? "middleInitial"
      : null;

  const save = (nextParts: NamePart[], nextLabels: Record<string, string> = partLabels) => {
    // Part labels stay only for the parts that stay.
    const kept = Object.fromEntries(
      Object.entries(nextLabels).filter(([part]) => nextParts.includes(part as NamePart))
    );
    onChange({
      parts: orderNameParts(nextParts) as NamePart[],
      ...(Object.keys(kept).length > 0 && { partLabels: kept }),
    });
  };

  const withoutMiddle = parts.filter((p) => p !== "middle" && p !== "middleInitial");
  const partFor = (row: Row): NamePart | null =>
    row === "middle" ? middle : parts.includes(row) ? row : null;

  const toggleRow = (row: Row, on: boolean) => {
    if (row === "middle") save(on ? [...withoutMiddle, "middle"] : withoutMiddle);
    else save(on ? [...parts, row] : parts.filter((p) => p !== row));
  };

  const setPartLabel = (part: NamePart, text: string) => {
    const next = { ...partLabels };
    if (text.trim()) next[part] = text;
    else delete next[part];
    save(parts, next);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label id="name-format-label">Format</Label>
        <ToggleGroup
          type="single"
          value={single ? "single" : "parts"}
          // Pressing the pressed button would clear the choice; a setting always has one.
          onValueChange={(v) => v && save(v === "single" ? ["single"] : DEFAULT_NAME_PARTS, {})}
          aria-labelledby="name-format-label"
        >
          <ToggleGroupItem value="single">Full name</ToggleGroupItem>
          <ToggleGroupItem value="parts">Separate parts</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {!single && (
        <div className="editor-reveal">
          {/* The reveal grows a grid row; padding keeps focus rings clear of its clip. */}
          <div className="min-h-0 overflow-hidden -m-1 p-1 space-y-1">
            {ROWS.map(([row, text]) => {
              const part = partFor(row);
              const id = `name-part-${row}`;
              return (
                <div key={row} className="flex h-8 items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={part !== null}
                    onCheckedChange={(checked) => toggleRow(row, checked === true)}
                  />
                  {part ? (
                    <InlineRename
                      value={partLabels[part] ?? ""}
                      placeholder={NAME_PART_LABELS[part]}
                      onChange={(t) => setPartLabel(part, t)}
                      name={`Rename ${NAME_PART_LABELS[part]}`}
                      className="max-w-40"
                      onEditingChange={(editing) => onFocusPart?.(editing ? `label-${part}` : null)}
                    >
                      <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
                        {partLabels[part] || NAME_PART_LABELS[part]}
                      </Label>
                    </InlineRename>
                  ) : (
                    <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
                      {text}
                    </Label>
                  )}
                  {row === "middle" && middle && (
                    <ToggleGroup
                      type="single"
                      value={middle}
                      onValueChange={(v) => v && save([...withoutMiddle, v as NamePart])}
                      aria-label="Middle name or initial"
                      className="ml-auto"
                    >
                      <ToggleGroupItem value="middle">Full</ToggleGroupItem>
                      <ToggleGroupItem value="middleInitial">Initial</ToggleGroupItem>
                    </ToggleGroup>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

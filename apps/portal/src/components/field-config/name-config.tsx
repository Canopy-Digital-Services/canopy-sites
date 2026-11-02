"use client";

import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { NameOptions } from "@/types/field-config";
import {
  DEFAULT_NAME_PARTS,
  NAME_PART_LABELS,
  nameRequiredParts,
  orderNameParts,
  type NamePart,
} from "../../../embed/src/name";
import { savedParts } from "@/lib/field-rules";
import { PartRow, PartsRequiredHeading } from "./part-row";
import { ConfigComponentProps } from "./types";

type Row = "first" | "middle" | "last";

const ROWS: [Row, string][] = [
  ["first", "First"],
  ["middle", "Middle"],
  ["last", "Last"],
];

export function NameConfig({
  value,
  onChange,
  onFocusPart,
  required: fieldRequired = false,
}: ConfigComponentProps<NameOptions>) {
  const parts: NamePart[] = value?.parts ?? DEFAULT_NAME_PARTS;
  const partLabels = value?.partLabels ?? {};
  const requiredParts = nameRequiredParts(value, fieldRequired) as NamePart[];
  const single = parts.includes("single");
  // A middle is a name or an initial, never both; one saved with both shows as the name.
  const middle: NamePart | null = parts.includes("middle")
    ? "middle"
    : parts.includes("middleInitial")
      ? "middleInitial"
      : null;

  // Labels and requirements stay only for the parts that stay (savedParts).
  const save = (next: Partial<NameOptions>) =>
    onChange(
      savedParts(
        {
          parts: next.parts ?? parts,
          partLabels: next.partLabels ?? partLabels,
          requiredParts: next.requiredParts ?? requiredParts,
        },
        orderNameParts
      ) as NameOptions
    );

  const withoutMiddle = parts.filter((p) => p !== "middle" && p !== "middleInitial");
  const partFor = (row: Row): NamePart | null =>
    row === "middle" ? middle : parts.includes(row) ? row : null;

  const toggleRow = (row: Row, on: boolean) => {
    if (row === "middle") save({ parts: on ? [...withoutMiddle, "middle"] : withoutMiddle });
    else save({ parts: on ? [...parts, row] : parts.filter((p) => p !== row) });
  };

  const setRequired = (part: NamePart, on: boolean) =>
    save({ requiredParts: on ? [...requiredParts, part] : requiredParts.filter((p) => p !== part) });

  const setPartLabel = (part: NamePart, text: string) => {
    const next = { ...partLabels };
    if (text.trim()) next[part] = text;
    else delete next[part];
    save({ partLabels: next });
  };

  // Switching format keeps whether the name is required.
  const pickFormat = (nextSingle: boolean) => {
    const nextParts: NamePart[] = nextSingle ? ["single"] : DEFAULT_NAME_PARTS;
    save({ parts: nextParts, partLabels: {}, requiredParts: requiredParts.length > 0 ? nextParts : [] });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label id="name-format-label">Format</Label>
        <ToggleGroup
          type="single"
          value={single ? "single" : "parts"}
          // Pressing the pressed button would clear the choice; a setting always has one.
          onValueChange={(v) => v && pickFormat(v === "single")}
          aria-labelledby="name-format-label"
        >
          <ToggleGroupItem value="single">Full name</ToggleGroupItem>
          <ToggleGroupItem value="parts">Separate parts</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {single ? (
        // One box has no part rows to carry the Required column.
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={requiredParts.includes("single")}
            onChange={(e) => setRequired("single", e.target.checked)}
          />
          Required field
        </label>
      ) : (
        <div className="editor-reveal">
          {/* The reveal grows a grid row; padding keeps focus rings clear of its clip. */}
          <div className="min-h-0 overflow-hidden -m-1 p-1 space-y-1">
            <PartsRequiredHeading />
            {ROWS.map(([row, text]) => {
              const part = partFor(row);
              return (
                <PartRow
                  key={row}
                  id={`name-part-${row}`}
                  name={text}
                  checked={part !== null}
                  onCheckedChange={(on) => toggleRow(row, on)}
                  label={part ? (partLabels[part] ?? "") : ""}
                  defaultLabel={part ? NAME_PART_LABELS[part] : text}
                  onRename={(t) => part && setPartLabel(part, t)}
                  onRenaming={(renaming) => part && onFocusPart?.(renaming ? `label-${part}` : null)}
                  required={part !== null && requiredParts.includes(part)}
                  onRequiredChange={(on) => part && setRequired(part, on)}
                >
                  {row === "middle" && middle && (
                    <ToggleGroup
                      type="single"
                      value={middle}
                      onValueChange={(v) => {
                        if (!v) return;
                        const next = v as NamePart;
                        // The middle stays required, or not, as it switches.
                        const wasRequired = requiredParts.includes(middle);
                        save({
                          parts: [...withoutMiddle, next],
                          requiredParts: wasRequired ? [...requiredParts, next] : requiredParts,
                        });
                      }}
                      aria-label="Middle name or initial"
                    >
                      <ToggleGroupItem value="middle">Full</ToggleGroupItem>
                      <ToggleGroupItem value="middleInitial">Initial</ToggleGroupItem>
                    </ToggleGroup>
                  )}
                </PartRow>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

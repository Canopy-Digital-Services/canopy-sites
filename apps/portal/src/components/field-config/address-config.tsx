"use client";

import { AddressOptions } from "@/types/field-config";
import {
  ADDRESS_PART_LABELS,
  addressParts,
  addressRequiredParts,
  type AddressPart,
} from "../../../embed/src/address";
import { savedParts } from "@/lib/field-rules";
import { PartRow, PartsRequiredHeading } from "./part-row";
import { ConfigComponentProps } from "./types";

const ROWS: AddressPart[] = ["line1", "line2", "city", "region", "postalCode"];

export function AddressConfig({
  value,
  onChange,
  onFocusPart,
  required: fieldRequired = false,
}: ConfigComponentProps<AddressOptions>) {
  const parts = addressParts(value);
  const partLabels = value?.partLabels ?? {};
  const requiredParts = addressRequiredParts(value, fieldRequired) as AddressPart[];

  // Labels and requirements stay only for the parts that stay (savedParts).
  const save = (next: Partial<AddressOptions>) =>
    onChange(
      savedParts(
        {
          parts: next.parts ?? parts,
          partLabels: next.partLabels ?? partLabels,
          requiredParts: next.requiredParts ?? requiredParts,
        },
        (order) => addressParts({ parts: order as AddressPart[] })
      ) as AddressOptions
    );

  const toggle = (part: AddressPart, on: boolean) => {
    if (on) return save({ parts: [...parts, part] });
    // An apartment means nothing without a street.
    save({ parts: parts.filter((p) => p !== part && !(part === "line1" && p === "line2")) });
  };

  const setRequired = (part: AddressPart, on: boolean) =>
    save({ requiredParts: on ? [...requiredParts, part] : requiredParts.filter((p) => p !== part) });

  const rename = (part: AddressPart, text: string) => {
    const next = { ...partLabels };
    if (text.trim()) next[part] = text;
    else delete next[part];
    save({ partLabels: next });
  };

  return (
    <div className="space-y-1">
      <PartsRequiredHeading />
      {ROWS.map((part) =>
        // The apartment shows only under a collected street, indented as its dependent.
        part === "line2" && !parts.includes("line1") ? null : (
          <PartRow
            key={part}
            id={`address-part-${part}`}
            name={ADDRESS_PART_LABELS[part]}
            checked={parts.includes(part)}
            onCheckedChange={(on) => toggle(part, on)}
            label={partLabels[part] ?? ""}
            defaultLabel={ADDRESS_PART_LABELS[part]}
            onRename={(text) => rename(part, text)}
            onRenaming={(renaming) => onFocusPart?.(renaming ? `label-${part}` : null)}
            required={requiredParts.includes(part)}
            onRequiredChange={(on) => setRequired(part, on)}
            className={part === "line2" ? "pl-6" : undefined}
          />
        )
      )}
    </div>
  );
}

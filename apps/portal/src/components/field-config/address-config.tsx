"use client";

import { AddressOptions } from "@/types/field-config";
import {
  ADDRESS_PART_LABELS,
  addressParts,
  addressRequiredParts,
  type AddressPart,
} from "../../../embed/src/address";
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

  const save = (next: Partial<AddressOptions>) => {
    const nextParts = next.parts ?? parts;
    // Labels and requirements stay only for the parts that stay.
    const keep = (part: string) => nextParts.includes(part as AddressPart);
    const labels = Object.fromEntries(
      Object.entries(next.partLabels ?? partLabels).filter(([part]) => keep(part))
    );
    onChange({
      parts: addressParts({ parts: nextParts }),
      requiredParts: addressParts({ parts: (next.requiredParts ?? requiredParts).filter(keep) }),
      ...(Object.keys(labels).length > 0 && { partLabels: labels }),
    });
  };

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

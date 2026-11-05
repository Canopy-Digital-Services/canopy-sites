"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// A Phone's one setting: an extension box beside the number, as Address's
// Apt, suite is Street's. The number is the field itself, named by its label
// and required by its Required field box.

import { PHONE_EXTENSION_LABEL, type PhoneOptions } from "../../../embed/src/phone";
import { PartRow } from "./part-row";
import { ConfigComponentProps } from "./types";

export function PhoneConfig({ value, onChange, onFocusPart }: ConfigComponentProps<PhoneOptions | undefined>) {
  const extension = value?.parts?.includes("extension") ?? false;
  const label = value?.partLabels?.extension ?? "";

  const save = (on: boolean, extensionLabel: string) =>
    onChange(
      on
        ? { parts: ["number", "extension"], ...(extensionLabel.trim() && { partLabels: { extension: extensionLabel } }) }
        : undefined
    );

  return (
    <PartRow
      id="phone-part-extension"
      name="Extension"
      checked={extension}
      onCheckedChange={(on) => save(on, label)}
      label={label}
      defaultLabel={PHONE_EXTENSION_LABEL}
      onRename={(text) => save(true, text)}
      onRenaming={(renaming) => onFocusPart?.(renaming ? "label-extension" : null)}
    />
  );
}

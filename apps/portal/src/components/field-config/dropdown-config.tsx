"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { choiceOptions, type ChoiceOptions } from "../../../embed/src/choices";
import { ChoiceOptionsEditor } from "./choice-options-editor";
import { ConfigComponentProps } from "./types";

const NO_DEFAULT = "__none__";

export function DropdownConfig({
  value,
  onChange,
  onFocusPart,
}: ConfigComponentProps<ChoiceOptions | undefined>) {
  const id = useId();
  const config = choiceOptions(value);
  // Each option once, as the form lists it.
  const choices = config.options.filter(
    (o, i, all) => o.value.trim() !== "" && all.findIndex((other) => other.value === o.value) === i
  );
  const hasDefault = choices.some((o) => o.value === config.defaultValue);

  const setDefault = (next: string) => {
    const updated = { ...config };
    if (next === NO_DEFAULT) delete updated.defaultValue;
    else updated.defaultValue = next;
    onChange(updated);
  };

  // A dropdown's options sit inside it, so the preview marks the dropdown.
  const markDropdown = (on: boolean) => onFocusPart?.(on ? "input" : null);

  return (
    <div className="space-y-4">
      <ChoiceOptionsEditor
        value={config}
        onChange={onChange}
        onFocusOption={(index) => markDropdown(index !== null)}
      />
      {choices.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor={id}>Default choice</Label>
          <Select
            value={hasDefault ? config.defaultValue : NO_DEFAULT}
            onValueChange={setDefault}
            onOpenChange={markDropdown}
          >
            <SelectTrigger id={id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_DEFAULT}>None</SelectItem>
              {choices.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

"use client";

import { CheckboxesOptions } from "@/types/field-config";
import { choiceOptions } from "../../../embed/src/choices";
import { ChoiceOptionsEditor } from "./choice-options-editor";
import { ConfigComponentProps } from "./types";

export function CheckboxesConfig({
  value,
  onChange,
  onFocusPart,
}: ConfigComponentProps<CheckboxesOptions | undefined>) {
  return (
    <ChoiceOptionsEditor
      value={choiceOptions(value)}
      onChange={onChange}
      // The preview marks the option being edited.
      onFocusOption={(index) => onFocusPart?.(index === null ? null : `option-${index}`)}
    />
  );
}

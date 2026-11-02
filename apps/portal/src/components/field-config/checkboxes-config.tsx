"use client";

import { choiceOptions, type ChoiceOptions } from "../../../embed/src/choices";
import { ChoiceOptionsEditor } from "./choice-options-editor";
import { ConfigComponentProps } from "./types";

export function CheckboxesConfig({
  value,
  onChange,
  onFocusPart,
}: ConfigComponentProps<ChoiceOptions | undefined>) {
  return (
    <ChoiceOptionsEditor
      value={choiceOptions(value)}
      onChange={onChange}
      // The preview marks the option being edited.
      onFocusOption={(index) => onFocusPart?.(index === null ? null : `option-${index}`)}
    />
  );
}

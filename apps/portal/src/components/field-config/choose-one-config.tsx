"use client";

import { choiceOptions, showsAsButtons, type ChoiceOptions } from "../../../embed/src/choices";
import { ChoiceOptionsEditor } from "./choice-options-editor";
import { ConfigComponentProps } from "./types";

export function ChooseOneConfig({
  value,
  onChange,
  onFocusPart,
}: ConfigComponentProps<ChoiceOptions | undefined>) {
  const config = choiceOptions(value);
  // The preview marks the option being edited, or the whole dropdown a long
  // list folds into.
  const buttons = showsAsButtons(config);
  return (
    <ChoiceOptionsEditor
      value={config}
      onChange={onChange}
      onFocusOption={(option) =>
        onFocusPart?.(option === null ? null : buttons ? `option-${option}` : "input")
      }
    />
  );
}

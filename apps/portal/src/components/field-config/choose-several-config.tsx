"use client";

import { choiceOptions, type ChoiceOptions } from "../../../embed/src/choices";
import { ChoiceOptionsEditor } from "./choice-options-editor";
import { ConfigComponentProps } from "./types";

export function ChooseSeveralConfig({
  value,
  onChange,
  onFocusPart,
}: ConfigComponentProps<ChoiceOptions | undefined>) {
  return (
    <ChoiceOptionsEditor
      value={choiceOptions(value)}
      onChange={onChange}
      // The preview marks the option being edited.
      onFocusOption={(option) => onFocusPart?.(option === null ? null : `option-${option}`)}
    />
  );
}

import { FieldType } from "@prisma/client";
import { ParagraphConfig } from "./paragraph-config";
import { DropdownConfig } from "./dropdown-config";
import { DateConfig } from "./date-config";
import { PhoneConfig } from "./phone-config";
import { NameConfig } from "./name-config";
import { CheckboxesConfig } from "./checkboxes-config";
import { NumberConfig } from "./number-config";
import { AddressConfig } from "./address-config";
import { ConfigComponentProps } from "./types";

// Variance boundary: each config component has a different generic type,
// but the renderer dispatches dynamically based on field type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConfigComponent = React.ComponentType<ConfigComponentProps<any>>;

const configRegistry: Partial<Record<FieldType, AnyConfigComponent>> = {
  TEXTAREA: ParagraphConfig,
  DROPDOWN: DropdownConfig,
  PHONE: PhoneConfig,
  DATE: DateConfig,
  NAME: NameConfig,
  CHECKBOXES: CheckboxesConfig,
  NUMBER: NumberConfig,
  ADDRESS: AddressConfig,
};

/** Whether a field type has settings of its own, below the common ones. */
export const hasTypeSettings = (type: string) => type in configRegistry;

type FieldConfigRendererProps = {
  type: FieldType;
  value: unknown;
  onChange: (value: unknown) => void;
  onFocusPart?: (part: string | null) => void;
  required?: boolean;
};

export function FieldConfigRenderer({ type, value, onChange, onFocusPart, required }: FieldConfigRendererProps) {
  const Component = configRegistry[type];
  if (!Component) return null;
  return <Component value={value} onChange={onChange} onFocusPart={onFocusPart} required={required} />;
}

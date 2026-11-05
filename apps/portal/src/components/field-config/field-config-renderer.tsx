import { FieldType } from "@prisma/client";
import { ParagraphConfig } from "./paragraph-config";
import { ChooseOneConfig } from "./choose-one-config";
import { DateConfig } from "./date-config";
import { PhoneConfig } from "./phone-config";
import { NameConfig } from "./name-config";
import { ChooseSeveralConfig } from "./choose-several-config";
import { NumberConfig } from "./number-config";
import { AddressConfig } from "./address-config";
import { ConfigComponentProps } from "./types";

// Variance boundary: each config component has a different generic type,
// but the renderer dispatches dynamically based on field type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConfigComponent = React.ComponentType<ConfigComponentProps<any>>;

const configRegistry: Partial<Record<FieldType, AnyConfigComponent>> = {
  TEXTAREA: ParagraphConfig,
  CHOOSE_ONE: ChooseOneConfig,
  PHONE: PhoneConfig,
  DATE: DateConfig,
  NAME: NameConfig,
  CHOOSE_SEVERAL: ChooseSeveralConfig,
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

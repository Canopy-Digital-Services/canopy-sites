import { FieldType } from "@prisma/client";
import { TextConfig, TextareaConfig } from "./text-config";
import { EmailConfig } from "./email-config";
import { DropdownConfig } from "./dropdown-config";
import { PhoneConfig } from "./phone-config";
import { DateConfig } from "./date-config";
import { NameConfig } from "./name-config";
import { CheckboxesConfig } from "./checkboxes-config";
import { NumberConfig } from "./number-config";
import { ConfigComponentProps } from "./types";

// Variance boundary: each config component has a different generic type,
// but the renderer dispatches dynamically based on field type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConfigComponent = React.ComponentType<ConfigComponentProps<any>>;

const configRegistry: Partial<Record<FieldType, AnyConfigComponent>> = {
  TEXT: TextConfig,
  EMAIL: EmailConfig,
  TEXTAREA: TextareaConfig,
  DROPDOWN: DropdownConfig,
  PHONE: PhoneConfig,
  DATE: DateConfig,
  NAME: NameConfig,
  CHECKBOXES: CheckboxesConfig,
  NUMBER: NumberConfig,
};

type FieldConfigRendererProps = {
  type: FieldType;
  value: unknown;
  onChange: (value: unknown) => void;
};

export function FieldConfigRenderer({ type, value, onChange }: FieldConfigRendererProps) {
  const Component = configRegistry[type];
  if (!Component) return null;
  return <Component value={value} onChange={onChange} />;
}

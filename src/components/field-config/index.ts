/**
 * Field configuration component registry
 * Maps FieldType to its corresponding configuration component
 */

import { FieldType } from "@prisma/client";
import { TextConfig, TextareaConfig } from "./text-config";
import { EmailConfig } from "./email-config";
import { SelectConfig } from "./select-config";
import { PhoneConfig } from "./phone-config";
import { DateConfig } from "./date-config";
import { NameConfig } from "./name-config";
import { HiddenConfig } from "./hidden-config";
import { ConfigComponentProps } from "./types";

// Registry type
type ConfigComponent = React.ComponentType<ConfigComponentProps<any>>;

// Map of field types to config components
const configRegistry: Partial<Record<FieldType, ConfigComponent>> = {
  TEXT: TextConfig,
  EMAIL: EmailConfig,
  TEXTAREA: TextareaConfig,
  SELECT: SelectConfig,
  PHONE: PhoneConfig,
  DATE: DateConfig,
  NAME: NameConfig,
  HIDDEN: HiddenConfig,
  // CHECKBOX has no config
};

/**
 * Get the config component for a given field type
 * Returns null if the field type has no configuration options
 */
export function getConfigComponent(
  type: FieldType
): ConfigComponent | null {
  return configRegistry[type] || null;
}

// Re-export types
export type { ConfigComponentProps } from "./types";

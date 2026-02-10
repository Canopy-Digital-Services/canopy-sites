/**
 * Shared types for field configuration components
 */

// Config component props
export type ConfigComponentProps<T = any> = {
  value: T;
  onChange: (value: T) => void;
};

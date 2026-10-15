/**
 * Shared types for field configuration components
 */

// Config component props
export type ConfigComponentProps<T = unknown> = {
  value: T;
  onChange: (value: T) => void;
};

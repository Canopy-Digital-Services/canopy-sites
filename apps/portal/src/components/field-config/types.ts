/**
 * Shared types for field configuration components
 */

// Config component props
export type ConfigComponentProps<T = unknown> = {
  value: T;
  onChange: (value: T) => void;
  /** Narrows the preview's mark to one part of the field while its settings
      have focus (a `data-field-part` in the embed); null for the whole field. */
  onFocusPart?: (part: string | null) => void;
};

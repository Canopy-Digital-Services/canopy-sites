/**
 * Shared types for field configuration components
 */

// Config component props
export type ConfigComponentProps<T = unknown> = {
  value: T;
  onChange: (value: T) => void;
  /** Whether the whole field is required: what a Name or Address requires
      when it has no list of required parts yet. */
  required?: boolean;
  /** Narrows the preview's mark to one part of the field while its settings
      have focus (a `data-field-part` in the embed); null for the whole field. */
  onFocusPart?: (part: string | null) => void;
};

// The editor flow's steps in order, and their titles: each section card's
// title and the flow buttons that lead to it say the same thing.

export const EDITOR_STEPS = ["header", "fields", "settings"] as const;

export type EditorStepName = (typeof EDITOR_STEPS)[number];

export const STEP_TITLES: Record<EditorStepName, string> = {
  header: "Header",
  fields: "Fields",
  settings: "Submission Settings",
};

/**
 * Shared types and utilities for rendering form previews via the embed script.
 */

export type EmbedDefinition = {
  formId: string;
  slug: string;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    placeholder?: string | null;
    helpText?: string | null;
    options?: unknown;
    validation?: unknown;
  }>;
  title?: string;
  description?: string;
  successMessage?: string;
  redirectUrl?: string;
  defaultTheme?: Record<string, unknown>;
};

export type EmbedFormInstance = {
  renderFromDefinition: (definition: EmbedDefinition) => void;
};

/** Shape accepted by formToEmbedDefinition — covers both DB form and FormState. */
export type EmbedFormInput = {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  successMessage: string | null;
  redirectUrl: string | null;
  defaultTheme: unknown;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    order: number;
    placeholder: string | null;
    helpText: string | null;
    options: unknown;
    validation: unknown;
  }>;
};

/**
 * Convert a DB-shaped form or FormState into an EmbedDefinition
 * suitable for renderFromDefinition().
 */
export function formToEmbedDefinition(form: EmbedFormInput): EmbedDefinition {
  return {
    formId: form.id,
    slug: form.slug,
    fields: form.fields
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((f) => ({
        name: f.name,
        type: f.type,
        label: f.label,
        required: f.required,
        placeholder: f.placeholder,
        helpText: f.helpText,
        options: f.options,
        validation: f.validation,
      })),
    title: form.title ?? undefined,
    description: form.description ?? undefined,
    successMessage: form.successMessage ?? undefined,
    redirectUrl: form.redirectUrl ?? undefined,
    defaultTheme: (form.defaultTheme as Record<string, unknown>) ?? undefined,
  };
}

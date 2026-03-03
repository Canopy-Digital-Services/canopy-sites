"use client";

import { useEffect, useRef } from "react";
import { useFormContext, type FormState } from "@/components/forms/form-context";
import { useEmbedScript } from "@/hooks/use-embed-script";
import type { EmbedDefinition } from "@/lib/embed-preview";

function toEmbedDefinition(state: FormState): EmbedDefinition {
  return {
    formId: state.id,
    slug: state.slug,
    fields: state.fields
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
    title: state.title ?? undefined,
    description: state.description ?? undefined,
    successMessage: state.successMessage ?? undefined,
    redirectUrl: state.redirectUrl ?? undefined,
    defaultTheme: (state.defaultTheme as Record<string, unknown>) ?? undefined,
  };
}

export function LivePreviewPanel() {
  const { state } = useFormContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const { formInstanceRef, ready } = useEmbedScript(containerRef);

  // Re-render when state changes (debounced)
  useEffect(() => {
    if (!ready || !formInstanceRef.current) return;

    const definition = toEmbedDefinition(state);
    const timer = setTimeout(() => {
      formInstanceRef.current?.renderFromDefinition(definition);
    }, 150);

    return () => clearTimeout(timer);
  }, [state, ready, formInstanceRef]);

  return (
    <div>
      <p className="text-xs font-heading font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Preview
      </p>
      <div ref={containerRef}>
        {!ready && (
          <div className="text-muted-foreground text-sm p-4">
            Loading preview...
          </div>
        )}
      </div>
    </div>
  );
}

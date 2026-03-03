"use client";

import { useEffect, useRef, useState } from "react";
import { useFormContext, type FormState } from "@/components/forms/form-context";

type EmbedFormInstance = {
  renderFromDefinition: (definition: EmbedDefinition) => void;
};

type EmbedDefinition = {
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
  const formInstanceRef = useRef<EmbedFormInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [embedUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  });

  // Load embed script and create instance
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    type CanopyFormsGlobal = {
      init: () => void;
      CanopyForm: new (container: HTMLElement, options: { formId?: string }) => EmbedFormInstance;
    };

    const getGlobal = () =>
      (window as unknown as { CanopyForms?: CanopyFormsGlobal }).CanopyForms;

    const createInstance = () => {
      const cf = getGlobal();
      if (!cf?.CanopyForm || !containerRef.current) return;
      formInstanceRef.current = new cf.CanopyForm(containerRef.current, {});
      setReady(true);
    };

    // Check if already loaded
    if (getGlobal()?.CanopyForm) {
      createInstance();
      return;
    }

    // Check if script tag exists but not yet loaded
    let script = document.querySelector(
      'script[src*="/embed.js"]'
    ) as HTMLScriptElement | null;

    if (script) {
      if (getGlobal()?.CanopyForm) {
        createInstance();
      } else {
        script.addEventListener("load", () => setTimeout(createInstance, 50));
      }
    } else {
      script = document.createElement("script");
      script.src = `${embedUrl}/embed.js`;
      script.onload = () => setTimeout(createInstance, 50);
      script.onerror = () => {
        console.error("[LivePreviewPanel] Failed to load embed script");
      };
      document.head.appendChild(script);
    }
  }, [embedUrl]);

  // Re-render when state changes (debounced)
  useEffect(() => {
    if (!ready || !formInstanceRef.current) return;

    const definition = toEmbedDefinition(state);
    const timer = setTimeout(() => {
      formInstanceRef.current?.renderFromDefinition(definition);
    }, 150);

    return () => clearTimeout(timer);
  }, [state, ready]);

  return (
    <div>
      <p className="text-xs font-heading font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Preview
      </p>
      <div className="rounded-lg border border-border/40 bg-card shadow-sm p-4">
        <div ref={containerRef}>
          {!ready && (
            <div className="text-muted-foreground text-sm p-4">
              Loading preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

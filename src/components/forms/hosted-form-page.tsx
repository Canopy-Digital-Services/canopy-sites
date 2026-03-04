"use client";

import { useEffect, useRef } from "react";
import { useEmbedScript } from "@/hooks/use-embed-script";
import { formToEmbedDefinition } from "@/lib/embed-preview";
import { cn } from "@/lib/utils";

type HostedFormPageProps = {
  form: {
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
};

export function HostedFormPage({ form }: HostedFormPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { formInstanceRef, ready } = useEmbedScript(containerRef);

  useEffect(() => {
    if (!ready || !formInstanceRef.current) return;
    const definition = formToEmbedDefinition(form);
    formInstanceRef.current.renderFromDefinition(definition);
  }, [ready, formInstanceRef, form]);

  // Extract pageBackground from theme (JSON stored as unknown)
  const themeObj = typeof form.defaultTheme === "object" && form.defaultTheme !== null
    ? (form.defaultTheme as Record<string, unknown>)
    : null;
  const pageBackground = typeof themeObj?.pageBackground === "string" ? themeObj.pageBackground : null;

  return (
    <div
      className={cn("min-h-screen flex flex-col", !pageBackground && "bg-muted/40")}
      style={pageBackground ? { backgroundColor: pageBackground } : undefined}
    >
      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          <div ref={containerRef}>
            {!ready && (
              <div className="text-muted-foreground text-sm p-4 text-center">
                Loading form...
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center">
        <a
          href="https://forms.canopyds.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/forms-logo.svg"
            alt=""
            width={14}
            height={14}
            className="opacity-50"
          />
          Powered by Canopy Forms
        </a>
      </footer>
    </div>
  );
}

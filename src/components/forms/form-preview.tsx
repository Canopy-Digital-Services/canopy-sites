"use client";

import { useEffect, useRef } from "react";
import { useEmbedScript } from "@/hooks/use-embed-script";
import { formToEmbedDefinition } from "@/lib/embed-preview";

type FormPreviewProps = {
  form: Parameters<typeof formToEmbedDefinition>[0];
  mode: "embed" | "page";
};

export function FormPreview({ form, mode }: FormPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { formInstanceRef, ready } = useEmbedScript(containerRef);

  useEffect(() => {
    if (!ready || !formInstanceRef.current) return;

    const definition = formToEmbedDefinition(form);
    formInstanceRef.current.renderFromDefinition(definition);
  }, [ready, formInstanceRef, form]);

  return (
    <div
      className={
        mode === "embed" ? "max-w-lg mx-auto" : "max-w-2xl mx-auto w-full"
      }
    >
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

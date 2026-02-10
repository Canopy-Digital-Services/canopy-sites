"use client";

import { useEffect, useRef, useState } from "react";
import { RightPanel } from "@/components/patterns/right-panel";

declare global {
  interface Window {
    CanopyForms?: {
      init: () => void;
    };
  }
}

type PreviewPanelProps = {
  open: boolean;
  onClose: () => void;
  form: {
    id: string;
  };
};

export function PreviewPanel({ open, onClose, form }: PreviewPanelProps) {
  // Always use the current window origin - initialize correctly on client
  const [embedUrl, setEmbedUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "https://forms.canopyds.com"; // Fallback for SSR
  });
  
  // Ensure we have the correct origin after hydration
  useEffect(() => {
    if (typeof window !== "undefined" && embedUrl !== window.location.origin) {
      setEmbedUrl(window.location.origin);
    }
  }, [embedUrl]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Radix UI Sheet uses a portal that mounts asynchronously
    // Wait for the portal content to be in the DOM before accessing the ref
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) {
        console.error("[PreviewPanel] Container ref not attached");
        return;
      }

      // Clear any previous initialization to allow re-init
      delete container.dataset.canopyInitialized;

    // Function to initialize the form
    const initForm = () => {
      if (window.CanopyForms) {
        window.CanopyForms.init();
      } else {
        console.error("[PreviewPanel] Embed script not loaded");
        if (container) {
          container.innerHTML = '<div class="text-red-500 p-4">Embed script failed to load. Check console for errors.</div>';
        }
      }
    };

    // Check if script already loaded
    if (window.CanopyForms) {
      setTimeout(initForm, 200);
      return;
    }

    // Check if script is already in document
    let script = document.querySelector('script[src*="/embed.js"]') as HTMLScriptElement;
    
    if (script) {
      if (window.CanopyForms) {
        setTimeout(initForm, 200);
      } else {
        script.addEventListener("load", () => setTimeout(initForm, 200));
      }
    } else {
      // Load the script
      script = document.createElement("script");
      script.src = `${embedUrl}/embed.js`;
      script.onload = () => setTimeout(initForm, 200);
      script.onerror = (e) => {
        console.error("[PreviewPanel] Failed to load embed script:", e);
        if (container) {
          container.innerHTML = '<div class="text-red-500 p-4">Failed to load embed script</div>';
        }
      };
      document.head.appendChild(script);
    }
    }, 100);

    return () => clearTimeout(timer);
  }, [open, embedUrl, form.id]);

  return (
    <RightPanel open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title="Preview">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This is how your form will appear when embedded on your website.
        </p>

        {/* Form Preview Container */}
        <div className="border rounded-lg p-6 bg-background">
          <div
            ref={containerRef}
            data-canopy-form={form.id}
            data-base-url={embedUrl}
          >
            <div className="text-gray-500 text-sm p-4">Loading form preview...</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Note: Preview may not reflect all customizations in real-time.
          Use the integrate code on your actual site for full functionality.
        </p>
      </div>
    </RightPanel>
  );
}

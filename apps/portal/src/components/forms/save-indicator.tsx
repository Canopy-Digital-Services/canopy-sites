"use client";

// The editor's autosave status, at the right of a card's header: "Saving..."
// while a save is in flight, "Saved" for two seconds after, nothing between.

import { Check, Save } from "lucide-react";
import type { SaveStatus } from "@/components/forms/form-context";

export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        <Save className="h-4 w-4 animate-pulse" />
        Saving...
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="text-sm text-success-strong flex items-center gap-2">
        <Check className="h-4 w-4" />
        Saved
      </span>
    );
  }
  return null;
}

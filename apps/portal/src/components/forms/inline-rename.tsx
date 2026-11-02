"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// Text with a pencil beside it that turns the text into an input in place, so
// a rename happens where the name is shown. Used for a self-labeled field's
// label in its row header and for a Name's part labels.

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type InlineRenameProps = {
  value: string;
  /** What a blank value shows as, and saves as. */
  placeholder: string;
  onChange: (value: string) => void;
  /** What the pencil's tooltip and the input are named for. */
  name: string;
  /** Shown while not editing; the value or placeholder when omitted. */
  children?: React.ReactNode;
  className?: string;
  /** While editing, for the preview to mark what is being renamed. */
  onEditingChange?: (editing: boolean) => void;
};

export function InlineRename({
  value,
  placeholder,
  onChange,
  name,
  children,
  className,
  onEditingChange,
}: InlineRenameProps) {
  const [editing, setEditing] = useState(false);
  const setEditingTo = (next: boolean) => {
    setEditing(next);
    onEditingChange?.(next);
  };

  // Inside a row that toggles on click, nothing here may toggle it.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  if (editing) {
    return (
      <Input
        autoFocus
        aria-label={name}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        // The pencil opens the input focused; text still the default is a
        // stand-in, selected so typing replaces it.
        onFocus={(e) => value === placeholder && e.currentTarget.select()}
        onBlur={() => setEditingTo(false)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
        }}
        onClick={stop}
        onPointerDown={stop}
        className={cn("h-7 min-w-0 px-2 text-sm", className)}
      />
    );
  }

  return (
    <>
      {children ?? (value.trim() || placeholder)}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={name}
            className="self-center"
            onClick={(e) => {
              e.stopPropagation();
              setEditingTo(true);
            }}
            onPointerDown={stop}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    </>
  );
}

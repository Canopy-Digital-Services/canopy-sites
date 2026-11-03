"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// Text with a pencil beside it that turns the text into a box in place, so a
// rename happens where the name is shown. Used for a field's label in its row
// header and for a Name's or Address's part labels.

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  /** Opens with the box already showing, as a just-added field's label does. */
  defaultEditing?: boolean;
};

/** Fits the box's height to its text, so a long name wraps in sight rather
    than scrolling out of it. */
const fit = (box: HTMLTextAreaElement | null) => {
  if (!box) return;
  box.style.height = "auto";
  box.style.height = `${box.scrollHeight + box.offsetHeight - box.clientHeight}px`;
};

export function InlineRename({
  value,
  placeholder,
  onChange,
  name,
  children,
  className,
  onEditingChange,
  defaultEditing = false,
}: InlineRenameProps) {
  const [editing, setEditing] = useState(defaultEditing);
  // Enter or Escape hands focus back to the pencil; a click elsewhere keeps
  // it where it went.
  const [fromKeys, setFromKeys] = useState(false);

  // Inside a row that toggles on click, nothing here may toggle it.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  if (editing) {
    return (
      <Textarea
        ref={fit}
        autoFocus
        rows={1}
        aria-label={name}
        value={value}
        placeholder={placeholder}
        // A name is one line, however it wraps: a pasted line break is a space.
        onChange={(e) => {
          onChange(e.target.value.replace(/\s*\n\s*/g, " "));
          fit(e.currentTarget);
        }}
        // The box opens focused with the name selected, so typing replaces it.
        onFocus={(e) => {
          onEditingChange?.(true);
          e.currentTarget.select();
        }}
        onBlur={() => {
          setEditing(false);
          onEditingChange?.(false);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Enter" || e.key === "Escape") {
            e.preventDefault();
            setFromKeys(true);
            e.currentTarget.blur();
          }
        }}
        onClick={stop}
        onPointerDown={stop}
        className={cn("min-h-0 min-w-0 px-2 py-[3px] text-sm md:text-sm", className)}
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
            autoFocus={fromKeys}
            onClick={(e) => {
              e.stopPropagation();
              setFromKeys(false);
              setEditing(true);
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

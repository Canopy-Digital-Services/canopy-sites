"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// One part of a field in its settings (Name's, Address's, Phone's extension):
// a checkbox to collect it and, while collected, its label on the form with a
// pencil to rename it, and a checkbox in the Required column
// (PartsRequiredHeading) when the part can be required.

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InlineRename } from "@/components/forms/inline-rename";
import { cn } from "@/lib/utils";

type PartRowProps = {
  id: string;
  /** The part's name while not collected. */
  name: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** The user's label for the part; blank for its default. */
  label: string;
  /** What the form calls the part until the user renames it. */
  defaultLabel: string;
  onRename: (label: string) => void;
  /** While renaming, for the preview to mark the part's label. */
  onRenaming?: (renaming: boolean) => void;
  /** The Required column, left out for a part that is never required. */
  required?: boolean;
  onRequiredChange?: (required: boolean) => void;
  /** A control for the part itself, before the Required column. */
  children?: React.ReactNode;
  className?: string;
};

/** The Required column's heading, over a list of PartRows. */
export function PartsRequiredHeading() {
  return (
    <div className="flex justify-end">
      <span className="w-16 text-center text-sm text-muted-foreground">Required</span>
    </div>
  );
}

export function PartRow({
  id,
  name,
  checked,
  onCheckedChange,
  label,
  defaultLabel,
  onRename,
  onRenaming,
  required,
  onRequiredChange,
  children,
  className,
}: PartRowProps) {
  return (
    <div className={cn("flex h-8 items-center gap-2", className)}>
      <Checkbox id={id} checked={checked} onCheckedChange={(c) => onCheckedChange(c === true)} />
      {checked ? (
        <InlineRename
          value={label}
          placeholder={defaultLabel}
          onChange={onRename}
          name={`Rename ${label || defaultLabel}`}
          className="max-w-40"
          onEditingChange={onRenaming}
        >
          <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
            {label || defaultLabel}
          </Label>
        </InlineRename>
      ) : (
        <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
          {name}
        </Label>
      )}
      <span className="flex-1" />
      {checked && children}
      {/* Only a collected part can be required. */}
      {onRequiredChange && (
        <span className="flex w-16 shrink-0 justify-center">
          {checked && (
            <Checkbox
              checked={required}
              onCheckedChange={(c) => onRequiredChange(c === true)}
              aria-label={`${label || defaultLabel} is required`}
            />
          )}
        </span>
      )}
    </div>
  );
}

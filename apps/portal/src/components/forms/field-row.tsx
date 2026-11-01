"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// One field in the Fields list. Collapsed it is a summary row; expanded it
// carries the field's settings in place, where the add/edit modal used to.
// The list keeps one row open at a time and autosaves (form-fields-manager).

import { useRef, useState } from "react";
import type { FieldType } from "@prisma/client";
import { ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SortableItemRenderProps } from "@/components/ui/sortable-list";
import { InlineRename } from "@/components/forms/inline-rename";
import { DEFAULT_NAME_PARTS } from "../../../embed/src/name";
import { ADDRESS_PARTS } from "../../../embed/src/address";
import { ROW_TITLE, useMarkerUnderline } from "@/components/forms/row-title";
import { FieldConfigRenderer } from "@/components/field-config";
import type { FieldState } from "@/components/forms/form-context";
import { cn } from "@/lib/utils";
import { FIELD_TYPE_OPTIONS, getFieldTypeLabel } from "@/lib/field-types";

// ─── Field rules ────────────────────────────────────────────────────────────

/** Types whose config lives in `options`; every other type keeps it in `validation`. */
export const isOptionsType = (type: string) =>
  type === "DROPDOWN" || type === "NAME" || type === "CHECKBOXES" || type === "ADDRESS";

const isChoiceType = (type: string) => type === "DROPDOWN" || type === "CHECKBOXES";

/** Types made of parts, each collected and required on its own. */
const isComposite = (type: string) => type === "NAME" || type === "ADDRESS";

/** A field's label when the user hasn't given one: its type's name. */
export const defaultLabel = (type: string) => getFieldTypeLabel(type);

/** Types whose name already says what they ask for. They have no Label box:
    the label stays the default unless renamed with the pencil beside it in
    the row header, where the user can see what they are renaming. */
const SELF_LABELED = new Set(["NAME", "EMAIL", "PHONE", "ADDRESS"]);

/** Whether the user has given the field a label of their own. */
const hasCustomLabel = (field: FieldState) =>
  field.label.trim() !== "" && field.label !== defaultLabel(field.type);

type ChoiceOption = { value: string; label: string };

/** What a new field of `type` starts with, so it is complete (and saved) the
    moment it is created and the user only overrides what they need. */
export function newFieldDefaults(type: string) {
  return {
    type,
    label: defaultLabel(type),
    // A form's names and addresses are nearly always required, all but
    // the middle name and the apartment.
    required: isComposite(type),
    options: isChoiceType(type)
      ? { options: [1, 2].map((n) => ({ value: `Option ${n}`, label: `Option ${n}` })) }
      : type === "NAME"
        ? { parts: DEFAULT_NAME_PARTS, requiredParts: DEFAULT_NAME_PARTS }
        : type === "ADDRESS"
          ? { parts: ADDRESS_PARTS, requiredParts: ADDRESS_PARTS.filter((p) => p !== "line2") }
          : undefined,
  };
}

/** Why the field as edited can't be saved yet, or null if it can. */
export function fieldProblem(field: FieldState): string | null {
  if (isChoiceType(field.type)) {
    const options = (field.options as { options?: ChoiceOption[] } | null)?.options ?? [];
    if (options.length === 0) return "Add at least one option to save.";
    if (!options.every((o) => o.value.trim() && o.label.trim())) return "Fill in every option to save.";
    const values = options.map((o) => o.value.trim());
    if (new Set(values).size !== values.length) return "Options must be different to save.";
  }
  if (field.type === "NAME") {
    const parts = (field.options as { parts?: string[] } | null)?.parts;
    if (parts && parts.length === 0) return "Choose at least one name part to save.";
  }
  if (field.type === "ADDRESS") {
    const parts = (field.options as { parts?: string[] } | null)?.parts;
    if (parts && parts.length === 0) return "Choose at least one address part to save.";
  }
  return null;
}

// Fields whose placeholder input doesn't apply.
const NO_PLACEHOLDER = new Set(["CHECKBOX", "CHECKBOXES", "NAME", "DATE", "ADDRESS"]);

/** The field's Input Rules: `options` or `validation`, by type. */
const configOf = (field: FieldState) => (isOptionsType(field.type) ? field.options : field.validation);

// ─── Type list ──────────────────────────────────────────────────────────────

/** The field types as a dropdown list, under whatever `trigger` is. */
function TypeMenu({
  trigger,
  disabled,
  onOpenChange,
  onPick,
}: {
  trigger: React.ReactNode;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  onPick: (type: FieldType) => void;
}) {
  return (
    <DropdownMenu modal={false} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48" onClick={(e) => e.stopPropagation()}>
        {FIELD_TYPE_OPTIONS.map((option) => (
          <DropdownMenuItem key={option.value} onSelect={() => onPick(option.value)}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Rows ───────────────────────────────────────────────────────────────────

type FieldRowProps = {
  field: FieldState;
  open: boolean;
  /** Why the field can't save yet, shown under its settings. */
  problem: string | null;
  dragHandleProps: SortableItemRenderProps["dragHandleProps"];
  onToggle: () => void;
  onChange: (patch: Partial<FieldState>) => void;
  onDelete: () => void;
  /** The part of the field whose settings have focus (a `data-field-part` in
      the embed), for the preview to mark alone; null for the whole field. */
  onFocusPart: (part: string | null) => void;
};

export function FieldRow({
  field,
  open,
  problem,
  dragHandleProps,
  onToggle,
  onChange,
  onDelete,
  onFocusPart,
}: FieldRowProps) {
  const label = field.label.trim() || defaultLabel(field.type);
  const typeName = getFieldTypeLabel(field.type);

  // The open row's title is underlined in coral, as a styling row's is; not
  // while it is being renamed, since the input replaces it.
  const titleRef = useRef<HTMLButtonElement>(null);
  const [renaming, setRenaming] = useState(false);
  useMarkerUnderline(titleRef, open && !renaming);

  const title = (
    <button
      ref={titleRef}
      type="button"
      // Clipped across only: a long label ends in an ellipsis, and the
      // underline below the text still shows.
      className={cn(ROW_TITLE, "min-w-0 whitespace-nowrap text-ellipsis overflow-x-clip")}
      aria-expanded={open}
      aria-label={open ? `Collapse ${label}` : `Edit ${label}`}
    >
      {label}
      {field.required && (
        <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
      )}
    </button>
  );

  return (
    <Collapsible
      open={open}
      className={cn(
        "border-b border-border/50 last:border-b-0 transition-colors",
        open && "bg-muted/30"
      )}
    >
      {/* Summary: the whole row toggles it; the grip alone drags. */}
      <div
        className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        {open ? (
          <span className="w-4 shrink-0" aria-hidden />
        ) : (
          <span
            {...dragHandleProps}
            className="shrink-0 cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/40" />
          </span>
        )}
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          {open && SELF_LABELED.has(field.type) ? (
            <InlineRename
              value={field.label}
              placeholder={defaultLabel(field.type)}
              onChange={(text) => onChange({ label: text })}
              name="Rename field"
              className="h-8 max-w-64 font-heading text-base font-semibold"
              onEditingChange={(editing) => {
                setRenaming(editing);
                onFocusPart(editing ? "label" : null);
              }}
            >
              {title}
            </InlineRename>
          ) : (
            title
          )}
          {/* The type, unless the label already says it. A field doesn't
              change type: one of another type is a new field. */}
          {hasCustomLabel(field) && (
            <span className="text-xs text-muted-foreground/60 shrink-0">{typeName}</span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {open && <ChevronUp className="h-4 w-4 text-muted-foreground mr-1.5" aria-hidden />}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete field</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <CollapsibleContent className="field-row-body">
        {/* -mx-1/px-1 keeps focus rings clear of the animation's clip. White
            controls stand off the open row's tint. */}
        <div className="-mx-1 px-1 [&_input]:bg-card [&_textarea]:bg-card [&_[role=combobox]:not(:hover)]:bg-card">
          <FieldSettings field={field} problem={problem} onChange={onChange} onFocusPart={onFocusPart} />
        </div>
      </CollapsibleContent>

    </Collapsible>
  );
}

function FieldSettings({
  field,
  problem,
  onChange,
  onFocusPart,
}: {
  field: FieldState;
  problem: string | null;
  onChange: (patch: Partial<FieldState>) => void;
  onFocusPart: (part: string | null) => void;
}) {
  const id = (part: string) => `field-${field.id}-${part}`;
  const optionsType = isOptionsType(field.type);
  // A self-labeled field is renamed from its row header instead.
  const selfLabeled = SELF_LABELED.has(field.type);

  return (
    <div className="space-y-4 px-3 pb-4 pt-2">
      {!selfLabeled && (
        <div className="space-y-2">
          <Label htmlFor={id("label")}>Label</Label>
          <Input
            id={id("label")}
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={defaultLabel(field.type)}
            // While the box has focus, the preview marks the label alone.
            onFocus={() => onFocusPart("label")}
            onBlur={() => onFocusPart(null)}
          />
        </div>
      )}

      {!NO_PLACEHOLDER.has(field.type) && (
        <div className="space-y-2">
          <Label htmlFor={id("placeholder")}>Placeholder</Label>
          <Input
            id={id("placeholder")}
            value={field.placeholder ?? ""}
            onChange={(e) => onChange({ placeholder: e.target.value })}
          />
        </div>
      )}

      {/* A Name or Address is required part by part, in its own settings. */}
      {!isComposite(field.type) && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ required: e.target.checked })}
          />
          Required field
        </label>
      )}

      {field.type !== "CHECKBOX" && (
        // The type's own settings, set off from the common ones above them;
        // a Name or Address has none above.
        <div className={isComposite(field.type) ? undefined : "border-t pt-4"}>
          <FieldConfigRenderer
            type={field.type as FieldType}
            value={configOf(field) ?? undefined}
            required={field.required}
            onFocusPart={onFocusPart}
            onChange={(next) => {
              if (!optionsType) return onChange({ validation: next ?? null });
              const patch: Partial<FieldState> = { options: next ?? null };
              // The field is required while any part is, for the list's asterisk.
              if (isComposite(field.type)) {
                patch.required = ((next as { requiredParts?: string[] } | null)?.requiredParts?.length ?? 0) > 0;
              }
              onChange(patch);
            }}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={id("help")}>Help text (optional)</Label>
        <Textarea
          id={id("help")}
          value={field.helpText ?? ""}
          onChange={(e) => onChange({ helpText: e.target.value })}
          rows={2}
        />
      </div>

      {problem && <p className="text-sm text-destructive">{problem}</p>}
    </div>
  );
}

/**
 * The list's last row: "Add field", which drops down the field types.
 * Picking one creates the field.
 */
export function AddFieldRow({
  busy,
  onOpen,
  onPick,
}: {
  busy: boolean;
  /** The list closes its open row when the type list opens. */
  onOpen: () => void;
  onPick: (type: FieldType) => void;
}) {
  return (
    <TypeMenu
      disabled={busy}
      onOpenChange={(open) => open && onOpen()}
      onPick={onPick}
      trigger={
        <button
          type="button"
          className="flex w-full items-center gap-2 py-2 px-3 text-sm font-medium text-primary hover:bg-muted/50 data-[state=open]:bg-muted/50 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add field
        </button>
      }
    />
  );
}

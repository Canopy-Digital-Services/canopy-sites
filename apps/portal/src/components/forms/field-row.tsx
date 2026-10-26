"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// One field in the Fields list. Collapsed it is a summary row; expanded it
// carries the field's settings in place, where the add/edit modal used to.
// The list keeps one row open at a time and autosaves (form-fields-manager).

import { useState } from "react";
import type { FieldType } from "@prisma/client";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SortableItemRenderProps } from "@/components/ui/sortable-list";
import { FieldConfigRenderer } from "@/components/field-config";
import type { FieldState } from "@/components/forms/form-context";
import { cn } from "@/lib/utils";
import { FIELD_TYPE_OPTIONS, getFieldTypeLabel } from "@/lib/field-types";

// ─── Field rules ────────────────────────────────────────────────────────────

/** Types whose config lives in `options`; every other type keeps it in `validation`. */
export const isOptionsType = (type: string) =>
  type === "DROPDOWN" || type === "NAME" || type === "CHECKBOXES" || type === "ADDRESS";

const isChoiceType = (type: string) => type === "DROPDOWN" || type === "CHECKBOXES";

/** A field's label when the user hasn't given one: its type's name. */
export const defaultLabel = (type: string) => getFieldTypeLabel(type);

type ChoiceOption = { value: string; label: string };

/** What a new field of `type` starts with, so it is complete (and saved) the
    moment it is created and the user only overrides what they need. */
export function newFieldDefaults(type: string) {
  return {
    type,
    label: defaultLabel(type),
    required: false,
    options: isChoiceType(type)
      ? { options: [1, 2].map((n) => ({ value: `Option ${n}`, label: `Option ${n}` })) }
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
  return null;
}

// Fields whose placeholder input doesn't apply.
const NO_PLACEHOLDER = new Set(["CHECKBOX", "CHECKBOXES", "NAME", "DATE", "ADDRESS"]);

/** The field's Input Rules: `options` or `validation`, by type. */
const configOf = (field: FieldState) => (isOptionsType(field.type) ? field.options : field.validation);

/** Whether switching `field` to `type` carries its Input Rules over. Plain
    types share validation (Text to Email keeps its lengths), and Dropdown and
    Checkboxes share options; anything else starts from the new type's defaults. */
const keepsConfig = (field: FieldState, type: string) =>
  (isChoiceType(type) && isChoiceType(field.type)) ||
  (!isOptionsType(type) && !isOptionsType(field.type));

/** Whether the user has set Input Rules beyond what the type starts with. */
function hasCustomConfig(field: FieldState) {
  const config = configOf(field);
  if (config == null) return false;
  if (typeof config === "object" && Object.keys(config).length === 0) return false;
  return JSON.stringify(config) !== JSON.stringify(newFieldDefaults(field.type).options);
}

/** The changes that switch `field` to `type`. */
function typeChange(field: FieldState, type: string): Partial<FieldState> {
  const patch: Partial<FieldState> = { type };
  // A label still at its default follows the type.
  if (!field.label.trim() || field.label === defaultLabel(field.type)) patch.label = defaultLabel(type);
  if (!keepsConfig(field, type)) {
    patch.options = newFieldDefaults(type).options ?? null;
    patch.validation = null;
  }
  if (NO_PLACEHOLDER.has(type)) patch.placeholder = null;
  return patch;
}

// ─── Type list ──────────────────────────────────────────────────────────────

/** The field types as a dropdown list, under whatever `trigger` is. */
function TypeMenu({
  trigger,
  value,
  disabled,
  onOpenChange,
  onPick,
}: {
  trigger: React.ReactNode;
  value?: string;
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
        {value ? (
          <DropdownMenuRadioGroup value={value} onValueChange={(v) => onPick(v as FieldType)}>
            {FIELD_TYPE_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        ) : (
          FIELD_TYPE_OPTIONS.map((option) => (
            <DropdownMenuItem key={option.value} onSelect={() => onPick(option.value)}>
              {option.label}
            </DropdownMenuItem>
          ))
        )}
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
};

export function FieldRow({ field, open, problem, dragHandleProps, onToggle, onChange, onDelete }: FieldRowProps) {
  const label = field.label.trim() || defaultLabel(field.type);
  // A type change that would throw away rules the user set waits on a confirm.
  const [pendingType, setPendingType] = useState<FieldType | null>(null);

  const pickType = (type: FieldType) => {
    if (type === field.type) return;
    if (!keepsConfig(field, type) && hasCustomConfig(field)) setPendingType(type);
    else onChange(typeChange(field, type));
  };

  const typeName = getFieldTypeLabel(field.type);

  return (
    <Collapsible
      open={open}
      className={cn(
        "border-b border-border/50 last:border-b-0 transition-colors",
        open && "bg-muted/30"
      )}
    >
      {/* Summary: the whole row toggles it; the grip alone drags, and the
          open row's type opens the type list. */}
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
          <button
            type="button"
            className="min-w-0 text-left font-medium text-sm truncate"
            aria-expanded={open}
            aria-label={open ? `Collapse ${label}` : `Edit ${label}`}
          >
            {label}
            {field.required && (
              <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
            )}
          </button>
          {open ? (
            <TypeMenu
              value={field.type}
              onPick={pickType}
              trigger={
                <button
                  type="button"
                  aria-label={`Field type: ${typeName}. Change type`}
                  className="shrink-0 inline-flex items-center gap-0.5 rounded-md px-1 -mx-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  {typeName}
                  <ChevronDown className="h-3 w-3" aria-hidden />
                </button>
              }
            />
          ) : (
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
          <FieldSettings field={field} problem={problem} onChange={onChange} />
        </div>
      </CollapsibleContent>

      <Dialog open={pendingType !== null} onOpenChange={(o) => !o && setPendingType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change field type</DialogTitle>
            <DialogDescription>
              If you change the field type, the current configuration will be lost. Proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingType(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingType) onChange(typeChange(field, pendingType));
                setPendingType(null);
              }}
            >
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
}

function FieldSettings({
  field,
  problem,
  onChange,
}: {
  field: FieldState;
  problem: string | null;
  onChange: (patch: Partial<FieldState>) => void;
}) {
  const id = (part: string) => `field-${field.id}-${part}`;
  const optionsType = isOptionsType(field.type);

  return (
    <div className="space-y-4 px-3 pb-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor={id("label")}>Label</Label>
        <Input
          id={id("label")}
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder={defaultLabel(field.type)}
        />
      </div>

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

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onChange({ required: e.target.checked })}
        />
        Required field
      </label>

      {field.type !== "CHECKBOX" && (
        <div className="border-t pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Input Rules
          </h3>
          <FieldConfigRenderer
            type={field.type as FieldType}
            value={configOf(field) ?? undefined}
            onChange={(next) =>
              onChange(optionsType ? { options: next ?? null } : { validation: next ?? null })
            }
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={id("help")}>Help text (optional)</Label>
        <Textarea
          id={id("help")}
          value={field.helpText ?? ""}
          onChange={(e) => onChange({ helpText: e.target.value })}
          placeholder="Brief guidance for filling out this field"
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

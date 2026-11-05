"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").
//
// One field in the Fields list. Collapsed it is a summary row; expanded it
// carries the field's settings in place, where the add/edit modal used to.
// The list keeps one row open at a time and autosaves (form-fields-manager).

import { useContext, useEffect, useRef, useState } from "react";
import type { FieldType } from "@prisma/client";
import { ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SortableItemRenderProps } from "@/components/ui/sortable-list";
import { InlineRename } from "@/components/forms/inline-rename";
import { anyPartRequired, defaultLabel, isComposite, isOptionsType } from "@/lib/field-rules";
import { ROW_TITLE, useMarkerUnderline } from "@/components/forms/row-title";
import { RowBody } from "@/components/forms/row-body";
import { ScrollHoldContext } from "@/hooks/use-scroll-hold";
import { FieldConfigRenderer, hasTypeSettings } from "@/components/field-config";
import type { FieldState } from "@/components/forms/form-context";
import { cn } from "@/lib/utils";
import { FIELD_TYPE_OPTIONS, getFieldTypeLabel } from "@/lib/field-types";

// ─── Field rules ────────────────────────────────────────────────────────────
// What a field saves and when it can't is in lib/field-rules; these are the
// row's own.

/** Whether the user has given the field a label of their own. */
const hasCustomLabel = (field: FieldState) =>
  field.label.trim() !== "" && field.label !== defaultLabel(field.type);


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
  /** Why the field can't save yet, shown under its type's settings. */
  problem: string | null;
  /** Just added: it opens with its rename box ready, so typing names it. */
  naming: boolean;
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
  naming,
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

  // The chevron at the foot, or Escape, closes the row and hands focus to its
  // title, since what had it is folding away. A row closed from its foot
  // hands the editor's scroll to its fold, which brings the summary into view
  // in one motion; one closed from its summary keeps that under the pointer.
  const scrollHold = useContext(ScrollHoldContext);
  const summaryRef = useRef<HTMLDivElement>(null);
  const refocus = useRef(false);
  const fromFoot = useRef(false);
  const close = () => {
    refocus.current = true;
    fromFoot.current = true;
    onToggle();
  };

  useEffect(() => {
    if (open || !refocus.current) return;
    refocus.current = false;
    titleRef.current?.focus({ preventScroll: true });
  }, [open]);

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
    <div
      className={cn(
        "border-b border-border/50 last:border-b-0 transition-colors",
        open && "bg-muted/30"
      )}
      onKeyDown={(e) => {
        // A menu or popover inside takes its own Escape (and prevents it).
        if (!open || e.key !== "Escape" || e.defaultPrevented || e.nativeEvent.isComposing) return;
        e.preventDefault();
        close();
      }}
    >
      {/* Summary: the whole row toggles it; the grip alone drags. Closing
          from the foot brings it back into view with room above it for the
          rows before it. */}
      <div
        ref={summaryRef}
        className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-muted/50 scroll-mt-24"
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
          {/* The label is renamed where it's shown, here in the header. */}
          {open ? (
            <InlineRename
              // A label still its type's name shows greyed in an empty box,
              // as a part's default does: what it saves as if left alone.
              value={field.label === defaultLabel(field.type) ? "" : field.label}
              placeholder={defaultLabel(field.type)}
              onChange={(text) => onChange({ label: text })}
              name="Rename field"
              defaultEditing={naming}
              className="font-heading text-base md:text-base font-semibold"
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

      <RowBody
        open={open}
        onFold={(fold, body) => {
          if (fromFoot.current && summaryRef.current) scrollHold?.fold(fold, body, summaryRef.current);
          fromFoot.current = false;
        }}
      >
        <FieldSettings
          field={field}
          problem={problem}
          onChange={onChange}
          onFocusPart={onFocusPart}
          onClose={close}
        />
      </RowBody>
    </div>
  );
}

function FieldSettings({
  field,
  problem,
  onChange,
  onFocusPart,
  onClose,
}: {
  field: FieldState;
  problem: string | null;
  onChange: (patch: Partial<FieldState>) => void;
  onFocusPart: (part: string | null) => void;
  /** Closes the row from its foot; the field saves as it goes. */
  onClose: () => void;
}) {
  const id = (part: string) => `field-${field.id}-${part}`;
  const optionsType = isOptionsType(field.type);

  return (
    <div className="space-y-4 px-3 pb-4 pt-2">
      {/* A Name or Address is required part by part, in its own settings. */}
      {!isComposite(field.type) && (
        <div className="flex items-center gap-2">
          <Checkbox
            id={id("required")}
            checked={field.required}
            onCheckedChange={(checked) => onChange({ required: checked === true })}
          />
          <Label htmlFor={id("required")} className="cursor-pointer font-normal">
            Required field
          </Label>
        </div>
      )}

      {hasTypeSettings(field.type) && (
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
              if (isComposite(field.type)) patch.required = anyPartRequired(next);
              onChange(patch);
            }}
          />
          {/* What keeps a field from saving is always in its type's settings,
              so it's said right under them. */}
          {problem && <p className="mt-2 text-sm text-destructive">{problem}</p>}
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

      {/* An open row's chevron is down here, where the user is when they
          finish, rather than in its header, which a long panel scrolls away.
          It lines up with the trash buttons above it. */}
      <div className="flex justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close field settings"
              className="text-muted-foreground"
              onClick={onClose}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Close</TooltipContent>
        </Tooltip>
      </div>
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

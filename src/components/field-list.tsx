"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SortableList } from "@/components/ui/sortable-list";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { getFieldTypeLabel } from "@/lib/field-types";

export type FieldSummary = {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  placeholder?: string | null;
  helpText?: string | null;
  options?: unknown;
  validation?: unknown;
};

type FieldListProps = {
  fields: FieldSummary[];
  onAddField: () => void;
  onEditField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onReorder: (fieldIds: string[]) => void;
};

export function FieldList({
  fields,
  onAddField,
  onEditField,
  onDeleteField,
  onReorder,
}: FieldListProps) {
  return (
    <div className="space-y-4">
      {/* No empty-state copy: the labeled "Add Field" button below is the whole
          message. See the empty-state anti-pattern in docs/UX_PATTERNS.md. */}
      {fields.length === 0 ? null : (
        <SortableList
          items={fields}
          onReorder={onReorder}
          className="border rounded-md space-y-0"
          renderItem={({ item: field, dragHandleProps }) => (
            <div
              {...dragHandleProps}
              className="flex items-center gap-2 py-2 px-3 border-b border-border/50 last:border-b-0 hover:bg-muted/50 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm">
                    {field.label}
                    {field.required && (
                      <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    {getFieldTypeLabel(field.type)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${field.label}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditField(field.id);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit field</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${field.label}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteField(field.id);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete field</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        />
      )}
      <Button type="button" onClick={onAddField}>
        <Plus className="h-4 w-4" />
        Add Field
      </Button>
    </div>
  );
}

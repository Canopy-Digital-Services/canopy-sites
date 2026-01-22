"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type FieldSummary = {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  placeholder?: string | null;
  options?: unknown;
  validation?: unknown;
};

type FieldListProps = {
  fields: FieldSummary[];
  onAddField: () => void;
  onEditField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onMoveField: (fieldId: string, direction: "up" | "down") => void;
};

export function FieldList({
  fields,
  onAddField,
  onEditField,
  onDeleteField,
  onMoveField,
}: FieldListProps) {
  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No fields yet. Add your first field to start rendering the embed.
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{field.label}</span>
                  {field.required ? <Badge>Required</Badge> : null}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="uppercase">{field.type}</span>
                  <span className="px-2">•</span>
                  <span>{field.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => onMoveField(field.id, "up")}
                >
                  Up
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={index === fields.length - 1}
                  onClick={() => onMoveField(field.id, "down")}
                >
                  Down
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditField(field.id)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteField(field.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Button type="button" onClick={onAddField}>
        Add Field
      </Button>
    </div>
  );
}

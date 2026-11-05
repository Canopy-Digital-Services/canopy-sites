"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type Row = { id: string; value: string };

type ListInputProps = {
  label: string;
  required?: boolean;
  hint: string;
  placeholder: string;
  addLabel: string;
  removeLabel: string;
  rows: Row[];
  error?: string | false;
  mono?: boolean;
  maxLength?: number;
  onChange: (rows: Row[]) => void;
  onBlur: () => void;
  newRow: () => Row;
};

/** One input per value, a remove button per row, and the Add button below the list. */
export function ListInput({
  label,
  required,
  hint,
  placeholder,
  addLabel,
  removeLabel,
  rows,
  error,
  mono,
  maxLength,
  onChange,
  onBlur,
  newRow,
}: ListInputProps) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      {rows.map((row, index) => (
        <div key={row.id} className="flex items-center gap-2">
          <Input
            value={row.value}
            placeholder={placeholder}
            maxLength={maxLength}
            aria-label={`${label} ${index + 1}`}
            aria-invalid={!!error}
            className={mono ? "font-mono" : undefined}
            onChange={(e) => onChange(rows.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)))}
            onBlur={onBlur}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={removeLabel}
                onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{removeLabel}</TooltipContent>
          </Tooltip>
        </div>
      ))}
      {error ? <p className="text-sm text-destructive">{error}</p> : <p className="text-xs text-muted-foreground">{hint}</p>}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-3 text-primary hover:text-primary hover:bg-primary/10"
        onClick={() => onChange([...rows, newRow()])}
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { FieldType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FieldOption = {
  value: string;
  label: string;
};

export type FieldValidation = {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
};

export type FieldDraft = {
  name: string;
  type: string;
  label: string;
  placeholder?: string | null;
  required?: boolean;
  options?: FieldOption[];
  validation?: FieldValidation;
};

type FieldEditorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: FieldDraft) => void;
  field?: FieldDraft | null;
};

const FIELD_TYPES = [
  { value: "TEXT", label: "Text" },
  { value: "EMAIL", label: "Email" },
  { value: "TEXTAREA", label: "Textarea" },
  { value: "SELECT", label: "Select" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "HIDDEN", label: "Hidden" },
];

export function FieldEditorModal({
  open,
  onOpenChange,
  onSave,
  field,
}: FieldEditorModalProps) {
  const [type, setType] = useState(field?.type ?? "TEXT");
  const [name, setName] = useState(field?.name ?? "");
  const [label, setLabel] = useState(field?.label ?? "");
  const [placeholder, setPlaceholder] = useState(field?.placeholder ?? "");
  const [required, setRequired] = useState(Boolean(field?.required));
  const [options, setOptions] = useState<FieldOption[]>(
    field?.options ?? []
  );
  const [minLength, setMinLength] = useState(
    field?.validation?.minLength?.toString() ?? ""
  );
  const [maxLength, setMaxLength] = useState(
    field?.validation?.maxLength?.toString() ?? ""
  );
  const [pattern, setPattern] = useState(field?.validation?.pattern ?? "");
  const [message, setMessage] = useState(field?.validation?.message ?? "");

  useEffect(() => {
    if (!open) {
      return;
    }

    setType(field?.type ?? "TEXT");
    setName(field?.name ?? "");
    setLabel(field?.label ?? "");
    setPlaceholder(field?.placeholder ?? "");
    setRequired(Boolean(field?.required));
    setOptions(field?.options ?? []);
    setMinLength(field?.validation?.minLength?.toString() ?? "");
    setMaxLength(field?.validation?.maxLength?.toString() ?? "");
    setPattern(field?.validation?.pattern ?? "");
    setMessage(field?.validation?.message ?? "");
  }, [open, field]);

  const showOptions = type === "SELECT";
  const showValidation = type === "TEXT" || type === "EMAIL" || type === "TEXTAREA";

  const title = field ? "Edit Field" : "Add Field";

  const canSave = useMemo(() => {
    if (!name.trim() || !label.trim()) {
      return false;
    }

    if (showOptions) {
      return options.every((option) => option.value.trim() && option.label.trim());
    }

    return true;
  }, [name, label, options, showOptions]);

  const handleOptionChange = (
    index: number,
    key: keyof FieldOption,
    value: string
  ) => {
    setOptions((prev) =>
      prev.map((option, current) =>
        current === index ? { ...option, [key]: value } : option
      )
    );
  };

  const handleOptionMove = (index: number, direction: "up" | "down") => {
    setOptions((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) {
        return prev;
      }
      const [removed] = next.splice(index, 1);
      next.splice(target, 0, removed);
      return next;
    });
  };

  const handleSave = () => {
    const validation: FieldValidation = {};
    if (minLength.trim()) {
      validation.minLength = Number(minLength);
    }
    if (maxLength.trim()) {
      validation.maxLength = Number(maxLength);
    }
    if (pattern.trim()) {
      validation.pattern = pattern.trim();
    }
    if (message.trim()) {
      validation.message = message.trim();
    }

    onSave({
      name: name.trim(),
      type,
      label: label.trim(),
      placeholder: placeholder.trim() || null,
      required,
      options: showOptions ? options : [],
      validation: showValidation ? validation : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Configure the field details and validation rules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Field Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-name">Field Name</Label>
            <Input
              id="field-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-label">Label</Label>
            <Input
              id="field-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. Email Address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-placeholder">Placeholder</Label>
            <Input
              id="field-placeholder"
              value={placeholder ?? ""}
              onChange={(event) => setPlaceholder(event.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={required}
              onChange={(event) => setRequired(event.target.checked)}
            />
            Required field
          </label>

          {showOptions ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setOptions((prev) => [...prev, { value: "", label: "" }])
                  }
                >
                  Add Option
                </Button>
              </div>
              {options.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add options to populate this select field.
                </p>
              ) : (
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div
                      key={`${option.value}-${index}`}
                      className="rounded-md border border-border p-3 text-sm"
                    >
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          value={option.label}
                          onChange={(event) =>
                            handleOptionChange(index, "label", event.target.value)
                          }
                          placeholder="Label"
                        />
                        <Input
                          value={option.value}
                          onChange={(event) =>
                            handleOptionChange(index, "value", event.target.value)
                          }
                          placeholder="Value"
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={index === 0}
                          onClick={() => handleOptionMove(index, "up")}
                        >
                          Up
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={index === options.length - 1}
                          onClick={() => handleOptionMove(index, "down")}
                        >
                          Down
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setOptions((prev) =>
                              prev.filter((_, current) => current !== index)
                            )
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {showValidation ? (
            <div className="space-y-3">
              <Label>Validation</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="number"
                  min={0}
                  value={minLength}
                  onChange={(event) => setMinLength(event.target.value)}
                  placeholder="Min length"
                />
                <Input
                  type="number"
                  min={0}
                  value={maxLength}
                  onChange={(event) => setMaxLength(event.target.value)}
                  placeholder="Max length"
                />
              </div>
              <Input
                value={pattern}
                onChange={(event) => setPattern(event.target.value)}
                placeholder="Regex pattern (optional)"
              />
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Custom validation message (optional)"
                rows={2}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            Save Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

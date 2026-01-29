"use client";

import { useEffect, useMemo, useState } from "react";
import { FieldType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getConfigComponent } from "@/components/field-config";

export type FieldOption = {
  value: string;
  label: string;
};

export type FieldValidation = {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
  format?: string;
  defaultCountry?: string;
  minDate?: string;
  maxDate?: string;
  noFuture?: boolean;
  noPast?: boolean;
};

export type FieldDraft = {
  name?: string; // Optional - server generates on create, immutable on edit
  type: string;
  label: string;
  placeholder?: string | null;
  required?: boolean;
  options?: any; // Can be array of {value, label} for SELECT or complex object for NAME
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
  { value: "TEXTAREA", label: "Paragraph" },
  { value: "PHONE", label: "Phone" },
  { value: "DATE", label: "Date" },
  { value: "NAME", label: "Name" },
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
  const [type, setType] = useState<FieldType>(
    (field?.type as FieldType) ?? "TEXT"
  );
  const [label, setLabel] = useState(field?.label ?? "");
  const [placeholder, setPlaceholder] = useState(field?.placeholder ?? "");
  const [required, setRequired] = useState(Boolean(field?.required));
  const [config, setConfig] = useState<any>(
    field?.validation || field?.options || undefined
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setType((field?.type as FieldType) ?? "TEXT");
    setLabel(field?.label ?? "");
    setPlaceholder(field?.placeholder ?? "");
    setRequired(Boolean(field?.required));
    
    // Initialize config based on field type
    const fieldType = field?.type as FieldType;
    if (fieldType === "SELECT" || fieldType === "NAME") {
      setConfig(field?.options || undefined);
    } else {
      setConfig(field?.validation || undefined);
    }
  }, [open, field]);

  // When type changes, preserve compatible config
  const handleTypeChange = (newType: FieldType) => {
    const oldType = type;
    setType(newType);
    
    // Clear config if switching between incompatible types
    if (
      (oldType === "SELECT" || oldType === "NAME") &&
      newType !== "SELECT" &&
      newType !== "NAME"
    ) {
      setConfig(undefined);
    } else if (
      (newType === "SELECT" || newType === "NAME") &&
      oldType !== "SELECT" &&
      oldType !== "NAME"
    ) {
      setConfig(undefined);
    }
    // Otherwise preserve config (e.g., TEXT -> EMAIL keeps validation)
  };

  const ConfigComponent = getConfigComponent(type);
  const showPlaceholder = type !== "CHECKBOX" && type !== "NAME" && type !== "HIDDEN";
  const title = field ? "Edit Field" : "Add Field";

  const canSave = useMemo(() => {
    if (!label.trim()) {
      return false;
    }

    // Validate SELECT has options
    if (type === "SELECT" && config) {
      const selectConfig = config as { options?: FieldOption[] };
      const options = selectConfig.options;
      if (!options || !Array.isArray(options) || options.length === 0) {
        return false;
      }
      // All options must be filled
      if (
        !options.every(
          (option: FieldOption) => option.value.trim() && option.label.trim()
        )
      ) {
        return false;
      }

      // Option values must be unique (prevents ambiguous defaults/submissions)
      const seen = new Set<string>();
      for (const option of options) {
        const v = option.value.trim();
        if (seen.has(v)) {
          return false;
        }
        seen.add(v);
      }

      return true;
    }

    // Validate NAME has parts
    if (type === "NAME" && config) {
      const nameConfig = config as { parts?: string[] };
      if (!nameConfig.parts || nameConfig.parts.length === 0) {
        return false;
      }
    }

    return true;
  }, [label, type, config]);

  const handleSave = () => {
    const draft: FieldDraft = {
      type,
      label: label.trim(),
      placeholder: placeholder.trim() || null,
      required,
    };

    // In edit mode, pass the existing name for reference
    if (field?.name) {
      draft.name = field.name;
    }

    // Assign config to appropriate field based on type
    if (type === "SELECT" || type === "NAME") {
      draft.options = config;
      draft.validation = undefined;
    } else if (ConfigComponent) {
      draft.validation = config;
      draft.options = undefined;
    } else {
      draft.validation = undefined;
      draft.options = undefined;
    }

    onSave(draft);
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
          {/* Stable skeleton - always visible */}
          <div className="space-y-2">
            <Label>Field Type</Label>
            <Select value={type} onValueChange={handleTypeChange}>
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
            <Label htmlFor="field-label">Label</Label>
            <Input
              id="field-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. Email Address"
            />
            {field?.name && (
              <p className="text-xs text-muted-foreground">
                Internal key: <code className="bg-muted px-1 py-0.5 rounded">{field.name}</code>
              </p>
            )}
          </div>

          {showPlaceholder && (
            <div className="space-y-2">
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={placeholder ?? ""}
                onChange={(event) => setPlaceholder(event.target.value)}
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={required}
              onChange={(event) => setRequired(event.target.checked)}
            />
            Required field
          </label>

          {/* Dynamic panel - type-specific configuration */}
          {ConfigComponent && (
            <ConfigComponent value={config} onChange={setConfig} />
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
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

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
import { getConfigComponent } from "@/components/field-config";
import { FIELD_TYPE_OPTIONS, getLabelPlaceholder } from "@/lib/field-types";

export type FieldOption = {
  value: string;
  label: string;
};

export type FieldValidation = {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
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
  helpText?: string | null;
  options?: any; // Can be array of {value, label} for DROPDOWN or complex object for NAME
  validation?: FieldValidation;
};

type FieldEditorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: FieldDraft) => void;
  field?: FieldDraft | null;
};

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
  const [helpText, setHelpText] = useState(field?.helpText ?? "");
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
    setHelpText(field?.helpText ?? "");
    
    // Initialize config based on field type
    const fieldType = field?.type as FieldType;
    if (fieldType === "DROPDOWN" || fieldType === "NAME" || fieldType === "CHECKBOXES") {
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
      (oldType === "DROPDOWN" || oldType === "NAME" || oldType === "CHECKBOXES") &&
      newType !== "DROPDOWN" &&
      newType !== "NAME" &&
      newType !== "CHECKBOXES"
    ) {
      setConfig(undefined);
    } else if (
      (newType === "DROPDOWN" || newType === "NAME" || newType === "CHECKBOXES") &&
      oldType !== "DROPDOWN" &&
      oldType !== "NAME" &&
      oldType !== "CHECKBOXES"
    ) {
      setConfig(undefined);
    }
    // Otherwise preserve config (e.g., TEXT -> EMAIL keeps validation)
  };

  const ConfigComponent = getConfigComponent(type);
  const showPlaceholder = type !== "CHECKBOX" && type !== "CHECKBOXES" && type !== "NAME" && type !== "HIDDEN" && type !== "DATE";
  const title = field ? "Edit Field" : "Add Field";

  const canSave = useMemo(() => {
    if (!label.trim()) {
      return false;
    }

    // Validate DROPDOWN / CHECKBOXES have options
    if ((type === "DROPDOWN" || type === "CHECKBOXES") && !config) {
      return false;
    }
    if ((type === "DROPDOWN" || type === "CHECKBOXES") && config) {
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
      placeholder: type === "DATE" ? null : placeholder.trim() || null,
      required,
      helpText: helpText.trim() || null,
    };

    // In edit mode, pass the existing name for reference
    if (field?.name) {
      draft.name = field.name;
    }

    // Assign config to appropriate field based on type
    if (type === "DROPDOWN" || type === "NAME" || type === "CHECKBOXES") {
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
                {FIELD_TYPE_OPTIONS.map((option) => (
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
              placeholder={getLabelPlaceholder(type)}
            />
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

          {/* Section divider */}
          {ConfigComponent && (
            <>
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Input Rules
                </h3>
                <ConfigComponent value={config} onChange={setConfig} />
              </div>
            </>
          )}

          {/* Help text field - shown for all field types within Input Rules */}
          <div className="space-y-2">
            <Label htmlFor="field-help-text">Help text (optional)</Label>
            <Textarea
              id="field-help-text"
              value={helpText ?? ""}
              onChange={(event) => setHelpText(event.target.value)}
              placeholder="Brief guidance for filling out this field"
              rows={2}
            />
          </div>
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

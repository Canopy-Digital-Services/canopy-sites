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
import { FieldConfigRenderer } from "@/components/field-config";
import {
  FieldPreview,
  FIELD_PREVIEW_TYPES,
  useLiveFieldWidth,
} from "@/components/forms/field-preview";
import { cn } from "@/lib/utils";
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
  options?: unknown; // DROPDOWN/CHECKBOXES options or NAME config (polymorphic across field types)
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
  const [type, setType] = useState<FieldType | "">(
    (field?.type as FieldType) ?? ""
  );
  const [label, setLabel] = useState(field?.label ?? "");
  const [placeholder, setPlaceholder] = useState(field?.placeholder ?? "");
  const [required, setRequired] = useState(Boolean(field?.required));
  const [helpText, setHelpText] = useState(field?.helpText ?? "");
  const [config, setConfig] = useState<unknown>(
    field?.validation || field?.options || undefined
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    // Use queueMicrotask to avoid synchronous setState in effect body
    queueMicrotask(() => {
      setType((field?.type as FieldType) ?? "");
      setLabel(field?.label ?? "");
      setPlaceholder(field?.placeholder ?? "");
      setRequired(Boolean(field?.required));
      setHelpText(field?.helpText ?? "");

      // Initialize config based on field type
      const fieldType = field?.type as FieldType;
      if (fieldType === "DROPDOWN" || fieldType === "NAME" || fieldType === "CHECKBOXES" || fieldType === "ADDRESS") {
        setConfig(field?.options || undefined);
      } else {
        setConfig(field?.validation || undefined);
      }
    });
  }, [open, field]);

  // When type changes, preserve compatible config
  const handleTypeChange = (newType: FieldType) => {
    const oldType = type;
    setType(newType);
    
    // Clear config if switching between incompatible types
    const isOptionsType = (t: FieldType | "") =>
      t === "DROPDOWN" || t === "NAME" || t === "CHECKBOXES" || t === "ADDRESS";

    if (isOptionsType(oldType) && !isOptionsType(newType)) {
      setConfig(undefined);
    } else if (isOptionsType(newType) && !isOptionsType(oldType)) {
      setConfig(undefined);
    }
    // Otherwise preserve config (e.g., TEXT -> EMAIL keeps validation)
  };

  const hasConfig = type !== "CHECKBOX";
  const showPlaceholder = type !== "CHECKBOX" && type !== "CHECKBOXES" && type !== "NAME" && type !== "DATE" && type !== "ADDRESS";
  const title = field ? "Edit Field" : "Add Field";
  const showPreview = FIELD_PREVIEW_TYPES.has(type);
  const previewWidth = useLiveFieldWidth();

  // Config is split across options/validation by type, same as handleSave.
  const isOptionsType =
    type === "DROPDOWN" || type === "NAME" || type === "CHECKBOXES" || type === "ADDRESS";
  const previewField = useMemo(
    () => ({
      name: field?.name ?? "preview",
      type,
      label: label.trim(),
      required,
      placeholder: placeholder.trim() || null,
      helpText: helpText.trim() || null,
      options: isOptionsType ? config : undefined,
      validation: isOptionsType ? undefined : config,
    }),
    [field?.name, type, label, required, placeholder, helpText, config, isOptionsType]
  );

  const canSave = useMemo(() => {
    if (!type) {
      return false;
    }

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
    if (type === "DROPDOWN" || type === "NAME" || type === "CHECKBOXES" || type === "ADDRESS") {
      draft.options = config;
      draft.validation = undefined;
    } else if (hasConfig) {
      draft.validation = config as FieldValidation | undefined;
      draft.options = undefined;
    } else {
      draft.validation = undefined;
      draft.options = undefined;
    }

    onSave(draft);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* aria-describedby={undefined} is required when omitting DialogDescription —
          Radix otherwise points it at an id that no longer renders. */}
      {/* With a preview, the dialog widens on lg+ to fit the settings column
          plus the field at its live-form width (capped to the viewport). */}
      <DialogContent
        className={cn(
          "max-h-[85vh] overflow-y-auto transition-[max-width]",
          showPreview && "lg:max-w-(--field-dialog-width)"
        )}
        style={
          showPreview
            ? ({
                "--field-dialog-width": `min(${previewWidth + 600}px, calc(100% - 2rem))`,
              } as React.CSSProperties)
            : undefined
        }
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* With a preview: mobile stacks type, preview, settings; lg+ puts the
            preview in a sticky right column beside type + settings. */}
        <div
          className={cn(
            "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4",
            showPreview && "lg:grid-cols-[29rem_minmax(0,1fr)] lg:gap-x-8"
          )}
        >
          <div className="space-y-2 lg:col-start-1 lg:row-start-1">
            <Label htmlFor="field-type-select">Field Type</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger id="field-type-select">
                <SelectValue placeholder="Choose a field type..." />
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

          {/* Choosing a type reveals the rest of the config; the reveal grows the
              dialog to fit instead of snapping to a taller frame. The inner
              wrapper's overflow-hidden is what the grid animation clips against,
              and the -mx-1/px-1 pair keeps focus rings from being clipped. */}
          {showPreview && (
            <div className="space-y-3 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-0 lg:self-start">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preview
              </h3>
              <FieldPreview field={previewField} />
            </div>
          )}

          {type && (
            <div className="editor-reveal lg:col-start-1 lg:row-start-2">
              <div className="space-y-4 overflow-hidden -mx-1 px-1">
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

              {hasConfig && (
                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Input Rules
                  </h3>
                  <FieldConfigRenderer type={type} value={config} onChange={setConfig} />
                </div>
              )}

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
            </div>
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

"use client";

// UI: see docs/UX_PATTERNS.md ("Inline field rows").

import { useEffect, useMemo, useRef, useState } from "react";
import type { FieldType } from "@prisma/client";
import { SortableList } from "@/components/ui/sortable-list";
import { createField, deleteField, reorderFields, updateField } from "@/actions/forms";
import { useToast } from "@/hooks/use-toast";
import { DeleteFieldDialog } from "@/components/delete-field-dialog";
import { useFormContext, type FieldState } from "@/components/forms/form-context";
import { AddFieldRow, FieldRow } from "@/components/forms/field-row";
import { fieldProblem, isOptionsType, newFieldDefaults, savedField } from "@/lib/field-rules";

/** Quiet time after the last edit before a field saves. */
const SAVE_DELAY_MS = 600;

type FormFieldsManagerProps = {
  formId: string;
};

const toFieldState = (f: FieldState): FieldState => ({
  id: f.id,
  name: f.name,
  label: f.label,
  type: f.type,
  required: f.required,
  order: f.order,
  helpText: f.helpText,
  options: f.options,
  validation: f.validation,
});


/**
 * The Fields list: one row per field, at most one open, edits autosaving a
 * beat after the user stops (and at once when the row closes or the step
 * changes). Adding happens in the list's last row.
 */
export function FormFieldsManager({ formId }: FormFieldsManagerProps) {
  const { state, setFields, updateField: patchField, addField, removeField, setPreviewFocus, trackSave } =
    useFormContext();
  const fields = useMemo(() => [...state.fields].sort((a, b) => a.order - b.order), [state.fields]);
  const [openId, setOpenId] = useState<string | null>(null);
  // The field just added, which opens with its label ready to type over.
  const [namingId, setNamingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingField, setDeletingField] = useState<FieldState | null>(null);
  const { toast } = useToast();

  // Saves read the latest fields, not the render that scheduled them.
  const latest = useRef(state.fields);
  useEffect(() => {
    latest.current = state.fields;
  }, [state.fields]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const save = async (fieldId: string) => {
    timers.current.delete(fieldId);
    const field = latest.current.find((f) => f.id === fieldId);
    if (!field || fieldProblem(field)) return;
    try {
      await trackSave(updateField(formId, fieldId, savedField(field)));
    } catch (error) {
      console.error(error);
      toast.error("Unable to save field. Please try again.");
    }
  };

  const flush = (fieldId: string | null) => {
    if (!fieldId) return;
    const timer = timers.current.get(fieldId);
    if (timer === undefined) return;
    clearTimeout(timer);
    void save(fieldId);
  };

  // Leaving the step (or the page) saves whatever is still waiting.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const fieldId of [...pending.keys()]) {
        clearTimeout(pending.get(fieldId));
        void save(fieldId);
      }
    };
    // save reads refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The open field is the one the preview marks, narrowed to the part whose
  // settings have focus. Moving from one box to the next blurs one before
  // focusing the other, so going back to the whole field waits a beat: two
  // boxes marking the same part (a Dropdown's options all mark the dropdown)
  // leave the mark as drawn instead of redrawing it.
  const partLeft = useRef<ReturnType<typeof setTimeout>>(undefined);
  const focusPart = (name: string, part: string | null) => {
    clearTimeout(partLeft.current);
    if (part) setPreviewFocus(`field:${name}#${part}`);
    else partLeft.current = setTimeout(() => setPreviewFocus(`field:${name}`), 0);
  };
  const openName = fields.find((f) => f.id === openId)?.name ?? null;
  useEffect(() => {
    // A closing row's last blur (its focus going to the title) mustn't mark it.
    clearTimeout(partLeft.current);
    setPreviewFocus(openName ? `field:${openName}` : null);
    return () => {
      clearTimeout(partLeft.current);
      setPreviewFocus(null);
    };
  }, [openName, setPreviewFocus]);

  const change = (fieldId: string, patch: Partial<FieldState>) => {
    patchField(fieldId, patch);
    clearTimeout(timers.current.get(fieldId));
    timers.current.set(fieldId, setTimeout(() => void save(fieldId), SAVE_DELAY_MS));
  };

  // A row that closes shows its options as they saved (without blank options).
  const tidy = (fieldId: string | null) => {
    const field = latest.current.find((f) => f.id === fieldId);
    if (!field || !isOptionsType(field.type) || fieldProblem(field)) return;
    const { options } = savedField(field);
    if (JSON.stringify(options) !== JSON.stringify(field.options)) patchField(field.id, { options });
  };

  const toggle = (fieldId: string) => {
    flush(openId);
    tidy(openId);
    setOpenId(openId === fieldId ? null : fieldId);
    setNamingId(null);
  };

  const closeOpen = () => {
    flush(openId);
    tidy(openId);
    setOpenId(null);
    setNamingId(null);
  };

  const create = async (type: FieldType) => {
    setCreating(true);
    try {
      const created = await trackSave(createField(formId, newFieldDefaults(type)));
      addField(toFieldState(created));
      setOpenId(created.id);
      setNamingId(created.id);
    } catch (error) {
      console.error(error);
      toast.error("Unable to add field. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConfirm = async (purgeData: boolean) => {
    if (!deletingField) return;
    const fieldId = deletingField.id;
    setDeletingField(null);
    clearTimeout(timers.current.get(fieldId));
    timers.current.delete(fieldId);
    if (openId === fieldId) setOpenId(null);
    const previous = [...state.fields];
    removeField(fieldId);
    try {
      await trackSave(deleteField(formId, fieldId, purgeData));
    } catch (error) {
      console.error(error);
      toast.error("Unable to delete field. Please try again.");
      setFields(previous);
    }
  };

  const handleReorder = async (fieldIds: string[]) => {
    const previous = [...state.fields];
    const reordered = fieldIds
      .map((id) => state.fields.find((field) => field.id === id))
      .filter((field): field is FieldState => field !== undefined)
      .map((field, index) => ({ ...field, order: index + 1 }));
    setFields(reordered);
    try {
      await trackSave(reorderFields(formId, fieldIds));
    } catch (error) {
      console.error(error);
      toast.error("Unable to reorder fields. Please try again.");
      setFields(previous);
    }
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-md overflow-hidden">
        {fields.length > 0 && (
          <SortableList
            items={fields}
            onReorder={(ids) => void handleReorder(ids)}
            className="space-y-0"
            renderItem={({ item: field, dragHandleProps }) => (
              <FieldRow
                field={field}
                open={openId === field.id}
                problem={openId === field.id ? fieldProblem(field) : null}
                naming={namingId === field.id}
                dragHandleProps={dragHandleProps}
                onToggle={() => toggle(field.id)}
                onChange={(patch) => change(field.id, patch)}
                onDelete={() => setDeletingField(field)}
                onFocusPart={(part) => focusPart(field.name, part)}
              />
            )}
          />
        )}
        <div className={fields.length > 0 ? "border-t border-border/50" : undefined}>
          <AddFieldRow busy={creating} onOpen={closeOpen} onPick={(type) => void create(type)} />
        </div>
      </div>
      {deletingField && (
        <DeleteFieldDialog
          open={!!deletingField}
          onOpenChange={(open) => {
            if (!open) setDeletingField(null);
          }}
          formId={formId}
          fieldName={deletingField.name}
          fieldLabel={deletingField.label}
          onConfirm={(purge) => void handleDeleteConfirm(purge)}
        />
      )}
    </div>
  );
}

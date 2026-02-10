"use client";

import { useMemo, useState, useTransition } from "react";
import { FieldList, FieldSummary } from "@/components/field-list";
import {
  FieldDraft,
  FieldEditorModal,
  FieldValidation,
} from "@/components/field-editor-modal";
import {
  createField,
  deleteField,
  reorderFields,
  updateField,
} from "@/actions/forms";
import { useToast } from "@/hooks/use-toast";

type FormFieldsManagerProps = {
  formId: string;
  fields: FieldSummary[];
};

export function FormFieldsManager({
  formId,
  fields,
}: FormFieldsManagerProps) {
  const [fieldList, setFieldList] = useState(fields);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const editingField = useMemo(
    () => fieldList.find((field) => field.id === editingFieldId) || null,
    [fieldList, editingFieldId]
  );

  const openCreate = () => {
    setEditingFieldId(null);
    setIsModalOpen(true);
  };

  const openEdit = (fieldId: string) => {
    setEditingFieldId(fieldId);
    setIsModalOpen(true);
  };

  const handleSave = (data: FieldDraft) => {
    startTransition(() => {
      void (async () => {
        try {
          if (editingFieldId) {
            const updated = await updateField(formId, editingFieldId, {
              ...data,
              type: data.type as typeof data.type,
            });
            setFieldList((prev) =>
              prev.map((field) =>
                field.id === updated.id
                  ? {
                      id: updated.id,
                      name: updated.name,
                      label: updated.label,
                      type: updated.type,
                      required: updated.required,
                      order: updated.order,
                      placeholder: updated.placeholder,
                      helpText: updated.helpText,
                      options: updated.options,
                      validation: updated.validation,
                    }
                  : field
              )
            );
          } else {
            const created = await createField(formId, {
              ...data,
              type: data.type as typeof data.type,
            });
            setFieldList((prev) => [
              ...prev,
              {
                id: created.id,
                name: created.name,
                label: created.label,
                type: created.type,
                required: created.required,
                order: created.order,
                placeholder: created.placeholder,
                helpText: created.helpText,
                options: created.options,
                validation: created.validation,
              },
            ]);
          }
          setIsModalOpen(false);
        } catch (saveError) {
          console.error(saveError);
          toast.error("Unable to save field. Please try again.");
        }
      })();
    });
  };

  const handleDelete = (fieldId: string) => {
    startTransition(() => {
      void (async () => {
        const previous = fieldList;
        setFieldList((prev) => prev.filter((field) => field.id !== fieldId));
        try {
          await deleteField(formId, fieldId);
        } catch (deleteError) {
          console.error(deleteError);
          toast.error("Unable to delete field. Please try again.");
          setFieldList(previous);
        }
      })();
    });
  };

  const handleReorder = (fieldIds: string[]) => {
    // Reconstruct the field list in the new order
    const reordered = fieldIds
      .map((id) => fieldList.find((field) => field.id === id))
      .filter((field): field is FieldSummary => field !== undefined)
      .map((field, orderIndex) => ({
        ...field,
        order: orderIndex + 1,
      }));

    // Optimistic update
    setFieldList(reordered);

    // Persist to server
    startTransition(() => {
      void (async () => {
        try {
          await reorderFields(formId, fieldIds);
        } catch (reorderError) {
          console.error(reorderError);
          toast.error("Unable to reorder fields. Please try again.");
          // Rollback on error
          setFieldList(fieldList);
        }
      })();
    });
  };

  const draftField: FieldDraft | null = editingField
    ? {
        name: editingField.name,
        type: editingField.type,
        label: editingField.label,
        placeholder: editingField.placeholder ?? "",
        required: editingField.required,
        helpText: editingField.helpText ?? "",
        options: editingField.options,
        validation: editingField.validation as FieldValidation | undefined,
      }
    : null;

  return (
    <div className="space-y-4">
      <FieldList
        fields={[...fieldList].sort((a, b) => a.order - b.order)}
        onAddField={openCreate}
        onEditField={openEdit}
        onDeleteField={handleDelete}
        onReorder={handleReorder}
      />
      <FieldEditorModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSave}
        field={draftField}
      />
      {isPending ? (
        <p className="text-xs text-zinc-500">Saving changes...</p>
      ) : null}
    </div>
  );
}

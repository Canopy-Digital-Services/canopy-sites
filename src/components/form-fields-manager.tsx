"use client";

import { useMemo, useState, useTransition } from "react";
import { FieldList, FieldSummary } from "@/components/field-list";
import {
  FieldDraft,
  FieldEditorModal,
} from "@/components/field-editor-modal";
import {
  createField,
  deleteField,
  reorderFields,
  updateField,
} from "@/app/(admin)/sites/[siteId]/forms/[formId]/actions";

type FormFieldsManagerProps = {
  siteId: string;
  formId: string;
  fields: FieldSummary[];
};

export function FormFieldsManager({
  siteId,
  formId,
  fields,
}: FormFieldsManagerProps) {
  const [fieldList, setFieldList] = useState(fields);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    setError(null);
    startTransition(() => {
      void (async () => {
        try {
          if (editingFieldId) {
            const updated = await updateField(siteId, formId, editingFieldId, {
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
                      options: updated.options,
                      validation: updated.validation,
                    }
                  : field
              )
            );
          } else {
            const created = await createField(siteId, formId, {
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
                options: created.options,
                validation: created.validation,
              },
            ]);
          }
          setIsModalOpen(false);
        } catch (saveError) {
          console.error(saveError);
          setError("Unable to save field. Please try again.");
        }
      })();
    });
  };

  const handleDelete = (fieldId: string) => {
    setError(null);
    startTransition(() => {
      void (async () => {
        const previous = fieldList;
        setFieldList((prev) => prev.filter((field) => field.id !== fieldId));
        try {
          await deleteField(siteId, formId, fieldId);
        } catch (deleteError) {
          console.error(deleteError);
          setError("Unable to delete field. Please try again.");
          setFieldList(previous);
        }
      })();
    });
  };

  const handleMove = (fieldId: string, direction: "up" | "down") => {
    setError(null);
    const index = fieldList.findIndex((field) => field.id === fieldId);
    if (index === -1) {
      return;
    }

    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= fieldList.length) {
      return;
    }

    const next = [...fieldList];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    const ordered = next.map((field, orderIndex) => ({
      ...field,
      order: orderIndex + 1,
    }));

    setFieldList(ordered);
    startTransition(() => {
      void (async () => {
        try {
          await reorderFields(
            siteId,
            formId,
            ordered.map((field) => field.id)
          );
        } catch (reorderError) {
          console.error(reorderError);
          setError("Unable to reorder fields. Please try again.");
          setFieldList(fieldList);
        }
      })();
    });
  };

  const draftField = editingField
    ? {
        name: editingField.name,
        type: editingField.type,
        label: editingField.label,
        placeholder: editingField.placeholder ?? "",
        required: editingField.required,
        options: Array.isArray(editingField.options)
          ? (editingField.options as { value: string; label: string }[])
          : [],
        validation:
          typeof editingField.validation === "object" &&
          editingField.validation !== null
            ? (editingField.validation as FieldDraft["validation"])
            : {},
      }
    : null;

  return (
    <div className="space-y-4">
      <FieldList
        fields={[...fieldList].sort((a, b) => a.order - b.order)}
        onAddField={openCreate}
        onEditField={openEdit}
        onDeleteField={handleDelete}
        onMoveField={handleMove}
      />
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
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

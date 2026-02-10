"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { startTransition, useState } from "react";

interface DeleteFormButtonProps {
  formName: string;
  action: (formData: FormData) => void;
}

export function DeleteFormButton({ formName, action }: DeleteFormButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    const formData = new FormData();
    startTransition(() => {
      action(formData);
    });
  };

  return (
    <ConfirmDialog
      title="Delete Form"
      description={`Are you sure you want to delete "${formName}"? This will delete all submissions.`}
      onConfirm={handleDelete}
      destructive
      trigger={
        <Button
          variant="destructive"
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Form"}
        </Button>
      }
    />
  );
}

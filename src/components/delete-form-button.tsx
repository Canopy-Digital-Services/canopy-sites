"use client";

import { Button } from "@/components/ui/button";
import { startTransition, useState } from "react";

interface DeleteFormButtonProps {
  formName: string;
  action: (formData: FormData) => void;
}

export function DeleteFormButton({ formName, action }: DeleteFormButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (
      !confirm(
        `Are you sure you want to delete "${formName}"? This will delete all submissions.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      action(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Button
        type="submit"
        variant="destructive"
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete Form"}
      </Button>
    </form>
  );
}

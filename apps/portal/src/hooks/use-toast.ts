"use client";

import { toast } from "sonner";

export function useToast() {
  const showSaving = (message = "Saving...") => toast.loading(message);
  const showSaved = (message = "Saved") => toast.success(message);
  const showError = (message = "Something went wrong") => toast.error(message);

  return {
    toast, // Expose raw toast function
    showSaving,
    showSaved,
    showError,
  };
}

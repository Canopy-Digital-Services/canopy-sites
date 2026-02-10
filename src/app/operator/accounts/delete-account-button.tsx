"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteAccount } from "@/actions/accounts";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function DeleteAccountButton({
  accountId,
  email,
}: {
  accountId: string;
  email: string;
}) {
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    startTransition(async () => {
      try {
        await deleteAccount(accountId);
        toast.success("Account deleted successfully");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete account"
        );
      }
    });
  }

  return (
    <ConfirmDialog
      title="Delete Account"
      description={`Are you sure you want to delete the account for ${email}? This will permanently delete all forms, sites, and submissions associated with this account. This action cannot be undone.`}
      onConfirm={handleDelete}
      destructive
      trigger={
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      }
    />
  );
}

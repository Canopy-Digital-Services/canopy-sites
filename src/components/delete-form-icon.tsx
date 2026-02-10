"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteForm } from "@/actions/forms";
import { useToast } from "@/hooks/use-toast";

interface DeleteFormIconProps {
  formId: string;
  formName: string;
}

export function DeleteFormIcon({ formId, formName }: DeleteFormIconProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    
    startTransition(async () => {
      try {
        await deleteForm(formId);
        toast.success("Form deleted successfully");
        router.refresh();
      } catch (error) {
        console.error("Failed to delete form:", error);
        toast.error("Failed to delete form");
        setIsDeleting(false);
      }
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-block">
          <ConfirmDialog
            title="Delete Form"
            description={`Are you sure you want to delete "${formName}"? This will delete all submissions.`}
            onConfirm={handleDelete}
            destructive
            trigger={
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                aria-label="Delete form"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Delete form</p>
      </TooltipContent>
    </Tooltip>
  );
}

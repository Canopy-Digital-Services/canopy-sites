"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { checkFieldHasData } from "@/actions/forms";

type DeleteFieldDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  fieldName: string;
  fieldLabel: string;
  onConfirm: (purgeData: boolean) => void;
};

export function DeleteFieldDialog({
  open,
  onOpenChange,
  formId,
  fieldName,
  fieldLabel,
  onConfirm,
}: DeleteFieldDialogProps) {
  const [dataCount, setDataCount] = useState<number | null>(null);
  const [isChecking, startChecking] = useTransition();
  const checkedRef = useRef(false);

  const dialogRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && !checkedRef.current) {
        checkedRef.current = true;
        startChecking(() => {
          void (async () => {
            try {
              const count = await checkFieldHasData(formId, fieldName);
              setDataCount(count);
            } catch {
              setDataCount(0);
            }
          })();
        });
      }
    },
    [formId, fieldName]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogRef}>
        <DialogHeader>
          <DialogTitle>Delete field</DialogTitle>
          <DialogDescription>
            {isChecking ? (
              <span className="flex items-center gap-2">
                <Loader2Icon className="size-4 animate-spin" />
                Checking for existing data…
              </span>
            ) : dataCount && dataCount > 0 ? (
              <>
                <strong>{dataCount}</strong>{" "}
                {dataCount === 1 ? "submission contains" : "submissions contain"}{" "}
                data for &ldquo;{fieldLabel}&rdquo;. You can choose to keep the existing submission data or delete it permanently.
              </>
            ) : (
              <>
                Are you sure you want to delete &ldquo;{fieldLabel}&rdquo;? This
                action cannot be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {isChecking ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          ) : dataCount && dataCount > 0 ? (
            <>
              <Button variant="outline" className="mr-auto" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="link"
                className="text-destructive"
                onClick={() => onConfirm(true)}
              >
                Delete data
              </Button>
              <Button onClick={() => onConfirm(false)}>
                Keep data
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => onConfirm(false)}
              >
                Delete
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

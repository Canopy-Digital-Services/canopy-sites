"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { resolvePlan } from "@/actions/plan-resolution";

export type ResolutionFormSummary = {
  id: string;
  name: string;
  title: string | null;
  submissionsCount: number;
  createdAt: string;
};

type Props = {
  planDisplayName: string;
  maxPublishedForms: number | null;
  forms: ResolutionFormSummary[];
};

export function PlanResolutionDialog({
  planDisplayName,
  maxPublishedForms,
  forms,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const capDisplay =
    maxPublishedForms === null ? "unlimited" : String(maxPublishedForms);
  const atCap =
    maxPublishedForms !== null && selected.size >= maxPublishedForms;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (maxPublishedForms !== null && next.size >= maxPublishedForms) {
        return prev;
      }
      next.add(id);
      return next;
    });
  }

  function submit(ids: string[]) {
    startTransition(async () => {
      try {
        await resolvePlan(ids);
        toast.success(
          ids.length > 0
            ? `Published ${ids.length} form${ids.length === 1 ? "" : "s"}.`
            : "All forms kept as draft."
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to resolve plan."
        );
      }
    });
  }

  return (
    <Dialog open>
      <DialogContent
        className="max-w-lg"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Your plan changed</DialogTitle>
          <DialogDescription>
            Your plan is now <strong>{planDisplayName}</strong>, which allows{" "}
            {capDisplay} published form{maxPublishedForms === 1 ? "" : "s"}.
            Choose which forms you want to keep published, or keep everything
            as draft for now.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {selected.size} of {capDisplay} selected
          </span>
          {atCap && (
            <span className="text-xs">
              Uncheck a form to pick a different one.
            </span>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto rounded-md border divide-y">
          {forms.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              You have no forms.
            </div>
          ) : (
            forms.map((form) => {
              const isChecked = selected.has(form.id);
              const disabled = !isChecked && atCap;
              return (
                <label
                  key={form.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 ${
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Checkbox
                    checked={isChecked}
                    disabled={disabled}
                    onCheckedChange={() => toggle(form.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {form.title || form.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {form.submissionsCount} submission
                      {form.submissionsCount === 1 ? "" : "s"} · Created{" "}
                      {new Date(form.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => submit([])}
          >
            Keep everything as draft
          </Button>
          <Button
            disabled={isPending || (forms.length > 0 && selected.size === 0)}
            onClick={() => submit(Array.from(selected))}
          >
            {isPending
              ? "Saving..."
              : selected.size === 0
                ? "Publish selected"
                : `Publish ${selected.size} form${selected.size === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

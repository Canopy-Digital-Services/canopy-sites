"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag } from "lucide-react";
import { setAccountPlan } from "@/actions/admin/plans";
import { toast } from "sonner";

export type PlanOption = {
  code: string;
  displayName: string;
  maxPublishedForms: number | null;
};

type Props = {
  accountId: string;
  email: string;
  currentPlanCode: string;
  currentPublishedFormsCount: number;
  plans: PlanOption[];
};

export function ChangePlanButton({
  accountId,
  email,
  currentPlanCode,
  currentPublishedFormsCount,
  plans,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState(currentPlanCode);
  const [isPending, startTransition] = useTransition();

  const selectedPlan = plans.find((p) => p.code === selectedCode);
  const wouldExceedCap =
    selectedPlan?.maxPublishedForms !== null &&
    selectedPlan?.maxPublishedForms !== undefined &&
    currentPublishedFormsCount > selectedPlan.maxPublishedForms;

  function handleSubmit() {
    if (selectedCode === currentPlanCode) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      try {
        const result = await setAccountPlan(accountId, selectedCode);
        if (result.resolutionRequired) {
          toast.success(
            `Plan changed. ${result.unpublishedCount} form${result.unpublishedCount === 1 ? "" : "s"} unpublished; user will be prompted to resolve on next login.`
          );
        } else {
          toast.success("Plan changed.");
        }
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to change plan"
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Tag className="h-4 w-4 mr-2" />
          Change Plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change plan</DialogTitle>
          <DialogDescription>
            Change the plan for <strong>{email}</strong>. This is an operator
            action; the account holder will see the change on their next admin
            page load.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={selectedCode} onValueChange={setSelectedCode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => {
                const cap =
                  plan.maxPublishedForms === null
                    ? "unlimited"
                    : `${plan.maxPublishedForms} published form${plan.maxPublishedForms === 1 ? "" : "s"}`;
                return (
                  <SelectItem key={plan.code} value={plan.code}>
                    {plan.displayName} ({cap})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {wouldExceedCap && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <strong>Warning:</strong> {email} currently has{" "}
              {currentPublishedFormsCount} published form
              {currentPublishedFormsCount === 1 ? "" : "s"}, which is over the
              selected plan&apos;s cap of {selectedPlan?.maxPublishedForms}.
              All of their forms will be unpublished and they will be prompted
              to choose which to keep published on their next login.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant={wouldExceedCap ? "destructive" : "default"}
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Change plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

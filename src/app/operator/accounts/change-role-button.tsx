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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Shield } from "lucide-react";
import { setUserRole } from "@/actions/admin/roles";
import { toast } from "sonner";

export type RoleOption = {
  code: string;
  displayName: string;
};

type Props = {
  userId: string;
  email: string;
  currentRoleCode: string;
  currentPlanCode: string;
  isSelf: boolean;
  isLastGlobalAdmin: boolean;
  roles: RoleOption[];
};

export function ChangeRoleButton({
  userId,
  email,
  currentRoleCode,
  currentPlanCode,
  isSelf,
  isLastGlobalAdmin,
  roles,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState(currentRoleCode);
  const [isPending, startTransition] = useTransition();

  const demotingFromAdmin =
    currentRoleCode === "GLOBAL_ADMIN" && selectedCode !== "GLOBAL_ADMIN";
  const blockedByLastAdmin = demotingFromAdmin && isLastGlobalAdmin;
  const willAutoUpgradePlan =
    selectedCode === "GLOBAL_ADMIN" &&
    currentRoleCode !== "GLOBAL_ADMIN" &&
    currentPlanCode !== "UNLOCKED";

  function handleSubmit() {
    if (selectedCode === currentRoleCode) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      try {
        const result = await setUserRole(userId, selectedCode);
        toast.success(
          result.planAutoUpgraded
            ? "Role changed. Account moved to Unlocked plan."
            : "Role changed."
        );
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to change role"
        );
      }
    });
  }

  if (isSelf) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="ghost" size="sm" disabled>
                <Shield className="h-4 w-4 mr-2" />
                Change Role
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>You cannot change your own role.</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Shield className="h-4 w-4 mr-2" />
          Change Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Change the role for <strong>{email}</strong>. The change takes
            effect on the user&apos;s next login.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={selectedCode} onValueChange={setSelectedCode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.code} value={role.code}>
                  {role.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {willAutoUpgradePlan && (
            <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
              This will also move {email}&apos;s account to the Unlocked plan
              so they are never limited by their own form cap.
            </div>
          )}

          {blockedByLastAdmin && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              At least one Global Admin is required. Promote another user
              before demoting this one.
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
            onClick={handleSubmit}
            disabled={isPending || blockedByLastAdmin}
          >
            {isPending ? "Saving..." : "Change role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

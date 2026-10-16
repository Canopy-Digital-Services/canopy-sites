"use client";

import { useState, useTransition } from "react";
import type { AccountStatus } from "@prisma/client";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Receipt } from "lucide-react";
import { setAccountBilling } from "@/actions/admin/billing";
import { ACCOUNT_STATUS_LABELS, BILLING_REF_MAX_LENGTH } from "@/lib/billing";
import { toast } from "sonner";

type Props = {
  accountId: string;
  email: string;
  currentStatus: AccountStatus;
  currentBillingRef: string | null;
};

export function BillingButton({ accountId, email, currentStatus, currentBillingRef }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>(currentStatus);
  const [billingRef, setBillingRef] = useState(currentBillingRef ?? "");
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (next) {
      setStatus(currentStatus);
      setBillingRef(currentBillingRef ?? "");
    }
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await setAccountBilling(accountId, status, billingRef);
        toast.success("Billing updated.");
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update billing");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Receipt className="h-4 w-4 mr-2" />
          Billing
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Billing</DialogTitle>
            <DialogDescription>
              Billing status and reference for <strong>{email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="account-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="account-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_STATUS_LABELS).map(([code, label]) => (
                  <SelectItem key={code} value={code}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing-ref">Billing reference (Optional)</Label>
            <Input
              id="billing-ref"
              value={billingRef}
              onChange={(e) => setBillingRef(e.target.value)}
              maxLength={BILLING_REF_MAX_LENGTH}
              placeholder="FreshBooks client or invoice"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

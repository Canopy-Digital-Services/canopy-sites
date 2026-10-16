"use client";

import { useState, useTransition } from "react";
import { ArrowRightLeft } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { assignSite } from "@/actions/admin/sites";
import type { SiteAccountOption } from "@/lib/data-access/sites";

type Props = { siteId: string; siteName: string; accounts: SiteAccountOption[] };

export function AssignSiteButton({ siteId, siteName, accounts }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (next) {
      setAccountId("");
      setError("");
    }
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId) return;
    startTransition(async () => {
      const result = await assignSite(siteId, accountId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.success("Site moved.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowRightLeft className="h-4 w-4" />
          Move to another account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Move {siteName}</DialogTitle>
            <DialogDescription>
              {accounts.length === 0
                ? "Every account on the Sites plan already has a site. Move an account to the Sites plan first."
                : "Its current owner loses the Editor and Stats for it."}
            </DialogDescription>
          </DialogHeader>
          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="assign-account">Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="assign-account">
                  <SelectValue placeholder="Choose an account on the Sites plan" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.ownerEmail ?? a.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            {accounts.length > 0 && (
              <Button type="submit" disabled={isPending || !accountId}>
                {isPending ? "Moving..." : "Move site"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

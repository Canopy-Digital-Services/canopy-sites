"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
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
import { addAccountMember } from "@/actions/admin/members";

export function AddMemberButton({ accountId, email }: { accountId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (next) {
      setMemberEmail("");
      setError(null);
    }
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await addAccountMember(accountId, memberEmail);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.success(`${result.email} added. They set a password with "Forgot password".`);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>
              Adds a new person to <strong>{email}</strong>&apos;s account. They sign in at the account&apos;s home address after
              setting a password with &quot;Forgot password&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              value={memberEmail}
              onChange={(e) => {
                setMemberEmail(e.target.value);
                setError(null);
              }}
              maxLength={254}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "member-email-error" : undefined}
            />
            {error ? (
              <p id="member-email-error" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || !memberEmail.trim()}>
              Add member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

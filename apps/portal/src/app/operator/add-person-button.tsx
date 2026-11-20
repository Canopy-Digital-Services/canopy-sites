"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
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
import { PERSON_NAME_MAX } from "@/lib/person";
import { CopyLinkField, EmailClaimLinkButton } from "./copy-link-field";

/**
 * Adds a person to an account (PRD D63): their name and a new email, then
 * their claim link, shown once to copy, email, or both.
 */
export function AddPersonButton({
  accountId,
  account,
  variant = "outline",
  size,
}: {
  accountId: string;
  /** What the dialog calls the account: its site's name, or its owner's email. */
  account: string;
  variant?: "outline" | "ghost";
  size?: "sm";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<{ email: string; claimUrl: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (next) {
      setName("");
      setEmail("");
      setError(null);
      setAdded(null);
    }
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await addAccountMember(accountId, email, name);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setAdded({ email: result.email, claimUrl: result.claimUrl });
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <UserPlus className="h-4 w-4" />
          Add person
        </Button>
      </DialogTrigger>
      <DialogContent>
        {added ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>{added.email} added</DialogTitle>
              <DialogDescription>Their link to set a password works once, for a week.</DialogDescription>
            </DialogHeader>
            <CopyLinkField url={added.claimUrl} label="Claim link" />
            <DialogFooter>
              <EmailClaimLinkButton url={added.claimUrl} />
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add person</DialogTitle>
              <DialogDescription>
                A login of their own on <strong>{account}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="person-name">Name</Label>
              <Input id="person-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={PERSON_NAME_MAX} disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-email">
                Email
                <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="person-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                maxLength={254}
                disabled={isPending}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "person-email-error" : undefined}
              />
              {error ? (
                <p id="person-email-error" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending || !email.trim()}>
                Add person
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

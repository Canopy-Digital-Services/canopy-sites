"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { sendClaimLink } from "@/actions/admin/claims";
import { actAsClient } from "@/actions/admin/act-as";
import { removeAccountMember, setPersonName } from "@/actions/admin/members";
import { PERSON_NAME_MAX } from "@/lib/person";
import { AddPersonButton } from "../../add-person-button";
import { CopyLinkField } from "../../copy-link-field";

/** A person as the operator page shows them; dates are formatted on the server. */
export type PersonRow = {
  userId: string;
  name: string | null;
  email: string;
  owner: boolean;
  claimed: boolean;
  claimedAt: string | null;
  link: string | null;
  lastSignIn: string | null;
};

/**
 * The people on the site's account (PRD D63), owner first: whether each has
 * claimed, their claim link, their last sign-in, renaming, and removing
 * anyone but the owner. Acting as the client (PRD D49) is the account's, so
 * it sits in the footer.
 */
export function PeopleCard({
  siteId,
  siteName,
  accountId,
  people,
}: {
  siteId: string;
  siteName: string;
  accountId: string;
  people: PersonRow[];
}) {
  const router = useRouter();
  const [copied, setCopied] = useState<{ url: string; expires: string } | null>(null);
  const [renaming, setRenaming] = useState<PersonRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function send(person: PersonRow, how: "copy" | "email") {
    startTransition(async () => {
      const result = await sendClaimLink(siteId, person.userId, how);
      if ("error" in result) toast.error(result.error);
      else if ("url" in result) setCopied({ url: result.url, expires: result.expires });
      else toast.success(result.message);
      router.refresh();
    });
  }

  function remove(person: PersonRow) {
    startTransition(async () => {
      const result = await removeAccountMember(accountId, person.userId);
      if ("error" in result) toast.error(result.error);
      else toast.success(`${person.name ?? person.email} removed.`);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>People</CardTitle>
      </CardHeader>
      <CardContent>
        {people.length ? (
          <ul className="divide-y">
            {people.map((p) => (
              <li key={p.userId} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 space-y-1 text-sm">
                  <p className="truncate">
                    <span className="font-medium">{p.name ?? p.email}</span>
                    {p.owner ? <span className="text-muted-foreground"> · Owner</span> : null}
                  </p>
                  {p.name ? <p className="truncate text-muted-foreground">{p.email}</p> : null}
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${p.claimed ? "bg-success" : "bg-amber-500"}`} />
                    <span>
                      {p.claimed
                        ? `${p.claimedAt ? `Claimed ${p.claimedAt}` : "Claimed"} · ${p.lastSignIn ? `Last sign-in ${p.lastSignIn}` : "Never signed in"}`
                        : `Not claimed · ${p.link ? `Link ${p.link}` : "No link sent"}`}
                    </span>
                  </p>
                  {p.claimed ? null : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button variant="outline" size="sm" disabled={isPending} onClick={() => send(p, "copy")}>
                        Copy claim link
                      </Button>
                      <Button variant="outline" size="sm" disabled={isPending} onClick={() => send(p, "email")}>
                        Email claim link
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Rename ${p.name ?? p.email}`} disabled={isPending} onClick={() => setRenaming(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rename</TooltipContent>
                  </Tooltip>
                  {p.owner ? null : (
                    <ConfirmDialog
                      title={`Remove ${p.name ?? p.email}`}
                      description="They're signed out and can't sign in again."
                      onConfirm={() => remove(p)}
                      destructive
                      trigger={
                        <span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label={`Remove ${p.name ?? p.email}`} disabled={isPending}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove</TooltipContent>
                          </Tooltip>
                        </span>
                      }
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No one yet.</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <form action={actAsClient.bind(null, siteId)}>
          <Button type="submit" disabled={isPending}>
            Act as client
          </Button>
        </form>
        <AddPersonButton accountId={accountId} account={siteName} />
      </CardFooter>

      <Dialog open={copied !== null} onOpenChange={(open) => (open ? null : setCopied(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim link</DialogTitle>
            <DialogDescription>Works once, until {copied?.expires}. Any earlier link no longer works.</DialogDescription>
          </DialogHeader>
          {copied ? <CopyLinkField url={copied.url} label="Claim link" /> : null}
          <DialogFooter>
            <Button type="button" onClick={() => setCopied(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {renaming ? <RenameDialog key={renaming.userId} accountId={accountId} person={renaming} onClose={() => setRenaming(null)} /> : null}
    </Card>
  );
}

function RenameDialog({ accountId, person, onClose }: { accountId: string; person: PersonRow; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(person.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await setPersonName(accountId, person.userId, name);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>{person.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-person">Name</Label>
            <Input
              id="rename-person"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              maxLength={PERSON_NAME_MAX}
              disabled={isPending}
              autoFocus
              aria-invalid={error ? true : undefined}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

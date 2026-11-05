"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { sendClaimLink } from "@/actions/admin/claims";
import { CopyLinkField } from "../../copy-link-field";

/** The owner as the operator page shows them; dates are formatted on the server. */
export type OwnerRow = {
  email: string;
  claimed: boolean;
  claimedAt: string | null;
  link: string | null;
  lastSignIn: string | null;
};

/**
 * The site's owner (PRD D49): whether they've claimed the account, the claim
 * link, and their last sign-in. A row per fact, so later
 * epics (the welcome video, E39) add theirs.
 */
export function OwnerCard({ siteId, owner }: { siteId: string; owner: OwnerRow | null }) {
  const router = useRouter();
  const [copied, setCopied] = useState<{ url: string; expires: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function send(how: "copy" | "email") {
    startTransition(async () => {
      const result = await sendClaimLink(siteId, how);
      if ("error" in result) toast.error(result.error);
      else if ("url" in result) setCopied({ url: result.url, expires: result.expires });
      else toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Owner</CardTitle>
      </CardHeader>
      <CardContent>
        {owner ? (
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{owner.email}</dd>
            <dt className="text-muted-foreground">Claimed</dt>
            <dd className={owner.claimed ? undefined : "text-muted-foreground"}>
              {owner.claimed ? (owner.claimedAt ?? "Yes") : "Not yet"}
            </dd>
            {owner.claimed && !owner.link ? null : (
              <>
                <dt className="text-muted-foreground">Claim link</dt>
                <dd className={owner.link ? undefined : "text-muted-foreground"}>{owner.link ?? "Not sent"}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Last sign-in</dt>
            <dd className={owner.lastSignIn ? undefined : "text-muted-foreground"}>{owner.lastSignIn ?? "Never"}</dd>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No owner.</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {owner && !owner.claimed ? (
          <>
            <Button variant="outline" disabled={isPending} onClick={() => send("copy")}>
              Copy claim link
            </Button>
            <Button variant="outline" disabled={isPending} onClick={() => send("email")}>
              Email claim link
            </Button>
          </>
        ) : null}
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
    </Card>
  );
}

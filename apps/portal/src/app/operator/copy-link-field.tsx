"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emailShownClaimLink } from "@/actions/admin/claims";

/** A link shown once, read-only, with a button that copies it. */
export function CopyLinkField({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Copied.");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input readOnly value={url} aria-label={label} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
      <Button type="button" variant="outline" onClick={copy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        Copy
      </Button>
    </div>
  );
}

/** Emails the claim link the dialog shows, so it and a copy pasted into a text are the same link. */
export function EmailClaimLinkButton({ url }: { url: string }) {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function send() {
    startTransition(async () => {
      const result = await emailShownClaimLink(url);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSent(true);
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="outline" disabled={isPending || sent} onClick={send}>
      {sent ? <Check className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
      {sent ? "Emailed" : "Email it"}
    </Button>
  );
}

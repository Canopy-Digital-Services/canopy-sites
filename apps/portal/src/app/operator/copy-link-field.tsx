"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

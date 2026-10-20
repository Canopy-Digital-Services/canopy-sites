"use client";
// UI: see docs/UX_PATTERNS.md for layout and component conventions.

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { discardPendingChange, getDraftState } from "@/actions/site-editor";

type Pending = { id: string; summary: string; status: string; buildStatus: string | null; error: string | null };

/** Fired by anything that changes the site's draft, so the chrome catches up at once. */
export const DRAFT_CHANGED = "canopy:draft";
/** Fired after a publish or a discard, so the canvas shows what is now live. */
export const DRAFT_PUBLISHED = "canopy:published";
/** Carries the same news between the owner's tabs: Publish happens on the preview page's own tab. */
const CHANNEL = "canopy-sites-draft";

/** Tells this tab and the owner's other tabs that the draft changed or was published. */
export function announceDraft(kind: "changed" | "published") {
  window.dispatchEvent(new Event(kind === "published" ? DRAFT_PUBLISHED : DRAFT_CHANGED));
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(kind);
    channel.close();
  } catch {
    // No BroadcastChannel: the other tabs catch up on their next load.
  }
}

const building = (p: Pending) => p.status === "DRAFT" && (p.buildStatus === "QUEUED" || p.buildStatus === "RUNNING");

/**
 * Unpublished changes, Preview, and Discard, in the Sites chrome whichever tab
 * made the changes (PRD D38). Preview opens the preview page in a new tab,
 * the only place to publish (D47). Renders nothing when the site has no draft.
 */
export function DraftStatus() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(() => {
    getDraftState().then((result) => {
      if ("error" in result) return;
      setPending(result.pending);
      setSiteId(result.siteId);
    });
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(DRAFT_CHANGED, load);
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = (e) => {
        load();
        if (e.data === "published") {
          window.dispatchEvent(new Event(DRAFT_PUBLISHED));
          router.refresh();
        }
      };
    } catch {
      // Without BroadcastChannel, a publish in another tab shows on the next load.
    }
    return () => {
      window.removeEventListener(DRAFT_CHANGED, load);
      channel?.close();
    };
  }, [load, router]);

  // While the preview builds, check every two seconds until it's ready.
  useEffect(() => {
    if (!pending || !building(pending)) return;
    const timer = setTimeout(load, 2000);
    return () => clearTimeout(timer);
  }, [pending, load]);

  if (!pending) return null;

  const failed = pending.status === "DRAFT" && pending.buildStatus === "FAILED";
  const ready = pending.status === "PREVIEWED";
  const label = ready ? "Unpublished changes" : failed ? "Preview failed" : "Preparing preview";
  const dot = ready ? "bg-amber-500" : failed ? "bg-destructive" : "bg-muted-foreground";

  function discard() {
    if (!pending) return;
    startTransition(async () => {
      const result = await discardPendingChange(pending.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setPending(null);
      announceDraft("published");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            {building(pending) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className={`h-2 w-2 rounded-full ${dot}`} />}
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{failed && pending.error ? pending.error : pending.summary}</TooltipContent>
      </Tooltip>
      <ConfirmDialog
        title="Discard changes"
        description="Every unpublished change goes, and your site stays as it is now."
        onConfirm={discard}
        destructive
        trigger={
          <Button variant="ghost" size="sm" disabled={isPending}>
            Discard
          </Button>
        }
      />
      {siteId ? (
        <Button size="sm" asChild>
          <a href={`/preview/${siteId}`} target="_blank" rel="noopener">
            Preview
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      ) : null}
    </div>
  );
}

"use client";
// UI: see docs/UX_PATTERNS.md for layout and component conventions.

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { discardPendingChange, getDraftState, publishPendingChange } from "@/actions/site-editor";

type Pending = { id: string; summary: string; status: string; buildStatus: string | null; error: string | null };

/** Fired by anything that changes the site's draft, so the chrome catches up at once. */
export const DRAFT_CHANGED = "canopy:draft";
/** Fired after a publish, so the canvas shows what is now live. */
export const DRAFT_PUBLISHED = "canopy:published";

const building = (p: Pending) => p.status === "DRAFT" && (p.buildStatus === "QUEUED" || p.buildStatus === "RUNNING");

/**
 * Unpublished changes and Publish, in the Sites chrome whichever tab made the
 * changes (PRD D38). Renders nothing when the site has no draft.
 */
export function DraftStatus() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(() => {
    getDraftState().then((result) => {
      if (!("error" in result)) setPending(result.pending);
    });
  }, []);

  useEffect(() => {
    let active = true;
    getDraftState().then((result) => {
      if (active && !("error" in result)) setPending(result.pending);
    });
    window.addEventListener(DRAFT_CHANGED, load);
    return () => {
      active = false;
      window.removeEventListener(DRAFT_CHANGED, load);
    };
  }, [load]);

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

  function publish() {
    if (!pending) return;
    startTransition(async () => {
      const result = await publishPendingChange(pending.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Published.");
      setPending(null);
      window.dispatchEvent(new Event(DRAFT_PUBLISHED));
      router.refresh();
    });
  }

  function discard() {
    if (!pending) return;
    startTransition(async () => {
      const result = await discardPendingChange(pending.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setPending(null);
      window.dispatchEvent(new Event(DRAFT_PUBLISHED));
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
      <Button size="sm" onClick={publish} disabled={!ready || isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Publish
      </Button>
    </div>
  );
}

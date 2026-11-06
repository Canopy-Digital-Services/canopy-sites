"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dismissHelpRequestDraft, sendHelpRequestToCanopy } from "@/actions/site-editor";

export type DraftedRequest = { id: string; message: string; summary: string };

/**
 * A request Quick Edit drafted for something it can't do (PRD D34), in the
 * chat under the reply that offered it. The owner sends it to Michael or
 * doesn't; what they see is exactly what he gets. Shared by Quick Edit and
 * the canvas's popover.
 */
export function HelpRequestCard({ request, onSent }: { request: DraftedRequest; onSent?: () => void }) {
  const [state, setState] = useState<"draft" | "sent" | "dismissed">("draft");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function act(kind: "send" | "dismiss") {
    startTransition(async () => {
      const result = kind === "send" ? await sendHelpRequestToCanopy(request.id) : await dismissHelpRequestDraft(request.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      setState(kind === "send" ? "sent" : "dismissed");
      if (kind === "send") onSent?.();
    });
  }

  return (
    <div className="max-w-[85%] space-y-2 rounded-lg border bg-card p-3 text-sm">
      <p className="text-xs text-muted-foreground">To Michael at Canopy</p>
      <p className="whitespace-pre-wrap">{request.message}</p>
      {state === "draft" ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" disabled={isPending} onClick={() => act("send")}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send to Michael
          </Button>
          <Button size="sm" variant="ghost" disabled={isPending} onClick={() => act("dismiss")}>
            Not now
          </Button>
        </div>
      ) : state === "sent" ? (
        <p className="flex items-start gap-2">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success" />
          Sent to Michael. You can text him if you need it sooner.
        </p>
      ) : (
        <p className="text-muted-foreground">Not sent.</p>
      )}
      {error ? <p className="text-destructive">{error}</p> : null}
    </div>
  );
}

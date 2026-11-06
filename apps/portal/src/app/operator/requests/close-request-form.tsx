"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { closeRequest } from "@/actions/admin/help-requests";
import { HELP_NOTE_MAX } from "@/lib/site-tools/help-request-limits";

/** Done or Declined on an open request, with an optional note the owner gets by email. */
export function CloseRequestForm({ requestId, acting }: { requestId: string; acting: boolean }) {
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const id = `note-${requestId}`;

  function close(status: "DONE" | "DECLINED") {
    startTransition(async () => {
      const result = await closeRequest(requestId, { status, note });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.emailed ? "Closed. Your note was emailed." : "Closed.");
    });
  }

  return (
    <form
      className="space-y-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        close("DONE");
      }}
    >
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {acting ? "Note (sent while acting, so nobody is emailed)" : "Note to the owner (optional, emailed)"}
      </Label>
      <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} maxLength={HELP_NOTE_MAX} rows={2} className="min-h-[2.75rem]" />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          Done
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => close("DECLINED")}>
          Decline
        </Button>
      </div>
    </form>
  );
}

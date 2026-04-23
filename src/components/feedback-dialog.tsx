"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback, type FeedbackPayload } from "@/actions/feedback";

const MAX_LENGTH = 5000;

type FeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: Omit<FeedbackPayload, "message">;
};

export function FeedbackDialog({ open, onOpenChange, context }: FeedbackDialogProps) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error("Please enter a message before sending.");
      return;
    }
    startTransition(() => {
      void (async () => {
        const result = await submitFeedback({ ...context, message: trimmed });
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success("Thanks! Your feedback was sent.");
        setMessage("");
        onOpenChange(false);
      })();
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    if (!next) setMessage("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            Tell us what&rsquo;s working, what isn&rsquo;t, or what you&rsquo;d like to see.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={MAX_LENGTH}
            rows={6}
            placeholder="What's on your mind?"
            aria-label="Feedback message"
            disabled={isPending}
          />
          <div className="text-xs text-muted-foreground text-right">
            {message.length} / {MAX_LENGTH}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !message.trim()}>
            {isPending ? "Sending…" : "Send feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

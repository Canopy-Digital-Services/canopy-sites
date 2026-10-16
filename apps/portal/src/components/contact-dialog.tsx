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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitContactMessage,
  type ContactKind,
  type ContactPayload,
} from "@/actions/contact";

const MAX_LENGTH = 5000;
const MAX_EMAIL_LENGTH = 320;
// Client-side shape check only; `isValidEmail` in the action is authoritative.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COPY: Record<
  ContactKind,
  {
    title: string;
    description: string;
    placeholder: string;
    submit: string;
    pending: string;
  }
> = {
  feedback: {
    title: "Send feedback",
    description: "Tell us what's working, what isn't, or what you'd like to see.",
    placeholder: "What's on your mind?",
    submit: "Send feedback",
    pending: "Sending…",
  },
  support: {
    title: "Contact support",
    description: "Describe what you need help with and where to reach you.",
    placeholder: "What can we help with?",
    submit: "Send message",
    pending: "Sending…",
  },
};

type ContactDialogProps = {
  /** `null` closes the dialog; a kind opens it with that kind's copy. */
  kind: ContactKind | null;
  onClose: () => void;
  /** Account email, prefilled as the support reply address. */
  accountEmail: string;
  context: Omit<ContactPayload, "message" | "kind" | "replyToEmail">;
};

export function ContactDialog({
  kind,
  onClose,
  accountEmail,
  context,
}: ContactDialogProps) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(accountEmail);
  const [emailTouched, setEmailTouched] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Keep the last kind's copy while the close animation plays out.
  const [lastKind, setLastKind] = useState<ContactKind>("feedback");
  if (kind && kind !== lastKind) setLastKind(kind);
  const activeKind = kind ?? lastKind;
  const copy = COPY[activeKind];

  // Only support asks where to reply; feedback uses the account email silently.
  const collectsEmail = activeKind === "support";
  const trimmedEmail = email.trim();
  const emailValid = EMAIL_REGEX.test(trimmedEmail);
  const emailError =
    emailTouched && !emailValid
      ? trimmedEmail
        ? "Enter a valid email address"
        : "Enter an email address for the reply"
      : null;

  const canSubmit = Boolean(message.trim()) && (!collectsEmail || emailValid);

  const reset = () => {
    setMessage("");
    setEmail(accountEmail);
    setEmailTouched(false);
  };

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!kind || !trimmed) return;
    if (collectsEmail && !emailValid) {
      setEmailTouched(true);
      return;
    }
    startTransition(() => {
      void (async () => {
        const result = await submitContactMessage({
          ...context,
          kind,
          message: trimmed,
          replyToEmail: collectsEmail ? trimmedEmail : undefined,
        });
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success(
          collectsEmail
            ? `Message sent. We'll reply to ${trimmedEmail}.`
            : "Thanks! Your feedback was sent."
        );
        reset();
        onClose();
      })();
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (next || isPending) return;
    reset();
    onClose();
  };

  return (
    <Dialog open={kind !== null} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
          noValidate
        >
          <div className="grid gap-4">
            {collectsEmail && (
              <div className="space-y-2">
                <Label htmlFor="contact-email">Reply to</Label>
                <Input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  maxLength={MAX_EMAIL_LENGTH}
                  aria-invalid={!!emailError}
                  disabled={isPending}
                />
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              {collectsEmail && <Label htmlFor="contact-message">Message</Label>}
              <Textarea
                id="contact-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={MAX_LENGTH}
                rows={6}
                placeholder={copy.placeholder}
                aria-label={collectsEmail ? undefined : copy.title}
                disabled={isPending}
              />
              <div className="text-xs text-muted-foreground text-right">
                {message.length} / {MAX_LENGTH}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending ? copy.pending : copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

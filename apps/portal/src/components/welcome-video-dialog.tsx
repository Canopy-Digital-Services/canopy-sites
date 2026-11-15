// UI: see docs/UX_PATTERNS.md for layout and component conventions.
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type WelcomeVideoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: string;
  captions: string;
};

/**
 * The site's welcome video (ROADMAP E39) in a dialog: the browser's own
 * player, captions on, started by the person and never by the page. Closing
 * it unmounts the player, which stops it.
 */
export function WelcomeVideoDialog({ open, onOpenChange, video, captions }: WelcomeVideoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="gap-0 overflow-hidden p-0 sm:max-w-4xl"
        // It opens by itself once, so a stray tap beside it mustn't be what closes it.
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-4">
          <DialogTitle>Welcome video</DialogTitle>
        </DialogHeader>
        {/* The time fragment has iOS draw the first frame where it would show an empty player. */}
        <video className="aspect-video w-full bg-black" controls playsInline preload="metadata" src={`${video}#t=0.001`}>
          <track kind="captions" src={captions} srcLang="en" label="English" default />
        </video>
      </DialogContent>
    </Dialog>
  );
}

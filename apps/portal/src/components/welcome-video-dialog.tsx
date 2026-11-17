// UI: see docs/UX_PATTERNS.md for layout and component conventions.
"use client";

import { useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { welcomeVideoWatched } from "@/actions/welcome";
import type { SitesTabId } from "@/lib/sites-tabs";

type WelcomeVideoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The tab the video walks through, which its watched figure is kept under. */
  tab: SitesTabId;
  video: string;
  captions: string;
};

/**
 * One of the site's welcome videos (ROADMAP E39) in a dialog: the browser's
 * own player, captions on, started by the person and never by the page.
 * Closing it unmounts the player, which stops it.
 */
export function WelcomeVideoDialog({ open, onOpenChange, tab, video, captions }: WelcomeVideoDialogProps) {
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
        <Player tab={tab} video={video} captions={captions} />
      </DialogContent>
    </Dialog>
  );
}

/** While it plays, the server hears how far the person has got this often, in seconds of video. */
const REPORT_EVERY = 10;

/**
 * The player, which also tells the server the furthest point the person has
 * played (the operator's "Quick Edit 4:12 of 5:03"): as it plays, when it
 * pauses or ends, and when the dialog closes on it.
 */
function Player({ tab, video, captions }: { tab: SitesTabId; video: string; captions: string }) {
  // Nothing draws these, so they stay out of state.
  const watched = useRef({ furthest: 0, reported: 0, length: 0 });

  const report = useCallback(() => {
    const w = watched.current;
    if (w.length === 0 || Math.floor(w.furthest) <= Math.floor(w.reported)) return;
    w.reported = w.furthest;
    void welcomeVideoWatched(tab, w.furthest, w.length);
  }, [tab]);

  // Closing the dialog removes a playing video with no pause event.
  useEffect(() => report, [report]);

  return (
    // The time fragment has iOS draw the first frame where it would show an empty player.
    <video
      className="aspect-video w-full bg-black"
      controls
      playsInline
      preload="metadata"
      src={`${video}#t=0.001`}
      onTimeUpdate={(e) => {
        const player = e.currentTarget;
        const w = watched.current;
        if (Number.isFinite(player.duration)) w.length = player.duration;
        // Dragging the position along a paused video is not watching it.
        if (player.paused || player.seeking || player.currentTime <= w.furthest) return;
        w.furthest = player.currentTime;
        if (w.furthest - w.reported >= REPORT_EVERY) report();
      }}
      onPause={report}
      onEnded={report}
    >
      <track kind="captions" src={captions} srcLang="en" label="English" default />
    </video>
  );
}

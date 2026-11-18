// UI: see docs/UX_PATTERNS.md for layout and component conventions.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
 * own player, started by the person and never by the page, with its captions
 * in a strip under the picture, where they cover nothing the video shows.
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
 * The caption the player is on, as plain text, or null while the person has
 * turned captions off in the player's own menu. The track stays "showing",
 * so that menu and full screen behave as usual; `.welcome-video` in
 * globals.css hides the browser's drawing of it everywhere but full screen,
 * where the strip can't follow.
 */
function useCaption(trackRef: React.RefObject<HTMLTrackElement | null>): string | null {
  const [caption, setCaption] = useState<string | null>("");
  useEffect(() => {
    const element = trackRef.current;
    const video = element?.parentElement;
    if (!element || !(video instanceof HTMLVideoElement)) return;
    const track = element.track;
    const read = () =>
      setCaption(
        track.mode === "disabled"
          ? null
          : [...(track.activeCues ?? [])]
              // Its text with the entities read (&amp; is &) and any markup dropped; the
              // strip is wider than the picture's two lines, so it wraps the words itself.
              .map((cue) => (cue instanceof VTTCue ? (cue.getCueAsHTML().textContent ?? "") : ""))
              .join(" ")
              .replace(/\s+/g, " ")
              .trim(),
      );
    track.addEventListener("cuechange", read);
    video.textTracks.addEventListener("change", read);
    return () => {
      track.removeEventListener("cuechange", read);
      video.textTracks.removeEventListener("change", read);
    };
  }, [trackRef]);
  return caption;
}

/**
 * The player, which also tells the server the furthest point the person has
 * played (the operator's "Quick Edit 4:12 of 5:03"): as it plays, when it
 * pauses or ends, and when the dialog closes on it.
 */
function Player({ tab, video, captions }: { tab: SitesTabId; video: string; captions: string }) {
  // Nothing draws these, so they stay out of state.
  const watched = useRef({ furthest: 0, reported: 0, length: 0 });
  const track = useRef<HTMLTrackElement>(null);
  const caption = useCaption(track);

  const report = useCallback(() => {
    const w = watched.current;
    if (w.length === 0 || Math.floor(w.furthest) <= Math.floor(w.reported)) return;
    w.reported = w.furthest;
    void welcomeVideoWatched(tab, w.furthest, w.length);
  }, [tab]);

  // Closing the dialog removes a playing video with no pause event.
  useEffect(() => report, [report]);

  return (
    <>
      {/* The time fragment has iOS draw the first frame where it would show an empty player. */}
      <video
        className="welcome-video aspect-video w-full bg-black"
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
        <track ref={track} kind="captions" src={captions} srcLang="en" label="English" default />
      </video>
      {caption === null ? null : (
        // Room for two lines (three on a phone) whether or not a caption is up, so the dialog holds still between them.
        <p className="min-h-24 px-6 py-3 text-center text-base leading-6 text-balance sm:min-h-20 sm:text-lg sm:leading-7">{caption}</p>
      )}
    </>
  );
}

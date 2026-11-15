"use client";
// UI: see docs/UX_PATTERNS.md for layout and component conventions.

import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns/empty-state";
import { keepHold } from "@/actions/site-editor";
import { isActivityMessage, KEEP_EVERY_MS, shouldKeep, wasIdle } from "@/lib/site-hold-policy";
import { DRAFT_CHANGED, DRAFT_PUBLISHED } from "./draft-status";

type Hold = {
  /** Who else is editing the site; null while it is this person's to edit. */
  by: string | null;
  hasDraft: boolean;
  /** Goes up when the site moved while this page wasn't holding it: whatever shows the site mounts again. */
  epoch: number;
  /** A write was just refused because someone else has the site: say so now, not at the page's next turn. */
  heldBy: (by: string) => void;
};

const HoldContext = createContext<Hold>({ by: null, hasDraft: false, epoch: 0, heldBy: () => {} });

/** Who has the site, on an editing page. Outside one, the site reads as this person's. */
export const useSiteHold = () => useContext(HoldContext);

/**
 * Keeps the site for the person on an editing page (PRD D64) and knows who
 * has it when they don't. The page asks when it opens, about every 25
 * seconds while its person is active, and at once when they come back from
 * being away; a page whose person has gone quiet stops asking, and the hold
 * runs out on its own. The tool layer decides who may write: this only keeps
 * the hold between writes and shows the answer.
 */
export function SiteHoldProvider({
  initial,
  children,
}: {
  /** Who has the site as the page rendered (`getSiteEditing`). */
  initial: { by: string | null; marker: string; hasDraft: boolean };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [by, setBy] = useState(initial.by);
  const [hasDraft, setHasDraft] = useState(initial.hasDraft);
  const [epoch, setEpoch] = useState(0);
  const page = useRef({ by: initial.by, marker: initial.marker, lastActive: 0, asking: false });

  const keep = useCallback(async () => {
    const p = page.current;
    if (p.asking) return;
    p.asking = true;
    try {
      const result = await keepHold();
      if ("error" in result) return;
      setHasDraft(result.hasDraft);
      if (result.by !== null) {
        p.by = result.by;
        setBy(result.by);
        return;
      }
      // The site was someone else's until now, or moved while this page wasn't
      // holding it: show it as it is, never as this page last saw it.
      if (p.by !== null || (result.fresh && result.marker !== p.marker)) {
        router.refresh();
        setEpoch((e) => e + 1);
      }
      p.by = null;
      p.marker = result.marker;
      setBy(null);
    } catch {
      // The server couldn't be reached. The page's next turn asks again.
    } finally {
      p.asking = false;
    }
  }, [router]);

  useEffect(() => {
    const p = page.current;
    p.lastActive = Date.now();
    void keep();

    const turn = () => {
      const visible = document.visibilityState === "visible";
      if (shouldKeep({ now: Date.now(), lastActive: p.lastActive, waiting: p.by !== null, visible })) void keep();
    };
    const active = () => {
      const now = Date.now();
      const back = wasIdle(now, p.lastActive);
      p.lastActive = now;
      if (back) void keep();
    };
    // Typing and clicking inside the site's frame never reach this window; the frame's reports do.
    const onMessage = (e: MessageEvent) => {
      if (isActivityMessage(e.data)) active();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") turn();
    };
    // This person's own edit moved the draft: learn where it stands now, so only someone else's edit reads as a move.
    const ownChange = () => void keep();

    const events = ["keydown", "pointerdown", "pointermove", "wheel", "touchstart"] as const;
    for (const name of events) window.addEventListener(name, active, { passive: true });
    window.addEventListener("message", onMessage);
    window.addEventListener(DRAFT_CHANGED, ownChange);
    window.addEventListener(DRAFT_PUBLISHED, ownChange);
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(turn, KEEP_EVERY_MS);
    return () => {
      for (const name of events) window.removeEventListener(name, active);
      window.removeEventListener("message", onMessage);
      window.removeEventListener(DRAFT_CHANGED, ownChange);
      window.removeEventListener(DRAFT_PUBLISHED, ownChange);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [keep]);

  const heldBy = useCallback((name: string) => {
    page.current.by = name;
    setBy(name);
  }, []);

  const value = useMemo(() => ({ by, hasDraft, epoch, heldBy }), [by, hasDraft, epoch, heldBy]);
  return <HoldContext.Provider value={value}>{children}</HoldContext.Provider>;
}

/** Who is editing, where the page's own editing would be. */
export function SiteHeldNotice({ by, previewHref }: { by: string; previewHref?: string }) {
  return (
    <div role="status">
      <EmptyState
        title={`${by} is editing the site`}
        action={
          previewHref ? (
            <Button asChild>
              <a href={previewHref} target="_blank" rel="opener">
                Preview
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

/**
 * A page's editing surface while the site is this person's, and who is
 * editing while it is someone else's. What it wraps mounts again when the
 * site comes back, so it never shows what it held before.
 */
export function WhileHolding({ previewHref, children }: { previewHref: string; children: React.ReactNode }) {
  const { by, hasDraft, epoch } = useSiteHold();
  if (by) return <SiteHeldNotice by={by} previewHref={hasDraft ? previewHref : undefined} />;
  return <Fragment key={epoch}>{children}</Fragment>;
}

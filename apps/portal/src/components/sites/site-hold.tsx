"use client";
// UI: see docs/UX_PATTERNS.md for layout and component conventions.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns/empty-state";
import { keepHold } from "@/actions/site-editor";
import { ASK_EVERY_MS, draftNotice, editingNotice, isActivityMessage, shouldAsk, wasIdle } from "@/lib/site-hold-policy";
import { DRAFT_CHANGED, DRAFT_PUBLISHED, HOLD_CHANGED } from "./draft-status";

type Hold = {
  /** Who else is making edits; null while nobody is, or this person is. */
  by: string | null;
  hasDraft: boolean;
  /** Whose the draft is, when it is someone else's to publish or discard before this person can edit; null otherwise. */
  draftBy: string | null;
  /** What that draft changes. */
  draftSummary: string | null;
  /** Goes up when the site moved under this page: whatever shows the site mounts again. */
  epoch: number;
  /** A write was just refused because the site or its draft is someone else's: say so now, not at the page's next turn. */
  refused: (refusal: { heldBy?: string; draftBy?: string }) => void;
  /**
   * This person has started an edit the server hasn't seen yet (a field
   * opened on the canvas): the site becomes theirs now, unless someone else
   * has it. A write needs no call: the tool layer takes the site for it.
   */
  begin: () => void;
  /** Where the site stood at this page's last word of it (the tool layer's marker). */
  marker: () => string;
  /** This page's own write moved the site to here. */
  wrote: (marker: string) => void;
};

/** Fired just before an editing surface mounts again because the site moved under it, so it can say what it was holding. */
export const SITE_MOVED = "canopy:site-moved";

const HoldContext = createContext<Hold>({
  by: null,
  hasDraft: false,
  draftBy: null,
  draftSummary: null,
  epoch: 0,
  refused: () => {},
  begin: () => {},
  marker: () => "",
  wrote: () => {},
});

/** Who has the site, on an editing page. Outside one, nobody else does. */
export const useSiteHold = () => useContext(HoldContext);

/**
 * Follows who has the site on an editing page (PRD D64). Being on the page
 * takes nothing: the site becomes this person's when they start an edit.
 * From then the page keeps their hold going by asking about every 25 seconds
 * while they are active, and stops once they have gone quiet, so the hold
 * runs out on its own. Everyone else's page asks the same question to learn
 * who is making edits, and whose the draft is when it isn't theirs to add to.
 * The tool layer decides who may write: this only keeps a hold between
 * writes and shows the answer.
 */
export function SiteHoldProvider({
  initial,
  reload = true,
  children,
}: {
  /** Who has the site as the page rendered (`getSiteEditing`). */
  initial: { by: string | null; marker: string; hasDraft: boolean; draftBy: string | null; draftSummary: string | null };
  /** False for a page that follows the draft itself, as the preview page does: it is never refreshed from here. */
  reload?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [by, setBy] = useState(initial.by);
  const [hasDraft, setHasDraft] = useState(initial.hasDraft);
  const [draft, setDraft] = useState({ by: initial.draftBy, summary: initial.draftSummary });
  const [epoch, setEpoch] = useState(0);
  const page = useRef({
    by: initial.by,
    /** Whether the site was this person's at the last answer. */
    mine: false,
    marker: initial.marker,
    lastActive: 0,
    asking: false,
    /** Something changed while a call was out: ask once more when it returns. */
    again: false,
    /** The next call takes the site, not only asks. */
    take: false,
    /** When this browser last changed the draft itself; 0 once an answer from after it has been read. */
    ownAt: 0,
  });

  const ask = useCallback(async () => {
    const p = page.current;
    if (p.asking) {
      p.again = true;
      return;
    }
    p.asking = true;
    try {
      do {
        p.again = false;
        const startedAt = Date.now();
        const take = p.take;
        p.take = false;
        const result = await keepHold({ take });
        if ("error" in result) continue;
        setHasDraft(result.hasDraft);
        setDraft((d) => (d.by === result.draftBy && d.summary === result.draftSummary ? d : { by: result.draftBy, summary: result.draftSummary }));
        if (result.by !== null) {
          p.by = result.by;
          p.mine = false;
          // Whatever they change from here is theirs, not this browser's.
          p.ownAt = 0;
          setBy(result.by);
          continue;
        }
        // The draft moving is this person's own doing when this browser just changed it. An
        // answer asked for before that change may already include it, so the change stays
        // their own until an answer asked for after it comes back.
        const own = p.ownAt > 0;
        if (own && startedAt >= p.ownAt) p.ownAt = 0;
        // The site moved without this page (someone else edited, here or while it wasn't
        // looking): show it as it is, never as this page last saw it. A person who had the
        // site and changed nothing leaves this page as it was, an open field included.
        if (reload && result.marker !== p.marker && !own) {
          window.dispatchEvent(new Event(SITE_MOVED));
          router.refresh();
          setEpoch((e) => e + 1);
        }
        p.by = null;
        p.mine = result.mine;
        p.marker = result.marker;
        setBy(null);
      } while (p.again);
    } catch {
      // The server couldn't be reached. The page's next turn asks again.
    } finally {
      p.asking = false;
    }
  }, [reload, router]);

  // The Sites chrome holds back Discard while the site is someone else's: tell it when that changes.
  const announced = useRef(initial.by);
  useEffect(() => {
    if (announced.current === by) return;
    announced.current = by;
    window.dispatchEvent(new Event(HOLD_CHANGED));
  }, [by]);

  useEffect(() => {
    const p = page.current;
    p.lastActive = Date.now();
    void ask();

    const turn = () => {
      const visible = document.visibilityState === "visible";
      if (shouldAsk({ now: Date.now(), lastActive: p.lastActive, holding: p.mine, visible })) void ask();
    };
    const active = () => {
      const now = Date.now();
      const back = wasIdle(now, p.lastActive);
      p.lastActive = now;
      if (back) void ask();
    };
    // Typing and clicking inside the site's frame never reach this window; the frame's reports do.
    const onMessage = (e: MessageEvent) => {
      if (isActivityMessage(e.data)) active();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") turn();
    };
    const ownChange = () => {
      p.ownAt = Date.now();
      void ask();
    };

    const events = ["keydown", "pointerdown", "pointermove", "wheel", "touchstart"] as const;
    for (const name of events) window.addEventListener(name, active, { passive: true });
    window.addEventListener("message", onMessage);
    window.addEventListener(DRAFT_CHANGED, ownChange);
    window.addEventListener(DRAFT_PUBLISHED, ownChange);
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(turn, ASK_EVERY_MS);
    return () => {
      for (const name of events) window.removeEventListener(name, active);
      window.removeEventListener("message", onMessage);
      window.removeEventListener(DRAFT_CHANGED, ownChange);
      window.removeEventListener(DRAFT_PUBLISHED, ownChange);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [ask]);

  const refused = useCallback(
    (refusal: { heldBy?: string; draftBy?: string }) => {
      if (refusal.heldBy) {
        page.current.by = refusal.heldBy;
        page.current.mine = false;
        setBy(refusal.heldBy);
      }
      // Whose draft it is comes with what it changes: ask for both.
      if (refusal.draftBy) void ask();
    },
    [ask],
  );

  const begin = useCallback(() => {
    page.current.take = true;
    page.current.lastActive = Date.now();
    void ask();
  }, [ask]);

  const marker = useCallback(() => page.current.marker, []);
  const wrote = useCallback((to: string) => {
    page.current.marker = to;
  }, []);

  const value = useMemo(
    () => ({ by, hasDraft, draftBy: draft.by, draftSummary: draft.summary, epoch, refused, begin, marker, wrote }),
    [by, hasDraft, draft, epoch, refused, begin, marker, wrote],
  );
  return <HoldContext.Provider value={value}>{children}</HoldContext.Provider>;
}

function PreviewLink({ href }: { href: string }) {
  return (
    <Button asChild>
      <a href={href} target="_blank" rel="opener">
        Preview
        <ExternalLink className="h-4 w-4" />
      </a>
    </Button>
  );
}

/**
 * Why this person can't edit right now, in the one line everyone else is
 * shown: someone is making edits, or someone's draft waits to be published
 * or discarded. Null when they can.
 */
export function blockedNotice(hold: Pick<Hold, "by" | "draftBy">): string | null {
  if (hold.by) return editingNotice(hold.by);
  if (hold.draftBy) return draftNotice(hold.draftBy);
  return null;
}

/** That line, where the page's own editing would be. */
export function SiteNotice({ title, previewHref }: { title: string; previewHref?: string }) {
  return (
    <div role="status">
      <EmptyState title={title} action={previewHref ? <PreviewLink href={previewHref} /> : undefined} />
    </div>
  );
}

/**
 * The Editor's canvas, with the site behind frosted glass while this person
 * can't edit it: someone else is making edits, or someone else's draft waits
 * to be published or discarded, in which case what it changes is listed. What
 * it wraps stays mounted and out of reach meanwhile, and mounts again when
 * the site has moved, so it never shows what it held before.
 */
export function BehindGlass({ previewHref, children }: { previewHref: string; children: React.ReactNode }) {
  const hold = useSiteHold();
  const title = blockedNotice(hold);
  return (
    <div className="relative">
      <div key={hold.epoch} inert={title !== null} aria-hidden={title !== null ? true : undefined}>
        {children}
      </div>
      {title !== null ? (
        <div role="status" className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 rounded-lg bg-background/60 px-6 text-center backdrop-blur-md">
          <div className="space-y-2">
            <h3 className="font-heading text-[1.375rem] font-semibold leading-tight">{title}</h3>
            {!hold.by && hold.draftSummary ? <p className="mx-auto max-w-xl text-sm text-muted-foreground">{hold.draftSummary}</p> : null}
          </div>
          {hold.hasDraft ? <PreviewLink href={previewHref} /> : null}
        </div>
      ) : null}
    </div>
  );
}

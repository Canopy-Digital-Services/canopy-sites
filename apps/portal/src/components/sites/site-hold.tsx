"use client";
// UI: see docs/UX_PATTERNS.md for layout and component conventions.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns/empty-state";
import { keepHold } from "@/actions/site-editor";
import { ASK_EVERY_MS, editingNotice, isActivityMessage, shouldAsk, wasIdle } from "@/lib/site-hold-policy";
import { DRAFT_CHANGED, DRAFT_PUBLISHED } from "./draft-status";

type Hold = {
  /** Who else is making edits; null while nobody is, or this person is. */
  by: string | null;
  hasDraft: boolean;
  /** Goes up when the site moved under this page: whatever shows the site mounts again. */
  epoch: number;
  /** A write was just refused because someone else has the site: say so now, not at the page's next turn. */
  heldBy: (by: string) => void;
  /**
   * This person has started an edit the server hasn't seen yet (a field
   * opened on the canvas): the site becomes theirs now, unless someone else
   * has it. A write needs no call: the tool layer takes the site for it.
   */
  begin: () => void;
};

const HoldContext = createContext<Hold>({ by: null, hasDraft: false, epoch: 0, heldBy: () => {}, begin: () => {} });

/** Who has the site, on an editing page. Outside one, nobody else does. */
export const useSiteHold = () => useContext(HoldContext);

/**
 * Follows who has the site on an editing page (PRD D64). Being on the page
 * takes nothing: the site becomes this person's when they start an edit.
 * From then the page keeps their hold going by asking about every 25 seconds
 * while they are active, and stops once they have gone quiet, so the hold
 * runs out on its own. Everyone else's page asks the same question to learn
 * who is making edits. The tool layer decides who may write: this only keeps
 * a hold between writes and shows the answer.
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
        if (result.by !== null) {
          p.by = result.by;
          p.mine = false;
          setBy(result.by);
          continue;
        }
        // The draft moving is this person's own doing when this browser just changed it. An
        // answer asked for before that change may already include it, so the change stays
        // their own until an answer asked for after it comes back.
        const own = p.ownAt > 0;
        if (own && startedAt >= p.ownAt) p.ownAt = 0;
        // The site was someone else's until now, or moved without this page: show it as it
        // is, never as this page last saw it.
        if (p.by !== null || (result.marker !== p.marker && !own)) {
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
  }, [router]);

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

  const heldBy = useCallback((name: string) => {
    page.current.by = name;
    page.current.mine = false;
    setBy(name);
  }, []);

  const begin = useCallback(() => {
    page.current.take = true;
    page.current.lastActive = Date.now();
    void ask();
  }, [ask]);

  const value = useMemo(() => ({ by, hasDraft, epoch, heldBy, begin }), [by, hasDraft, epoch, heldBy, begin]);
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

/** Who is making edits, where the page's own editing would be. */
export function SiteHeldNotice({ by, previewHref }: { by: string; previewHref?: string }) {
  return (
    <div role="status">
      <EmptyState title={editingNotice(by)} action={previewHref ? <PreviewLink href={previewHref} /> : undefined} />
    </div>
  );
}

/**
 * The Editor's canvas, with the site behind frosted glass and who is making
 * edits over it while someone else has the site. What it wraps stays mounted
 * and out of reach meanwhile, and mounts again when the site comes back, so
 * it never shows what it held before.
 */
export function BehindGlass({ previewHref, children }: { previewHref: string; children: React.ReactNode }) {
  const { by, hasDraft, epoch } = useSiteHold();
  return (
    <div className="relative">
      <div key={epoch} inert={by !== null} aria-hidden={by !== null ? true : undefined}>
        {children}
      </div>
      {by !== null ? (
        <div role="status" className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 rounded-lg bg-background/60 px-6 text-center backdrop-blur-md">
          <h3 className="font-heading text-[1.375rem] font-semibold leading-tight">{editingNotice(by)}</h3>
          {hasDraft ? <PreviewLink href={previewHref} /> : null}
        </div>
      ) : null}
    </div>
  );
}

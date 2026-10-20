"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getSitePreviewState, publishPreview } from "@/actions/site-editor";
import { announceDraft } from "@/components/sites/draft-status";
import { sitePath, type LiveSite } from "@/lib/site-live";

type Pending = {
  id: string;
  summary: string;
  status: string;
  error: string | null;
  buildId: string | null;
  buildStatus: string | null;
  publishable: string | null;
};
type Slot = { html: string; build: string | null; key: number };

const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");
const BAR_HEIGHT = 56;

/**
 * The preview page's view: the site in a full-window sandboxed srcdoc frame
 * (the canvas's document, in the bridge's view mode), and the preview bar.
 * A newer build of the draft loads behind the page on screen and swaps in at
 * the same scroll position. Publish sends the build on screen, so only what
 * the owner is looking at can go live.
 */
export function PreviewView({
  siteId,
  siteName,
  live,
  startPath,
  liveNow,
  host,
}: {
  siteId: string;
  siteName: string;
  live: LiveSite;
  startPath: string;
  liveNow: boolean;
  host: string | null;
}) {
  const frames = useRef<Array<HTMLIFrameElement | null>>([null, null]);
  const [slots, setSlots] = useState<Array<Slot | null>>([null, null]);
  const [active, setActive] = useState(0);
  const [path, setPath] = useState(startPath);
  const [loadError, setLoadError] = useState(false);
  const [pending, setPending] = useState<Pending | null | undefined>(undefined);
  const [published, setPublished] = useState(false);
  const [isPublishing, startPublish] = useTransition();
  const activeRef = useRef(0);
  const slotKey = useRef(0);
  const scrollY = useRef(0);
  const swapping = useRef<{ slot: number; y: number } | null>(null);
  /** The last build brought in, so a build the canvas route can't show isn't asked for again and again. */
  const attempted = useRef<string | null>(null);
  const firstPath = useRef(true);
  const shownBuild = slots[active]?.build ?? null;

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const fetchPage = useCallback(
    async (to: string): Promise<Omit<Slot, "key">> => {
      const res = await fetch(`/canvas/${siteId}${encodePath(to)}?view=preview`, { cache: "no-store" });
      if (!res.ok && res.status !== 404) throw new Error(String(res.status));
      return { html: await res.text(), build: res.headers.get("x-canopy-build") };
    },
    [siteId],
  );

  // Navigation: the page on screen, from the top.
  useEffect(() => {
    let current = true;
    swapping.current = null;
    fetchPage(path).then(
      (page) => {
        if (!current) return;
        setLoadError(false);
        setSlots((s) => s.map((x, i) => (i === activeRef.current ? { ...page, key: ++slotKey.current } : x)));
      },
      () => current && setLoadError(true),
    );
    return () => {
      current = false;
    };
  }, [path, fetchPage]);

  /** Loads the newest build of this page behind the one on screen; it swaps in once scrolled to the same place. */
  const refreshInPlace = useCallback(async () => {
    try {
      const page = await fetchPage(path);
      const slot = 1 - activeRef.current;
      const swap = { slot, y: scrollY.current };
      swapping.current = swap;
      setSlots((s) => s.map((x, i) => (i === slot ? { ...page, key: ++slotKey.current } : x)));
      // A page that never reports back doesn't hold up the next update.
      setTimeout(() => {
        if (swapping.current === swap) swapping.current = null;
      }, 10_000);
    } catch {
      // The page on screen stays; the next check tries again.
    }
  }, [fetchPage, path]);

  // The tab's address follows the site's own navigation, so reload and back work.
  useEffect(() => {
    const url = `/preview/${siteId}${path === "/" ? "" : encodePath(path)}`;
    const first = firstPath.current;
    firstPath.current = false;
    if (window.location.pathname === url) return;
    // The page as opened (no path) becomes the changed page's address; later moves add history.
    if (first) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }, [path, siteId]);
  useEffect(() => {
    const onPop = () => {
      const rest = window.location.pathname.slice(`/preview/${siteId}`.length);
      setPath(rest ? decodeURIComponent(rest) : "/");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [siteId]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const m = e.data as { source?: string; type?: string; [k: string]: unknown };
      if (!m || m.source !== "canopy-canvas") return;
      const swap = swapping.current;
      if (swap && e.source === frames.current[swap.slot]?.contentWindow) {
        if (m.type === "ready") frames.current[swap.slot]?.contentWindow?.postMessage({ type: "restore", y: swap.y }, "*");
        else if (m.type === "restored") {
          swapping.current = null;
          setActive(swap.slot);
        }
        return;
      }
      if (e.source !== frames.current[activeRef.current]?.contentWindow) return;
      if (m.type === "scroll") scrollY.current = Number(m.y) || 0;
      else if (m.type === "navigate") setPath(sitePath(live, String(m.path)));
      else if (m.type === "external" && typeof m.href === "string" && /^https?:/.test(m.href)) window.open(m.href, "_blank", "noopener");
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [live]);

  // The draft's state, every few seconds while the tab is in view, so an edit
  // made in another tab shows here once it's built.
  const check = useCallback(
    () =>
      getSitePreviewState(siteId).then((result) => {
        if (!("error" in result)) setPending(result.pending);
      }),
    [siteId],
  );
  useEffect(() => {
    let active = true;
    getSitePreviewState(siteId).then((result) => {
      if (active && !("error" in result)) setPending(result.pending);
    });
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [check, siteId]);

  // A newer finished build than the one on screen: bring it in. A draft gone
  // elsewhere (published or discarded): show the live page.
  const onScreen = Boolean(slots[active]);
  useEffect(() => {
    // Until a page is on screen there is nothing to compare: the first load shows the newest build anyway.
    if (published || pending === undefined || !onScreen || swapping.current) return;
    if (pending === null) {
      if (shownBuild && attempted.current !== "live") {
        attempted.current = "live";
        refreshInPlace();
      }
      return;
    }
    const want = pending.publishable;
    if (!want || want === shownBuild || want === attempted.current) return;
    attempted.current = want;
    refreshInPlace();
  }, [pending, shownBuild, onScreen, published, refreshInPlace]);

  function publish() {
    if (!pending || !shownBuild) return;
    startPublish(async () => {
      const result = await publishPreview({ changeSetId: pending.id, buildId: shownBuild });
      if ("error" in result) {
        toast.error(result.error);
        check();
        return;
      }
      setPublished(true);
      announceDraft("published");
    });
  }

  const building = pending?.buildStatus === "QUEUED" || pending?.buildStatus === "RUNNING";
  const failed = pending?.status === "DRAFT" && pending.buildStatus === "FAILED";
  const ready = Boolean(pending?.publishable && pending.publishable === shownBuild);
  let message: string;
  if (published) message = liveNow ? "Published. Your site is live." : `Published. It will be live${host ? ` on ${host}` : ""} in a few minutes.`;
  else if (pending === undefined) message = "Loading";
  else if (pending === null) message = "No unpublished changes";
  else if (failed) message = "This preview couldn't be built";
  else if (ready) message = "Previewing unpublished changes";
  else message = "Updating preview";

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="relative flex-1">
        {slots.map((slot, i) =>
          slot ? (
            <iframe
              key={slot.key}
              ref={(el) => {
                frames.current[i] = el;
              }}
              srcDoc={slot.html}
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
              title={i === active ? `Preview of ${siteName}` : "Updating"}
              aria-hidden={i === active ? undefined : true}
              tabIndex={i === active ? undefined : -1}
              className="absolute inset-0 h-full w-full border-0 bg-white"
              style={{ visibility: i === active ? "visible" : "hidden", pointerEvents: i === active ? "auto" : "none" }}
            />
          ) : null,
        )}
        {loadError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">This page couldn&apos;t be loaded.</p>
          </div>
        ) : null}
      </div>
      <div
        className="flex shrink-0 flex-wrap items-center justify-center gap-x-5 gap-y-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        style={{ minHeight: BAR_HEIGHT }}
        role="region"
        aria-label="Preview"
      >
        <span className="flex items-center gap-2" aria-live="polite">
          {(building && !ready) || pending === undefined || isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {message}
        </span>
        {failed && pending?.error ? <span className="max-w-md truncate font-normal opacity-90">{pending.error}</span> : null}
        {!published && pending ? (
          <Button variant="outline" size="sm" className="text-foreground" onClick={publish} disabled={!ready || isPublishing}>
            Publish
          </Button>
        ) : null}
      </div>
    </div>
  );
}

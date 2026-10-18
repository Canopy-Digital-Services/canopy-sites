"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Lightbulb, Loader2, Monitor, Send, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { fieldInfo, fieldLimit, type FieldInfo } from "@canopy/site-contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { refreshPendingChange, saveCanvasEdits, sendQuickEdit } from "@/actions/site-editor";
import { DRAFT_CHANGED, DRAFT_PUBLISHED } from "@/components/sites/draft-status";

export type CanvasPage = { path: string; title: string };
type AnnouncementDates = { id: string; startsOn: string; endsOn: string };
type Rect = { x: number; y: number; width: number; height: number };
type Edit = { address: string; value: string | null };
type ChatMessage = { id: number; role: "owner" | "assistant"; text: string };

const DESKTOP_WIDTH = 1280;
const PHONE_WIDTH = 390;
const PANEL_WIDTH = 320;
/** Kinds the canvas edits in place; every other marked field opens quick edit (PRD D37). */
const IN_PLACE = new Set(["text", "paragraph", "price"]);

interface Selected {
  address: string;
  /** Which of the field's appearances on the page was clicked (a price shows in two places). */
  index: number;
  original: string;
  value: string;
  rect: Rect;
  info: FieldInfo | null;
  limit?: number;
  mode: "edit" | "ask";
  error?: string;
}

/** "/demo/services/" and "/demo/services#x" are the same page: "/demo/services". */
function pagePath(path: string) {
  const bare = path.split("#")[0].replace(/\/+$/, "");
  return bare === "/demo" || bare === "" ? "/demo/" : bare;
}

const oneLine = (v: string) => v.replace(/\s+/g, " ").trim();

/**
 * The visual editor's canvas (PRD D35, D43). The page's HTML comes from /demo
 * in editor mode, fetched here with the session, and shows in a sandboxed
 * srcdoc frame; the bridge inside it reports clicks on marked fields and
 * asks to navigate, and edits text in place. Saves go to the site's draft
 * one at a time; Publish lives in the Sites chrome.
 */
export function CanvasEditor({
  siteId,
  pages,
  limits,
  announcements,
}: {
  siteId: string;
  pages: CanvasPage[];
  limits: Record<string, number>;
  announcements: AnnouncementDates[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // Two frames: the one on screen, and one a newer build of the same page loads into
  // behind it, so an update swaps in at the same place instead of reloading the page.
  const frames = useRef<Array<HTMLIFrameElement | null>>([null, null]);
  const [wrapWidth, setWrapWidth] = useState(1000);
  const [viewport, setViewport] = useState<"desktop" | "phone">("desktop");
  const [history, setHistory] = useState<{ stack: string[]; at: number }>({ stack: [pages[0]?.path ?? "/demo/"], at: 0 });
  const path = history.stack[history.at];
  const [slots, setSlots] = useState<Array<{ html: string; key: number } | null>>([null, null]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "updating" | "error">("idle");
  const [dates, setDates] = useState<{ startsOn: string; endsOn: string } | null>(null);
  const selectedRef = useRef<Selected | null>(null);
  const hashRef = useRef<string | null>(null);
  const activeRef = useRef(0);
  const scrollYRef = useRef(0);
  const swapRef = useRef<{ slot: number; y: number; address?: string; index?: number; top?: number } | null>(null);
  const refreshWaitingRef = useRef(false);
  const slotKey = useRef(0);
  const saveChain = useRef<Promise<void>>(Promise.resolve());

  selectedRef.current = selected;
  activeRef.current = active;

  const post = useCallback((msg: Record<string, unknown>) => {
    frames.current[activeRef.current]?.contentWindow?.postMessage(msg, "*");
  }, []);

  const fetchPage = useCallback(async (target: string) => {
    const res = await fetch(`${target}?canopy_editor=1`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    return res.text();
  }, []);

  /** Loads a page into the frame on screen: navigation, from the top. */
  const load = useCallback(
    async (target: string) => {
      swapRef.current = null;
      setLoading(true);
      setLoadError(false);
      try {
        const html = await fetchPage(target);
        const at = activeRef.current;
        setSlots((s) => s.map((slot, i) => (i === at ? { html, key: ++slotKey.current } : slot)));
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    },
    [fetchPage],
  );

  /**
   * Shows the newest build of the page without losing the owner's place: it
   * loads behind the frame on screen, scrolls to the same spot, reselects the
   * same field, and only then swaps in. Waits while the owner is typing in a field.
   */
  const refreshInPlace = useCallback(async () => {
    if (selectedRef.current?.mode === "edit") {
      refreshWaitingRef.current = true;
      return;
    }
    refreshWaitingRef.current = false;
    try {
      const html = await fetchPage(pagePath(history.stack[history.at]));
      const slot = 1 - activeRef.current;
      const s = selectedRef.current;
      swapRef.current = { slot, y: scrollYRef.current, address: s?.address, index: s?.index, top: s?.rect.y };
      setSlots((all) => all.map((x, i) => (i === slot ? { html, key: ++slotKey.current } : x)));
    } catch {
      setSaveState("error");
    }
  }, [fetchPage, history]);

  useEffect(() => {
    load(path);
  }, [path, load]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWrapWidth(el.clientWidth));
    observer.observe(el);
    setWrapWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const close = useCallback(
    (restore: boolean) => {
      if (restore) post({ type: "finish" });
      post({ type: "deselect" });
      setSelected(null);
      setDates(null);
      if (refreshWaitingRef.current) refreshInPlace();
    },
    [post, refreshInPlace],
  );

  const navigate = useCallback(
    (to: string) => {
      const [, hash] = to.split("#");
      hashRef.current = hash ?? null;
      const next = pagePath(to);
      setSelected(null);
      setDates(null);
      setHistory((h) => {
        if (h.stack[h.at] === next) {
          load(next);
          return h;
        }
        return { stack: [...h.stack.slice(0, h.at + 1), next], at: h.at + 1 };
      });
    },
    [load],
  );

  /** Brings the canvas up to date once the draft's build has the change. */
  const reloadWhenBuilt = useCallback(
    async (changeSetId: string) => {
      setSaveState("updating");
      for (let i = 0; i < 80; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const r = await refreshPendingChange(changeSetId);
        if ("error" in r || r.status === "FAILED" || r.buildStatus === "FAILED") {
          setSaveState("error");
          return;
        }
        if (r.status === "PREVIEWED") {
          window.dispatchEvent(new Event(DRAFT_CHANGED));
          await refreshInPlace();
          return;
        }
      }
      setSaveState("idle");
    },
    [refreshInPlace],
  );

  const save = useCallback(
    (edits: Edit[], revert: () => void) => {
      setSaveState("saving");
      saveChain.current = saveChain.current.then(async () => {
        const result = await saveCanvasEdits({ siteId, edits });
        if ("error" in result) {
          toast.error(result.issues?.[0]?.message ?? result.error);
          revert();
          setSaveState("error");
          return;
        }
        setSaveState("saved");
        if (result.buildError) toast.error(result.buildError);
        window.dispatchEvent(new Event(DRAFT_CHANGED));
      });
    },
    [siteId],
  );

  const announcementOf = useCallback(
    (address: string) => {
      const m = /^announcements\/([^/]+)\/message$/.exec(address);
      return m ? (announcements.find((a) => a.id === m[1]) ?? null) : null;
    },
    [announcements],
  );

  const done = useCallback(() => {
    const s = selectedRef.current;
    if (!s || s.mode !== "edit") return;
    const text = oneLine(s.value);
    if (!text) {
      setSelected({ ...s, error: "This can't be empty." });
      return;
    }
    const edits: Edit[] = [];
    if (text !== oneLine(s.original)) edits.push({ address: s.address, value: text });
    const announcement = announcementOf(s.address);
    if (announcement && dates) {
      const base = s.address.replace(/\/message$/, "");
      for (const key of ["startsOn", "endsOn"] as const) {
        if (dates[key] === announcement[key]) continue;
        if (dates[key]) edits.push({ address: `${base}/${key}`, value: dates[key] });
        else if (announcement[key]) edits.push({ address: `${base}/${key}`, value: null });
      }
    }
    post({ type: "finish", value: text });
    close(false);
    if (edits.length) save(edits, () => post({ type: "patch", address: s.address, value: s.original }));
  }, [announcementOf, close, dates, post, save]);

  const doneRef = useRef(done);
  doneRef.current = done;

  const select = useCallback(
    (address: string, index: number, value: string, rect: Rect) => {
      const info = fieldInfo(address);
      const inPlace = Boolean(info && IN_PLACE.has(info.kind));
      const limit = fieldLimit(address, limits);
      setSelected({ address, index, original: value, value, rect, info, limit, mode: inPlace ? "edit" : "ask" });
      const announcement = announcementOf(address);
      setDates(announcement ? { startsOn: announcement.startsOn, endsOn: announcement.endsOn } : null);
      if (inPlace) post({ type: "edit", address, limit });
    },
    [announcementOf, limits, post],
  );

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const m = e.data as { source?: string; type?: string; [k: string]: unknown };
      if (!m || m.source !== "canopy-canvas") return;
      // The frame loading behind: restore the owner's place in it, then swap it in.
      const swap = swapRef.current;
      if (swap && e.source === frames.current[swap.slot]?.contentWindow) {
        if (m.type === "ready") {
          frames.current[swap.slot]?.contentWindow?.postMessage({ type: "restore", y: swap.y, address: swap.address, index: swap.index, top: swap.top }, "*");
        } else if (m.type === "restored") {
          swapRef.current = null;
          setActive(swap.slot);
          setSaveState("saved");
          if (m.rect) setSelected((s) => (s ? { ...s, rect: m.rect as Rect } : s));
        }
        return;
      }
      if (e.source !== frames.current[activeRef.current]?.contentWindow) return;
      switch (m.type) {
        case "ready":
          if (hashRef.current) post({ type: "scroll-hash", hash: hashRef.current });
          hashRef.current = null;
          break;
        case "select":
          select(String(m.address), Number(m.index) || 0, String(m.value ?? ""), m.rect as Rect);
          break;
        case "scroll":
          scrollYRef.current = Number(m.y) || 0;
          break;
        case "input":
          setSelected((s) => (s && s.address === m.address ? { ...s, value: String(m.value ?? ""), rect: m.rect as Rect, error: undefined } : s));
          break;
        case "rect":
          setSelected((s) => (s ? { ...s, rect: m.rect as Rect } : s));
          break;
        case "commit":
          doneRef.current();
          break;
        case "cancel":
        case "deselect":
          close(true);
          break;
        case "navigate":
          navigate(String(m.path));
          break;
        case "external":
          toast("That link goes to another site.");
          break;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [close, navigate, post, select]);

  useEffect(() => {
    const refresh = () => refreshInPlace();
    window.addEventListener(DRAFT_PUBLISHED, refresh);
    return () => window.removeEventListener(DRAFT_PUBLISHED, refresh);
  }, [refreshInPlace]);

  // Desktop shows the site at full width, scaled to fit; phone at its real size.
  const frameWidth = viewport === "desktop" ? DESKTOP_WIDTH : PHONE_WIDTH;
  const scale = viewport === "desktop" ? Math.min(1, wrapWidth / DESKTOP_WIDTH) : 1;
  const frameLeft = viewport === "desktop" ? 0 : Math.max(0, (wrapWidth - PHONE_WIDTH) / 2);
  const canvasHeight = 720;

  let panelStyle: React.CSSProperties | undefined;
  if (selected) {
    const left = Math.min(Math.max(8, frameLeft + selected.rect.x * scale), Math.max(8, wrapWidth - PANEL_WIDTH - 8));
    const bottom = (selected.rect.y + selected.rect.height) * scale;
    const below = bottom < canvasHeight * 0.55;
    panelStyle = below ? { left, top: bottom + 10 } : { left, top: selected.rect.y * scale - 10, transform: "translateY(-100%)" };
  }
  const current = pages.find((p) => p.path === path);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Back" disabled={history.at === 0} onClick={() => setHistory((h) => ({ ...h, at: h.at - 1 }))}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Forward"
                disabled={history.at >= history.stack.length - 1}
                onClick={() => setHistory((h) => ({ ...h, at: h.at + 1 }))}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
          <Select value={current ? current.path : ""} onValueChange={navigate}>
            <SelectTrigger size="sm" className="w-56" aria-label="Page">
              <SelectValue placeholder={path} />
            </SelectTrigger>
            <SelectContent>
              {pages.map((p) => (
                <SelectItem key={p.path} value={p.path}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          {saveState === "saving" ? (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving
            </span>
          ) : saveState === "updating" ? (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating preview
            </span>
          ) : saveState === "saved" ? (
            <span className="text-sm text-muted-foreground">Saved</span>
          ) : saveState === "error" ? (
            <span className="text-sm text-destructive">Not saved</span>
          ) : null}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={viewport === "desktop" ? "secondary" : "ghost"} size="icon-sm" aria-label="Desktop" onClick={() => setViewport("desktop")}>
                  <Monitor className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Desktop</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={viewport === "phone" ? "secondary" : "ghost"} size="icon-sm" aria-label="Phone" onClick={() => setViewport("phone")}>
                  <Smartphone className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Phone</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <div ref={wrapRef} className="relative w-full overflow-hidden rounded-lg border bg-muted" style={{ height: canvasHeight }}>
        {slots.map((slot, i) =>
          slot ? (
            <iframe
              key={slot.key}
              ref={(el) => {
                frames.current[i] = el;
              }}
              srcDoc={slot.html}
              sandbox="allow-scripts"
              title={i === active ? "Your site in the editor" : "Updating"}
              aria-hidden={i === active ? undefined : true}
              tabIndex={i === active ? undefined : -1}
              className="absolute top-0 origin-top-left border-0 bg-white"
              style={{
                left: frameLeft,
                width: frameWidth,
                height: canvasHeight / scale,
                transform: `scale(${scale})`,
                visibility: i === active ? "visible" : "hidden",
                pointerEvents: i === active ? "auto" : "none",
              }}
            />
          ) : null,
        )}
        {loading ? (
          <div className="absolute right-3 top-3 flex items-center gap-2 rounded-md bg-card px-2 py-1 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading
          </div>
        ) : null}
        {loadError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">This page couldn&apos;t be loaded.</p>
          </div>
        ) : null}
        {selected && panelStyle ? (
          <FieldPanel
            key={selected.address}
            style={panelStyle}
            selected={selected}
            dates={dates}
            onDates={setDates}
            onDone={done}
            onCancel={() => close(true)}
            onAsk={() => {
              post({ type: "finish" });
              setSelected({ ...selected, value: selected.original, mode: "ask" });
            }}
            onChanged={reloadWhenBuilt}
          />
        ) : null}
      </div>
    </div>
  );
}

function FieldPanel({
  style,
  selected,
  dates,
  onDates,
  onDone,
  onCancel,
  onAsk,
  onChanged,
}: {
  style: React.CSSProperties;
  selected: Selected;
  dates: { startsOn: string; endsOn: string } | null;
  onDates: (d: { startsOn: string; endsOn: string }) => void;
  onDone: () => void;
  onCancel: () => void;
  onAsk: () => void;
  onChanged: (changeSetId: string) => void;
}) {
  const label = selected.info?.label ?? "This part of your site";
  return (
    <div className="absolute z-10 space-y-3 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg" style={{ ...style, width: PANEL_WIDTH }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm">{label}</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close" className="-mr-2 -mt-1" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Close</TooltipContent>
        </Tooltip>
      </div>
      {selected.mode === "edit" ? (
        <>
          {selected.limit ? (
            <p className={selected.value.length >= selected.limit ? "text-xs text-amber-700" : "text-xs text-muted-foreground"}>
              {selected.value.length} of {selected.limit} characters
            </p>
          ) : null}
          {selected.error ? <p className="text-sm text-destructive">{selected.error}</p> : null}
          {dates ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="canvas-starts">Starts</Label>
                <Input id="canvas-starts" type="date" value={dates.startsOn} onChange={(e) => onDates({ ...dates, startsOn: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="canvas-ends">Ends</Label>
                <Input id="canvas-ends" type="date" value={dates.endsOn} onChange={(e) => onDates({ ...dates, endsOn: e.target.value })} />
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={onAsk}>
              <Lightbulb className="h-4 w-4" />
              Quick Edit
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={onDone}>
                Done
              </Button>
            </div>
          </div>
        </>
      ) : (
        <ScopedQuickEdit selected={selected} onChanged={onChanged} />
      )}
    </div>
  );
}

/** Quick edit, opened from one field on the canvas (PRD D37). */
function ScopedQuickEdit({ selected, onChanged }: { selected: Selected; onChanged: (changeSetId: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);

  async function send() {
    const message = draft.trim();
    if (!message || busy) return;
    setMessages((m) => [...m, { id: ++seq.current, role: "owner", text: message }]);
    setDraft("");
    setBusy(true);
    const result = await sendQuickEdit({
      conversationId,
      message,
      scope: { address: selected.address, label: selected.info?.label ?? "", value: selected.original },
    });
    setBusy(false);
    if ("error" in result) {
      setMessages((m) => [...m, { id: ++seq.current, role: "assistant", text: result.error }]);
      return;
    }
    setConversationId(result.conversationId);
    setMessages((m) => [...m, { id: ++seq.current, role: "assistant", text: result.reply }]);
    if (result.changeSetId) {
      window.dispatchEvent(new Event(DRAFT_CHANGED));
      onChanged(result.changeSetId);
    }
  }

  return (
    <div className="space-y-3">
      {messages.length ? (
        <div className="max-h-56 space-y-2 overflow-y-auto">
          {messages.map((m) => (
            <div key={m.id} className={m.role === "owner" ? "flex justify-end" : "flex justify-start"}>
              <p
                className={
                  m.role === "owner"
                    ? "max-w-[90%] whitespace-pre-wrap rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "max-w-[90%] whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm"
                }
              >
                {m.text}
              </p>
            </div>
          ))}
          {busy ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Working on it
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      ) : null}
      <form
        className="flex items-end gap-2"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="What would you like to change?"
          maxLength={2000}
          rows={2}
          autoFocus
          className="min-h-[2.75rem] resize-none"
          aria-label="What would you like to change?"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="submit" size="icon" aria-label="Send" disabled={busy || !draft.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send</TooltipContent>
        </Tooltip>
      </form>
    </div>
  );
}

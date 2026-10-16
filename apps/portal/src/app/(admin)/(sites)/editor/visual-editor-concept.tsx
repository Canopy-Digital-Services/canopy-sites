"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
// A static concept: nothing on this page is interactive or saves anything.
import { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const SITE_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

/**
 * The concept's frame: toolbar, the framed site, and the inspector column.
 * The page tabs and inspector arrive as slots, streamed by the server while
 * the site itself starts loading in the frame.
 */
export function VisualEditorConcept({ pageTabs, inspector }: { pageTabs: React.ReactNode; inspector: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <Toolbar pageTabs={pageTabs} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Canvas />
        <div className="space-y-4">{inspector}</div>
      </div>
    </div>
  );
}

function Toolbar({ pageTabs }: { pageTabs: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
      <div className="flex items-center gap-1" aria-label="Pages">
        {pageTabs}
      </div>
      <div className="flex items-center gap-1 text-muted-foreground" aria-hidden="true">
        <span className="rounded-md bg-secondary p-1.5 text-foreground">
          <Monitor className="h-4 w-4" />
        </span>
        <span className="p-1.5">
          <Smartphone className="h-4 w-4" />
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          1 change not published
        </span>
        <Button variant="outline" size="sm" disabled>
          Preview
        </Button>
        <Button size="sm" disabled>
          Publish
        </Button>
      </div>
    </div>
  );
}

/** The demo site at desktop width, scaled to fit, with editing drawn over it. */
function Canvas() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / SITE_WIDTH));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border bg-muted">
      <div className="flex items-center gap-2 border-b bg-card px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        </span>
        <span className="flex-1 truncate rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">sites.canopyds.com/demo</span>
      </div>
      <div ref={ref} className="relative w-full overflow-hidden" style={{ height: CANVAS_HEIGHT }}>
        <iframe
          src="/demo?canopy_editor_mockup=1"
          title="Your site, as the editor shows it"
          sandbox="allow-scripts"
          className="absolute left-0 top-0 origin-top-left border-0 bg-white"
          style={{ width: SITE_WIDTH, height: CANVAS_HEIGHT / scale, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}

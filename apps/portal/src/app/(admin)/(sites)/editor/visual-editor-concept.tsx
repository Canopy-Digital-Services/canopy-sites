"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
// A static concept: nothing on this page is interactive or saves anything.
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Lock, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ConceptData = {
  pages: string[];
  selected: { category: string; service: string; price: string } | null;
  locked: string[];
  style: { colors: { name: string; hex: string }[]; fonts: { role: string; family: string }[] };
};

const SITE_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

export function VisualEditorConcept({ data }: { data: ConceptData }) {
  return (
    <div className="space-y-4">
      <Toolbar pages={data.pages} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Canvas />
        <Inspector data={data} />
      </div>
    </div>
  );
}

function Toolbar({ pages }: { pages: string[] }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
      <div className="flex items-center gap-1" aria-label="Pages">
        {pages.map((p, i) => (
          <span
            key={p}
            className={
              i === 0
                ? "rounded-md bg-secondary px-3 py-1.5 text-sm font-medium"
                : "rounded-md px-3 py-1.5 text-sm text-muted-foreground"
            }
          >
            {p}
          </span>
        ))}
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

function Inspector({ data }: { data: ConceptData }) {
  return (
    <div className="space-y-4">
      {data.selected ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Price</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-1">
              Services menu <ChevronRight className="h-3 w-3" /> {data.selected.category} <ChevronRight className="h-3 w-3" />{" "}
              {data.selected.service}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="concept-price">Price</Label>
              <Input id="concept-price" value={data.selected.price} readOnly tabIndex={-1} />
            </div>
            <p className="text-sm text-muted-foreground">
              Also shown in Featured services on the home page. One change updates both.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {data.locked.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Locked by Canopy</CardTitle>
            <CardDescription>Contact details change through us, so a slip can never break how customers reach you.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.locked.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {data.style.colors.length || data.style.fonts.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Site style</CardTitle>
            <CardDescription>Colors and fonts apply across every page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.style.colors.length ? (
              <div className="grid grid-cols-2 gap-2">
                {data.style.colors.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-sm">
                    <span className="h-6 w-6 shrink-0 rounded-md border" style={{ backgroundColor: c.hex }} />
                    <span className="truncate capitalize">{c.name}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {data.style.fonts.map((f) => (
              <div key={f.role} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{f.role}</span>
                <span>{f.family}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

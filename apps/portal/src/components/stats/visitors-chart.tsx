"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
// One series over time, so an area chart with no legend: the card title
// names it. Thin 2px line and a faint wash in --chart-2 (validated: L 0.60,
// C 0.12, 3.7:1 on the white card), hairline gridlines, and a crosshair that
// snaps to the nearest day on hover, touch, or arrow keys. The Table view is
// the same data without the chart.
//
// The plot is laid out in percentages (an SVG stretched with
// preserveAspectRatio="none" and non-scaling strokes, HTML for text and
// markers), so it renders at full width on the server with no measuring.
import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DailyStats } from "@/lib/stats";
import { formatCount, formatLongDate, formatShortDate } from "./format";

/** Gridline values: about four clean steps (1, 2, 5 × 10ⁿ) from zero past the peak. */
function yTicks(peak: number): number[] {
  const max = Math.max(peak, 4);
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: top / step + 1 }, (_, i) => i * step);
}

/** Which days get an x-axis label: every day for a week, else weekly or fortnightly, ending on the last day. */
function labelledDays(n: number): number[] {
  const every = n <= 7 ? 1 : n <= 31 ? 7 : 14;
  const days: number[] = [];
  for (let i = n - 1; i >= 0; i -= every) days.unshift(i);
  return days;
}

export function VisitorsChart({ daily }: { daily: DailyStats[] }) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitors per day</CardTitle>
        <CardAction>
          <ToggleGroup
            type="single"
            value={view}
            // Pressing the pressed button would clear the choice; one view always shows.
            onValueChange={(v) => v && setView(v as "chart" | "table")}
            aria-label="Show as"
          >
            <ToggleGroupItem value="chart">Chart</ToggleGroupItem>
            <ToggleGroupItem value="table">Table</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>{view === "chart" ? <Plot daily={daily} /> : <DailyTable daily={daily} />}</CardContent>
    </Card>
  );
}

function Plot({ daily }: { daily: DailyStats[] }) {
  const gradientId = `visitors-wash-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [active, setActive] = useState<number | null>(null);

  const n = daily.length;
  const ticks = yTicks(Math.max(0, ...daily.map((d) => d.visitors)));
  const top = ticks[ticks.length - 1];
  const x = (i: number) => ((i + 0.5) / n) * 100;
  const y = (v: number) => (1 - v / top) * 100;

  const line = daily.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(3)} ${y(d.visitors).toFixed(3)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(3)} 100 L${x(0).toFixed(3)} 100 Z`;
  const labels = labelledDays(n);
  const markers = n <= 7 ? daily.map((_, i) => i) : [n - 1];

  function dayAt(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return Math.min(n - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * n)));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next: Record<string, (a: number | null) => number | null> = {
      ArrowLeft: (a) => Math.max(0, (a ?? n) - 1),
      ArrowRight: (a) => Math.min(n - 1, (a ?? -1) + 1),
      Home: () => 0,
      End: () => n - 1,
      Escape: () => null,
    };
    const move = next[event.key];
    if (!move) return;
    event.preventDefault();
    setActive(move);
  }

  const point = active === null ? null : daily[active];

  return (
    <div className="flex">
      {/* y-axis */}
      <div aria-hidden className="relative h-56 w-10 shrink-0">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute right-3 -translate-y-1/2 text-xs leading-none tabular-nums text-muted-foreground"
            style={{ top: `${y(t)}%` }}
          >
            {formatCount(t)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div
          role="group"
          aria-label="Visitors per day. Use the arrow keys to read each day."
          tabIndex={0}
          className="relative h-56 touch-pan-y rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onPointerDown={(e) => setActive(dayAt(e))}
          onPointerMove={(e) => setActive(dayAt(e))}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setActive(null);
          }}
          onFocus={() => setActive((a) => a ?? n - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={onKeyDown}
        >
          {/* gridlines, baseline darkest */}
          {ticks.map((t) => (
            <div
              key={t}
              aria-hidden
              className={cn("absolute inset-x-0 h-px", t === 0 ? "bg-border" : "bg-border/60")}
              style={{ top: `${y(t)}%` }}
            />
          ))}

          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: "var(--chart-2)", stopOpacity: 0.18 }} />
                <stop offset="100%" style={{ stopColor: "var(--chart-2)", stopOpacity: 0.02 }} />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line}
              fill="none"
              className="stroke-chart-2"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {point && active !== null ? (
            <div aria-hidden className="absolute inset-y-0 w-px bg-foreground/15" style={{ left: `${x(active)}%` }} />
          ) : null}

          {markers.map((i) => (
            <Marker key={i} left={x(i)} top={y(daily[i].visitors)} />
          ))}
          {point && active !== null && !markers.includes(active) ? <Marker left={x(active)} top={y(point.visitors)} /> : null}

          {point && active !== null ? (
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute top-2 z-10 min-w-36 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg",
                x(active) > 60 ? "-translate-x-full -ml-3" : "ml-3",
              )}
              style={{ left: `${x(active)}%` }}
            >
              <p className="text-muted-foreground">{formatLongDate(point.date)}</p>
              <p className="mt-1.5 flex items-center gap-2">
                <span className="h-0.5 w-3 rounded-full bg-chart-2" />
                <span className="text-sm font-semibold tabular-nums">{formatCount(point.visitors)}</span>
                <span className="text-muted-foreground">visitors</span>
              </p>
              <p className="mt-0.5 flex items-center gap-2">
                <span className="w-3" />
                <span className="text-sm font-semibold tabular-nums">{formatCount(point.pageviews)}</span>
                <span className="text-muted-foreground">pageviews</span>
              </p>
            </div>
          ) : null}
        </div>

        {/* x-axis; on narrow screens every other label hides so they never collide */}
        <div aria-hidden className="relative h-6">
          {labels.map((i, k) => (
            <span
              key={i}
              className={cn(
                "absolute top-2 -translate-x-1/2 whitespace-nowrap text-xs leading-none text-muted-foreground",
                (labels.length - 1 - k) % 2 === 1 && labels.length > 4 && "hidden sm:block",
              )}
              style={{ left: `${x(i)}%` }}
            >
              {formatShortDate(daily[i].date)}
            </span>
          ))}
        </div>

        <p aria-live="polite" className="sr-only">
          {point ? `${formatLongDate(point.date)}: ${formatCount(point.visitors)} visitors, ${formatCount(point.pageviews)} pageviews` : ""}
        </p>
      </div>
    </div>
  );
}

/** An 8px dot with a 2px ring in the card color, so it stays legible on the line. */
function Marker({ left, top }: { left: number; top: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-2 ring-2 ring-card"
      style={{ left: `${left}%`, top: `${top}%` }}
    />
  );
}

function DailyTable({ daily }: { daily: DailyStats[] }) {
  return (
    <div className="h-62 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Visitors</TableHead>
            <TableHead className="text-right">Pageviews</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...daily].reverse().map((d) => (
            <TableRow key={d.date}>
              <TableCell>{formatLongDate(d.date)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCount(d.visitors)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCount(d.pageviews)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

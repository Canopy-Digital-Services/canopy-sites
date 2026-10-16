// UI: see docs/UX_PATTERNS.md for layout and component conventions.
// Server parts of the visual editor concept: they wait on the site's content
// and stylesheet, behind skeletons, while the framed site loads.
import { ChevronRight, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ConceptData = {
  pages: string[];
  selected: { category: string; service: string; price: string } | null;
  locked: string[];
  style: { colors: { name: string; hex: string }[]; fonts: { role: string; family: string }[] };
};

const bar = "animate-pulse rounded-md bg-muted";

export async function PageTabs({ data }: { data: Promise<ConceptData | null> }) {
  const pages = (await data)?.pages ?? [];
  return pages.map((p, i) => (
    <span
      key={p}
      className={i === 0 ? "rounded-md bg-secondary px-3 py-1.5 text-sm font-medium" : "rounded-md px-3 py-1.5 text-sm text-muted-foreground"}
    >
      {p}
    </span>
  ));
}

export function PageTabsSkeleton() {
  return (
    <>
      <span className={`${bar} h-8 w-16`} />
      <span className={`${bar} h-8 w-20`} />
      <span className={`${bar} h-8 w-24`} />
    </>
  );
}

export async function Inspector({ data }: { data: Promise<ConceptData | null> }) {
  const d = await data;
  if (!d) return <p className="text-sm text-muted-foreground">Your site&apos;s details couldn&apos;t be loaded.</p>;
  return (
    <>
      {d.selected ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Price</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-1">
              Services menu <ChevronRight className="h-3 w-3" /> {d.selected.category} <ChevronRight className="h-3 w-3" /> {d.selected.service}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="concept-price">Price</Label>
              <Input id="concept-price" value={d.selected.price} readOnly tabIndex={-1} />
            </div>
            <p className="text-sm text-muted-foreground">Also shown in Featured services on the home page. One change updates both.</p>
          </CardContent>
        </Card>
      ) : null}

      {d.locked.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Locked by Canopy</CardTitle>
            <CardDescription>Contact details change through us, so a slip can never break how customers reach you.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {d.locked.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {d.style.colors.length || d.style.fonts.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Site style</CardTitle>
            <CardDescription>Colors and fonts apply across every page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {d.style.colors.length ? (
              <div className="grid grid-cols-2 gap-2">
                {d.style.colors.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-sm">
                    <span className="h-6 w-6 shrink-0 rounded-md border" style={{ backgroundColor: c.hex }} />
                    <span className="truncate capitalize">{c.name}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {d.style.fonts.map((f) => (
              <div key={f.role} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{f.role}</span>
                <span>{f.family}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

export function InspectorSkeleton() {
  return (
    <>
      {[["w-16", "h-24"], ["w-36", "h-20"], ["w-28", "h-32"]].map(([title, body]) => (
        <Card key={title}>
          <CardHeader>
            <div className={`${bar} h-5 ${title}`} />
          </CardHeader>
          <CardContent>
            <div className={`${bar} ${body} w-full`} />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

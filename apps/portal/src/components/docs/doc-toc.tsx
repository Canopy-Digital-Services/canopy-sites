// UI: see docs/UX_PATTERNS.md for layout and component conventions.
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { DocHeading } from "@/lib/docs";

type DocTOCProps = {
  headings: DocHeading[];
};

export function DocTOC({ headings }: DocTOCProps) {
  const h2Count = headings.filter((h) => h.depth === 2).length;
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    if (els.length === 0) return;

    // Observe headings and pick the topmost visible one. Use a threshold that
    // fires when the heading enters the top 35% of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: [0, 1] }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (h2Count < 2) return null;

  return (
    <aside className="hidden xl:block w-56 shrink-0">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-4 py-6">
        <h3 className="mb-3 text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
          On this page
        </h3>
        <ul className="flex flex-col gap-1 border-l border-border/60">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={cn(
                  "block border-l-2 -ml-px py-1 text-xs leading-snug transition-colors",
                  h.depth === 3 ? "pl-6" : "pl-3",
                  activeId === h.id
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

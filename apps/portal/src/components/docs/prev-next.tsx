// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { AdjacentDoc } from "@/lib/docs";

type PrevNextProps = {
  prev: AdjacentDoc | null;
  next: AdjacentDoc | null;
};

function hrefFor(slug: string): string {
  return slug === "index" ? "/docs" : `/docs/${slug}`;
}

export function PrevNext({ prev, next }: PrevNextProps) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Previous and next pages"
      className="mt-16 grid grid-cols-1 gap-3 border-t border-border/60 pt-6 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={hrefFor(prev.slug)}
          className="group flex flex-col gap-1 rounded-lg border border-border/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeft className="h-3 w-3" />
            Previous
          </span>
          <span className="text-sm font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {next ? (
        <Link
          href={hrefFor(next.slug)}
          className="group flex flex-col gap-1 rounded-lg border border-border/60 px-4 py-3 text-right transition-colors hover:border-primary/40 hover:bg-accent/40 sm:text-right"
        >
          <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            Next
            <ArrowRight className="h-3 w-3" />
          </span>
          <span className="text-sm font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
            {next.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}

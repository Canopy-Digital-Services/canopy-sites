// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type DocsBreadcrumbProps = {
  title: string;
  group?: string;
};

export function DocsBreadcrumb({ title, group }: DocsBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <li>
          <Link
            href="/docs"
            className="hover:text-foreground transition-colors"
          >
            Docs
          </Link>
        </li>
        {group ? (
          <>
            <li aria-hidden="true">
              <ChevronRight className="h-3 w-3" />
            </li>
            <li className="text-muted-foreground/80">{group}</li>
          </>
        ) : null}
        <li aria-hidden="true">
          <ChevronRight className="h-3 w-3" />
        </li>
        <li className="text-foreground font-medium truncate max-w-[60vw]">
          {title}
        </li>
      </ol>
    </nav>
  );
}

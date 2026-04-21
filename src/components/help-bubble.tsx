// UI: see docs/UX_PATTERNS.md for layout and component conventions.
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { getHelpHref } from "@/lib/docs-route-map";

export function HelpBubble() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const href = getHelpHref(pathname, searchParams?.toString());

  if (!href) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 print:hidden">
      <Link
        href={href}
        aria-label="Open help documentation"
        className="group inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <HelpCircle className="h-5 w-5" />
      </Link>
    </div>
  );
}

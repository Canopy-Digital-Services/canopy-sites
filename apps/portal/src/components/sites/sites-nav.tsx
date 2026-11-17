"use client";
// UI: see docs/UX_PATTERNS.md for layout and component conventions.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartLine, ClipboardList, LayoutTemplate, Lightbulb, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITES_TABS, sitesTabOf, type SitesTabId } from "@/lib/sites-tabs";

const ICONS: Record<SitesTabId, LucideIcon> = {
  "quick-edit": Lightbulb,
  editor: LayoutTemplate,
  forms: ClipboardList,
  stats: ChartLine,
};

/** Top-nav items for accounts with Canopy Sites. */
export function SitesNav() {
  const current = sitesTabOf(usePathname());

  return SITES_TABS.map(({ id, href, label }) => {
    const Icon = ICONS[id];
    const active = id === current;
    return (
      <Button
        key={href}
        asChild
        variant={active ? "secondary" : "ghost"}
        size="sm"
      >
        <Link href={href} aria-current={active ? "page" : undefined}>
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </Link>
      </Button>
    );
  });
}

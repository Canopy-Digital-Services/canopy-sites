"use client";
// UI: see docs/UX_PATTERNS.md for layout and component conventions.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartLine, ClipboardList, LayoutTemplate, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const ITEMS = [
  { href: "/quick-edit", label: "Quick Edit", icon: Lightbulb },
  { href: "/editor", label: "Editor", icon: LayoutTemplate },
  { href: "/forms", label: "Forms", icon: ClipboardList },
  { href: "/stats", label: "Stats", icon: ChartLine },
] as const;

/** Top-nav items for accounts with Canopy Sites. */
export function SitesNav() {
  const pathname = usePathname();

  return ITEMS.map(({ href, label, icon: Icon }) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
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

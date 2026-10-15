// UI: see docs/UX_PATTERNS.md for layout and component conventions.
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type DocLink = {
  slug: string;
  title: string;
};

type DocGroup = {
  group: string;
  items: DocLink[];
};

type DocsSidebarProps = {
  groups: DocGroup[];
};

function hrefFor(slug: string): string {
  return slug === "index" ? "/docs" : `/docs/${slug}`;
}

function isActive(pathname: string, slug: string): boolean {
  if (slug === "index") return pathname === "/docs";
  return pathname === `/docs/${slug}`;
}

function NavList({ groups, pathname, onNavigate }: {
  groups: DocGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.group} className="flex flex-col gap-1">
          <h3 className="px-3 text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
            {group.group}
          </h3>
          <ul className="flex flex-col">
            {group.items.map((item) => {
              const active = isActive(pathname, item.slug);
              return (
                <li key={item.slug}>
                  <Link
                    href={hrefFor(item.slug)}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-accent text-primary font-medium"
                        : "text-foreground/80 hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DocsSidebar({ groups }: DocsSidebarProps) {
  const pathname = usePathname() ?? "/docs";

  return (
    <aside className="hidden md:block w-60 shrink-0 border-r border-border/60">
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto px-4 py-6">
        <NavList groups={groups} pathname={pathname} />
      </div>
    </aside>
  );
}

export function DocsSidebarMobile({ groups }: DocsSidebarProps) {
  const pathname = usePathname() ?? "/docs";
  const [open, setOpen] = useState(false);

  const current = groups
    .flatMap((g) => g.items)
    .find((i) => isActive(pathname, i.slug));

  return (
    <div className="md:hidden sticky top-14 z-[5] -mx-4 mb-4 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-2 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Open docs navigation"
        className="gap-2"
      >
        <Menu className="h-4 w-4" />
        <span className="text-sm">Docs menu</span>
      </Button>
      {current ? (
        <span className="ml-auto text-xs text-muted-foreground truncate">
          {current.title}
        </span>
      ) : null}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-6 overflow-y-auto">
          <SheetTitle className="text-sm font-heading font-semibold mb-4">
            Documentation
          </SheetTitle>
          <NavList
            groups={groups}
            pathname={pathname}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

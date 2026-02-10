"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ResponsiveSidebarLayoutProps = {
  sidebar: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  children: React.ReactNode;
};

export function ResponsiveSidebarLayout({
  sidebar,
  sidebarFooter,
  children,
}: ResponsiveSidebarLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarInner = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-auto">{sidebar}</div>
      {sidebarFooter && (
        <div className="flex-shrink-0 pt-4 border-t border-border/50">
          {sidebarFooter}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar - hidden on mobile */}
      <aside className="hidden md:flex md:flex-col w-64 border-r bg-muted/40 p-6">
        {sidebarInner}
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header with hamburger - hidden on desktop */}
        <header className="md:hidden flex items-center gap-2 p-4 border-b bg-muted/40">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Menu</TooltipContent>
          </Tooltip>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-6 flex flex-col min-h-full">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          {sidebarInner}
        </SheetContent>
      </Sheet>
    </div>
  );
}

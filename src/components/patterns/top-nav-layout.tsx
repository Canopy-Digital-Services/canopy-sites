"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type TopNavLayoutProps = {
  logo: React.ReactNode;
  navItems?: React.ReactNode;
  userMenu: React.ReactNode;
  children: React.ReactNode;
};

export function TopNavLayout({ logo, navItems, userMenu, children }: TopNavLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      {/* Desktop nav bar */}
      <header className="hidden md:flex items-center h-14 px-6 border-b bg-muted/40 shrink-0 gap-6">
        <div className="shrink-0">{logo}</div>
        <nav className="flex items-center gap-1">{navItems}</nav>
        <div className="ml-auto">{userMenu}</div>
      </header>

      {/* Mobile nav bar */}
      <header className="md:hidden flex items-center h-14 px-4 border-b bg-muted/40 shrink-0">
        <div className="shrink-0">{logo}</div>
        <div className="ml-auto">
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
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 min-h-0 flex flex-col overflow-auto">
        {children}
      </main>

      {/* Mobile drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-6 flex flex-col gap-6">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="shrink-0">{logo}</div>
          <nav className="flex flex-col gap-1">{navItems}</nav>
          <div className="mt-auto pt-4 border-t border-border/50">{userMenu}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

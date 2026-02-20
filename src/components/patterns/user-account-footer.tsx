"use client";

import Link from "next/link";
import { ChevronsUpDown, Settings, LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(email: string | null | undefined): string {
  if (!email || !email.trim()) return "?";
  const local = email.split("@")[0];
  if (!local) return "?";
  const chars = local.replace(/\W/g, "").slice(0, 2);
  return chars ? chars.toUpperCase() : "?";
}

type UserAccountFooterProps = {
  email: string | null | undefined;
};

export function UserAccountFooter({ email }: UserAccountFooterProps) {
  const initials = getInitials(email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 min-w-0 rounded-md p-1 -m-1 hover:bg-accent/50 transition-colors text-left">
          <div
            className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium"
            aria-hidden
          >
            {initials}
          </div>
          <span className="text-sm text-muted-foreground truncate flex-1" title={email ?? undefined}>
            {email ?? "—"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings className="h-4 w-4" />
            Manage Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOutAction} className="w-full">
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

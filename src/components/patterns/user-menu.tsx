"use client";

import Link from "next/link";
import { Settings, LogOut, BookOpen } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

type UserMenuProps = {
  email: string | null | undefined;
};

export function UserMenu({ email }: UserMenuProps) {
  const initials = getInitials(email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium hover:bg-primary/80 transition-colors"
          aria-label="User menu"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-48">
        {email ? (
          <>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground truncate">
              {email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings className="h-4 w-4" />
            Manage Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/docs">
            <BookOpen className="h-4 w-4" />
            Help
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

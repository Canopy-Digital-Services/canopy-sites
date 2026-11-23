"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Settings, LogOut, Shield } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** The name's first and last initials (two letters of a one-word name), else two letters of the email. */
function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${Array.from(words[0])[0]}${Array.from(words[words.length - 1])[0]}`.toUpperCase();
  if (words.length === 1) return Array.from(words[0]).slice(0, 2).join("").toUpperCase();
  if (!email || !email.trim()) return "?";
  const local = email.split("@")[0];
  if (!local) return "?";
  const chars = local.replace(/\W/g, "").slice(0, 2);
  return chars ? chars.toUpperCase() : "?";
}

type UserMenuProps = {
  email: string | null | undefined;
  name?: string | null;
  isGlobalAdmin?: boolean;
};

export function UserMenu({ email, name, isGlobalAdmin = false }: UserMenuProps) {
  const initials = getInitials(name, email);
  const [, startTransition] = useTransition();

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
        {isGlobalAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/operator/accounts">
              <Shield className="h-4 w-4" />
              Operator Console
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings className="h-4 w-4" />
            Manage Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Not a form: the menu unmounts as soon as an item is picked, which cancels a nested form's submit. */}
        <DropdownMenuItem onSelect={() => startTransition(() => signOutAction())}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

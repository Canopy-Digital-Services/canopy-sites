// UI: see docs/UX_PATTERNS.md for layout and component conventions.
"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, AlarmClock, CalendarOff, Inbox, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  listMyNotifications,
  dismissNotification,
  dismissAllNotifications,
} from "@/actions/notifications";
import type { NotificationListItem } from "@/lib/data-access/notifications";

const POLL_MS = 60_000;

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

function primaryLine(n: NotificationListItem): string {
  switch (n.type) {
    case "NEW_SUBMISSION":
      return n.count === 1 ? "1 new submission" : `${n.count} new submissions`;
    case "LIMIT_MAX_REACHED":
      return "Max responses reached";
    case "LIMIT_DEADLINE_REACHED":
      return "Deadline reached";
  }
}

function iconFor(type: NotificationListItem["type"]) {
  switch (type) {
    case "NEW_SUBMISSION":
      return <Inbox className="h-4 w-4 text-primary" />;
    case "LIMIT_MAX_REACHED":
      return <AlarmClock className="h-4 w-4 text-destructive" />;
    case "LIMIT_DEADLINE_REACHED":
      return <CalendarOff className="h-4 w-4 text-destructive" />;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    try {
      const next = await listMyNotifications();
      setItems(next);
    } catch {
      // Swallow — polling retries; showing a toast on every poll failure
      // would be noisy. A one-off failure is acceptable.
    }
  }, []);

  // Initial fetch + refetch on route change.
  // Inlined (rather than calling refresh()) so setState lives inside the
  // promise callback, which the set-state-in-effect lint rule allows.
  useEffect(() => {
    let cancelled = false;
    listMyNotifications()
      .then((next) => {
        if (!cancelled) setItems(next);
      })
      .catch(() => {
        // Swallow — polling retries.
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Poll every POLL_MS while the tab is visible
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const totalCount = items.reduce((sum, n) => sum + n.count, 0);
  const badgeText = totalCount > 9 ? "9+" : String(totalCount);

  const handleRowClick = (n: NotificationListItem) => {
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    setOpen(false);
    startTransition(async () => {
      try {
        await dismissNotification(n.id);
      } catch {
        toast.error("Couldn't dismiss notification");
        refresh();
      }
    });
    router.push(`/forms/${n.formId}?mode=submissions`);
  };

  const handleClearAll = () => {
    const snapshot = items;
    setItems([]);
    startTransition(async () => {
      try {
        await dismissAllNotifications();
      } catch {
        toast.error("Couldn't clear notifications");
        setItems(snapshot);
      }
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={
            totalCount > 0
              ? `Notifications, ${totalCount} unread`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold leading-none flex items-center justify-center"
              aria-hidden="true"
            >
              {badgeText}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-medium">Notifications</span>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            You&rsquo;re all caught up.
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleRowClick(n)}
                  className="w-full text-left flex items-start gap-3 px-3 py-2.5 hover:bg-accent transition-colors border-b last:border-b-0"
                >
                  <div className="mt-0.5 shrink-0">{iconFor(n.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {primaryLine(n)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {n.formName}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0 mt-0.5">
                    {formatRelative(new Date(n.updatedAt))}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

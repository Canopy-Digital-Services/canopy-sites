"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchSelectOption = {
  value: string;
  label: string;
  /** Shown muted beside the label, and searched with it. */
  detail?: string;
};

type SearchSelectProps = {
  value: string;
  options: SearchSelectOption[];
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  "aria-labelledby"?: string;
};

/**
 * One choice from a list too long to scan (time zones): a trigger showing the
 * chosen option, and a popover with a search box over the list. Typing
 * filters by label and detail, Enter takes the first match, and the arrow
 * keys move through the list.
 */
export function SearchSelect({ value, options, onChange, id, disabled, "aria-labelledby": labelledBy }: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const chosen = options.find((o) => o.value === value);
  const query = search.trim().toLowerCase();
  const shown = query ? options.filter((o) => `${o.label} ${o.detail ?? ""}`.toLowerCase().includes(query)) : options;

  function close() {
    setOpen(false);
    setSearch("");
  }

  function select(next: string) {
    close();
    onChange(next);
  }

  // The chosen option, mid-list as the list opens. The popover mounts after
  // `open` changes, so this runs from the list's own ref, and it moves the
  // list's scroll alone: scrollIntoView would move the page under a popover
  // that isn't placed yet.
  const listMounted = useCallback((list: HTMLDivElement | null) => {
    listRef.current = list;
    const chosen = list?.querySelector<HTMLElement>("[data-selected=true]");
    if (list && chosen) list.scrollTop = chosen.offsetTop - (list.clientHeight - chosen.offsetHeight) / 2;
  }, []);

  return (
    <Popover.Root open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-haspopup="listbox"
          aria-labelledby={labelledBy}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-1 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            open && "ring-1 ring-ring"
          )}
        >
          <span className="truncate text-left">{chosen?.label ?? value}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={cn(
            "z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover text-popover-foreground shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
          sideOffset={4}
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            searchRef.current?.focus();
          }}
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={searchRef}
              className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search"
              aria-label="Search"
              aria-controls={listId}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                // Matches read from the top, wherever the list had scrolled to.
                if (listRef.current) listRef.current.scrollTop = 0;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && shown.length > 0) {
                  e.preventDefault();
                  select(shown[0].value);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  listRef.current?.querySelector<HTMLElement>("[role=option]")?.focus();
                }
              }}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div ref={listMounted} id={listId} role="listbox" className="relative max-h-60 overflow-y-auto p-1">
            {shown.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No matches</div>
            ) : (
              shown.map((option) => {
                const selected = option.value === value;
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={selected}
                    data-selected={selected}
                    tabIndex={-1}
                    className={cn(
                      "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
                      "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      selected && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => select(option.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        select(option.value);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus();
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        ((e.currentTarget.previousElementSibling as HTMLElement | null) ?? searchRef.current)?.focus();
                      }
                    }}
                  >
                    <Check className={cn("h-4 w-4 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                    <span className="shrink-0">{option.label}</span>
                    {option.detail ? <span className="ml-auto min-w-0 truncate pl-2 text-xs text-muted-foreground">{option.detail}</span> : null}
                  </div>
                );
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

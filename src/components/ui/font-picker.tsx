"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Popover } from "radix-ui";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURATED_FONTS, ALL_GOOGLE_FONTS } from "@/lib/google-fonts";

const INHERIT_VALUE = "inherit";
const INHERIT_LABEL = "Inherit from host page";

type FontPickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
};

export function FontPicker({ value, onChange, id }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const displayLabel = value === INHERIT_VALUE || !value
    ? INHERIT_LABEL
    : value;

  const isSearching = search.trim().length > 0;
  const query = search.trim().toLowerCase();

  const filteredFonts = isSearching
    ? ALL_GOOGLE_FONTS.filter((f) => f.toLowerCase().includes(query))
    : CURATED_FONTS;

  const handleSelect = useCallback((font: string) => {
    onChange(font);
    setOpen(false);
    setSearch("");
  }, [onChange]);

  // Focus search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setSearch("");
    }
  }, [open]);

  // Scroll selected item into view when opening
  useEffect(() => {
    if (open && listRef.current) {
      const selected = listRef.current.querySelector("[data-selected=true]");
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [open]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-1 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            open && "ring-1 ring-ring"
          )}
        >
          <span className="truncate text-left">
            {displayLabel}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={cn(
            "z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover text-popover-foreground shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
          sideOffset={4}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Search input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={searchRef}
              className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search fonts..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {search && (
              <button
                type="button"
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                tabIndex={-1}
              >
                ✕
              </button>
            )}
          </div>

          {/* Font list */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1"
          >
            {/* Inherit option — always shown, pinned at top when not searching */}
            {!isSearching && (
              <FontOption
                font={INHERIT_VALUE}
                label={INHERIT_LABEL}
                selected={value === INHERIT_VALUE || !value}
                onSelect={handleSelect}
              />
            )}

            {/* Separator between inherit and curated list */}
            {!isSearching && (
              <div className="mx-2 my-1 border-t" />
            )}

            {/* Font results */}
            {filteredFonts.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No fonts found.
              </div>
            ) : (
              filteredFonts.map((font) => (
                <FontOption
                  key={font}
                  font={font}
                  label={font}
                  selected={value === font}
                  onSelect={handleSelect}
                />
              ))
            )}

            {/* Search hint */}
            {!isSearching && (
              <>
                <div className="mx-2 my-1 border-t" />
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Search to browse all {ALL_GOOGLE_FONTS.length.toLocaleString()} Google Fonts
                </div>
              </>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

type FontOptionProps = {
  font: string;
  label: string;
  selected: boolean;
  onSelect: (font: string) => void;
};

function FontOption({ font, label, selected, onSelect }: FontOptionProps) {
  return (
    <div
      role="option"
      aria-selected={selected}
      data-selected={selected}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "hover:bg-accent hover:text-accent-foreground",
        selected && "bg-accent text-accent-foreground"
      )}
      onClick={() => onSelect(font)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(font);
      }}
      tabIndex={0}
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4 shrink-0",
          selected ? "opacity-100" : "opacity-0"
        )}
      />
      {label}
    </div>
  );
}

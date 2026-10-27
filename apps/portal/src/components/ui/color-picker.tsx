"use client";

import { useRef, useState } from "react";
import { Popover } from "radix-ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** One color on offer, with the names of what already uses it. */
export type PickerColor = { value: string; names: string[] };

/** A row of colors: the form's own, and on Sites a titled brand row above. */
export type PickerRow = { title?: string; colors: PickerColor[] };

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * A color as a swatch that opens rows of colors to pick from, so matching
 * one already in use is one click, and New color for the system picker
 * (which takes hex on every platform). With no colors to offer, the swatch
 * opens the system picker itself. `value` is the color shown now, set or not.
 */
export function ColorPicker({
  id,
  label,
  tooltip = false,
  value,
  rows,
  onChange,
}: {
  id: string;
  /** Spoken name of the swatch, and its tooltip when `tooltip` is set. */
  label: string;
  /** Name the swatch in a tooltip, where no visible label does (a toolbar). */
  tooltip?: boolean;
  value: string;
  rows: PickerRow[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const empty = rows.every((row) => row.colors.length === 0);
  const customRef = useRef<HTMLInputElement>(null);
  // Closing for Custom leaves focus alone: moving it back to the swatch can
  // dismiss the system picker as it opens.
  const toCustom = useRef(false);

  const openCustom = () => {
    const input = customRef.current;
    if (!input) return;
    toCustom.current = true;
    if (typeof input.showPicker === "function") input.showPicker();
    else input.click();
    setOpen(false);
  };

  const swatch = (
    <span className="relative inline-flex rounded-md has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50">
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          aria-label={label}
          tabIndex={empty ? -1 : undefined}
          aria-hidden={empty || undefined}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-card p-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span className="block size-full rounded-sm border border-black/10" style={{ background: value }} />
        </button>
      </Popover.Trigger>
      {/* The system picker, laid invisibly over the swatch so it opens
          anchored there. With nothing to offer, it takes the swatch's
          clicks itself: a real click is the sure way to open it, and
          showPicker() from the swatch's own click didn't. */}
      <input
        ref={customRef}
        type="color"
        tabIndex={empty ? undefined : -1}
        aria-hidden={!empty || undefined}
        aria-label={empty ? label : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "absolute inset-0 size-full cursor-pointer opacity-0",
          !empty && "pointer-events-none"
        )}
      />
    </span>
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {tooltip ? (
        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>{swatch}</TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ) : (
        swatch
      )}
      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="start"
          // Focus on the first swatch would open its tooltip over the row.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => {
            if (toCustom.current) e.preventDefault();
            toCustom.current = false;
          }}
          className={cn(
            "z-50 w-56 space-y-3 rounded-md border bg-popover p-3 text-popover-foreground shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          {rows.map((row, i) => (
            <div key={row.title ?? i} className="space-y-1.5">
              {row.title && <p className="text-xs text-muted-foreground">{row.title}</p>}
              <div className="flex flex-wrap gap-1.5">
                {row.colors.map((color) => (
                  <Tooltip key={color.value} delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={color.names.join(", ")}
                        aria-pressed={same(color.value, value)}
                        onClick={() => {
                          onChange(color.value);
                          setOpen(false);
                        }}
                        className={cn(
                          "size-7 rounded-sm border border-black/10 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                          "aria-pressed:ring-2 aria-pressed:ring-ring aria-pressed:ring-offset-2 aria-pressed:ring-offset-popover"
                        )}
                        style={{ background: color.value }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{color.names.join(", ")}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={openCustom}
            className="-mx-1.5 block w-[calc(100%+0.75rem)] rounded-sm px-1.5 py-1 text-left text-sm hover:bg-accent hover:text-accent-foreground"
          >
            New color
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

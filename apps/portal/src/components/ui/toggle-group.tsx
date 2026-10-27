"use client"

import Link from "next/link"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const groupClasses =
  "inline-flex items-center gap-0.5 rounded-md border border-input bg-card p-0.5 shadow-xs"

const itemClasses = cn(
  "inline-flex h-7 items-center justify-center gap-1.5 rounded-sm px-2.5 text-sm text-muted-foreground whitespace-nowrap transition-colors outline-none",
  "hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
  // Pressed is read from ARIA, not `data-state`: a TooltipTrigger round an
  // item replaces its `data-state` with the tooltip's own.
  "aria-checked:bg-secondary aria-checked:font-medium aria-checked:text-secondary-foreground",
  "aria-pressed:bg-secondary aria-pressed:font-medium aria-pressed:text-secondary-foreground",
  "aria-[current=true]:bg-secondary aria-[current=true]:font-medium aria-[current=true]:text-secondary-foreground",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
)

/** A row of buttons for one small, exclusive choice (2–4 options): every
    option visible, one click. The pressed one takes the soft `secondary`
    highlight, as selection state does elsewhere. */
function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(groupClasses, className)}
      {...props}
    />
  )
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(itemClasses, className)}
      {...props}
    />
  )
}

/** `ToggleGroup`'s look for a choice kept in the URL: each option is a link,
    the current one marked with `aria-current`. Links stay links (no radio
    role), so it renders from server components without JS. */
function ToggleLinkGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="toggle-group"
      className={cn(groupClasses, className)}
      {...props}
    />
  )
}

function ToggleLinkItem({
  active,
  className,
  ...props
}: React.ComponentProps<typeof Link> & { active: boolean }) {
  return (
    <Link
      data-slot="toggle-group-item"
      aria-current={active ? "true" : undefined}
      className={cn(itemClasses, className)}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem, ToggleLinkGroup, ToggleLinkItem }

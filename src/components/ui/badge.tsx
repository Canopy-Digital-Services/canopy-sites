import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Badges are categorical labels, not buttons: tinted pills (pale fill +
// saturated text, no border, fully rounded) so they never read as pressable.
// Status indicators (Live/Saving/etc.) are a separate inline-atom pattern.
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        // Semantic tints
        brand: "bg-primary/10 text-primary",
        success: "bg-success/15 text-success-strong",
        neutral: "bg-muted text-foreground",
        destructive: "bg-destructive/12 text-destructive",
        amber: "bg-amber-100 text-amber-800",
        // Legacy aliases (old shadcn names) → mapped onto the tinted scale
        default: "bg-primary/10 text-primary",
        secondary: "bg-muted text-muted-foreground",
        outline: "bg-muted text-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

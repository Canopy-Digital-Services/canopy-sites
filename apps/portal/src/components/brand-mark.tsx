import { cn } from "@/lib/utils";
import type { Product } from "@/lib/product";

type BrandMarkProps = {
  size?: "sm" | "md";
  product?: Product;
  tagline?: string;
  className?: string;
};

export function BrandMark({ size = "md", product = "forms", tagline, className }: BrandMarkProps) {
  const logoClassName = size === "sm" ? "h-7" : "h-10";

  return (
    <div className={cn("flex items-center", className)}>
      {product === "sites" ? (
        // Placeholder wordmark until Canopy Sites brand assets exist.
        <span
          className={cn(
            logoClassName,
            "flex items-center font-heading font-semibold tracking-tight text-primary",
            size === "sm" ? "text-lg" : "text-2xl"
          )}
        >
          Canopy Sites
        </span>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- Static SVG brand asset; next/image adds unnecessary overhead for inline SVGs */}
          <img
            src="/brand/forms-logo-combined.svg"
            alt=""
            className={cn(logoClassName, "w-auto shrink-0")}
          />
        </>
      )}
      {tagline ? (
        <div className="ml-3 text-sm text-muted-foreground">{tagline}</div>
      ) : null}
    </div>
  );
}

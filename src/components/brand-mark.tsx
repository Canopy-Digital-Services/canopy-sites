import { cn } from "@/lib/utils";

type BrandMarkProps = {
  size?: "sm" | "md";
  tagline?: string;
  className?: string;
};

export function BrandMark({ size = "md", tagline, className }: BrandMarkProps) {
  const logoClassName = size === "sm" ? "h-7" : "h-10";

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src="/brand/forms-logo-combined.svg"
        alt=""
        className={cn(logoClassName, "w-auto shrink-0")}
      />
      {tagline ? (
        <div className="ml-3 text-sm text-muted-foreground">{tagline}</div>
      ) : null}
    </div>
  );
}


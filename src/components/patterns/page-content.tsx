// UI: see docs/UX_PATTERNS.md for layout and component conventions.

type PageContentWidth = "default" | "wide";

type PageContentProps = {
  children: React.ReactNode;
  width?: PageContentWidth;
};

const WIDTH_CLASS: Record<PageContentWidth, string> = {
  default: "max-w-5xl",
  wide: "max-w-7xl",
};

export function PageContent({ children, width = "default" }: PageContentProps) {
  return (
    <div className="p-4 md:p-6">
      <div className={`${WIDTH_CLASS[width]} mx-auto`}>{children}</div>
    </div>
  );
}

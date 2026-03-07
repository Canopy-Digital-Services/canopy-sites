// UI: see docs/UX_PATTERNS.md for layout and component conventions.

type PageContentProps = {
  children: React.ReactNode;
};

export function PageContent({ children }: PageContentProps) {
  return (
    <div className="p-4 md:p-6">
      <div className="max-w-5xl mx-auto">{children}</div>
    </div>
  );
}

type PageContentProps = {
  children: React.ReactNode;
};

export function PageContent({ children }: PageContentProps) {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  );
}

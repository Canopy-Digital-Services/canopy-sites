type EditorLayoutProps = {
  header: React.ReactNode;
  main: React.ReactNode;
  panel?: React.ReactNode;
};

export function EditorLayout({ header, main, panel }: EditorLayoutProps) {
  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col">
      <div className="sticky top-0 z-20 border-b bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {header}
      </div>
      <div className="flex flex-1">
        <div className="min-w-0 flex-1 py-6">{main}</div>
        {panel ? (
          <aside className="hidden lg:flex lg:flex-col lg:w-[400px] xl:w-[480px] shrink-0 border-l border-border/50 bg-muted/30">
            <div className="sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto p-6">
              {panel}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

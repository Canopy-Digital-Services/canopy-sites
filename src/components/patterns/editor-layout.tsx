type EditorLayoutProps = {
  header?: React.ReactNode;
  main: React.ReactNode;
  panel?: React.ReactNode;
};

export function EditorLayout({ header, main, panel }: EditorLayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      {/* Full-width header above the column split — matches PageContent padding */}
      {header ? (
        <div className="shrink-0 px-4 md:px-8 pt-4 md:pt-8">
          <div className="max-w-7xl mx-auto">
            {header}
          </div>
        </div>
      ) : null}
      {/* Two-column body */}
      <div className="flex flex-1 min-h-0">
        {/* Editor column */}
        <div className="min-w-0 flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {main}
        </div>
        {/* Preview column */}
        {panel ? (
          <aside className="hidden lg:flex lg:flex-col lg:w-[400px] xl:w-[480px] shrink-0 border-l border-border/50">
            <div className="h-full overflow-y-auto flex flex-col">
              {panel}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

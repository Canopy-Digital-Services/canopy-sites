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
      <div className="flex flex-1 gap-6 py-6">
        <div className="min-w-0 flex-1">{main}</div>
        {panel ? <div className="hidden lg:block">{panel}</div> : null}
      </div>
    </div>
  );
}

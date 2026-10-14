// UI: see docs/UX_PATTERNS.md for layout and component conventions.

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg bg-muted px-6 py-12 text-center">
      {icon ? <div className="mx-auto mb-4 w-fit text-primary">{icon}</div> : null}
      <h3 className="text-[1.375rem] font-heading font-semibold leading-tight">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

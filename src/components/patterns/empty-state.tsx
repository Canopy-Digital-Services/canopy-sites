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
    <div className="rounded-lg border border-dashed bg-muted/30 p-10 text-center">
      {icon ? <div className="mx-auto mb-3 w-fit">{icon}</div> : null}
      <h3 className="text-lg font-heading font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

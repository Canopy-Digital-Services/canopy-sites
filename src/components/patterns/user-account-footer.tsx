function getInitials(email: string | null | undefined): string {
  if (!email || !email.trim()) return "?";
  const local = email.split("@")[0];
  if (!local) return "?";
  const chars = local.replace(/\W/g, "").slice(0, 2);
  return chars ? chars.toUpperCase() : "?";
}

type UserAccountFooterProps = {
  email: string | null | undefined;
};

export function UserAccountFooter({ email }: UserAccountFooterProps) {
  const initials = getInitials(email);

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium"
        aria-hidden
      >
        {initials}
      </div>
      <span className="text-sm text-muted-foreground truncate" title={email ?? undefined}>
        {email ?? "—"}
      </span>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";

export function StatusBadge({
  status,
}: {
  status: "NEW" | "READ" | "ARCHIVED";
}) {
  const variant = status === "NEW" ? "default" : "secondary";

  return <Badge variant={variant}>{status}</Badge>;
}

export function SpamBadge({ isSpam }: { isSpam: boolean }) {
  if (!isSpam) return null;
  return <Badge variant="destructive">SPAM</Badge>;
}

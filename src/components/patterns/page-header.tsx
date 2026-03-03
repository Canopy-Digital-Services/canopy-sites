import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
};

export function PageHeader({ title, description, actions, backHref }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-3">
        {backHref ? (
          <Link href={backHref}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" aria-label="Go back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewToggleProps = {
  view: "grid" | "list";
};

export function ViewToggle({ view }: ViewToggleProps) {
  return (
    <div className="flex gap-1">
      <Link href="/forms?view=grid">
        <Button
          variant={view === "grid" ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </Link>
      <Link href="/forms?view=list">
        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

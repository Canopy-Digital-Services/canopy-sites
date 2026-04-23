import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ViewToggleProps = {
  view: "grid" | "list";
};

export function ViewToggle({ view }: ViewToggleProps) {
  return (
    <div className="flex gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label="Grid view"
            asChild
          >
            <Link href="/forms?view=grid">
              <LayoutGrid className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Grid view</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label="List view"
            asChild
          >
            <Link href="/forms?view=list">
              <List className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>List view</TooltipContent>
      </Tooltip>
    </div>
  );
}

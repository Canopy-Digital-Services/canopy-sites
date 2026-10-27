import { LayoutGrid, List } from "lucide-react";
import { ToggleLinkGroup, ToggleLinkItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ViewToggleProps = {
  view: "grid" | "list";
};

const VIEWS = [
  { value: "grid", label: "Grid view", Icon: LayoutGrid },
  { value: "list", label: "List view", Icon: List },
] as const;

export function ViewToggle({ view }: ViewToggleProps) {
  return (
    <ToggleLinkGroup aria-label="View">
      {VIEWS.map(({ value, label, Icon }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <ToggleLinkItem href={`/forms?view=${value}`} active={view === value} aria-label={label} className="px-1.5">
              <Icon className="h-4 w-4" />
            </ToggleLinkItem>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleLinkGroup>
  );
}

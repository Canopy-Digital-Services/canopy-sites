"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FormFieldsManager } from "@/components/form-fields-manager";

type FieldsSectionProps = {
  formId: string;
  /** "accordion" renders the collapsible card; "flow" renders it always expanded with no collapse chrome. */
  variant?: "accordion" | "flow";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function FieldsSection({ formId, variant = "accordion", open = false, onOpenChange }: FieldsSectionProps) {
  const isFlow = variant === "flow";

  const headerInner = (
    <div className="flex items-center justify-between gap-4">
      {/* No description: "Add Field" states the action and the grip handles
          state the reordering. Both were narrating the design. */}
      <CardTitle>Fields</CardTitle>
      {!isFlow && (
        <div className="shrink-0">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      )}
    </div>
  );

  const body = (
    <CardContent>
      <FormFieldsManager formId={formId} />
    </CardContent>
  );

  if (isFlow) {
    return (
      <Card>
        <CardHeader>{headerInner}</CardHeader>
        {body}
      </Card>
    );
  }

  return (
    <Card>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CardHeader className="cursor-pointer" onClick={() => onOpenChange?.(!open)}>
          <CollapsibleTrigger asChild>{headerInner}</CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>{body}</CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

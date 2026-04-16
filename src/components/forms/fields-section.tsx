"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FormFieldsManager } from "@/components/form-fields-manager";

type FieldsSectionProps = {
  formId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FieldsSection({ formId, open, onOpenChange }: FieldsSectionProps) {
  return (
    <Card className="border-l-4 border-l-primary">
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CardHeader className="cursor-pointer" onClick={() => onOpenChange(!open)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Fields</CardTitle>
                <CardDescription>Add the fields you would like in your form. Drag to reorder.</CardDescription>
              </div>
              <div className="shrink-0">
                {open ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <FormFieldsManager formId={formId} />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

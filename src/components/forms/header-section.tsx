"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Check, ChevronDown, ChevronRight } from "lucide-react";
import { useFormContext } from "@/components/forms/form-context";

type HeaderSectionProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HeaderSection({ open, onOpenChange }: HeaderSectionProps) {
  const { state, saveStatus, updateHeader } = useFormContext();

  return (
    <Card className="border-l-4 border-l-primary">
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CardHeader className="cursor-pointer" onClick={() => onOpenChange(!open)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Header</CardTitle>
                <CardDescription>Optional title and description shown above the form.</CardDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {saveStatus === "saving" && (
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Save className="h-4 w-4 animate-pulse" />
                    Saving...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-sm text-success-strong flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Saved
                  </span>
                )}
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="form-title">Title</Label>
              <Input
                id="form-title"
                value={state.title ?? ""}
                onChange={(e) => updateHeader({ title: e.target.value || null })}
                placeholder="e.g. Contact Us"
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-description">Description</Label>
              <Textarea
                id="form-description"
                value={state.description ?? ""}
                onChange={(e) => updateHeader({ description: e.target.value || null })}
                placeholder="e.g. Fill out the form below and we'll get back to you."
                maxLength={400}
                rows={3}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

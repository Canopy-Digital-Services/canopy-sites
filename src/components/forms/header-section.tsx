"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Check, ChevronDown, ChevronRight } from "lucide-react";
import { useFormContext } from "@/components/forms/form-context";

type HeaderSectionProps = {
  /** "accordion" renders the collapsible card; "flow" renders it always expanded with no collapse chrome. */
  variant?: "accordion" | "flow";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function HeaderSection({ variant = "accordion", open = false, onOpenChange }: HeaderSectionProps) {
  const { state, saveStatus, updateHeader } = useFormContext();
  const isFlow = variant === "flow";

  const headerInner = (
    <div className="flex items-center justify-between gap-4">
      <div>
        {/* The "(Optional)" marker replaces a description line that explained the
            same thing in a sentence. The Title/Description inputs below are
            self-evident; the only thing worth saying is that they're skippable. */}
        <CardTitle className="flex items-baseline gap-2">
          Header
          <span className="text-sm font-normal tracking-normal text-muted-foreground">
            (Optional)
          </span>
        </CardTitle>
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
        {!isFlow &&
          (open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ))}
      </div>
    </div>
  );

  const body = (
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

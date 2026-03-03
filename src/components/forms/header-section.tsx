"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Check } from "lucide-react";
import { useFormContext } from "@/components/forms/form-context";

export function HeaderSection() {
  const { state, saveStatus, updateHeader } = useFormContext();

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Header</CardTitle>
            <CardDescription>Optional title and description shown above the form.</CardDescription>
          </div>
          {saveStatus === "saving" && (
            <span className="text-sm text-muted-foreground flex items-center gap-2 shrink-0">
              <Save className="h-4 w-4 animate-pulse" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2 shrink-0">
              <Check className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </CardHeader>
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
    </Card>
  );
}

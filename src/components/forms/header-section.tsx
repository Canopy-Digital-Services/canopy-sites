"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Check } from "lucide-react";
import { updateFormHeader } from "@/actions/forms";

type HeaderSectionProps = {
  formId: string;
  title: string | null;
  description: string | null;
};

export function HeaderSection({ formId, title: initialTitle, description: initialDescription }: HeaderSectionProps) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    const currentTitle = title || null;
    if (currentTitle === initialTitle) return;

    setSaveStatus("saving");

    const timeoutId = setTimeout(() => {
      void (async () => {
        try {
          await updateFormHeader(formId, { title: title || null });
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (error) {
          console.error("Failed to save title:", error);
          setSaveStatus("idle");
        }
      })();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [title, formId, initialTitle]);

  useEffect(() => {
    const currentDescription = description || null;
    if (currentDescription === initialDescription) return;

    setSaveStatus("saving");

    const timeoutId = setTimeout(() => {
      void (async () => {
        try {
          await updateFormHeader(formId, { description: description || null });
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (error) {
          console.error("Failed to save description:", error);
          setSaveStatus("idle");
        }
      })();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [description, formId, initialDescription]);

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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Contact Us"
            maxLength={120}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-description">Description</Label>
          <Textarea
            id="form-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Fill out the form below and we'll get back to you."
            maxLength={400}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

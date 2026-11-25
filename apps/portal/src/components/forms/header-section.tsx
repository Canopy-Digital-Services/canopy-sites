"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SaveIndicator } from "@/components/forms/save-indicator";
import { useFormContext, HEADER_PLACEHOLDERS } from "@/components/forms/form-context";
import { STEP_TITLES } from "@/components/forms/editor-steps";

export function HeaderSection() {
  const { state, saveStatus, updateHeader, setPreviewFocus } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            {/* The "(Optional)" marker replaces a description line that explained the
                same thing in a sentence. The Title/Description inputs below are
                self-evident; the only thing worth saying is that they're skippable. */}
            <CardTitle className="flex items-baseline gap-2">
              {STEP_TITLES.header}
              <span className="text-sm font-normal tracking-normal text-muted-foreground">
                (Optional)
              </span>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SaveIndicator status={saveStatus} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="form-title">Title</Label>
          <Input
            id="form-title"
            value={state.title ?? ""}
            onChange={(e) => updateHeader({ title: e.target.value || null })}
            placeholder={HEADER_PLACEHOLDERS.title}
            onFocus={() => setPreviewFocus("title")}
            onBlur={() => setPreviewFocus(null)}
            maxLength={120}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-description">Description</Label>
          <Textarea
            id="form-description"
            value={state.description ?? ""}
            onChange={(e) => updateHeader({ description: e.target.value || null })}
            placeholder={HEADER_PLACEHOLDERS.description}
            onFocus={() => setPreviewFocus("description")}
            onBlur={() => setPreviewFocus(null)}
            maxLength={400}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormFieldsManager } from "@/components/form-fields-manager";
import { useFormContext } from "@/components/forms/form-context";
import { SaveIndicator } from "@/components/forms/save-indicator";
import { STEP_TITLES } from "@/components/forms/editor-steps";

export function FieldsSection({ formId }: { formId: string }) {
  const { saveStatus } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          {/* No description: "Add Field" states the action and the grip handles
              state the reordering. Both were narrating the design. */}
          <CardTitle>{STEP_TITLES.fields}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <SaveIndicator status={saveStatus} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FormFieldsManager formId={formId} />
      </CardContent>
    </Card>
  );
}

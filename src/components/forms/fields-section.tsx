"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormFieldsManager } from "@/components/form-fields-manager";
import { FieldSummary } from "@/components/field-list";

type FieldsSectionProps = {
  formId: string;
  fields: FieldSummary[];
};

export function FieldsSection({ formId, fields }: FieldsSectionProps) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle>Fields</CardTitle>
        <CardDescription>Define the inputs your form collects</CardDescription>
      </CardHeader>
      <CardContent>
        <FormFieldsManager formId={formId} fields={fields} />
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormFieldsManager } from "@/components/form-fields-manager";
import { FieldSummary } from "@/components/field-list";

type FieldsSectionProps = {
  formId: string;
  fields: FieldSummary[];
};

export function FieldsSection({ formId, fields }: FieldsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fields</CardTitle>
      </CardHeader>
      <CardContent>
        <FormFieldsManager formId={formId} fields={fields} />
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormFieldsManager } from "@/components/form-fields-manager";

type FieldsSectionProps = {
  formId: string;
};

export function FieldsSection({ formId }: FieldsSectionProps) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle>Fields</CardTitle>
        <CardDescription>Add the fields you would like in your form. Drag to reorder.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormFieldsManager formId={formId} />
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, ClipboardList, Monitor, AppWindow } from "lucide-react";
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FormPreview } from "@/components/forms/form-preview";
import type { formToEmbedDefinition } from "@/lib/embed-preview";

type FormViewPageProps = {
  form: Parameters<typeof formToEmbedDefinition>[0] & {
    name: string;
    fields: Array<{ name: string; type: string; label: string; required: boolean; order: number; placeholder: string | null; helpText: string | null; options: unknown; validation: unknown }>;
  };
  apiUrl: string;
};

export function FormViewPage({ form }: FormViewPageProps) {
  const [mode, setMode] = useState<"embed" | "page">("embed");

  return (
    <PageContent>
      <div className="space-y-6">
        <PageHeader
          title={form.name}
          description={`${form.fields.length} field${form.fields.length === 1 ? "" : "s"}`}
          backHref="/forms"
          actions={
            <>
              <Link href={`/forms/${form.id}/edit`}>
                <Button variant="outline">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Link href={`/forms/${form.id}/submissions`}>
                <Button variant="outline">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Submissions
                </Button>
              </Link>
            </>
          }
        />

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "embed" | "page")}
        >
          <TabsList>
            <TabsTrigger value="embed">
              <Monitor className="h-4 w-4" />
              Embed
            </TabsTrigger>
            <TabsTrigger value="page">
              <AppWindow className="h-4 w-4" />
              Page
            </TabsTrigger>
          </TabsList>

          <TabsContent value="embed">
            <div className="border rounded-lg bg-background p-6 min-h-[400px]">
              <FormPreview form={form} mode="embed" />
            </div>
          </TabsContent>

          <TabsContent value="page">
            <div className="border rounded-lg bg-background p-6 min-h-[400px]">
              <FormPreview form={form} mode="page" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContent>
  );
}

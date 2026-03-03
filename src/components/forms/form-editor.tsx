"use client";

import { useState } from "react";
import { EditorLayout } from "@/components/patterns/editor-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Code, Save, Check, Eye } from "lucide-react";
import { FieldsSection } from "@/components/forms/fields-section";
import { HeaderSection } from "@/components/forms/header-section";
import { AfterSubmissionSection } from "@/components/forms/after-submission-section";
import { AppearanceSection } from "@/components/forms/appearance-section";
import { IntegratePanel } from "@/components/forms/integrate-panel";
import { RightPanel } from "@/components/patterns/right-panel";
import { LivePreviewPanel } from "@/components/forms/live-preview-panel";
import { FormProvider, useFormContext } from "@/components/forms/form-context";

type FormEditorProps = {
  apiUrl: string;
  ownerEmail: string;
  form: {
    id: string;
    name: string;
    slug: string;
    allowedOrigins: string[];
    notifyEmails: string[];
    emailNotificationsEnabled: boolean;
    honeypotField: string | null;
    successMessage: string | null;
    redirectUrl: string | null;
    title: string | null;
    description: string | null;
    defaultTheme: unknown;
    stopAt: Date | null;
    maxSubmissions: number | null;
    fields: Array<{
      id: string;
      name: string;
      label: string;
      type: string;
      required: boolean;
      order: number;
      placeholder: string | null;
      helpText: string | null;
      options: unknown;
      validation: unknown;
    }>;
  };
};

export function FormEditor({ apiUrl, ownerEmail, form }: FormEditorProps) {
  return (
    <FormProvider initialForm={form}>
      <FormEditorInner apiUrl={apiUrl} ownerEmail={ownerEmail} form={form} />
    </FormProvider>
  );
}

function FormEditorInner({ apiUrl, ownerEmail, form }: FormEditorProps) {
  const { state, saveStatus, updateName } = useFormContext();
  const [integrateOpen, setIntegrateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const header = (
    <div className="max-w-[640px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Input
            value={state.name}
            onChange={(e) => updateName(e.target.value)}
            className="text-lg font-semibold max-w-md"
            placeholder="Form name"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saveStatus === "saving" && (
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Save className="h-4 w-4 animate-pulse" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Saved
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => setIntegrateOpen(true)}>
            <Code className="mr-2 h-4 w-4" />
            Integrate
          </Button>
        </div>
      </div>
    </div>
  );

  const main = (
    <div className="space-y-8 max-w-[640px] mx-auto">
      <HeaderSection />
      <FieldsSection formId={form.id} />
      <AppearanceSection />
      <AfterSubmissionSection ownerEmail={ownerEmail} />
    </div>
  );

  const panel = <LivePreviewPanel />;

  return (
    <>
      <EditorLayout header={header} main={main} panel={panel} />

      {/* Mobile preview handle — fixed tab on right edge */}
      <button
        onClick={() => setPreviewOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 lg:hidden flex flex-col items-center gap-1.5 rounded-l-lg border border-r-0 border-border/50 bg-background/90 backdrop-blur-sm px-1.5 py-3 shadow-md transition-colors hover:bg-muted/80"
        aria-label="Open preview"
      >
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-[10px] font-heading font-medium text-muted-foreground uppercase tracking-wider [writing-mode:vertical-lr]">
          Preview
        </span>
      </button>

      {/* Mobile preview sheet */}
      <RightPanel
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Preview"
      >
        <LivePreviewPanel />
      </RightPanel>

      <IntegratePanel
        open={integrateOpen}
        onClose={() => setIntegrateOpen(false)}
        apiUrl={apiUrl}
        form={form}
      />
    </>
  );
}

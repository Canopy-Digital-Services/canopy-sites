"use client";

import { useState } from "react";
import { EditorLayout } from "@/components/patterns/editor-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Code, Save, Check, Eye, Pencil } from "lucide-react";
import Link from "next/link";
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
  const [editingName, setEditingName] = useState(false);

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-3">
        <Link href={`/forms/${form.id}`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" aria-label="Back to form">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="space-y-1">
          {editingName ? (
            <Input
              autoFocus
              value={state.name}
              onChange={(e) => updateName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); }}
              className="text-3xl font-heading font-semibold tracking-tight h-auto"
              placeholder="Form name"
            />
          ) : (
            <h1 className="text-3xl font-heading font-semibold tracking-tight flex items-center gap-2">
              {state.name}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => setEditingName(true)} aria-label="Rename form">
                <Pencil className="h-4 w-4" />
              </Button>
            </h1>
          )}
        </div>
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
  );

  const main = (
    <div className="max-w-[640px] mx-auto space-y-8">
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

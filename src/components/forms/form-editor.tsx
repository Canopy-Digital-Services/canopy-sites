"use client";

import { useState, useEffect } from "react";
import { EditorLayout } from "@/components/patterns/editor-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Code, Save, Check } from "lucide-react";
import { SiteSelector } from "@/components/forms/site-selector";
import { FieldsSection } from "@/components/forms/fields-section";
import { BehaviorSection } from "@/components/forms/behavior-section";
import { AppearanceSection } from "@/components/forms/appearance-section";
import { PreviewPanel } from "@/components/forms/preview-panel";
import { IntegratePanel } from "@/components/forms/integrate-panel";
import { useToast } from "@/hooks/use-toast";
import { updateFormBasics } from "@/actions/forms";

type FormEditorProps = {
  apiUrl: string; // Pass from server-side page
  form: {
    id: string;
    name: string;
    slug: string;
    notifyEmails: string[];
    emailNotificationsEnabled: boolean;
    honeypotField: string | null;
    successMessage: string | null;
    redirectUrl: string | null;
    defaultTheme: unknown;
    site: {
      id: string;
      name: string;
      domain: string;
      apiKey: string;
    };
    fields: Array<{
      id: string;
      name: string;
      label: string;
      type: string;
      required: boolean;
      order: number;
      placeholder: string | null;
      options: unknown;
      validation: unknown;
    }>;
  };
};

export function FormEditor({ apiUrl, form }: FormEditorProps) {
  const { toast } = useToast();
  const [formName, setFormName] = useState(form.name);
  const [panelType, setPanelType] = useState<"preview" | "integrate" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Auto-save form name with debouncing
  useEffect(() => {
    if (formName === form.name) return;

    setSaveStatus("saving");
    setIsSaving(true);

    const timeoutId = setTimeout(() => {
      void (async () => {
        try {
          await updateFormBasics(form.id, { name: formName });
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (error) {
          console.error("Failed to save form name:", error);
          toast.error("Failed to save form name");
          setSaveStatus("idle");
        } finally {
          setIsSaving(false);
        }
      })();
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [formName, form.name, form.id, toast]);

  const handleOpenPreview = () => setPanelType("preview");
  const handleOpenIntegrate = () => setPanelType("integrate");
  const handleClosePanel = () => setPanelType(null);

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Input
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="text-lg font-semibold max-w-md"
          placeholder="Form name"
        />
        <SiteSelector formId={form.id} currentSiteId={form.site.id} />
      </div>
      <div className="flex items-center gap-2">
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
        <Button variant="outline" size="sm" onClick={handleOpenPreview}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button variant="outline" size="sm" onClick={handleOpenIntegrate}>
          <Code className="mr-2 h-4 w-4" />
          Integrate
        </Button>
      </div>
    </div>
  );

  const main = (
    <div className="space-y-6">
      {/* Fields Section - Expanded by default */}
      <FieldsSection formId={form.id} fields={form.fields} />

      {/* Behavior Section - Collapsible */}
      <BehaviorSection
        formId={form.id}
        successMessage={form.successMessage}
        redirectUrl={form.redirectUrl}
        emailNotificationsEnabled={form.emailNotificationsEnabled}
        notifyEmails={form.notifyEmails}
        honeypotField={form.honeypotField}
      />

      {/* Appearance Section - Collapsible */}
      <AppearanceSection formId={form.id} defaultTheme={form.defaultTheme} />
    </div>
  );

  const panel = panelType === "preview" ? (
    <PreviewPanel
      open={true}
      onClose={handleClosePanel}
      form={form}
    />
  ) : panelType === "integrate" ? (
    <IntegratePanel
      open={true}
      onClose={handleClosePanel}
      apiUrl={apiUrl}
      form={form}
    />
  ) : null;

  return <EditorLayout header={header} main={main} panel={panel} />;
}

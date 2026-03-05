"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Code,
  Save,
  Check,
  Eye,
  Pencil,
  Globe,
  GlobeLock,
  ClipboardList,
  X,
  Monitor,
  AppWindow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormProvider, useFormContext } from "@/components/forms/form-context";
import { FormPreview } from "@/components/forms/form-preview";
import { FieldsSection } from "@/components/forms/fields-section";
import { HeaderSection } from "@/components/forms/header-section";
import { AppearanceSection } from "@/components/forms/appearance-section";
import { AfterSubmissionSection } from "@/components/forms/after-submission-section";
import { IntegratePanel } from "@/components/forms/integrate-panel";
import { RightPanel } from "@/components/patterns/right-panel";
import { toggleFormPublished } from "@/actions/forms";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type WorkspaceForm = {
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
  published: boolean;
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

type FormWorkspaceProps = {
  apiUrl: string;
  ownerEmail: string;
  form: WorkspaceForm;
  initialMode?: "edit" | "view";
};

export function FormWorkspace({ apiUrl, ownerEmail, form, initialMode = "view" }: FormWorkspaceProps) {
  const [editing, setEditing] = useState(initialMode === "edit");

  return (
    <FormProvider initialForm={form} autoSaveEnabled={editing}>
      <WorkspaceInner
        apiUrl={apiUrl}
        ownerEmail={ownerEmail}
        form={form}
        editing={editing}
        setEditing={setEditing}
      />
    </FormProvider>
  );
}

type WorkspaceInnerProps = {
  apiUrl: string;
  ownerEmail: string;
  form: WorkspaceForm;
  editing: boolean;
  setEditing: (editing: boolean) => void;
};

function WorkspaceInner({ apiUrl, ownerEmail, form, editing, setEditing }: WorkspaceInnerProps) {
  const { state, saveStatus, updateName } = useFormContext();
  const [previewMode, setPreviewMode] = useState<"embed" | "page">("embed");
  const [integrateOpen, setIntegrateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [published, setPublished] = useState(form.published);
  const [isPublishing, startPublishTransition] = useTransition();

  return (
    <>
      <div className="flex flex-col h-full">
        {/* ─── Header ──────────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 md:px-8 pt-4 md:pt-6 pb-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              {/* Left: navigation + title */}
              <div className="flex items-center gap-3 min-w-0">
                {editing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    aria-label="Done editing"
                    onClick={() => setEditing(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Link href="/forms">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" aria-label="Back to forms">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                )}

                <div className="min-w-0">
                  {editing && editingName ? (
                    <Input
                      autoFocus
                      value={state.name}
                      onChange={(e) => updateName(e.target.value)}
                      onBlur={() => setEditingName(false)}
                      onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); }}
                      className="text-2xl font-heading font-semibold tracking-tight h-auto"
                      placeholder="Form name"
                    />
                  ) : (
                    <h1 className="text-2xl font-heading font-semibold tracking-tight flex items-center gap-2 truncate">
                      {editing ? state.name : form.name}
                      {editing && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => setEditingName(true)} aria-label="Rename form">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </h1>
                  )}
                </div>
              </div>

              {/* Right: action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {editing ? (
                  <>
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
                    <Button
                      variant={published ? "outline" : "default"}
                      size="sm"
                      disabled={isPublishing}
                      onClick={() => {
                        const next = !published;
                        startPublishTransition(async () => {
                          try {
                            await toggleFormPublished(form.id, next);
                            setPublished(next);
                            toast.success(next ? "Form published" : "Form unpublished");
                          } catch {
                            toast.error("Failed to update publish status");
                          }
                        });
                      }}
                    >
                      {published ? (
                        <GlobeLock className="mr-2 h-4 w-4" />
                      ) : (
                        <Globe className="mr-2 h-4 w-4" />
                      )}
                      {isPublishing ? "Updating..." : published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIntegrateOpen(true)}>
                      <Code className="mr-2 h-4 w-4" />
                      Integrate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                      Done
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Link href={`/forms/${form.id}/submissions`}>
                      <Button variant="outline" size="sm">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Submissions
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Body: editor column + preview column ────────────────────── */}
        <div className="flex flex-1 min-h-0">
          {/* Editor column — animates width on desktop, full-width on mobile when editing */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              editing
                ? "w-full lg:w-[480px] xl:w-[640px] lg:opacity-100 shrink-0"
                : "w-0 opacity-0",
            )}
          >
            <div className="w-full lg:w-[480px] xl:w-[640px] overflow-y-auto h-full px-4 md:px-8 py-6">
              <div className="max-w-[640px] mx-auto space-y-8">
                <HeaderSection />
                <FieldsSection formId={form.id} />
                <AppearanceSection />
                <AfterSubmissionSection ownerEmail={ownerEmail} />
              </div>
            </div>
          </div>

          {/* Preview column — fills remaining space */}
          <div className={cn(
            "flex-1 min-w-0 flex flex-col border-l border-border/50 overflow-hidden",
            editing && "hidden lg:flex",
          )}>
            {/* Embed / Page tab bar */}
            <div className="shrink-0 px-4 pt-3 pb-1">
              <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "embed" | "page")}>
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
              </Tabs>
            </div>

            {/* Preview area */}
            <div className="flex-1 overflow-y-auto">
              {previewMode === "embed" ? (
                <div className="p-6 min-h-[400px]">
                  <FormPreview
                    live={editing}
                    form={editing ? undefined : form}
                    mode="embed"
                  />
                </div>
              ) : (
                <FormPreview
                  live={editing}
                  form={editing ? undefined : form}
                  mode="page"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile preview handle — fixed tab on right edge (only in edit mode) */}
      {editing && (
        <button
          onClick={() => setPreviewOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 lg:hidden flex flex-col items-center gap-1.5 rounded-l-lg border border-r-0 border-border/50 bg-background/90 backdrop-blur-sm px-1.5 py-3 shadow-md transition-colors hover:bg-muted/80"
          aria-label="Open preview"
        >
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium [writing-mode:vertical-lr]">
            Preview
          </span>
        </button>
      )}

      {/* Mobile preview sheet */}
      <RightPanel
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Preview"
      >
        <FormPreview live mode="page" />
      </RightPanel>

      <IntegratePanel
        open={integrateOpen}
        onClose={() => setIntegrateOpen(false)}
        apiUrl={apiUrl}
        form={form}
        published={published}
      />
    </>
  );
}

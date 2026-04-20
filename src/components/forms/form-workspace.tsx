"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Check,
  Pencil,
  Eye,
  Monitor,
  AppWindow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FormProvider, useFormContext } from "@/components/forms/form-context";
import { FormPreview } from "@/components/forms/form-preview";
import { FieldsSection } from "@/components/forms/fields-section";
import { HeaderSection } from "@/components/forms/header-section";
import { AppearanceSection } from "@/components/forms/appearance-section";
import { AfterSubmissionSection } from "@/components/forms/after-submission-section";
import { PublishContent } from "@/components/forms/publish-content";
import { SubmissionsContent } from "@/components/forms/submissions-content";
import { RightPanel } from "@/components/patterns/right-panel";
import { FormTabNav } from "@/components/forms/form-tab-nav";
import { toggleFormPublished } from "@/actions/forms";
import { toast } from "sonner";
import { useThumbnailCapture } from "@/hooks/use-thumbnail-capture";

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

type Submission = {
  id: string;
  createdAt: string;
  status: string;
  isSpam: boolean;
  data: Record<string, unknown>;
};

type FormWorkspaceProps = {
  apiUrl: string;
  ownerEmail: string;
  form: WorkspaceForm;
  submissions?: Submission[];
  statusFilter?: string;
  spamFilter?: string;
};

export function FormWorkspace({ apiUrl, ownerEmail, form, submissions = [], statusFilter = "all", spamFilter = "all" }: FormWorkspaceProps) {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const activeTab =
    mode === "submissions" ? "submissions" :
    mode === "publish" ? "publish" :
    "editor";

  return (
    <FormProvider initialForm={form} autoSaveEnabled={activeTab === "editor" || activeTab === "publish"}>
      <WorkspaceInner
        apiUrl={apiUrl}
        ownerEmail={ownerEmail}
        form={form}
        activeTab={activeTab}
        submissions={submissions}
        statusFilter={statusFilter}
        spamFilter={spamFilter}
      />
    </FormProvider>
  );
}

type WorkspaceInnerProps = {
  apiUrl: string;
  ownerEmail: string;
  form: WorkspaceForm;
  activeTab: string;
  submissions: Submission[];
  statusFilter: string;
  spamFilter: string;
};

function WorkspaceInner({ apiUrl, ownerEmail, form, activeTab, submissions, statusFilter, spamFilter }: WorkspaceInnerProps) {
  const router = useRouter();
  const { state, saveStatus, updateName } = useFormContext();

  const handleTabChange = (tab: string) => {
    const mode = tab === "editor" ? "edit" : tab;
    router.push(`/forms/${form.id}?mode=${mode}`);
  };
  const [previewMode, setPreviewMode] = useState<"embed" | "page">("embed");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [openSection, setOpenSection] = useState<"header" | "fields" | "appearance" | "settings" | null>("fields");
  const [published, setPublished] = useState(form.published);
  const [isPublishing, startPublishTransition] = useTransition();
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const editing = activeTab === "editor";

  useThumbnailCapture({
    formId: form.id,
    saveStatus,
    previewRef: previewContainerRef,
    enabled: editing,
  });

  const handlePublishToggle = () => {
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
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* ─── Header ──────────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 md:px-8 pt-4 md:pt-6 pb-0">
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              {/* Left: back arrow + form name */}
              <div className="flex items-center gap-3 min-w-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/forms">
                      <Button variant="ghost" size="icon-sm" aria-label="Back to forms">
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Back to forms</TooltipContent>
                </Tooltip>

                <div className="min-w-0">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        value={state.name}
                        onChange={(e) => updateName(e.target.value)}
                        onBlur={() => setEditingName(false)}
                        onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); }}
                        className="text-2xl font-heading font-semibold tracking-tight h-auto"
                        placeholder="Form name"
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingName(false)}
                        aria-label="Confirm name"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <h1 className="text-2xl font-heading font-semibold tracking-tight flex items-center gap-2 truncate">
                      {state.name || form.name}
                      {editing && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" onClick={() => setEditingName(true)} aria-label="Rename form">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Rename form</TooltipContent>
                        </Tooltip>
                      )}
                    </h1>
                  )}
                </div>
              </div>

              {/* Right: contextual actions */}
              <div className="flex items-center gap-2 shrink-0">
                {editing && (
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
                  </>
                )}
              </div>
            </div>

            {/* Tab navigation */}
            <FormTabNav
              formId={form.id}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>
        </div>

        {/* ─── Body ────────────────────────────────────────────────────── */}
        {activeTab === "submissions" ? (
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
            <SubmissionsContent
              formId={form.id}
              submissions={submissions}
              statusFilter={statusFilter}
              spamFilter={spamFilter}
            />
          </div>
        ) : activeTab === "publish" ? (
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
            <div className="max-w-5xl mx-auto">
              <PublishContent
                apiUrl={apiUrl}
                form={form}
                published={published}
                isPublishing={isPublishing}
                onPublishToggle={handlePublishToggle}
              />
            </div>
          </div>
        ) : (
          /* Editor tab: editor column + preview column */
          <div className="flex flex-1 min-h-0 justify-center">
            {/* Editor column */}
            <div className="w-full lg:w-[600px] shrink-0 overflow-y-auto px-4 md:px-8 py-6">
              <div className="max-w-[640px] mx-auto space-y-4">
                <HeaderSection
                  open={openSection === "header"}
                  onOpenChange={(v) => setOpenSection(v ? "header" : null)}
                />
                <FieldsSection
                  formId={form.id}
                  open={openSection === "fields"}
                  onOpenChange={(v) => setOpenSection(v ? "fields" : null)}
                />
                <AppearanceSection
                  open={openSection === "appearance"}
                  onOpenChange={(v) => setOpenSection(v ? "appearance" : null)}
                />
                <AfterSubmissionSection
                  ownerEmail={ownerEmail}
                  open={openSection === "settings"}
                  onOpenChange={(v) => setOpenSection(v ? "settings" : null)}
                />
              </div>
            </div>

            {/* Preview column — fixed width, floating shadow on both sides */}
            <div className="w-[600px] shrink-0 hidden lg:flex flex-col overflow-hidden shadow-[-8px_0_16px_-4px_rgba(0,0,0,0.08),8px_0_16px_-4px_rgba(0,0,0,0.08)] dark:shadow-[-8px_0_16px_-4px_rgba(0,0,0,0.3),8px_0_16px_-4px_rgba(0,0,0,0.3)]">
              {/* Embed / Page toggle */}
              <div className="shrink-0 px-4 pt-3 pb-1">
                <div className="flex gap-1">
                  <Button
                    variant={previewMode === "embed" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode("embed")}
                  >
                    <Monitor className="h-4 w-4" />
                    Embed
                  </Button>
                  <Button
                    variant={previewMode === "page" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode("page")}
                  >
                    <AppWindow className="h-4 w-4" />
                    Page
                  </Button>
                </div>
              </div>

              {/* Preview area */}
              <div ref={previewContainerRef} className="flex-1 overflow-y-auto flex flex-col">
                <FormPreview live mode={previewMode} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile preview handle — fixed tab on right edge (only in editor tab) */}
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
    </>
  );
}

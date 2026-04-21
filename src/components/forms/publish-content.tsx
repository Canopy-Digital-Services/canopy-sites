"use client";

import { CopyButton } from "@/components/copy-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Globe,
  GlobeLock,
  Link2,
  Code2,
  ExternalLink,
  Shield,
  Plus,
  Trash2,
  Save,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFormContext } from "@/components/forms/form-context";

type PublishContentProps = {
  apiUrl: string;
  published: boolean;
  isPublishing: boolean;
  onPublishToggle: () => void;
  publishDisabledReason?: string;
  form: {
    id: string;
    name: string;
    slug: string;
    honeypotField: string | null;
    fields: Array<{
      id: string;
      name: string;
      label: string;
      type: string;
      required: boolean;
    }>;
  };
};

export function PublishContent({
  apiUrl,
  form,
  published,
  isPublishing,
  onPublishToggle,
  publishDisabledReason,
}: PublishContentProps) {
  const { state, saveStatus, updateSubmissionSettings } = useFormContext();
  const hostedUrl = `${apiUrl}/f/${form.id}`;

  const embedCode = `<div
  data-canopy-form="${form.id}"
  data-base-url="${apiUrl}"
></div>
<script src="${apiUrl}/embed.js" defer></script>`;

  const handleAddOrigin = () => {
    updateSubmissionSettings({ allowedOrigins: [...state.allowedOrigins, ""] });
  };

  const handleRemoveOrigin = (index: number) => {
    updateSubmissionSettings({
      allowedOrigins: state.allowedOrigins.filter((_, i) => i !== index),
    });
  };

  const handleOriginChange = (index: number, value: string) => {
    const updated = [...state.allowedOrigins];
    updated[index] = value;
    updateSubmissionSettings({ allowedOrigins: updated });
  };

  return (
    <div className="max-w-[640px] mx-auto space-y-6">
      {/* ── Publish status ─────────────────────────────── */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {published ? (
              <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <GlobeLock className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {published ? "Published" : "Not published"}
                </span>
                {published ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    Draft
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {published
                  ? "Your form is accepting submissions"
                  : "Publish to start accepting submissions"}
              </p>
            </div>
          </div>
          {!published && publishDisabledReason ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button
                    variant="default"
                    size="sm"
                    disabled
                    aria-disabled="true"
                  >
                    <Globe className="h-4 w-4" />
                    Publish
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{publishDisabledReason}</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant={published ? "outline" : "default"}
              size="sm"
              disabled={isPublishing}
              onClick={onPublishToggle}
            >
              {published ? (
                <GlobeLock className="h-4 w-4" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              {isPublishing
                ? "Updating..."
                : published
                  ? "Unpublish"
                  : "Publish"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Share link (published only) ────────────────── */}
      {published && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Share Link</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-3 py-2 rounded-md flex-1 break-all">
                {hostedUrl}
              </code>
              <CopyButton text={hostedUrl} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Anyone with this link can fill out your form.
              </p>
              <a
                href={hostedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Open
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Allowed Origins ────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <CardTitle className="text-base">Allowed Origins</CardTitle>
                <CardDescription>
                  Domains allowed to embed and submit to this form. Localhost is always allowed for development.
                </CardDescription>
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
                <span className="text-sm text-success flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.allowedOrigins.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No origins configured. Submissions will be blocked unless you add allowed domains.
            </p>
          ) : (
            <div className="space-y-2">
              {state.allowedOrigins.map((origin, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={origin}
                    onChange={(e) => handleOriginChange(index, e.target.value)}
                    placeholder="example.com"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveOrigin(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove origin</TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddOrigin}
          >
            <Plus className="h-4 w-4" />
            Add Origin
          </Button>
        </CardContent>
      </Card>

      {/* ── Embed code ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Embed on Your Website</CardTitle>
            </div>
            <CopyButton text={embedCode} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
            <code>{embedCode}</code>
          </pre>
          <p className="text-xs text-muted-foreground">
            Paste this snippet into your HTML where you want the form to appear.
          </p>
        </CardContent>
      </Card>

      {/* ── Configuration notes ────────────────────────── */}
      {form.honeypotField && (
        <div className="space-y-2.5 px-1">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>
              Spam protection is active — the embed handles this automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

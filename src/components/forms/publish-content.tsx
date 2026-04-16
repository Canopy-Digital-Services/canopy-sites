"use client";

import { CopyButton } from "@/components/copy-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Globe,
  GlobeLock,
  Link2,
  Code2,
  ExternalLink,
  Shield,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PublishContentProps = {
  apiUrl: string;
  published: boolean;
  isPublishing: boolean;
  onPublishToggle: () => void;
  form: {
    id: string;
    name: string;
    slug: string;
    honeypotField: string | null;
    allowedOrigins: string[];
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
}: PublishContentProps) {
  const hostedUrl = `${apiUrl}/f/${form.id}`;

  const embedCode = `<div
  data-canopy-form="${form.id}"
  data-base-url="${apiUrl}"
></div>
<script src="${apiUrl}/embed.js" defer></script>`;

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
      <div className="space-y-2.5 px-1">
        {form.honeypotField && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>
              Spam protection is active — the embed handles this automatically.
            </p>
          </div>
        )}

        {form.allowedOrigins.length > 0 ? (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>
              Allowed origins:{" "}
              {form.allowedOrigins.map((origin, i) => (
                <code
                  key={i}
                  className="bg-muted px-1.5 py-0.5 rounded mx-0.5"
                >
                  {origin}
                </code>
              ))}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 py-3 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>
              To accept submissions, add your website&apos;s domain under
              Allowed Origins in Submission Settings on the Editor tab.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

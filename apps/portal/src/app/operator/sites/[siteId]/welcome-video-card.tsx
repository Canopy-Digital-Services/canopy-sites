"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { removeSiteWelcomeVideo } from "@/actions/admin/welcome-video";
import { sitesTabLabel, type SitesTabId } from "@/lib/sites-tabs";
import {
  CAPTIONS_LENGTH_HEADER,
  isMp4,
  isWebVtt,
  WELCOME_CAPTIONS_MAX_BYTES,
  WELCOME_UPLOAD_ERRORS,
  WELCOME_UPLOAD_MAX_BYTES,
} from "@/lib/welcome-video-limits";

/** Where a tab's video stands; the upload time is formatted on the server. */
export type WelcomeVideoRow = { tab: SitesTabId; state: "none" | "missing" | { uploadedAt: string } };

/**
 * The site's welcome videos on the operator's page, a row for
 * each tab of the portal: whether the tab has a video, the upload of an MP4
 * with its captions, which replaces it, and taking it away. `videos` is null
 * where this portal keeps no media.
 */
export function WelcomeVideoCard({ siteId, videos }: { siteId: string; videos: WelcomeVideoRow[] | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploadingTo, setUploadingTo] = useState<WelcomeVideoRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function remove(tab: SitesTabId) {
    startTransition(async () => {
      const result = await removeSiteWelcomeVideo(siteId, tab);
      if ("error" in result) toast.error(result.error);
      else toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome videos</CardTitle>
      </CardHeader>
      <CardContent>
        {videos === null ? (
          <p className="text-sm text-muted-foreground">This portal has no media storage (MEDIA_DIR is not set).</p>
        ) : (
          <ul className="divide-y">
            {videos.map((row) => {
              const label = sitesTabLabel(row.tab);
              return (
                <li key={row.tab} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">{label}</p>
                    {row.state === "missing" ? (
                      <p className="text-destructive">Its file is missing from this portal. Upload it again.</p>
                    ) : (
                      <p className="text-muted-foreground">{row.state === "none" ? "None yet" : `Uploaded ${row.state.uploadedAt}`}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" disabled={isPending} onClick={() => setUploadingTo(row)}>
                      {typeof row.state === "object" ? "Replace" : "Upload"}
                    </Button>
                    {row.state === "none" ? null : (
                      <ConfirmDialog
                        title={`Remove the ${label} video?`}
                        description="Clears how far each person watched it. A video you upload for this tab later opens once for each of them again."
                        onConfirm={() => remove(row.tab)}
                        destructive
                        trigger={
                          <Button variant="outline" size="sm" disabled={isPending}>
                            Remove
                          </Button>
                        }
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {uploadingTo ? (
        <UploadDialog
          key={uploadingTo.tab}
          siteId={siteId}
          tab={uploadingTo.tab}
          replaces={typeof uploadingTo.state === "object"}
          onClose={() => setUploadingTo(null)}
        />
      ) : null}
    </Card>
  );
}

/** The upload of one tab's video: the MP4 and its captions, both required, checked as they are chosen. */
function UploadDialog({ siteId, tab, replaces, onClose }: { siteId: string; tab: SitesTabId; replaces: boolean; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const label = sitesTabLabel(tab);
  const [video, setVideo] = useState<File | null>(null);
  const [captions, setCaptions] = useState<File | null>(null);
  // What a chosen file turned out not to be; reading it takes a moment, so these are set, not derived.
  const [wrong, setWrong] = useState<{ video?: boolean; captions?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  /** The share of the upload sent so far, while one is under way. */
  const [progress, setProgress] = useState<number | null>(null);
  const uploading = progress !== null;

  const tooLarge = (video?.size ?? 0) + (captions?.size ?? 0) > WELCOME_UPLOAD_MAX_BYTES;
  const errors = {
    video: video ? (wrong.video ? WELCOME_UPLOAD_ERRORS.video : tooLarge ? WELCOME_UPLOAD_ERRORS.size : "") : submitted ? WELCOME_UPLOAD_ERRORS.video : "",
    captions: captions ? (wrong.captions ? WELCOME_UPLOAD_ERRORS.captions : "") : submitted ? WELCOME_UPLOAD_ERRORS.captions : "",
  };

  async function chooseVideo(file: File | null) {
    setVideo(file);
    setServerError(null);
    setWrong((w) => ({ ...w, video: false }));
    if (file && !isMp4(new Uint8Array(await file.slice(0, 8).arrayBuffer()))) setWrong((w) => ({ ...w, video: true }));
  }

  async function chooseCaptions(file: File | null) {
    setCaptions(file);
    setServerError(null);
    setWrong((w) => ({ ...w, captions: false }));
    if (file && (file.size > WELCOME_CAPTIONS_MAX_BYTES || !isWebVtt(await file.text()))) setWrong((w) => ({ ...w, captions: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!video || !captions || errors.video || errors.captions) return;

    setServerError(null);
    setProgress(0);
    const result = await send(siteId, tab, captions, video, setProgress);
    setProgress(null);
    if ("error" in result) {
      setServerError(result.error);
      return;
    }
    toast.success(`${label} video uploaded.`);
    router.refresh();
    onClose();
  }

  return (
    // An upload under way is not abandoned by a click beside the dialog.
    <Dialog open onOpenChange={(open) => (open || uploading ? null : onClose())}>
      <DialogContent aria-describedby={undefined} showCloseButton={!uploading}>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{label} welcome video</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="welcome-video">Video</Label>
            <Input
              id="welcome-video"
              type="file"
              accept="video/mp4,.mp4"
              disabled={uploading}
              aria-invalid={errors.video ? true : undefined}
              onChange={(e) => void chooseVideo(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">MP4, up to 100 MB.</p>
            {errors.video ? <p className="text-sm text-destructive">{errors.video}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="welcome-captions">Captions</Label>
            <Input
              id="welcome-captions"
              type="file"
              accept="text/vtt,.vtt"
              disabled={uploading}
              aria-invalid={errors.captions ? true : undefined}
              onChange={(e) => void chooseCaptions(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">WebVTT (.vtt).</p>
            {errors.captions ? <p className="text-sm text-destructive">{errors.captions}</p> : null}
          </div>
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={uploading}>
              {uploading ? `Uploading ${Math.floor(progress * 100)}%` : replaces ? "Replace" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Posts the captions and then the video as one body (see the route). An
 * XMLHttpRequest because `fetch` reports no progress on what it sends.
 */
function send(siteId: string, tab: SitesTabId, captions: File, video: File, onProgress: (share: number) => void) {
  return new Promise<{ ok: true } | { error: string }>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/operator/sites/${siteId}/welcome-video/${tab}`);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader(CAPTIONS_LENGTH_HEADER, String(captions.size));
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status === 200) resolve({ ok: true });
      // Cloudflare answers an upload over its limit itself, with a page.
      else resolve({ error: xhr.response?.error ?? (xhr.status === 413 ? WELCOME_UPLOAD_ERRORS.size : "The upload failed") });
    };
    xhr.onerror = () => resolve({ error: "The upload failed" });
    xhr.send(new Blob([captions, video]));
  });
}

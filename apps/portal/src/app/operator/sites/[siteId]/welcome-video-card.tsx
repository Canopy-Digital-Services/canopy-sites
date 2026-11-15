"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { removeSiteWelcomeVideo } from "@/actions/admin/welcome-video";
import {
  CAPTIONS_LENGTH_HEADER,
  isMp4,
  isWebVtt,
  WELCOME_CAPTIONS_MAX_BYTES,
  WELCOME_UPLOAD_ERRORS,
  WELCOME_UPLOAD_MAX_BYTES,
} from "@/lib/welcome-video-limits";

/** Where the site's video stands; the upload time is formatted on the server. */
export type WelcomeVideoCardState = "no-storage" | "none" | "missing" | { uploadedAt: string };

/**
 * The site's welcome video (ROADMAP E39) on the operator's page: whether it
 * has one, the upload of an MP4 with its captions, which replaces it, and
 * taking it away.
 */
export function WelcomeVideoCard({ siteId, state }: { siteId: string; state: WelcomeVideoCardState }) {
  const router = useRouter();
  const { toast } = useToast();
  const form = useRef<HTMLFormElement>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [captions, setCaptions] = useState<File | null>(null);
  // What a chosen file turned out not to be; reading it takes a moment, so these are set, not derived.
  const [wrong, setWrong] = useState<{ video?: boolean; captions?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  /** The share of the upload sent so far, while one is under way. */
  const [progress, setProgress] = useState<number | null>(null);
  const uploading = progress !== null;
  const [removing, startRemoving] = useTransition();
  const busy = uploading || removing;
  const hasVideo = state === "missing" || typeof state === "object";

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
    const result = await send(siteId, captions, video, setProgress);
    setProgress(null);
    if ("error" in result) {
      setServerError(result.error);
      return;
    }
    toast.success("Welcome video uploaded.");
    form.current?.reset();
    setVideo(null);
    setCaptions(null);
    setSubmitted(false);
    router.refresh();
  }

  function remove() {
    startRemoving(async () => {
      const result = await removeSiteWelcomeVideo(siteId);
      if ("error" in result) toast.error(result.error);
      else toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome video</CardTitle>
      </CardHeader>
      {state === "no-storage" ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">This portal has no media storage (MEDIA_DIR is not set).</p>
        </CardContent>
      ) : (
        <form ref={form} onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {state === "missing" ? (
              <p className="text-sm text-destructive">Its file is missing from this portal. Upload it again.</p>
            ) : (
              <p className="text-sm text-muted-foreground">{state === "none" ? "None yet." : `Uploaded ${state.uploadedAt}.`}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="welcome-video">Video</Label>
              <Input
                id="welcome-video"
                type="file"
                accept="video/mp4,.mp4"
                disabled={busy}
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
                disabled={busy}
                aria-invalid={errors.captions ? true : undefined}
                onChange={(e) => void chooseCaptions(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">WebVTT (.vtt).</p>
              {errors.captions ? <p className="text-sm text-destructive">{errors.captions}</p> : null}
            </div>
            {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {uploading ? `Uploading ${Math.floor(progress * 100)}%` : typeof state === "object" ? "Replace" : "Upload"}
            </Button>
            {hasVideo ? (
              <ConfirmDialog
                title="Remove welcome video"
                description="Clears how far each person watched. A video you upload later opens once for each of them again."
                onConfirm={remove}
                destructive
                trigger={
                  <Button type="button" variant="outline" disabled={busy}>
                    Remove
                  </Button>
                }
              />
            ) : null}
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

/**
 * Posts the captions and then the video as one body (see the route). An
 * XMLHttpRequest because `fetch` reports no progress on what it sends.
 */
function send(siteId: string, captions: File, video: File, onProgress: (share: number) => void) {
  return new Promise<{ ok: true } | { error: string }>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/operator/sites/${siteId}/welcome-video`);
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

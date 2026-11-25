/**
 * What a welcome video upload must be. The operator's browser
 * checks these before it sends anything, and the server checks them again.
 */

/** The whole request, captions and video together: Cloudflare refuses a larger one on the Free and Pro plans. */
export const WELCOME_UPLOAD_MAX_BYTES = 100_000_000;
export const WELCOME_CAPTIONS_MAX_BYTES = 1_000_000;

/** The upload's body is the captions and then the video; this header says how many bytes the captions are. */
export const CAPTIONS_LENGTH_HEADER = "x-captions-length";

export const WELCOME_UPLOAD_ERRORS = {
  video: "Choose an MP4 file",
  captions: "Choose a WebVTT (.vtt) file",
  size: "The upload has to be under 100 MB",
} as const;

/** An MP4 starts with its `ftyp` box: four bytes of size, then those four letters. */
export function isMp4(head: Uint8Array): boolean {
  return head.length >= 8 && head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70;
}

/** A WebVTT file starts with `WEBVTT`, after an optional byte order mark, then white space or the file's end. */
export function isWebVtt(text: string): boolean {
  return /^\uFEFF?WEBVTT(?:[ \t\r\n]|$)/.test(text);
}

/** Seconds as a player shows them: 4:12, and 1:04:12 from an hour up. */
export function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const s = String(whole % 60).padStart(2, "0");
  const minutes = Math.floor(whole / 60);
  if (minutes < 60) return `${minutes}:${s}`;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}:${s}`;
}

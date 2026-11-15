/**
 * A site's welcome video (ROADMAP E39): a walkthrough of the portal Michael
 * records for the site, shown once to each person on its account.
 *
 * Its files are `<MEDIA_DIR>/welcome/<siteId>/<key>.mp4` and `<key>.vtt`
 * (captions), named by `Site.welcomeVideoKey`. With `MEDIA_DIR` unset there
 * are no videos. They are client media: never in the repo or the image, and
 * served only by `/welcome/[siteId]/[file]`, to the account's people. The
 * operator uploads the pair from the site's page.
 */

import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { prisma } from "@/lib/db";
import type { SessionContext } from "@/lib/session";
import { forgetWelcomeVideo, sessionCanUseAccount, welcomeNotYetShown } from "@/lib/data-access/memberships";
import {
  isMp4,
  isWebVtt,
  WELCOME_CAPTIONS_MAX_BYTES,
  WELCOME_UPLOAD_ERRORS,
  WELCOME_UPLOAD_MAX_BYTES,
} from "@/lib/welcome-video-limits";

const FILE = /^([0-9a-f]{16})\.(mp4|vtt)$/;
const TYPES = { mp4: "video/mp4", vtt: "text/vtt; charset=utf-8" } as const;

type WelcomeSession = Pick<SessionContext, "user" | "memberships" | "actingAs">;

function mediaDir(): string | null {
  return process.env.MEDIA_DIR?.trim() || null;
}

export type WelcomeVideo = {
  video: string;
  captions: string;
  /** Whether it opens by itself on this page load: once per person, never for an operator acting as them. */
  open: boolean;
};

/**
 * The welcome video of the account's site for this session, or null when the
 * account has no site or the site no video. An operator acting as the client
 * (PRD D49) gets the video to open from the help bubble, never by itself.
 */
export async function welcomeVideoFor(session: WelcomeSession, accountId: string): Promise<WelcomeVideo | null> {
  if (!mediaDir()) return null;
  const site = await prisma.site.findUnique({ where: { accountId }, select: { id: true, welcomeVideoKey: true } });
  if (!site?.welcomeVideoKey) return null;
  const base = `/welcome/${site.id}/${site.welcomeVideoKey}`;
  return { video: `${base}.mp4`, captions: `${base}.vtt`, open: await welcomeNotYetShown(session, accountId) };
}

export type WelcomeFile = { path: string; size: number; type: string };

/**
 * One of a site's two welcome files, when this session may use the site's
 * account and the name is the site's current key; else null, which the route
 * answers with a 404. The path is built from the site's own id and a name
 * the pattern above matched, never from the request as it came.
 */
export async function welcomeFile(session: WelcomeSession, siteId: string, file: string): Promise<WelcomeFile | null> {
  const dir = mediaDir();
  const name = FILE.exec(String(file));
  if (!dir || !name) return null;
  const site = await prisma.site.findUnique({
    where: { id: String(siteId) },
    select: { id: true, accountId: true, welcomeVideoKey: true },
  });
  if (!site || site.welcomeVideoKey !== name[1]) return null;
  if (!(await sessionCanUseAccount(session, site.accountId))) return null;
  const full = path.join(dir, "welcome", site.id, `${name[1]}.${name[2]}`);
  const info = await stat(full).catch(() => null);
  if (!info?.isFile()) return null;
  return { path: full, size: info.size, type: TYPES[name[2] as keyof typeof TYPES] };
}

export type WelcomeVideoState = "no-storage" | "none" | "missing" | { uploadedAt: Date };

/**
 * Where the site's video stands, for the operator's page: this portal keeps
 * no media, the site has none, its file is gone from the disk (the volume is
 * not in the backups, so it is uploaded again), or when it was uploaded.
 */
export async function welcomeVideoState(site: { id: string; welcomeVideoKey: string | null }): Promise<WelcomeVideoState> {
  const dir = mediaDir();
  if (!dir) return "no-storage";
  if (!site.welcomeVideoKey) return "none";
  const info = await stat(path.join(dir, "welcome", site.id, `${site.welcomeVideoKey}.mp4`)).catch(() => null);
  return info?.isFile() ? { uploadedAt: info.mtime } : "missing";
}

export type WelcomeUpload = { key: string } | { status: 400 | 404 | 409 | 413; error: string };

class UploadTooLarge extends Error {}

/**
 * Stores an upload as the site's welcome video. `body` is the captions, of
 * `captionsBytes` bytes, and then the MP4, which goes to the disk as it
 * arrives and is never held in memory. Both must be what they claim, and
 * together no more than `maxBytes`. The pair is named by a hash of the MP4,
 * so a new video gets a new address; the site's earlier files, and what an
 * upload that died left behind, are then deleted. A different video also
 * clears what each person had watched. It does not open by itself again for
 * someone the earlier one was shown to.
 */
export async function storeWelcomeVideo(
  siteId: string,
  body: ReadableStream<Uint8Array>,
  captionsBytes: number,
  maxBytes: number = WELCOME_UPLOAD_MAX_BYTES,
): Promise<WelcomeUpload> {
  const root = mediaDir();
  if (!root) return { status: 409, error: "This portal has no media storage" };
  const site = await prisma.site.findUnique({
    where: { id: String(siteId) },
    select: { id: true, accountId: true, welcomeVideoKey: true },
  });
  if (!site) return { status: 404, error: "No such site" };
  if (!Number.isSafeInteger(captionsBytes) || captionsBytes < 1 || captionsBytes > WELCOME_CAPTIONS_MAX_BYTES) {
    return { status: 400, error: WELCOME_UPLOAD_ERRORS.captions };
  }

  const reader = body.getReader();
  let pending: Uint8Array = new Uint8Array(0);
  /** The body's next `length` bytes, or fewer when it ends first. */
  async function take(length: number): Promise<Buffer> {
    const parts: Uint8Array[] = [];
    let have = 0;
    while (have < length) {
      if (pending.length === 0) {
        const { done, value } = await reader.read();
        if (done) break;
        pending = value;
        continue;
      }
      const part = pending.subarray(0, length - have);
      pending = pending.subarray(part.length);
      parts.push(part);
      have += part.length;
    }
    return Buffer.concat(parts);
  }

  const dir = path.join(root, "welcome", site.id);
  const partial = path.join(dir, `${randomBytes(8).toString("hex")}.part`);
  try {
    const captions = await take(captionsBytes);
    if (captions.length < captionsBytes || !isWebVtt(utf8(captions) ?? "")) {
      return { status: 400, error: WELCOME_UPLOAD_ERRORS.captions };
    }
    const head = await take(8);
    if (!isMp4(head)) return { status: 400, error: WELCOME_UPLOAD_ERRORS.video };

    const hash = createHash("sha256");
    let size = captions.length;
    async function* video(): AsyncGenerator<Uint8Array> {
      let chunk: Uint8Array | undefined = Buffer.concat([head, pending]);
      while (chunk) {
        size += chunk.length;
        if (size > maxBytes) throw new UploadTooLarge();
        hash.update(chunk);
        yield chunk;
        chunk = (await reader.read()).value;
      }
    }
    await mkdir(dir, { recursive: true });
    await pipeline(video(), createWriteStream(partial, { flags: "wx" }));

    const key = hash.digest("hex").slice(0, 16);
    await writeFile(path.join(dir, `${key}.vtt`), captions);
    await rename(partial, path.join(dir, `${key}.mp4`));
    await prisma.$transaction([
      prisma.site.update({ where: { id: site.id }, data: { welcomeVideoKey: key } }),
      // What each person watched was of the video this one replaces. The same video, with new captions, keeps it.
      ...(key === site.welcomeVideoKey ? [] : [forgetWelcomeVideo(site.accountId, false)]),
    ]);
    for (const name of await readdir(dir)) {
      if (!name.startsWith(`${key}.`)) await rm(path.join(dir, name), { force: true });
    }
    return { key };
  } catch (error) {
    if (error instanceof UploadTooLarge) return { status: 413, error: WELCOME_UPLOAD_ERRORS.size };
    throw error;
  } finally {
    await rm(partial, { force: true });
    await reader.cancel().catch(() => undefined);
  }
}

/**
 * Takes the site's welcome video away: its key, its files, and what each
 * person on the account had of it, the showing included, so a video uploaded
 * later opens once for each of them. False for a site that doesn't exist.
 */
export async function removeWelcomeVideo(siteId: string): Promise<boolean> {
  const site = await prisma.site.findUnique({ where: { id: String(siteId) }, select: { id: true, accountId: true } });
  if (!site) return false;
  await prisma.$transaction([
    prisma.site.update({ where: { id: site.id }, data: { welcomeVideoKey: null } }),
    forgetWelcomeVideo(site.accountId, true),
  ]);
  const root = mediaDir();
  if (root) await rm(path.join(root, "welcome", site.id), { recursive: true, force: true });
  return true;
}

function utf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return null;
  }
}

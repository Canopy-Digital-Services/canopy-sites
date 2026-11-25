/**
 * A site's welcome videos: walkthroughs Michael records for
 * the site, one for each tab of its portal that needs one, opened once for
 * each person on the account the first time they visit that tab.
 *
 * A video is a `WelcomeVideo` row and two files,
 * `<MEDIA_DIR>/welcome/<siteId>/<tab>-<key>.mp4` and `.vtt` (captions), the
 * key a hash of the MP4. With `MEDIA_DIR` unset there are no videos. They
 * are client media: never in the repo or the image, and served only by
 * `/welcome/[siteId]/[file]`, to the account's people, at
 * `/welcome/<siteId>/<tab>-<key>-video` and `-captions`. Those addresses end
 * in no file extension on purpose: Cloudflare treats a `.mp4` address as one
 * it could cache, and on such a request's miss it fetches the whole file
 * without the player's byte range, so the player gets a 200 and can't seek
 * (seen on sites-dev, 2026-11-18). An address it can't cache passes ranges. The operator uploads
 * and removes them on the site's page. A `WelcomeView` row is one person's
 * viewing of one video.
 */

import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, open, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { prisma } from "@/lib/db";
import type { SessionContext } from "@/lib/session";
import { ownMembershipId, sessionCanUseAccount } from "@/lib/data-access/memberships";
import { isSitesTab, SITES_TABS, type SitesTabId } from "@/lib/sites-tabs";
import {
  isMp4,
  isWebVtt,
  WELCOME_CAPTIONS_MAX_BYTES,
  WELCOME_UPLOAD_ERRORS,
  WELCOME_UPLOAD_MAX_BYTES,
} from "@/lib/welcome-video-limits";

/** A file as it is asked for: the tab, its video's key, and which of the pair. */
const FILE = /^([a-z-]+)-([0-9a-f]{16})-(video|captions)$/;
/** Each part's file on the disk, and the type it is sent as. */
const PARTS = {
  video: { extension: "mp4", type: "video/mp4" },
  captions: { extension: "vtt", type: "text/vtt; charset=utf-8" },
} as const;
/** A file as it is stored, which is also an upload still arriving (`.part`, under a random key). */
const STORED = /^([a-z-]+)-([0-9a-f]{16})\.(mp4|vtt|part)$/;

type WelcomeSession = Pick<SessionContext, "user" | "memberships" | "actingAs">;

function mediaDir(): string | null {
  return process.env.MEDIA_DIR?.trim() || null;
}

export type WelcomeVideo = {
  tab: SitesTabId;
  video: string;
  captions: string;
  /** Whether it opens by itself when this person visits the tab: once each, never for an operator acting as them. */
  open: boolean;
};

/**
 * The welcome videos of the account's site for this session, in the tabs'
 * order; none when the account has no site or the site no video. An operator
 * acting as the client (PRD D49) gets each to open from the help bubble,
 * never by itself.
 */
export async function welcomeVideosFor(session: WelcomeSession, accountId: string): Promise<WelcomeVideo[]> {
  if (!mediaDir()) return [];
  const site = await prisma.site.findUnique({
    where: { accountId },
    select: { id: true, welcomeVideos: { select: { id: true, tab: true, key: true } } },
  });
  if (!site?.welcomeVideos.length) return [];
  const membershipId = await ownMembershipId(session, accountId);
  const shown = membershipId
    ? new Set((await prisma.welcomeView.findMany({ where: { membershipId }, select: { videoId: true } })).map((view) => view.videoId))
    : null;
  return SITES_TABS.flatMap(({ id }) => {
    const video = site.welcomeVideos.find((v) => v.tab === id);
    if (!video) return [];
    const base = `/welcome/${site.id}/${id}-${video.key}`;
    return [{ tab: id, video: `${base}-video`, captions: `${base}-captions`, open: shown !== null && !shown.has(video.id) }];
  });
}

/** Whose viewing of which video a `WelcomeView` row is: the session's own person, of their site's video for the tab. */
async function viewOf(session: WelcomeSession, accountId: string, tab: SitesTabId) {
  const membershipId = await ownMembershipId(session, accountId);
  if (!membershipId) return null;
  const video = await prisma.welcomeVideo.findFirst({ where: { tab, site: { accountId } }, select: { id: true } });
  return video ? { videoId: video.id, membershipId } : null;
}

/** The tab's video opened by itself for this person, so it won't again. The first time stays; acting records nothing. */
export async function markWelcomeShown(session: WelcomeSession, accountId: string, tab: SitesTabId): Promise<void> {
  const view = await viewOf(session, accountId, tab);
  if (view) await prisma.welcomeView.createMany({ data: [view], skipDuplicates: true });
}

/**
 * How far this person has played the tab's video: the furthest point of a
 * video `length` seconds long. It only moves forward. Playing a video counts
 * as having been shown it; an operator acting as the client records nothing.
 */
export async function recordWelcomeWatched(
  session: WelcomeSession,
  accountId: string,
  tab: SitesTabId,
  seconds: number,
  length: number,
): Promise<void> {
  const view = await viewOf(session, accountId, tab);
  if (!view) return;
  await prisma.welcomeView.createMany({ data: [view], skipDuplicates: true });
  await prisma.welcomeView.updateMany({
    where: { ...view, OR: [{ watchedSeconds: null }, { watchedSeconds: { lt: seconds } }] },
    data: { watchedSeconds: seconds, videoSeconds: length },
  });
}

export type WelcomeFile = { path: string; size: number; type: string };

/**
 * One of a video's two files, when this session may use the site's account
 * and the name is the tab's current video; else null, which the route
 * answers with a 404. The path is built from the site's own id and the parts
 * of a name the pattern above matched, never from the request as it came.
 */
export async function welcomeFile(session: WelcomeSession, siteId: string, file: string): Promise<WelcomeFile | null> {
  const dir = mediaDir();
  const name = FILE.exec(String(file));
  if (!dir || !name || !isSitesTab(name[1])) return null;
  const video = await prisma.welcomeVideo.findUnique({
    where: { siteId_tab: { siteId: String(siteId), tab: name[1] } },
    select: { key: true, site: { select: { id: true, accountId: true } } },
  });
  if (!video || video.key !== name[2]) return null;
  if (!(await sessionCanUseAccount(session, video.site.accountId))) return null;
  const part = PARTS[name[3] as keyof typeof PARTS];
  const full = path.join(dir, "welcome", video.site.id, `${name[1]}-${name[2]}.${part.extension}`);
  const info = await stat(full).catch(() => null);
  if (!info?.isFile()) return null;
  return { path: full, size: info.size, type: part.type };
}

export type WelcomeVideoState = "none" | "missing" | { uploadedAt: Date };

/**
 * Where each tab's video stands, for the operator's page: the site has none
 * for the tab, its file is gone from the disk (the volume is not in the
 * backups, so it is uploaded again), or when it was uploaded. Null where
 * this portal keeps no media.
 */
export async function welcomeVideoStates(siteId: string): Promise<{ tab: SitesTabId; state: WelcomeVideoState }[] | null> {
  const dir = mediaDir();
  if (!dir) return null;
  const videos = await prisma.welcomeVideo.findMany({ where: { siteId }, select: { tab: true, key: true } });
  return Promise.all(
    SITES_TABS.map(async ({ id }) => {
      const video = videos.find((v) => v.tab === id);
      if (!video) return { tab: id, state: "none" as const };
      const info = await stat(path.join(dir, "welcome", siteId, `${id}-${video.key}.mp4`)).catch(() => null);
      return { tab: id, state: info?.isFile() ? { uploadedAt: info.mtime } : ("missing" as const) };
    }),
  );
}

/** Deletes a tab's files in a site's directory, all of them or all but the video `keep` names. */
async function removeFiles(dir: string, tab: SitesTabId, keep?: string): Promise<void> {
  for (const name of await readdir(dir).catch(() => [])) {
    const stored = STORED.exec(name);
    if (stored && stored[1] === tab && stored[2] !== keep) await rm(path.join(dir, name), { force: true });
  }
}

export type WelcomeUpload = { key: string } | { status: 400 | 404 | 409 | 413; error: string };

class UploadTooLarge extends Error {}

/**
 * Stores an upload as the site's welcome video for a tab. `body` is the
 * captions, of `captionsBytes` bytes, and then the MP4, which goes to the
 * disk as it arrives and is never held in memory. Both must be what they
 * claim, and together no more than `maxBytes`. The pair is named by a hash
 * of the MP4, so a new video gets a new address; the tab's earlier files,
 * and what an upload that died left behind, are then deleted. A different
 * video also clears what each person had watched. It does not open by itself
 * again for someone the earlier one was shown to.
 */
export async function storeWelcomeVideo(
  siteId: string,
  tab: SitesTabId,
  body: ReadableStream<Uint8Array>,
  captionsBytes: number,
  maxBytes: number = WELCOME_UPLOAD_MAX_BYTES,
): Promise<WelcomeUpload> {
  const root = mediaDir();
  if (!root) return { status: 409, error: "This portal has no media storage" };
  const site = await prisma.site.findUnique({
    where: { id: String(siteId) },
    select: { id: true, welcomeVideos: { where: { tab }, select: { id: true, key: true } } },
  });
  if (!site) return { status: 404, error: "No such site" };
  if (!Number.isSafeInteger(captionsBytes) || captionsBytes < 1 || captionsBytes > WELCOME_CAPTIONS_MAX_BYTES) {
    return { status: 400, error: WELCOME_UPLOAD_ERRORS.captions };
  }
  const had = site.welcomeVideos[0];

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
  const partial = path.join(dir, `${tab}-${randomBytes(8).toString("hex")}.part`);
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
    // Opened before anything is written, so the cleanup below always finds it: a
    // stream that opens the file itself can create it after an early refusal's
    // cleanup has run, and leave it behind.
    const file = await open(partial, "wx");
    await pipeline(video(), file.createWriteStream());

    const key = hash.digest("hex").slice(0, 16);
    await writeFile(path.join(dir, `${tab}-${key}.vtt`), captions);
    await rename(partial, path.join(dir, `${tab}-${key}.mp4`));
    await prisma.$transaction([
      prisma.welcomeVideo.upsert({
        where: { siteId_tab: { siteId: site.id, tab } },
        create: { siteId: site.id, tab, key },
        update: { key },
      }),
      // What each person watched was of the video this one replaces. The same video, with new captions, keeps it.
      ...(had && had.key !== key
        ? [prisma.welcomeView.updateMany({ where: { videoId: had.id }, data: { watchedSeconds: null, videoSeconds: null } })]
        : []),
    ]);
    await removeFiles(dir, tab, key);
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
 * Takes a tab's welcome video away: its row, its files, and with the row
 * each person's viewing of it, so a video uploaded for the tab later opens
 * once for each of them. False for a site that doesn't exist.
 */
export async function removeWelcomeVideo(siteId: string, tab: SitesTabId): Promise<boolean> {
  const site = await prisma.site.findUnique({ where: { id: String(siteId) }, select: { id: true } });
  if (!site) return false;
  await prisma.welcomeVideo.deleteMany({ where: { siteId: site.id, tab } });
  const root = mediaDir();
  if (root) await removeFiles(path.join(root, "welcome", site.id), tab);
  return true;
}

function utf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return null;
  }
}

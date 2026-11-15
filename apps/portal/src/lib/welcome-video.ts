/**
 * A site's welcome video (ROADMAP E39): a walkthrough of the portal Michael
 * records for the site, shown once to each person on its account.
 *
 * Its files are `<MEDIA_DIR>/welcome/<siteId>/<key>.mp4` and `<key>.vtt`
 * (captions), named by `Site.welcomeVideoKey`. With `MEDIA_DIR` unset there
 * are no videos. They are client media: never in the repo or the image, and
 * served only by `/welcome/[siteId]/[file]`, to the account's people.
 */

import path from "node:path";
import { stat } from "node:fs/promises";
import { prisma } from "@/lib/db";
import type { SessionContext } from "@/lib/session";
import { sessionCanUseAccount, welcomeNotYetShown } from "@/lib/data-access/memberships";

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

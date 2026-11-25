import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import type { SitesTabId } from "@/lib/sites-tabs";
import { createAccount, createMember, createSite, resetDatabase } from "../../../test/db";
import { resetRequest, signInAs } from "../../../test/next-request";

vi.mock("next/headers", () => import("../../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.spyOn(console, "log").mockImplementation(() => {});

const { getSession } = await import("@/lib/session");
const { welcomeVideosFor } = await import("@/lib/welcome-video");
const { removeSiteWelcomeVideo } = await import("./welcome-video");

const KEY = "0123456789abcdef";
const SHOWN = new Date("2026-11-14T12:00:00Z");

let mediaDir = "";

beforeAll(async () => {
  mediaDir = await mkdtemp(path.join(tmpdir(), "welcome-remove-"));
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await rm(mediaDir, { recursive: true, force: true });
});

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
  await rm(path.join(mediaDir, "welcome"), { recursive: true, force: true });
  vi.stubEnv("MEDIA_DIR", mediaDir);
});

/** A site with welcome videos for Quick Edit and the Editor on disk, both shown to and played by the two people on its account. */
async function siteWithWatchedVideos() {
  const { account, user: owner } = await createAccount({ planCode: "SITES" });
  const member = await createMember(account.id);
  const site = await createSite(account.id);
  const dir = path.join(mediaDir, "welcome", site.id);
  await mkdir(dir, { recursive: true });
  const memberships = await prisma.membership.findMany({ where: { accountId: account.id } });
  for (const tab of ["quick-edit", "editor"] as const) {
    const video = await prisma.welcomeVideo.create({ data: { siteId: site.id, tab, key: KEY } });
    await prisma.welcomeView.createMany({
      data: memberships.map((m) => ({ videoId: video.id, membershipId: m.id, shownAt: SHOWN, watchedSeconds: 100, videoSeconds: 114 })),
    });
    await writeFile(path.join(dir, `${tab}-${KEY}.mp4`), "video");
    await writeFile(path.join(dir, `${tab}-${KEY}.vtt`), "WEBVTT\n");
  }
  return { account, owner, member, site, dir };
}

async function signInOperator() {
  const { user } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
  await signInAs(user.id);
}

const tabsWithVideo = async (siteId: string) =>
  (await prisma.welcomeVideo.findMany({ where: { siteId }, select: { tab: true } })).map((v) => v.tab).sort();
const files = (dir: string) => readdir(dir).then((names) => names.sort(), () => []);
const views = (userId: string, tab: SitesTabId) => prisma.welcomeView.findFirst({ where: { membership: { userId }, video: { tab } } });

describe("removing a tab's welcome video", () => {
  it("is refused to anyone who isn't a Global Admin", async () => {
    const { owner, site, dir } = await siteWithWatchedVideos();
    await expect(removeSiteWelcomeVideo(site.id, "quick-edit")).rejects.toThrow();
    await signInAs(owner.id);
    await expect(removeSiteWelcomeVideo(site.id, "quick-edit")).rejects.toThrow();

    expect(await tabsWithVideo(site.id)).toEqual(["editor", "quick-edit"]);
    expect(await files(dir)).toHaveLength(4);
  });

  it("takes the tab's video, its files, and each person's viewing of it, and leaves the other tab's", async () => {
    const { account, owner, member, site, dir } = await siteWithWatchedVideos();
    const other = await siteWithWatchedVideos();
    await signInOperator();
    expect(await removeSiteWelcomeVideo(site.id, "quick-edit")).toEqual({ success: true, message: "Quick Edit video removed." });

    expect(await tabsWithVideo(site.id)).toEqual(["editor"]);
    expect(await files(dir)).toEqual([`editor-${KEY}.mp4`, `editor-${KEY}.vtt`]);
    for (const person of [owner, member]) {
      expect(await views(person.id, "quick-edit")).toBeNull();
      expect(await views(person.id, "editor")).toMatchObject({ shownAt: SHOWN, watchedSeconds: 100, videoSeconds: 114 });
    }

    // Another site's videos, and its people, are untouched.
    expect(await tabsWithVideo(other.site.id)).toEqual(["editor", "quick-edit"]);
    expect(await files(other.dir)).toHaveLength(4);
    expect(await views(other.owner.id, "quick-edit")).toMatchObject({ shownAt: SHOWN, watchedSeconds: 100 });

    // The tab gets a video again, as an upload gives it one: it opens for them as a first one does.
    await prisma.welcomeVideo.create({ data: { siteId: site.id, tab: "quick-edit", key: "fedcba9876543210" } });
    resetRequest();
    await signInAs(owner.id);
    const session = await getSession();
    expect((await welcomeVideosFor(session!, account.id)).map((v) => [v.tab, v.open])).toEqual([
      ["quick-edit", true],
      ["editor", false],
    ]);
  });

  it("clears a video whose file is already gone, and says so for a tab or a site that doesn't exist", async () => {
    const { site, dir } = await siteWithWatchedVideos();
    await rm(dir, { recursive: true });
    await signInOperator();
    expect(await removeSiteWelcomeVideo(site.id, "editor")).toMatchObject({ success: true });
    expect(await tabsWithVideo(site.id)).toEqual(["quick-edit"]);

    expect(await removeSiteWelcomeVideo(site.id, "account" as SitesTabId)).toEqual({ error: "That tab doesn't exist." });
    expect(await removeSiteWelcomeVideo("no-such-site", "quick-edit")).toEqual({ error: "That site doesn't exist." });
    expect(await tabsWithVideo(site.id)).toEqual(["quick-edit"]);
  });
});

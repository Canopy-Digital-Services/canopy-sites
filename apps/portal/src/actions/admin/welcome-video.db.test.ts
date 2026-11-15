import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createMember, createSite, resetDatabase } from "../../../test/db";
import { resetRequest, signInAs } from "../../../test/next-request";

vi.mock("next/headers", () => import("../../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.spyOn(console, "log").mockImplementation(() => {});

const { getSession } = await import("@/lib/session");
const { welcomeVideoFor } = await import("@/lib/welcome-video");
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

/** A site with a welcome video on disk that both people on its account were shown and played. */
async function siteWithWatchedVideo() {
  const { account, user: owner } = await createAccount({ planCode: "SITES" });
  const member = await createMember(account.id);
  const site = await createSite(account.id);
  await prisma.site.update({ where: { id: site.id }, data: { welcomeVideoKey: KEY } });
  await prisma.membership.updateMany({
    where: { accountId: account.id },
    data: { welcomeShownAt: SHOWN, welcomeWatchedSeconds: 100, welcomeVideoSeconds: 114 },
  });
  const dir = path.join(mediaDir, "welcome", site.id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${KEY}.mp4`), "video");
  await writeFile(path.join(dir, `${KEY}.vtt`), "WEBVTT\n");
  return { account, owner, member, site, dir };
}

async function signInOperator() {
  const { user } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
  await signInAs(user.id);
}

const keyNow = async (siteId: string) => (await prisma.site.findUniqueOrThrow({ where: { id: siteId } })).welcomeVideoKey;
const files = (dir: string) => readdir(dir).then((names) => names.sort(), () => []);

describe("removing a site's welcome video (ROADMAP E39)", () => {
  it("is refused to anyone who isn't a Global Admin", async () => {
    const { owner, site, dir } = await siteWithWatchedVideo();
    await expect(removeSiteWelcomeVideo(site.id)).rejects.toThrow();
    await signInAs(owner.id);
    await expect(removeSiteWelcomeVideo(site.id)).rejects.toThrow();

    expect(await keyNow(site.id)).toBe(KEY);
    expect(await files(dir)).toEqual([`${KEY}.mp4`, `${KEY}.vtt`]);
  });

  it("takes the video, its files, and what each person had of it, so the next one opens for them as a first one does", async () => {
    const { account, owner, member, site, dir } = await siteWithWatchedVideo();
    const other = await siteWithWatchedVideo();
    await signInOperator();
    expect(await removeSiteWelcomeVideo(site.id)).toEqual({ success: true, message: "Welcome video removed." });

    expect(await keyNow(site.id)).toBeNull();
    expect(await files(dir)).toEqual([]);
    for (const person of [owner, member]) {
      expect(await prisma.membership.findFirstOrThrow({ where: { userId: person.id } })).toMatchObject({
        welcomeShownAt: null,
        welcomeWatchedSeconds: null,
        welcomeVideoSeconds: null,
      });
    }

    // Another site's video, and its people, are untouched.
    expect(await keyNow(other.site.id)).toBe(KEY);
    expect(await files(other.dir)).toEqual([`${KEY}.mp4`, `${KEY}.vtt`]);
    expect(await prisma.membership.findFirstOrThrow({ where: { userId: other.owner.id } })).toMatchObject({
      welcomeShownAt: SHOWN,
      welcomeWatchedSeconds: 100,
    });

    resetRequest();
    await signInAs(owner.id);
    const session = await getSession();
    expect(await welcomeVideoFor(session!, account.id)).toBeNull();
    // The site gets a video again, as an upload gives it one.
    await prisma.site.update({ where: { id: site.id }, data: { welcomeVideoKey: "fedcba9876543210" } });
    expect((await welcomeVideoFor(session!, account.id))?.open).toBe(true);
  });

  it("clears a video whose file is already gone, and says so for a site that doesn't exist", async () => {
    const { site, dir } = await siteWithWatchedVideo();
    await rm(dir, { recursive: true });
    await signInOperator();
    expect(await removeSiteWelcomeVideo(site.id)).toMatchObject({ success: true });
    expect(await keyNow(site.id)).toBeNull();

    expect(await removeSiteWelcomeVideo("no-such-site")).toEqual({ error: "That site doesn't exist." });
  });
});

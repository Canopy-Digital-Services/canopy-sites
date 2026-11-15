import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createMember, createSite, resetDatabase } from "../../../../../test/db";
import { resetRequest, signInAs } from "../../../../../test/next-request";

vi.mock("next/headers", () => import("../../../../../test/next-request"));

const { GET } = await import("./route");

const KEY = "0123456789abcdef";
/** A Quick Edit video's two files are named by the tab and the key. */
const NAME = `quick-edit-${KEY}`;
const VIDEO = Buffer.from(Array.from({ length: 1000 }, (_, i) => i % 251));
const CAPTIONS = "WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nHi.\n";

let mediaDir = "";

beforeAll(async () => {
  mediaDir = await mkdtemp(path.join(tmpdir(), "welcome-route-"));
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await rm(mediaDir, { recursive: true, force: true });
});

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
  vi.stubEnv("MEDIA_DIR", mediaDir);
});

/** A Sites account whose site has a welcome video for Quick Edit on disk. */
async function siteWithVideo() {
  const { account, user } = await createAccount({ planCode: "SITES" });
  const site = await createSite(account.id);
  await prisma.welcomeVideo.create({ data: { siteId: site.id, tab: "quick-edit", key: KEY } });
  const dir = path.join(mediaDir, "welcome", site.id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${NAME}.mp4`), VIDEO);
  await writeFile(path.join(dir, `${NAME}.vtt`), CAPTIONS);
  return { account, user, site, dir };
}

function get(siteId: string, file: string, range?: string) {
  const request = new Request(`https://evil.example.com/welcome/${siteId}/${file}`, { headers: range ? { Range: range } : {} });
  return GET(request, { params: Promise.resolve({ siteId, file }) });
}

/** Signs a Global Admin in and points their session at the account, as Act as client does. */
async function signInActingAs(accountId: string) {
  const { user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
  const { session } = await signInAs(operator.id);
  const actAs = await prisma.actAs.create({ data: { operatorUserId: operator.id, accountId } });
  await prisma.session.update({ where: { id: session.id }, data: { actAsId: actAs.id } });
  return operator;
}

const bytes = async (res: Response) => Buffer.from(await res.arrayBuffer());

describe("/welcome (ROADMAP E39)", () => {
  it("gives each person on the account the video and its captions, out of any shared cache", async () => {
    const { account, user, site } = await siteWithVideo();
    const member = await createMember(account.id);
    for (const id of [user.id, member.id]) {
      resetRequest();
      await signInAs(id);
      const video = await get(site.id, `${NAME}.mp4`);
      expect(video.status).toBe(200);
      expect(video.headers.get("content-type")).toBe("video/mp4");
      expect(video.headers.get("content-length")).toBe("1000");
      expect(video.headers.get("accept-ranges")).toBe("bytes");
      expect(video.headers.get("cache-control")).toBe("private");
      expect((await bytes(video)).equals(VIDEO)).toBe(true);

      const captions = await get(site.id, `${NAME}.vtt`);
      expect(captions.status).toBe(200);
      expect(captions.headers.get("content-type")).toBe("text/vtt; charset=utf-8");
      expect(captions.headers.get("cache-control")).toBe("private");
      expect(await captions.text()).toBe(CAPTIONS);
    }
  });

  it("gives an operator the files only while acting as the account", async () => {
    const { account, site } = await siteWithVideo();
    const operator = await signInActingAs(account.id);
    expect((await get(site.id, `${NAME}.mp4`)).status).toBe(200);

    resetRequest();
    await signInAs(operator.id);
    expect((await get(site.id, `${NAME}.mp4`)).status).toBe(404);
  });

  it("answers a byte range with those bytes, so the player seeks", async () => {
    const { user, site } = await siteWithVideo();
    await signInAs(user.id);

    const first = await get(site.id, `${NAME}.mp4`, "bytes=0-1");
    expect(first.status).toBe(206);
    expect(first.headers.get("content-range")).toBe("bytes 0-1/1000");
    expect(first.headers.get("content-length")).toBe("2");
    expect((await bytes(first)).equals(VIDEO.subarray(0, 2))).toBe(true);

    const middle = await get(site.id, `${NAME}.mp4`, "bytes=400-");
    expect(middle.status).toBe(206);
    expect(middle.headers.get("content-range")).toBe("bytes 400-999/1000");
    expect((await bytes(middle)).equals(VIDEO.subarray(400))).toBe(true);

    const tail = await get(site.id, `${NAME}.mp4`, "bytes=-10");
    expect(tail.headers.get("content-range")).toBe("bytes 990-999/1000");
    expect((await bytes(tail)).equals(VIDEO.subarray(990))).toBe(true);

    const past = await get(site.id, `${NAME}.mp4`, "bytes=1000-");
    expect(past.status).toBe(416);
    expect(past.headers.get("content-range")).toBe("bytes */1000");
  });

  it("is a 404 that nothing caches for a signed-out request and for another account", async () => {
    const { site } = await siteWithVideo();
    const signedOut = await get(site.id, `${NAME}.mp4`);
    expect(signedOut.status).toBe(404);
    expect(signedOut.headers.get("cache-control")).toBe("no-store");

    const { user: outsider } = await createAccount({ planCode: "SITES" });
    await signInAs(outsider.id);
    for (const file of [`${NAME}.mp4`, `${NAME}.vtt`]) {
      const res = await get(site.id, file);
      expect(res.status, file).toBe(404);
      expect(res.headers.get("cache-control")).toBe("no-store");
    }
    expect((await get("no-such-site", `${NAME}.mp4`)).status).toBe(404);
  });

  it("gives each tab its own video", async () => {
    const { user, site, dir } = await siteWithVideo();
    const other = Buffer.from("the Editor's walkthrough");
    await prisma.welcomeVideo.create({ data: { siteId: site.id, tab: "editor", key: "fedcba9876543210" } });
    await writeFile(path.join(dir, "editor-fedcba9876543210.mp4"), other);
    await signInAs(user.id);

    expect((await bytes(await get(site.id, `${NAME}.mp4`))).equals(VIDEO)).toBe(true);
    expect((await bytes(await get(site.id, "editor-fedcba9876543210.mp4"))).equals(other)).toBe(true);
    // One tab's key under another tab's name is neither.
    expect((await get(site.id, `editor-${KEY}.mp4`)).status).toBe(404);
    expect((await get(site.id, "quick-edit-fedcba9876543210.mp4")).status).toBe(404);
  });

  it("is a 404 for any name but the current two files of a tab that has a video", async () => {
    const { user, site, dir } = await siteWithVideo();
    await writeFile(path.join(dir, "quick-edit-fedcba9876543210.mp4"), VIDEO);
    await writeFile(path.join(dir, `stats-${KEY}.mp4`), VIDEO);
    await writeFile(path.join(mediaDir, "secret.mp4"), VIDEO);
    await signInAs(user.id);
    for (const file of [
      // A video the tab had before, still on disk.
      "quick-edit-fedcba9876543210.mp4",
      // A file on disk under a tab the site has no video for, and names with no tab or one that isn't a tab.
      `stats-${KEY}.mp4`,
      KEY + ".mp4",
      `account-${KEY}.mp4`,
      `${NAME}.MP4`,
      `quick-edit-${KEY.toUpperCase()}.mp4`,
      `${NAME}.mp4.vtt`,
      NAME,
      `${NAME}.txt`,
      `x${NAME}.mp4`,
      "../../secret.mp4",
      `../${site.id}/${NAME}.mp4`,
      `..%2F..%2Fsecret.mp4`,
      `${NAME}.mp4\0`,
      "",
    ]) {
      expect((await get(site.id, file)).status, JSON.stringify(file)).toBe(404);
    }
  });

  it("is a 404 when the file is gone from disk, and with no media directory set", async () => {
    const { user, site, dir } = await siteWithVideo();
    await signInAs(user.id);
    await rm(path.join(dir, `${NAME}.vtt`));
    expect((await get(site.id, `${NAME}.vtt`)).status).toBe(404);
    expect((await get(site.id, `${NAME}.mp4`)).status).toBe(200);

    vi.stubEnv("MEDIA_DIR", "");
    expect((await get(site.id, `${NAME}.mp4`)).status).toBe(404);
  });
});

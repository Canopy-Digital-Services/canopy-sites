import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import type { SitesTabId } from "@/lib/sites-tabs";
import { CAPTIONS_LENGTH_HEADER, WELCOME_UPLOAD_MAX_BYTES } from "@/lib/welcome-video-limits";
import { createAccount, createSite, resetDatabase } from "../../../../../../../test/db";
import { resetRequest, signInAs } from "../../../../../../../test/next-request";

vi.mock("next/headers", () => import("../../../../../../../test/next-request"));

const { POST } = await import("./route");
const { GET } = await import("../../../../../welcome/[siteId]/[file]/route");
const { storeWelcomeVideo } = await import("@/lib/welcome-video");

const CAPTIONS = "WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nHi.\n";
/** Bytes that start as an MP4 does; `fill` makes two of them differ. */
const mp4 = (fill: number) => Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypisom"), Buffer.alloc(2000, fill)]);
const keyOf = (video: Buffer) => createHash("sha256").update(video).digest("hex").slice(0, 16);

let mediaDir = "";

beforeAll(async () => {
  mediaDir = await mkdtemp(path.join(tmpdir(), "welcome-upload-"));
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

/** The body a few bytes at a time, as a slow connection delivers it. */
function trickle(body: Buffer): ReadableStream<Uint8Array> {
  let at = 0;
  return new ReadableStream({
    pull(controller) {
      if (at >= body.length) return controller.close();
      controller.enqueue(body.subarray(at, (at += 7)));
    },
  });
}

/** The upload as the site page's card sends it: the captions, then the video, in one body, to the tab's address. */
function upload(siteId: string, tab: string, captions: string | Buffer, video: Buffer, headers: Record<string, string> = {}) {
  const request = new Request(`https://sites.test/operator/sites/${siteId}/welcome-video/${tab}`, {
    method: "POST",
    headers: {
      origin: "https://sites.test",
      "x-forwarded-host": "sites.test",
      [CAPTIONS_LENGTH_HEADER]: String(Buffer.byteLength(captions)),
      ...headers,
    },
    body: trickle(Buffer.concat([Buffer.from(captions), video])),
    duplex: "half",
  } as RequestInit);
  return POST(request, { params: Promise.resolve({ siteId, tab }) });
}

async function operatorAndSite() {
  const { user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
  const { account, user: owner } = await createAccount({ planCode: "SITES" });
  const site = await createSite(account.id);
  await signInAs(operator.id);
  return { operator, account, owner, site };
}

const files = (siteId: string) => readdir(path.join(mediaDir, "welcome", siteId)).then((names) => names.sort(), () => []);
/** Each tab's key, for the tabs of the site that have a video. */
const keysNow = async (siteId: string) =>
  Object.fromEntries((await prisma.welcomeVideo.findMany({ where: { siteId } })).map((v) => [v.tab, v.key]));
const viewOf = (userId: string, tab: SitesTabId) => prisma.welcomeView.findFirst({ where: { membership: { userId }, video: { tab } } });

/** Everyone on the account has been shown the tab's video and played 100 of its 114 seconds. */
async function watched(accountId: string, siteId: string, tab: SitesTabId, shownAt: Date) {
  const video = await prisma.welcomeVideo.findUniqueOrThrow({ where: { siteId_tab: { siteId, tab } } });
  const memberships = await prisma.membership.findMany({ where: { accountId } });
  await prisma.welcomeView.createMany({
    data: memberships.map((m) => ({ videoId: video.id, membershipId: m.id, shownAt, watchedSeconds: 100, videoSeconds: 114 })),
  });
}

describe("uploading a tab's welcome video (ROADMAP E39)", () => {
  it("stores the operator's upload under the tab and the MP4's hash, and the site's owner can then play it", async () => {
    const { owner, site } = await operatorAndSite();
    const video = mp4(1);
    const res = await upload(site.id, "quick-edit", CAPTIONS, video);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");

    const name = `quick-edit-${keyOf(video)}`;
    expect(await keysNow(site.id)).toEqual({ "quick-edit": keyOf(video) });
    expect(await files(site.id)).toEqual([`${name}.mp4`, `${name}.vtt`]);
    expect((await readFile(path.join(mediaDir, "welcome", site.id, `${name}.mp4`))).equals(video)).toBe(true);
    expect(await readFile(path.join(mediaDir, "welcome", site.id, `${name}.vtt`), "utf8")).toBe(CAPTIONS);

    resetRequest();
    await signInAs(owner.id);
    const played = await GET(new Request(`https://sites.test/welcome/${site.id}/${name}-video`), {
      params: Promise.resolve({ siteId: site.id, file: `${name}-video` }),
    });
    expect(played.status).toBe(200);
    expect(Buffer.from(await played.arrayBuffer()).equals(video)).toBe(true);
  });

  it("keeps each tab's video apart, the same MP4 in two tabs included", async () => {
    const { site } = await operatorAndSite();
    const video = mp4(1);
    await upload(site.id, "quick-edit", CAPTIONS, video);
    await upload(site.id, "editor", "WEBVTT\n\nThe Editor.\n", video);
    await upload(site.id, "stats", CAPTIONS, mp4(3));
    const key = keyOf(video);
    expect(await keysNow(site.id)).toEqual({ "quick-edit": key, editor: key, stats: keyOf(mp4(3)) });
    expect(await files(site.id)).toHaveLength(6);

    // Replacing one tab's leaves the others' files alone.
    expect((await upload(site.id, "editor", CAPTIONS, mp4(2))).status).toBe(200);
    expect(await files(site.id)).toEqual(
      [`editor-${keyOf(mp4(2))}`, `quick-edit-${key}`, `stats-${keyOf(mp4(3))}`].flatMap((name) => [`${name}.mp4`, `${name}.vtt`]),
    );
    expect(await readFile(path.join(mediaDir, "welcome", site.id, `quick-edit-${key}.vtt`), "utf8")).toBe(CAPTIONS);
  });

  it("replaces the tab's video, deletes the files it had, and starts what each person watched of it over", async () => {
    const { account, owner, site } = await operatorAndSite();
    await upload(site.id, "quick-edit", CAPTIONS, mp4(1));
    await upload(site.id, "editor", CAPTIONS, mp4(5));
    const shown = new Date("2026-11-14T12:00:00Z");
    await watched(account.id, site.id, "quick-edit", shown);
    await watched(account.id, site.id, "editor", shown);
    const next = mp4(2);
    expect((await upload(site.id, "quick-edit", "WEBVTT\n\nNew captions.\n", next)).status).toBe(200);

    expect(await keysNow(site.id)).toEqual({ "quick-edit": keyOf(next), editor: keyOf(mp4(5)) });
    expect((await files(site.id)).filter((name) => name.startsWith("quick-edit-"))).toEqual([
      `quick-edit-${keyOf(next)}.mp4`,
      `quick-edit-${keyOf(next)}.vtt`,
    ]);
    // It was shown to them once, and a new one doesn't open by itself again.
    expect(await viewOf(owner.id, "quick-edit")).toMatchObject({ shownAt: shown, watchedSeconds: null, videoSeconds: null });
    // The Editor's video wasn't replaced.
    expect(await viewOf(owner.id, "editor")).toMatchObject({ shownAt: shown, watchedSeconds: 100, videoSeconds: 114 });
  });

  it("takes new captions for the same video, and keeps what each person watched of it", async () => {
    const { account, owner, site } = await operatorAndSite();
    const video = mp4(1);
    await upload(site.id, "quick-edit", CAPTIONS, video);
    await watched(account.id, site.id, "quick-edit", new Date());
    expect((await upload(site.id, "quick-edit", "WEBVTT\n\nCorrected.\n", video)).status).toBe(200);

    const name = `quick-edit-${keyOf(video)}`;
    expect(await files(site.id)).toEqual([`${name}.mp4`, `${name}.vtt`]);
    expect(await readFile(path.join(mediaDir, "welcome", site.id, `${name}.vtt`), "utf8")).toBe("WEBVTT\n\nCorrected.\n");
    expect(await viewOf(owner.id, "quick-edit")).toMatchObject({ watchedSeconds: 100, videoSeconds: 114 });
  });

  it("refuses anyone but a Global Admin, and a page on another origin", async () => {
    const { owner, site } = await operatorAndSite();
    expect((await upload(site.id, "quick-edit", CAPTIONS, mp4(1), { origin: "https://client.canopyds.com" })).status).toBe(403);
    expect((await upload(site.id, "quick-edit", CAPTIONS, mp4(1), { origin: "null" })).status).toBe(403);

    resetRequest();
    expect((await upload(site.id, "quick-edit", CAPTIONS, mp4(1))).status).toBe(403);
    await signInAs(owner.id);
    expect((await upload(site.id, "quick-edit", CAPTIONS, mp4(1))).status).toBe(403);

    expect(await keysNow(site.id)).toEqual({});
    expect(await files(site.id)).toEqual([]);
  });

  it("refuses files that aren't an MP4 and its WebVTT captions, and keeps the video the tab had", async () => {
    const { site } = await operatorAndSite();
    const video = mp4(1);
    await upload(site.id, "quick-edit", CAPTIONS, video);
    const kept = [`quick-edit-${keyOf(video)}.mp4`, `quick-edit-${keyOf(video)}.vtt`];

    const notVideo = await upload(site.id, "quick-edit", CAPTIONS, Buffer.from("GIF89a, and nothing like a video"));
    expect(notVideo.status).toBe(400);
    expect(await notVideo.json()).toEqual({ error: "Choose an MP4 file" });

    const srt = await upload(site.id, "quick-edit", "1\n00:00:00,000 --> 00:00:02,000\nHi.\n", mp4(2));
    expect(srt.status).toBe(400);
    expect(await srt.json()).toEqual({ error: "Choose a WebVTT (.vtt) file" });

    // No captions at all, captions that say they are longer than the whole body, and ones that aren't text.
    expect((await upload(site.id, "quick-edit", "", mp4(2))).status).toBe(400);
    expect((await upload(site.id, "quick-edit", CAPTIONS, mp4(2), { [CAPTIONS_LENGTH_HEADER]: "999999" })).status).toBe(400);
    expect((await upload(site.id, "quick-edit", Buffer.concat([Buffer.from("WEBVTT\n"), Buffer.from([0xff, 0xfe])]), mp4(2))).status).toBe(400);

    expect(await keysNow(site.id)).toEqual({ "quick-edit": keyOf(video) });
    expect(await files(site.id)).toEqual(kept);
  });

  it("refuses more than the limit, by the length it states and as it arrives", async () => {
    const { site } = await operatorAndSite();
    const stated = await upload(site.id, "quick-edit", CAPTIONS, mp4(1), { "content-length": String(WELCOME_UPLOAD_MAX_BYTES + 1) });
    expect(stated.status).toBe(413);

    const body = Buffer.concat([Buffer.from(CAPTIONS), mp4(1)]);
    const counted = await storeWelcomeVideo(site.id, "quick-edit", trickle(body), Buffer.byteLength(CAPTIONS), body.length - 1);
    expect(counted).toEqual({ status: 413, error: "The upload has to be under 100 MB" });
    expect("key" in (await storeWelcomeVideo(site.id, "quick-edit", trickle(body), Buffer.byteLength(CAPTIONS), body.length))).toBe(true);

    const second = Buffer.concat([Buffer.from(CAPTIONS), mp4(2)]);
    expect("error" in (await storeWelcomeVideo(site.id, "quick-edit", trickle(second), Buffer.byteLength(CAPTIONS), second.length - 1))).toBe(true);
    expect(await keysNow(site.id)).toEqual({ "quick-edit": keyOf(mp4(1)) });
    expect(await files(site.id)).toEqual([`quick-edit-${keyOf(mp4(1))}.mp4`, `quick-edit-${keyOf(mp4(1))}.vtt`]);
  });

  it("has nowhere to keep one where MEDIA_DIR is unset, and no such site or tab to give one to", async () => {
    const { site } = await operatorAndSite();
    expect((await upload("no-such-site", "quick-edit", CAPTIONS, mp4(1))).status).toBe(404);
    for (const tab of ["account", "Quick Edit", "..", "quick-edit-x"]) {
      expect((await upload(site.id, tab, CAPTIONS, mp4(1))).status, tab).toBe(404);
    }

    vi.stubEnv("MEDIA_DIR", "");
    expect((await upload(site.id, "quick-edit", CAPTIONS, mp4(1))).status).toBe(409);
    expect(await keysNow(site.id)).toEqual({});
    expect(await files(site.id)).toEqual([]);
  });
});

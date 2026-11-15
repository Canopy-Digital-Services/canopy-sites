import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { CAPTIONS_LENGTH_HEADER, WELCOME_UPLOAD_MAX_BYTES } from "@/lib/welcome-video-limits";
import { createAccount, createSite, resetDatabase } from "../../../../../../test/db";
import { resetRequest, signInAs } from "../../../../../../test/next-request";

vi.mock("next/headers", () => import("../../../../../../test/next-request"));

const { POST } = await import("./route");
const { GET } = await import("../../../../welcome/[siteId]/[file]/route");
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

/** The upload as the site page's card sends it: the captions, then the video, in one body. */
function upload(siteId: string, captions: string | Buffer, video: Buffer, headers: Record<string, string> = {}) {
  const request = new Request(`https://sites.test/operator/sites/${siteId}/welcome-video`, {
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
  return POST(request, { params: Promise.resolve({ siteId }) });
}

async function operatorAndSite() {
  const { user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
  const { account, user: owner } = await createAccount({ planCode: "SITES" });
  const site = await createSite(account.id);
  await signInAs(operator.id);
  return { operator, account, owner, site };
}

const files = (siteId: string) => readdir(path.join(mediaDir, "welcome", siteId)).then((names) => names.sort(), () => []);
const keyNow = async (siteId: string) => (await prisma.site.findUniqueOrThrow({ where: { id: siteId } })).welcomeVideoKey;

describe("uploading a site's welcome video (ROADMAP E39)", () => {
  it("stores the operator's upload under the MP4's hash, and the site's owner can then play it", async () => {
    const { owner, site } = await operatorAndSite();
    const video = mp4(1);
    const res = await upload(site.id, CAPTIONS, video);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");

    const key = keyOf(video);
    expect(await keyNow(site.id)).toBe(key);
    expect(await files(site.id)).toEqual([`${key}.mp4`, `${key}.vtt`]);
    expect((await readFile(path.join(mediaDir, "welcome", site.id, `${key}.mp4`))).equals(video)).toBe(true);
    expect(await readFile(path.join(mediaDir, "welcome", site.id, `${key}.vtt`), "utf8")).toBe(CAPTIONS);

    resetRequest();
    await signInAs(owner.id);
    const played = await GET(new Request(`https://sites.test/welcome/${site.id}/${key}.mp4`), {
      params: Promise.resolve({ siteId: site.id, file: `${key}.mp4` }),
    });
    expect(played.status).toBe(200);
    expect(Buffer.from(await played.arrayBuffer()).equals(video)).toBe(true);
  });

  it("replaces the site's video and deletes the files it had", async () => {
    const { site } = await operatorAndSite();
    await upload(site.id, CAPTIONS, mp4(1));
    const next = mp4(2);
    expect((await upload(site.id, "WEBVTT\n\nNew captions.\n", next)).status).toBe(200);

    const key = keyOf(next);
    expect(await keyNow(site.id)).toBe(key);
    expect(await files(site.id)).toEqual([`${key}.mp4`, `${key}.vtt`]);
  });

  it("takes new captions for the same video", async () => {
    const { site } = await operatorAndSite();
    const video = mp4(1);
    await upload(site.id, CAPTIONS, video);
    expect((await upload(site.id, "WEBVTT\n\nCorrected.\n", video)).status).toBe(200);

    const key = keyOf(video);
    expect(await files(site.id)).toEqual([`${key}.mp4`, `${key}.vtt`]);
    expect(await readFile(path.join(mediaDir, "welcome", site.id, `${key}.vtt`), "utf8")).toBe("WEBVTT\n\nCorrected.\n");
  });

  it("refuses anyone but a Global Admin, and a page on another origin", async () => {
    const { owner, site } = await operatorAndSite();
    expect((await upload(site.id, CAPTIONS, mp4(1), { origin: "https://client.canopyds.com" })).status).toBe(403);
    expect((await upload(site.id, CAPTIONS, mp4(1), { origin: "null" })).status).toBe(403);

    resetRequest();
    expect((await upload(site.id, CAPTIONS, mp4(1))).status).toBe(403);
    await signInAs(owner.id);
    expect((await upload(site.id, CAPTIONS, mp4(1))).status).toBe(403);

    expect(await keyNow(site.id)).toBeNull();
    expect(await files(site.id)).toEqual([]);
  });

  it("refuses files that aren't an MP4 and its WebVTT captions, and keeps the video the site had", async () => {
    const { site } = await operatorAndSite();
    const video = mp4(1);
    await upload(site.id, CAPTIONS, video);
    const kept = [`${keyOf(video)}.mp4`, `${keyOf(video)}.vtt`];

    const notVideo = await upload(site.id, CAPTIONS, Buffer.from("GIF89a, and nothing like a video"));
    expect(notVideo.status).toBe(400);
    expect(await notVideo.json()).toEqual({ error: "Choose an MP4 file" });

    const srt = await upload(site.id, "1\n00:00:00,000 --> 00:00:02,000\nHi.\n", mp4(2));
    expect(srt.status).toBe(400);
    expect(await srt.json()).toEqual({ error: "Choose a WebVTT (.vtt) file" });

    // No captions at all, captions that say they are longer than the whole body, and ones that aren't text.
    expect((await upload(site.id, "", mp4(2))).status).toBe(400);
    expect((await upload(site.id, CAPTIONS, mp4(2), { [CAPTIONS_LENGTH_HEADER]: "999999" })).status).toBe(400);
    expect((await upload(site.id, Buffer.concat([Buffer.from("WEBVTT\n"), Buffer.from([0xff, 0xfe])]), mp4(2))).status).toBe(400);

    expect(await keyNow(site.id)).toBe(keyOf(video));
    expect(await files(site.id)).toEqual(kept);
  });

  it("refuses more than the limit, by the length it states and as it arrives", async () => {
    const { site } = await operatorAndSite();
    const stated = await upload(site.id, CAPTIONS, mp4(1), { "content-length": String(WELCOME_UPLOAD_MAX_BYTES + 1) });
    expect(stated.status).toBe(413);

    const body = Buffer.concat([Buffer.from(CAPTIONS), mp4(1)]);
    const counted = await storeWelcomeVideo(site.id, trickle(body), Buffer.byteLength(CAPTIONS), body.length - 1);
    expect(counted).toEqual({ status: 413, error: "The upload has to be under 100 MB" });
    expect("key" in (await storeWelcomeVideo(site.id, trickle(body), Buffer.byteLength(CAPTIONS), body.length))).toBe(true);

    const second = Buffer.concat([Buffer.from(CAPTIONS), mp4(2)]);
    expect("error" in (await storeWelcomeVideo(site.id, trickle(second), Buffer.byteLength(CAPTIONS), second.length - 1))).toBe(true);
    expect(await keyNow(site.id)).toBe(keyOf(mp4(1)));
    expect(await files(site.id)).toEqual([`${keyOf(mp4(1))}.mp4`, `${keyOf(mp4(1))}.vtt`]);
  });

  it("has nowhere to keep one where MEDIA_DIR is unset, and no site to give one to", async () => {
    const { site } = await operatorAndSite();
    expect((await upload("no-such-site", CAPTIONS, mp4(1))).status).toBe(404);

    vi.stubEnv("MEDIA_DIR", "");
    expect((await upload(site.id, CAPTIONS, mp4(1))).status).toBe(409);
    expect(await keyNow(site.id)).toBeNull();
  });
});

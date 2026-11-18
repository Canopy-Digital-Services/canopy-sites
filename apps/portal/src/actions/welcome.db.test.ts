import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import type { SitesTabId } from "@/lib/sites-tabs";
import { createAccount, createMember, createSite, resetDatabase } from "../../test/db";
import { resetRequest, signInAs } from "../../test/next-request";

vi.mock("next/headers", () => import("../../test/next-request"));

const { getSession } = await import("@/lib/session");
const { listPeopleAccess } = await import("@/lib/claim");
const { welcomeVideosFor } = await import("@/lib/welcome-video");
const { welcomeVideoShown, welcomeVideoWatched } = await import("./welcome");

const KEYS: Partial<Record<SitesTabId, string>> = { "quick-edit": "0123456789abcdef", editor: "fedcba9876543210" };

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
  vi.stubEnv("MEDIA_DIR", "/nowhere/media");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

/** A Sites account whose site has a welcome video for each of the tabs named. */
async function siteWithVideos(...tabs: SitesTabId[]) {
  const { account, user } = await createAccount({ planCode: "SITES" });
  const site = await createSite(account.id);
  for (const tab of tabs) await prisma.welcomeVideo.create({ data: { siteId: site.id, tab, key: KEYS[tab]! } });
  return { account, user, site };
}

/** What the signed-in layout hands the help bubble for the current request: each video's tab, and whether it opens by itself. */
async function welcome(accountId: string) {
  const session = await getSession();
  if (!session) throw new Error("signed out");
  return Object.fromEntries((await welcomeVideosFor(session, accountId)).map((video) => [video.tab, video.open]));
}

const shownAt = async (userId: string, tab: SitesTabId) =>
  (await prisma.welcomeView.findFirst({ where: { membership: { userId }, video: { tab } } }))?.shownAt ?? null;

/** Signs a Global Admin in and points their session at the account, as Act as client does. */
async function signInActingAs(accountId: string) {
  const { account: own, user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
  const { session } = await signInAs(operator.id);
  const actAs = await prisma.actAs.create({ data: { operatorUserId: operator.id, accountId } });
  await prisma.session.update({ where: { id: session.id }, data: { actAsId: actAs.id } });
  return { own, operator };
}

describe("each tab's welcome video opening once (ROADMAP E39)", () => {
  it("hands over the videos of the tabs that have one, in the tabs' order, with their files", async () => {
    const { account, user, site } = await siteWithVideos("editor", "quick-edit");
    await signInAs(user.id);
    const session = await getSession();
    expect(await welcomeVideosFor(session!, account.id)).toEqual([
      {
        tab: "quick-edit",
        video: `/welcome/${site.id}/quick-edit-0123456789abcdef-video`,
        captions: `/welcome/${site.id}/quick-edit-0123456789abcdef-captions`,
        open: true,
      },
      {
        tab: "editor",
        video: `/welcome/${site.id}/editor-fedcba9876543210-video`,
        captions: `/welcome/${site.id}/editor-fedcba9876543210-captions`,
        open: true,
      },
    ]);
  });

  it("opens a tab's video by itself until it has been shown to the person, one tab at a time", async () => {
    const { account, user } = await siteWithVideos("quick-edit", "editor");
    await signInAs(user.id);
    expect(await welcome(account.id)).toEqual({ "quick-edit": true, editor: true });

    await welcomeVideoShown("quick-edit");
    // Still handed over, for the help bubble to play; the Editor's waits for their first visit there.
    expect(await welcome(account.id)).toEqual({ "quick-edit": false, editor: true });

    await welcomeVideoShown("editor");
    expect(await welcome(account.id)).toEqual({ "quick-edit": false, editor: false });
  });

  it("is shown to each person on the account separately, and keeps the first time", async () => {
    const { account, user } = await siteWithVideos("quick-edit");
    const member = await createMember(account.id);
    await signInAs(user.id);
    await welcomeVideoShown("quick-edit");
    const first = await shownAt(user.id, "quick-edit");
    expect(first).toBeInstanceOf(Date);
    expect(await shownAt(member.id, "quick-edit")).toBeNull();

    await welcomeVideoShown("quick-edit");
    expect(await shownAt(user.id, "quick-edit")).toEqual(first);

    resetRequest();
    await signInAs(member.id);
    expect(await welcome(account.id)).toEqual({ "quick-edit": true });
    await welcomeVideoShown("quick-edit");
    expect(await welcome(account.id)).toEqual({ "quick-edit": false });
  });

  it("opens for someone who claimed before the tab had a video", async () => {
    const { account, user, site } = await siteWithVideos("quick-edit");
    await signInAs(user.id);
    await welcomeVideoShown("quick-edit");
    expect(await welcome(account.id)).toEqual({ "quick-edit": false });

    await prisma.welcomeVideo.create({ data: { siteId: site.id, tab: "stats", key: "0000000000000000" } });
    expect(await welcome(account.id)).toEqual({ "quick-edit": false, stats: true });
  });

  it("never opens by itself for an operator acting as the account, whose viewing records nothing", async () => {
    const { account, user } = await siteWithVideos("quick-edit");
    const { operator } = await signInActingAs(account.id);

    expect(await welcome(account.id)).toEqual({ "quick-edit": false });
    await welcomeVideoShown("quick-edit");
    expect(await shownAt(user.id, "quick-edit")).toBeNull();
    expect(await shownAt(operator.id, "quick-edit")).toBeNull();
    expect(await prisma.welcomeView.count()).toBe(0);
  });

  it("records nothing for a tab with no video, or a name that isn't a tab", async () => {
    const { account, user } = await siteWithVideos("quick-edit");
    await signInAs(user.id);
    await welcomeVideoShown("editor");
    await welcomeVideoShown("account" as SitesTabId);
    await welcomeVideoShown({ not: null } as unknown as SitesTabId);
    expect(await prisma.welcomeView.count()).toBe(0);
    expect(await welcome(account.id)).toEqual({ "quick-edit": true });
  });

  it("is nothing for an account with no site, and with no media directory set", async () => {
    const { account, user } = await createAccount();
    await signInAs(user.id);
    expect(await welcome(account.id)).toEqual({});

    const withVideo = await siteWithVideos("quick-edit");
    resetRequest();
    await signInAs(withVideo.user.id);
    vi.stubEnv("MEDIA_DIR", "");
    expect(await welcome(withVideo.account.id)).toEqual({});
  });
});

/** What the operator's people card is given for this person. */
const watchedBy = async (accountId: string, userId: string) =>
  (await listPeopleAccess(accountId)).find((person) => person.userId === userId)?.watched;

describe("how far each person has watched each welcome video (ROADMAP E39)", () => {
  it("keeps each person's furthest point in each tab's video, in whole seconds of its length", async () => {
    const { account, user } = await siteWithVideos("quick-edit", "editor");
    const member = await createMember(account.id);
    await signInAs(user.id);
    await welcomeVideoShown("quick-edit");
    expect(await watchedBy(account.id, user.id)).toEqual([]);

    await welcomeVideoWatched("quick-edit", 12.9, 114.45);
    expect(await watchedBy(account.id, user.id)).toEqual([{ tab: "quick-edit", seconds: 12, of: 114 }]);

    // Playing an earlier part again takes nothing back.
    await welcomeVideoWatched("quick-edit", 5, 114.45);
    expect(await watchedBy(account.id, user.id)).toEqual([{ tab: "quick-edit", seconds: 12, of: 114 }]);

    // To the end, which a player may report a hair past the length.
    await welcomeVideoWatched("quick-edit", 114.46, 114.45);
    await welcomeVideoWatched("editor", 40, 130);
    expect(await watchedBy(account.id, user.id)).toEqual(
      expect.arrayContaining([
        { tab: "quick-edit", seconds: 114, of: 114 },
        { tab: "editor", seconds: 40, of: 130 },
      ]),
    );
    expect(await watchedBy(account.id, member.id)).toEqual([]);

    resetRequest();
    await signInAs(member.id);
    await welcomeVideoWatched("quick-edit", 30, 114.45);
    expect(await watchedBy(account.id, member.id)).toEqual([{ tab: "quick-edit", seconds: 30, of: 114 }]);
  });

  it("counts playing a video as having been shown it", async () => {
    const { account, user } = await siteWithVideos("editor");
    await signInAs(user.id);
    await welcomeVideoWatched("editor", 20, 130);
    expect(await shownAt(user.id, "editor")).toBeInstanceOf(Date);
    expect(await welcome(account.id)).toEqual({ editor: false });
  });

  it("records nothing for an operator acting as the account, or for a tab with no video", async () => {
    const { account, user } = await siteWithVideos("quick-edit");
    const { own, operator } = await signInActingAs(account.id);
    await welcomeVideoWatched("quick-edit", 60, 114);
    expect(await watchedBy(account.id, user.id)).toEqual([]);
    expect(await watchedBy(own.id, operator.id)).toEqual([]);

    resetRequest();
    await signInAs(user.id);
    await welcomeVideoWatched("stats", 60, 114);
    expect(await prisma.welcomeView.count()).toBe(0);
  });

  it("drops a report that isn't a tab and two sensible numbers", async () => {
    const { account, user } = await siteWithVideos("quick-edit");
    await signInAs(user.id);
    const reports: [unknown, unknown, unknown][] = [
      ["quick-edit", Number.NaN, 114],
      ["quick-edit", 60, Number.NaN],
      ["quick-edit", Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
      ["quick-edit", -5, 114],
      ["quick-edit", 0.9, 114],
      ["quick-edit", 60, 9_000_000],
      ["quick-edit", "a minute", "two"],
      ["quick-edit", undefined, undefined],
      ["quick-edit", { gt: 0 }, 114],
      ["account", 60, 114],
      [{ not: null }, 60, 114],
      [undefined, 60, 114],
    ];
    for (const [tab, seconds, length] of reports) {
      await welcomeVideoWatched(tab as SitesTabId, seconds as number, length as number);
      expect(await watchedBy(account.id, user.id), JSON.stringify([tab, seconds, length])).toEqual([]);
    }
    expect(await prisma.welcomeView.count()).toBe(0);
  });
});

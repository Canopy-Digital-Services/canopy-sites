import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createMember, createSite, resetDatabase } from "../../test/db";
import { resetRequest, signInAs } from "../../test/next-request";

vi.mock("next/headers", () => import("../../test/next-request"));

const { getSession } = await import("@/lib/session");
const { welcomeVideoFor } = await import("@/lib/welcome-video");
const { listPeopleAccess } = await import("@/lib/claim");
const { welcomeVideoShown, welcomeVideoWatched } = await import("./welcome");

const KEY = "0123456789abcdef";

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
  vi.stubEnv("MEDIA_DIR", "/nowhere/media");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

async function siteWithVideo() {
  const { account, user } = await createAccount({ planCode: "SITES" });
  const site = await createSite(account.id);
  await prisma.site.update({ where: { id: site.id }, data: { welcomeVideoKey: KEY } });
  return { account, user, site };
}

/** What the signed-in layout hands the help bubble for the current request. */
async function welcome(accountId: string) {
  const session = await getSession();
  if (!session) throw new Error("signed out");
  return welcomeVideoFor(session, accountId);
}

const shownAt = async (userId: string) => (await prisma.membership.findFirstOrThrow({ where: { userId } })).welcomeShownAt;

describe("the welcome video's one automatic showing (ROADMAP E39)", () => {
  it("opens by itself for a person until it has been shown to them, and still plays from the help bubble after", async () => {
    const { account, user, site } = await siteWithVideo();
    await signInAs(user.id);
    const files = { video: `/welcome/${site.id}/${KEY}.mp4`, captions: `/welcome/${site.id}/${KEY}.vtt` };
    expect(await welcome(account.id)).toEqual({ ...files, open: true });

    await welcomeVideoShown();
    expect(await welcome(account.id)).toEqual({ ...files, open: false });
  });

  it("is shown to each person on the account separately, and keeps the first time", async () => {
    const { account, user } = await siteWithVideo();
    const member = await createMember(account.id);
    await signInAs(user.id);
    await welcomeVideoShown();
    const first = await shownAt(user.id);
    expect(first).toBeInstanceOf(Date);
    expect(await shownAt(member.id)).toBeNull();

    await welcomeVideoShown();
    expect(await shownAt(user.id)).toEqual(first);

    resetRequest();
    await signInAs(member.id);
    expect((await welcome(account.id))?.open).toBe(true);
    await welcomeVideoShown();
    expect((await welcome(account.id))?.open).toBe(false);
  });

  it("opens for someone who claimed before the site had a video", async () => {
    const { account, user } = await createAccount({ planCode: "SITES" });
    const site = await createSite(account.id);
    await signInAs(user.id);
    expect(await welcome(account.id)).toBeNull();

    await prisma.site.update({ where: { id: site.id }, data: { welcomeVideoKey: KEY } });
    expect((await welcome(account.id))?.open).toBe(true);
  });

  it("never opens by itself for an operator acting as the account, whose viewing records nothing", async () => {
    const { account, user } = await siteWithVideo();
    const { account: own, user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { session } = await signInAs(operator.id);
    const actAs = await prisma.actAs.create({ data: { operatorUserId: operator.id, accountId: account.id } });
    await prisma.session.update({ where: { id: session.id }, data: { actAsId: actAs.id } });

    expect((await welcome(account.id))?.open).toBe(false);
    await welcomeVideoShown();
    expect(await shownAt(user.id)).toBeNull();
    expect(await shownAt(operator.id)).toBeNull();
    expect(await prisma.membership.count({ where: { accountId: own.id, welcomeShownAt: { not: null } } })).toBe(0);
  });

  it("is nothing for an account with no site, and with no media directory set", async () => {
    const { account, user } = await createAccount();
    await signInAs(user.id);
    expect(await welcome(account.id)).toBeNull();

    const withVideo = await siteWithVideo();
    resetRequest();
    await signInAs(withVideo.user.id);
    vi.stubEnv("MEDIA_DIR", "");
    expect(await welcome(withVideo.account.id)).toBeNull();
  });
});

/** What the operator's people card is given for this person. */
const watchedBy = async (accountId: string, userId: string) =>
  (await listPeopleAccess(accountId)).find((person) => person.userId === userId)?.watched;

describe("how far each person has watched the welcome video (ROADMAP E39)", () => {
  it("keeps each person's furthest point, in whole seconds of the video's length", async () => {
    const { account, user } = await siteWithVideo();
    const member = await createMember(account.id);
    await signInAs(user.id);
    expect(await watchedBy(account.id, user.id)).toBeNull();

    await welcomeVideoWatched(12.9, 114.45);
    expect(await watchedBy(account.id, user.id)).toEqual({ seconds: 12, of: 114 });

    // Playing an earlier part again takes nothing back.
    await welcomeVideoWatched(5, 114.45);
    expect(await watchedBy(account.id, user.id)).toEqual({ seconds: 12, of: 114 });

    // To the end, which a player may report a hair past the length.
    await welcomeVideoWatched(114.46, 114.45);
    expect(await watchedBy(account.id, user.id)).toEqual({ seconds: 114, of: 114 });
    expect(await watchedBy(account.id, member.id)).toBeNull();

    resetRequest();
    await signInAs(member.id);
    await welcomeVideoWatched(30, 114.45);
    expect(await watchedBy(account.id, member.id)).toEqual({ seconds: 30, of: 114 });
    expect(await watchedBy(account.id, user.id)).toEqual({ seconds: 114, of: 114 });
  });

  it("records nothing for an operator acting as the account, or where the site has no video", async () => {
    const { account, user } = await siteWithVideo();
    const { account: own, user: operator } = await createAccount({ roleCode: "GLOBAL_ADMIN" });
    const { session } = await signInAs(operator.id);
    const actAs = await prisma.actAs.create({ data: { operatorUserId: operator.id, accountId: account.id } });
    await prisma.session.update({ where: { id: session.id }, data: { actAsId: actAs.id } });
    await welcomeVideoWatched(60, 114);
    expect(await watchedBy(account.id, user.id)).toBeNull();
    expect(await watchedBy(own.id, operator.id)).toBeNull();

    const none = await createAccount({ planCode: "SITES" });
    await createSite(none.account.id);
    resetRequest();
    await signInAs(none.user.id);
    await welcomeVideoWatched(60, 114);
    expect(await watchedBy(none.account.id, none.user.id)).toBeNull();
  });

  it("drops a report that isn't two sensible numbers", async () => {
    const { account, user } = await siteWithVideo();
    await signInAs(user.id);
    const reports: [unknown, unknown][] = [
      [Number.NaN, 114],
      [60, Number.NaN],
      [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
      [-5, 114],
      [0.9, 114],
      [60, 9_000_000],
      ["a minute", "two"],
      [undefined, undefined],
      [{ gt: 0 }, 114],
    ];
    for (const [seconds, length] of reports) {
      await welcomeVideoWatched(seconds as number, length as number);
      expect(await watchedBy(account.id, user.id)).toBeNull();
    }
  });
});

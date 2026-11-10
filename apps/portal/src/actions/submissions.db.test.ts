import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createForm, resetDatabase } from "../../test/db";
import { resetRequest, signInAs } from "../../test/next-request";

vi.mock("next/headers", () => import("../../test/next-request"));

const { setSubmissionSpam, setSubmissionStatus } = await import("./submissions");

async function expectRedirect(promise: Promise<unknown>, to: string) {
  const err = await promise.then(() => null, (e) => e);
  expect(String(err?.digest)).toContain(`NEXT_REDIRECT;replace;${to};`);
}

/** Two accounts, each with a form and a new submission the honeypot caught; signed in as the first. */
async function twoAccounts() {
  const make = async () => {
    const { account, user } = await createAccount();
    const form = await createForm(account.id, user.id);
    const submission = await prisma.submission.create({
      data: { formId: form.id, data: { email: "a@test.invalid" }, meta: {}, isSpam: true },
    });
    return { account, user, form, submission };
  };
  const mine = await make();
  const theirs = await make();
  await signInAs(mine.user.id);
  return { mine, theirs };
}

const stored = (id: string) => prisma.submission.findUniqueOrThrow({ where: { id } });

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
});

describe("a submission's status and spam flag", () => {
  it("change on a submission of the caller's form, which returns to its page", async () => {
    const { mine, theirs } = await twoAccounts();
    const page = `/forms/${mine.form.id}/submissions/${mine.submission.id}`;

    await expectRedirect(setSubmissionStatus(mine.form.id, mine.submission.id, "READ"), page);
    expect(await stored(mine.submission.id)).toMatchObject({ status: "READ", isSpam: true });

    await expectRedirect(setSubmissionSpam(mine.form.id, mine.submission.id, false), page);
    expect(await stored(mine.submission.id)).toMatchObject({ status: "READ", isSpam: false });

    expect(await stored(theirs.submission.id)).toEqual(theirs.submission);
  });

  it("find no submission of another form, in any account", async () => {
    const { mine, theirs } = await twoAccounts();
    const second = await createForm(mine.account.id, mine.user.id);

    await expect(setSubmissionStatus(mine.form.id, theirs.submission.id, "ARCHIVED")).rejects.toThrow("Submission not found");
    await expect(setSubmissionSpam(mine.form.id, theirs.submission.id, false)).rejects.toThrow("Submission not found");
    await expect(setSubmissionStatus(second.id, mine.submission.id, "READ")).rejects.toThrow("Submission not found");
    await expect(setSubmissionSpam(second.id, mine.submission.id, false)).rejects.toThrow("Submission not found");

    expect(await stored(theirs.submission.id)).toEqual(theirs.submission);
    expect(await stored(mine.submission.id)).toEqual(mine.submission);
  });

  it("refuse a form of another account", async () => {
    const { theirs } = await twoAccounts();

    await expect(setSubmissionStatus(theirs.form.id, theirs.submission.id, "READ")).rejects.toThrow("not found or access denied");
    await expect(setSubmissionSpam(theirs.form.id, theirs.submission.id, false)).rejects.toThrow("not found or access denied");
    expect(await stored(theirs.submission.id)).toEqual(theirs.submission);
  });

  it("take only a status the schema has, a true or false flag, and ids that are strings", async () => {
    const { mine, theirs } = await twoAccounts();
    const as = <T>(value: unknown) => value as T;

    for (const status of ["DELETED", "read", "", { not: "NEW" }, ["READ"], null]) {
      await expect(setSubmissionStatus(mine.form.id, mine.submission.id, as<string>(status))).rejects.toThrow("Invalid status");
    }
    for (const flag of ["false", 0, null, undefined, {}]) {
      await expect(setSubmissionSpam(mine.form.id, mine.submission.id, as<boolean>(flag))).rejects.toThrow("Invalid spam flag");
    }
    for (const id of [{ not: "" }, { in: [mine.submission.id, theirs.submission.id] }, null, ""]) {
      await expect(setSubmissionStatus(mine.form.id, as<string>(id), "READ")).rejects.toThrow("Invalid submission id");
      await expect(setSubmissionSpam(mine.form.id, as<string>(id), false)).rejects.toThrow("Invalid submission id");
      await expect(setSubmissionStatus(as<string>(id), mine.submission.id, "READ")).rejects.toThrow("Invalid form id");
      await expect(setSubmissionSpam(as<string>(id), mine.submission.id, false)).rejects.toThrow("Invalid form id");
    }

    expect(await stored(mine.submission.id)).toEqual(mine.submission);
    expect(await stored(theirs.submission.id)).toEqual(theirs.submission);
  });
});

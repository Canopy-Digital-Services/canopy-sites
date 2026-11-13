import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createSite, resetDatabase } from "../../test/db";

// No mail leaves the test: the transport is a list.
const sent = vi.hoisted(() => [] as Array<{ to: string; text: string }>);
vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail: async (mail: { to: string; text: string }) => void sent.push(mail) }) },
}));
vi.spyOn(console, "log").mockImplementation(() => {});

const { queueNewSubmissionNotification } = await import("./email-queue");

/** 4:20 PM Pacific on Nov 12, which is already Nov 13 in UTC. */
const SUBMITTED_AT = new Date("2026-11-13T00:20:05Z");

async function notified(accountId: string) {
  queueNewSubmissionNotification({ formId: "form-1", formName: "Contact", accountId, submittedAt: SUBMITTED_AT, notifyEmails: ["owner@example.com"] });
  await vi.waitFor(() => expect(sent).toHaveLength(1));
  return sent[0].text;
}

beforeEach(async () => {
  sent.length = 0;
  vi.stubEnv("SMTP_HOST", "smtp.test.invalid");
  vi.stubEnv("SMTP_USER", "forms@test.invalid");
  await resetDatabase();
});
afterEach(() => vi.unstubAllEnvs());

describe("the submission notification's time", () => {
  it("is in the account's zone for an account with no site", async () => {
    const { account } = await createAccount({ planCode: "FREE" });
    await prisma.account.update({ where: { id: account.id }, data: { timeZone: "America/New_York" } });

    expect(await notified(account.id)).toContain("Date: Nov 12, 2026, 7:20 PM EST\n");
  });

  it("is in the account's zone for an account with a site, whatever the site's retired column holds", async () => {
    const { account } = await createAccount({ planCode: "SITES" });
    await prisma.account.update({ where: { id: account.id }, data: { timeZone: "America/Chicago" } });
    await createSite(account.id);

    expect(await notified(account.id)).toContain("Date: Nov 12, 2026, 6:20 PM CST\n");
  });

  it("is in UTC, named, for an account nobody has given a zone", async () => {
    const { account } = await createAccount();

    expect(await notified(account.id)).toContain("Date: Nov 13, 2026, 12:20 AM UTC\n");
  });
});

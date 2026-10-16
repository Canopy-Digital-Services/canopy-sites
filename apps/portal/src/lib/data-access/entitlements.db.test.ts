import { beforeEach, describe, expect, it } from "vitest";
import { createAccount, createForm, resetDatabase } from "../../../test/db";
import { getAccountEntitlements } from "./entitlements";

beforeEach(resetDatabase);

describe("getAccountEntitlements", () => {
  it("blocks another publish at the FREE cap and counts only published forms", async () => {
    const { account, user } = await createAccount({ planCode: "FREE" });
    await createForm(account.id, user.id, { published: true });
    await createForm(account.id, user.id, { published: false });

    const e = await getAccountEntitlements(account.id);
    expect(e).toMatchObject({
      maxPublishedForms: 1,
      publishedFormsCount: 1,
      totalFormsCount: 2,
      canPublishAnother: false,
      sitesEnabled: false,
    });
  });

  it("gives UNLOCKED no cap and Canopy Sites", async () => {
    const { account, user } = await createAccount({ planCode: "UNLOCKED" });
    await createForm(account.id, user.id, { published: true });

    const e = await getAccountEntitlements(account.id);
    expect(e).toMatchObject({ maxPublishedForms: null, canPublishAnother: true, sitesEnabled: true });
  });

  it("throws for an account that does not exist", async () => {
    await expect(getAccountEntitlements("missing")).rejects.toThrow("Account not found");
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createForm, resetDatabase } from "../../../test/db";
import { listAccountsMetadata } from "./accounts";

beforeEach(resetDatabase);

async function addSubmissions(formId: string, n: number) {
  for (let i = 0; i < n; i++) {
    await prisma.submission.create({ data: { formId, data: {}, meta: {} } });
  }
}

describe("listAccountsMetadata", () => {
  it("reports each account's owner, form counts, and submission total", async () => {
    const a = await createAccount({ planCode: "FREE" });
    const b = await createAccount({ planCode: "UNLOCKED", roleCode: "GLOBAL_ADMIN" });
    const a1 = await createForm(a.account.id, a.user.id, { published: true });
    const a2 = await createForm(a.account.id, a.user.id);
    const b1 = await createForm(b.account.id, b.user.id, { published: true });
    await addSubmissions(a1.id, 3);
    await addSubmissions(a2.id, 2);
    await addSubmissions(b1.id, 1);
    const empty = await createAccount();

    const rows = new Map((await listAccountsMetadata()).map((r) => [r.id, r]));

    expect(rows.get(a.account.id)).toMatchObject({
      email: a.user.email,
      userId: a.user.id,
      formsCount: 2,
      publishedFormsCount: 1,
      submissionsCount: 5,
      planCode: "FREE",
      status: "ACTIVE",
      roleCode: "USER",
    });
    expect(rows.get(b.account.id)).toMatchObject({ formsCount: 1, submissionsCount: 1, roleCode: "GLOBAL_ADMIN" });
    expect(rows.get(empty.account.id)).toMatchObject({ formsCount: 0, publishedFormsCount: 0, submissionsCount: 0 });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, createForm, resetDatabase } from "../../test/db";
import { resetRequest, signInAs } from "../../test/next-request";

vi.mock("next/headers", () => import("../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { toggleFormPublished } = await import("./forms");

beforeEach(async () => {
  resetRequest();
  await resetDatabase();
});

const isPublished = async (formId: string) =>
  (await prisma.form.findUniqueOrThrow({ where: { id: formId } })).published;

describe("toggleFormPublished", () => {
  it("refuses to publish a form without a field", async () => {
    const { account, user } = await createAccount();
    await signInAs(user.id);
    const form = await createForm(account.id, user.id);

    await expect(toggleFormPublished(form.id, true)).rejects.toThrow("needs a field");
    expect(await isPublished(form.id)).toBe(false);
  });

  it("publishes a form with a field", async () => {
    const { account, user } = await createAccount();
    await signInAs(user.id);
    const form = await createForm(account.id, user.id);
    await prisma.field.create({ data: { formId: form.id, name: "email", type: "EMAIL", label: "Email", order: 1 } });

    await toggleFormPublished(form.id, true);

    expect(await isPublished(form.id)).toBe(true);
  });

  it("unpublishes a form without a field", async () => {
    const { account, user } = await createAccount();
    await signInAs(user.id);
    const form = await createForm(account.id, user.id, { published: true });

    await toggleFormPublished(form.id, false);

    expect(await isPublished(form.id)).toBe(false);
  });
});

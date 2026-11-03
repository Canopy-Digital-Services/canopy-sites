import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { newFieldDefaults } from "@/lib/field-rules";
import { createAccount, createForm, resetDatabase } from "../../test/db";
import { resetRequest, signInAs } from "../../test/next-request";

vi.mock("next/headers", () => import("../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { createField, toggleFormPublished, updateFormBasics } = await import("./forms");

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

// A filled honeypot marks the submission as spam, so a field sharing its
// name would mark every visitor who answers that field as spam.
describe("a field and the honeypot never share a name", () => {
  it("gives a new field a suffix when its label makes the honeypot's name", async () => {
    const { account, user } = await createAccount();
    await signInAs(user.id);
    const form = await createForm(account.id, user.id, { honeypotField: "website" });

    // What the editor sends for a new Website field: its label is "Website".
    const first = await createField(form.id, newFieldDefaults("WEBSITE"));
    const second = await createField(form.id, newFieldDefaults("WEBSITE"));

    expect(first.name).toBe("website_2");
    expect(second.name).toBe("website_3");
  });

  it("refuses a new field given the honeypot's name", async () => {
    const { account, user } = await createAccount();
    await signInAs(user.id);
    const form = await createForm(account.id, user.id, { honeypotField: "website" });

    await expect(createField(form.id, { name: "website", type: "TEXT", label: "Website" })).rejects.toThrow("honeypot");
    expect(await prisma.field.count({ where: { formId: form.id } })).toBe(0);
  });

  it("refuses a honeypot named for a field, and takes any other name", async () => {
    const { account, user } = await createAccount();
    await signInAs(user.id);
    const form = await createForm(account.id, user.id);
    await prisma.field.create({ data: { formId: form.id, name: "website", type: "TEXT", label: "Website", order: 1 } });
    const honeypot = async () => (await prisma.form.findUniqueOrThrow({ where: { id: form.id } })).honeypotField;

    await expect(updateFormBasics(form.id, { honeypotField: " website " })).rejects.toThrow("already named");
    expect(await honeypot()).toBeNull();

    await updateFormBasics(form.id, { honeypotField: "company_url" });
    expect(await honeypot()).toBe("company_url");
  });
});

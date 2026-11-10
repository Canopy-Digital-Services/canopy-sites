import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { newFieldDefaults } from "@/lib/field-rules";
import { createAccount, createForm, resetDatabase } from "../../test/db";
import { resetRequest, signInAs } from "../../test/next-request";

vi.mock("next/headers", () => import("../../test/next-request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const {
  checkFieldHasData,
  createField,
  deleteField,
  markAllSubmissionsRead,
  reorderFields,
  toggleFormPublished,
  updateField,
  updateFormBasics,
} = await import("./forms");
const { getOwnedForm, getOwnedFormMinimal } = await import("@/lib/data-access/forms");

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

// An action's arguments are whatever the client sent. An id is a string, and
// what an action does goes by the form the ownership check returned.
describe("a form's actions reach only that form", () => {
  /** Two accounts, each with a form, a field, and a new submission; signed in as the first. */
  async function twoAccounts() {
    const make = async () => {
      const { account, user } = await createAccount();
      const form = await createForm(account.id, user.id);
      const field = await prisma.field.create({ data: { formId: form.id, name: "email", type: "EMAIL", label: "Email", order: 1 } });
      const submission = await prisma.submission.create({ data: { formId: form.id, data: { email: "a@test.invalid" }, meta: {} } });
      return { account, user, form, field, submission };
    };
    const mine = await make();
    const theirs = await make();
    await signInAs(mine.user.id);
    return { mine, theirs };
  }

  type Rows = Awaited<ReturnType<typeof twoAccounts>>["mine"];
  async function expectUntouched({ field, submission }: Rows) {
    expect(await prisma.field.findUnique({ where: { id: field.id } })).toEqual(field);
    expect(await prisma.submission.findUnique({ where: { id: submission.id } })).toEqual(submission);
  }

  it("refuses a form id that isn't a string, and both accounts' rows stay as they were", async () => {
    const { mine, theirs } = await twoAccounts();
    const notStrings = [{ not: "" }, { in: [mine.form.id, theirs.form.id] }, [mine.form.id], null, undefined, 7, ""] as unknown as string[];

    for (const formId of notStrings) {
      await expect(markAllSubmissionsRead(formId)).rejects.toThrow("Invalid form id");
      await expect(deleteField(formId, theirs.field.id, true)).rejects.toThrow("Invalid form id");
      await expect(updateField(formId, theirs.field.id, { type: "EMAIL", label: "Changed" })).rejects.toThrow("Invalid form id");
      await expect(reorderFields(formId, [theirs.field.id])).rejects.toThrow("Invalid form id");
      await expect(checkFieldHasData(formId, "email")).rejects.toThrow("Invalid form id");
      await expect(getOwnedFormMinimal(formId, mine.account.id)).rejects.toThrow("Invalid form id");
      await expect(getOwnedForm(formId, mine.account.id)).rejects.toThrow("Invalid form id");
    }
    await expectUntouched(theirs);
    await expectUntouched(mine);
  });

  it("refuses a field id that isn't a string", async () => {
    const { mine, theirs } = await twoAccounts();
    const notStrings = [{ not: "" }, { in: [mine.field.id, theirs.field.id] }, null, 7] as unknown as string[];

    for (const fieldId of notStrings) {
      await expect(deleteField(mine.form.id, fieldId)).rejects.toThrow("Invalid field id");
      await expect(updateField(mine.form.id, fieldId, { type: "EMAIL", label: "Changed" })).rejects.toThrow("Invalid field id");
      await expect(reorderFields(mine.form.id, [fieldId])).rejects.toThrow("Invalid field ids");
    }
    await expect(reorderFields(mine.form.id, { length: 0 } as unknown as string[])).rejects.toThrow("Invalid field ids");
    await expectUntouched(theirs);
    await expectUntouched(mine);
  });

  it("refuses another account's form, and another form's field, by their own ids", async () => {
    const { mine, theirs } = await twoAccounts();

    await expect(markAllSubmissionsRead(theirs.form.id)).rejects.toThrow("not found or access denied");
    await expect(deleteField(theirs.form.id, theirs.field.id)).rejects.toThrow("not found or access denied");
    await expect(deleteField(mine.form.id, theirs.field.id)).rejects.toThrow("Field not found");
    await expect(updateField(mine.form.id, theirs.field.id, { type: "EMAIL", label: "Changed" })).rejects.toThrow("Field not found");
    await expect(reorderFields(mine.form.id, [theirs.field.id])).rejects.toThrow("Invalid field order");
    await expectUntouched(theirs);
    await expectUntouched(mine);
  });

  it("does the caller's own form's work and nothing else", async () => {
    const { mine, theirs } = await twoAccounts();

    expect(await checkFieldHasData(mine.form.id, "email")).toBe(1);
    await markAllSubmissionsRead(mine.form.id);
    expect((await prisma.submission.findUniqueOrThrow({ where: { id: mine.submission.id } })).status).toBe("READ");

    await updateField(mine.form.id, mine.field.id, { type: "EMAIL", label: "Work email" });
    expect((await prisma.field.findUniqueOrThrow({ where: { id: mine.field.id } })).label).toBe("Work email");

    await deleteField(mine.form.id, mine.field.id, true);
    expect(await prisma.field.findUnique({ where: { id: mine.field.id } })).toBeNull();
    expect((await prisma.submission.findUniqueOrThrow({ where: { id: mine.submission.id } })).data).toEqual({});

    await expectUntouched(theirs);
  });
});

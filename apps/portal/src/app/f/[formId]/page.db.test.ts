import { isValidElement, type ReactElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { getPublishedForm } from "@/lib/data-access/forms";
import { HostedFormPage } from "@/components/forms/hosted-form-page";
import { createAccount, createForm, resetDatabase } from "../../../../test/db";
import HostedFormRoute from "./page";

// What the form's owner set up and a visitor has no use for.
const PRIVATE = {
  notifyEmails: ["owner@test.invalid"],
  allowedOrigins: ["https://client.test.invalid"],
  maxSubmissions: 7,
  emailIncludeResponses: true,
  thumbnail: Buffer.from("not-a-real-png"),
};

async function hostedForm(opts: { published?: boolean; type?: "HOSTED" | "EMBEDDED" } = {}) {
  const { account, user } = await createAccount();
  const form = await createForm(account.id, user.id, { published: opts.published ?? true, type: opts.type ?? "HOSTED", honeypotField: "company_url" });
  await prisma.form.update({
    where: { id: form.id },
    data: { ...PRIVATE, title: "Contact us", description: "We answer within a day.", successMessage: "Thanks!", defaultTheme: { primary: "#005f6a" } },
  });
  const field = await prisma.field.create({ data: { formId: form.id, name: "email", type: "EMAIL", label: "Email", order: 1, required: true } });
  return { account, user, form, field };
}

const page = (formId: string) => HostedFormRoute({ params: Promise.resolve({ formId }) }) as Promise<ReactElement<{ form: Record<string, unknown> }>>;

/** Everything the page would send to the browser for this element. */
const sent = (element: ReactElement) => JSON.stringify(element.props);

beforeEach(resetDatabase);

describe("/f/[formId]", () => {
  it("hands the hosted form its public fields, by name, and nothing else of the row", async () => {
    const { account, user, form, field } = await hostedForm();

    const element = await page(form.id);
    expect(isValidElement(element)).toBe(true);
    expect(element.type).toBe(HostedFormPage);

    expect(Object.keys(element.props.form).sort()).toEqual(
      ["defaultTheme", "description", "fields", "id", "redirectUrl", "slug", "successMessage", "title"]
    );
    const fields = element.props.form.fields as Array<Record<string, unknown>>;
    expect(fields).toHaveLength(1);
    expect(Object.keys(fields[0]).sort()).toEqual(
      ["helpText", "label", "name", "options", "order", "required", "type", "validation"]
    );
    expect(element.props.form).toMatchObject({ id: form.id, title: "Contact us", successMessage: "Thanks!" });

    const html = sent(element);
    for (const kept of ["owner@test.invalid", "client.test.invalid", "company_url", account.id, user.id, field.id, "notifyEmails", "honeypotField"]) {
      expect(html, kept).not.toContain(kept);
    }
  });

  it("reads only public columns for a published form", async () => {
    const { form } = await hostedForm();

    const row = await getPublishedForm(form.id);
    expect(Object.keys(row!).sort()).toEqual(
      ["defaultTheme", "description", "fields", "id", "name", "redirectUrl", "slug", "successMessage", "title", "type"]
    );
    expect(await getPublishedForm((await hostedForm({ published: false })).form.id)).toBeNull();
  });

  it("shows the not-available page, with nothing of the form in it, when the form is unpublished or embedded", async () => {
    for (const opts of [{ published: false }, { type: "EMBEDDED" as const }]) {
      const { form } = await hostedForm(opts);
      const element = await page(form.id);
      expect(element.type).not.toBe(HostedFormPage);
      expect(sent(element)).toBe("{}");
    }
  });
});

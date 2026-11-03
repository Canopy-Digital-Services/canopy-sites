import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { resetRateLimits } from "@/lib/rate-limit";
import { handlePublicSubmit } from "./public-submit";
import { createAccount, createForm, resetDatabase } from "../../test/db";

/** A published embedded form with the honeypot "website", an Email field
    that lowercases, a Name field of first and last, a Date of birth, and a
    Number. */
async function contactForm(opts: { withFields?: boolean } = {}) {
  const { account, user } = await createAccount();
  const form = await createForm(account.id, user.id, { type: "EMBEDDED", published: true, honeypotField: "website" });
  if (opts.withFields !== false) {
    await prisma.field.createMany({
      data: [
        { formId: form.id, name: "email", type: "EMAIL", label: "Email", order: 1, validation: { normalize: true } },
        { formId: form.id, name: "name", type: "NAME", label: "Name", order: 2 },
        { formId: form.id, name: "born", type: "DATE_OF_BIRTH", label: "Date of birth", order: 3 },
        { formId: form.id, name: "budget", type: "NUMBER", label: "Budget", order: 4 },
      ],
    });
  }
  return form;
}

/** POSTs the body from `origin`, by default a site on localhost; null sends no Origin. */
function submit(formId: string, body: unknown, origin: string | null = "http://localhost:4321") {
  const request = new NextRequest(`http://localhost:3006/api/embed/${formId}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return handlePublicSubmit({
    request,
    formId,
    allowMethods: "POST, OPTIONS",
    rateLimit: { max: 100, windowMs: 60_000 },
  });
}

beforeEach(async () => {
  resetRateLimits();
  await resetDatabase();
});

describe("handlePublicSubmit: what is stored", () => {
  it("stores the form's fields as checked, and not the honeypot", async () => {
    const form = await contactForm();

    const res = await submit(form.id, {
      email: " Ann@Example.com ",
      name: { first: "Ann", last: "Lee" },
      born: "1980-3-7",
      budget: "1,250.50",
      website: "",
    });

    expect(res.status).toBe(200);
    const submission = await prisma.submission.findFirstOrThrow({ where: { formId: form.id } });
    expect(submission.data).toEqual({ email: "ann@example.com", name: { first: "Ann", last: "Lee" }, born: "1980-03-07", budget: "1250.50" });
    expect(submission.isSpam).toBe(false);
  });

  it("marks a filled honeypot as spam, and still stores only the fields", async () => {
    const form = await contactForm();

    const res = await submit(form.id, { email: "bot@example.com", website: "https://spam.example" });

    expect(res.status).toBe(200);
    const submission = await prisma.submission.findFirstOrThrow({ where: { formId: form.id } });
    expect(submission.isSpam).toBe(true);
    expect(submission.data).toEqual({ email: "bot@example.com" });
  });
});

describe("handlePublicSubmit: what is refused", () => {
  it("refuses a key that isn't a field, alongside the fields' own errors", async () => {
    const form = await contactForm();

    const res = await submit(form.id, { email: "nope", junk: "x".repeat(60_000) });

    expect(res.status).toBe(400);
    expect((await res.json()).fields).toEqual({
      junk: "This form has no field by that name.",
      email: "Enter a valid email address",
    });
    expect(await prisma.submission.count()).toBe(0);
  });

  it("refuses a Name part the field doesn't ask for", async () => {
    const form = await contactForm();

    const res = await submit(form.id, { name: { first: "Ann", last: "Lee", junk: "x".repeat(60_000) } });

    expect(res.status).toBe(400);
    expect((await res.json()).fields).toEqual({ name: 'Name has no part "junk".' });
    expect(await prisma.submission.count()).toBe(0);
  });

  it("refuses a body that isn't an object", async () => {
    const form = await contactForm();

    for (const body of ["[1, 2]", "null", '"text"', "{"]) {
      const res = await submit(form.id, body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid JSON" });
    }
    expect(await prisma.submission.count()).toBe(0);
  });

  it("takes no answers for a form without fields", async () => {
    const form = await contactForm({ withFields: false });

    const res = await submit(form.id, { message: "hello" });

    expect(res.status).toBe(400);
    expect((await res.json()).fields).toEqual({ message: "This form has no field by that name." });
    expect(await prisma.submission.count()).toBe(0);
  });
});

describe("handlePublicSubmit: a hosted form", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://forms.example.com"));
  afterEach(() => vi.unstubAllEnvs());

  async function hostedForm() {
    const { account, user } = await createAccount();
    const form = await createForm(account.id, user.id, { type: "HOSTED", published: true });
    await prisma.field.create({ data: { formId: form.id, name: "email", type: "EMAIL", label: "Email", order: 1 } });
    return form;
  }

  it("takes a submission from its hosted page", async () => {
    const form = await hostedForm();

    const res = await submit(form.id, { email: "ann@example.com" }, "https://forms.example.com");

    expect(res.status).toBe(200);
    const submission = await prisma.submission.findFirstOrThrow({ where: { formId: form.id } });
    expect(submission.data).toEqual({ email: "ann@example.com" });
  });

  it("refuses a submission from any other site, localhost included", async () => {
    const form = await hostedForm();

    for (const origin of ["https://example.com", "https://forms.example.com.evil.test", "http://localhost:4321", null]) {
      const res = await submit(form.id, { email: "ann@example.com" }, origin);
      expect(res.status).toBe(403);
      expect((await res.json()).code).toBe("FORM_HOSTED_ONLY");
    }
    expect(await prisma.submission.count()).toBe(0);
  });
});

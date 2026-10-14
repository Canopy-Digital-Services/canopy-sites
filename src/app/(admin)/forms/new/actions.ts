"use server";

import { redirect } from "next/navigation";
import { FormType } from "@prisma/client";
import { getCurrentAccountId } from "@/lib/auth-utils";
import { createForm } from "@/actions/forms";
import { prisma } from "@/lib/db";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function findUniqueSlug(baseSlug: string, accountId: string): Promise<string> {
  const root = baseSlug || "form";
  let slug = root;
  let counter = 1;

  while (true) {
    const existing = await prisma.form.findUnique({
      where: { accountId_slug: { accountId, slug } },
    });
    if (!existing) return slug;
    slug = `${root}-${counter}`;
    counter++;
  }
}

export async function handleCreateForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "");

  if (!name) {
    throw new Error("Name is required");
  }
  if (typeRaw !== FormType.HOSTED && typeRaw !== FormType.EMBEDDED) {
    throw new Error("Form type is required");
  }

  const accountId = await getCurrentAccountId();
  const slug = await findUniqueSlug(generateSlug(name), accountId);

  const form = await createForm({ name, slug, type: typeRaw });

  redirect(`/forms/${form.id}?mode=edit`);
}

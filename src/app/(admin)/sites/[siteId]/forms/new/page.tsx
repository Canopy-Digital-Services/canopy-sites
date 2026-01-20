import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function createForm(siteId: string, formData: FormData) {
  "use server";

  const userId = await getCurrentUserId();
  const name = formData.get("name") as string;
  let slug = formData.get("slug") as string;
  const notifyEmailsRaw = formData.get("notifyEmails") as string;
  const honeypotField = formData.get("honeypotField") as string;

  if (!name) {
    throw new Error("Form name is required");
  }

  // Auto-generate slug if empty
  if (!slug) {
    slug = slugify(name);
  }

  // Parse emails (comma-separated)
  const notifyEmails = notifyEmailsRaw
    ? notifyEmailsRaw.split(",").map((e) => e.trim()).filter(Boolean)
    : [];

  // Verify site ownership
  const site = await prisma.site.findFirst({
    where: { id: siteId, userId },
  });

  if (!site) {
    throw new Error("Site not found");
  }

  const form = await prisma.form.create({
    data: {
      siteId,
      name,
      slug,
      notifyEmails,
      honeypotField: honeypotField || null,
    },
  });

  redirect(`/sites/${siteId}/forms/${form.id}`);
}

export default async function NewFormPage({
  params,
}: {
  params: { siteId: string };
}) {
  const userId = await getCurrentUserId();

  const site = await prisma.site.findFirst({
    where: {
      id: params.siteId,
      userId,
    },
  });

  if (!site) {
    notFound();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Form</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Add a new form to {site.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createForm.bind(null, site.id)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Form Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Contact Form"
                required
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                A friendly name to identify this form
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="contact (auto-generated if empty)"
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                URL-friendly identifier, unique per site. Leave empty to
                auto-generate from name.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notifyEmails">Notification Emails</Label>
              <Textarea
                id="notifyEmails"
                name="notifyEmails"
                placeholder="admin@example.com, support@example.com"
                rows={3}
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Comma-separated email addresses to notify on new submissions
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="honeypotField">Honeypot Field (Optional)</Label>
              <Input
                id="honeypotField"
                name="honeypotField"
                placeholder="website"
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Name of a hidden field used for spam detection. If this field is
                filled, the submission is marked as spam.
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Create Form</Button>
              <Link href={`/sites/${site.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

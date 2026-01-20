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

async function updateForm(siteId: string, formId: string, formData: FormData) {
  "use server";

  const userId = await getCurrentUserId();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const notifyEmailsRaw = formData.get("notifyEmails") as string;
  const honeypotField = formData.get("honeypotField") as string;

  if (!name || !slug) {
    throw new Error("Name and slug are required");
  }

  // Parse emails
  const notifyEmails = notifyEmailsRaw
    ? notifyEmailsRaw.split(",").map((e) => e.trim()).filter(Boolean)
    : [];

  // Verify ownership via site
  const site = await prisma.site.findFirst({
    where: { id: siteId, userId },
  });

  if (!site) {
    throw new Error("Site not found");
  }

  await prisma.form.update({
    where: { id: formId },
    data: {
      name,
      slug,
      notifyEmails,
      honeypotField: honeypotField || null,
    },
  });

  redirect(`/sites/${siteId}/forms/${formId}`);
}

async function deleteForm(siteId: string, formId: string) {
  "use server";

  const userId = await getCurrentUserId();

  // Verify ownership via site
  const site = await prisma.site.findFirst({
    where: { id: siteId, userId },
  });

  if (!site) {
    throw new Error("Site not found");
  }

  await prisma.form.delete({
    where: { id: formId },
  });

  redirect(`/sites/${siteId}`);
}

export default async function EditFormPage({
  params,
}: {
  params: { siteId: string; formId: string };
}) {
  const userId = await getCurrentUserId();

  const site = await prisma.site.findFirst({
    where: {
      id: params.siteId,
      userId,
    },
    include: {
      forms: {
        where: { id: params.formId },
      },
    },
  });

  if (!site || site.forms.length === 0) {
    notFound();
  }

  const form = site.forms[0];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Form</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Update form configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={updateForm.bind(null, site.id, form.id)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Form Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={form.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={form.slug}
                required
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                URL-friendly identifier, must be unique per site
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notifyEmails">Notification Emails</Label>
              <Textarea
                id="notifyEmails"
                name="notifyEmails"
                defaultValue={form.notifyEmails.join(", ")}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="honeypotField">Honeypot Field</Label>
              <Input
                id="honeypotField"
                name="honeypotField"
                defaultValue={form.honeypotField || ""}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">Update Form</Button>
              <Link href={`/sites/${site.id}/forms/${form.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Deleting this form will permanently remove all submissions. This
            action cannot be undone.
          </p>
          <form action={deleteForm.bind(null, site.id, form.id)}>
            <Button
              type="submit"
              variant="destructive"
              onClick={(e) => {
                if (
                  !confirm(
                    `Are you sure you want to delete "${form.name}"? This will delete all submissions.`
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              Delete Form
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

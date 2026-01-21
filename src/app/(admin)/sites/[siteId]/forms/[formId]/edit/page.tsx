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
import { DeleteFormButton } from "@/components/delete-form-button";
import { FormFieldsManager } from "@/components/form-fields-manager";
import { updateFormSettings } from "../actions";

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

async function updateSuccessSettingsFromForm(
  siteId: string,
  formId: string,
  formData: FormData
) {
  "use server";

  const successMessage = (formData.get("successMessage") as string) || null;
  const redirectUrl = (formData.get("redirectUrl") as string) || null;

  await updateFormSettings(siteId, formId, {
    successMessage,
    redirectUrl,
  });

  redirect(`/sites/${siteId}/forms/${formId}/edit`);
}

async function updateThemeSettingsFromForm(
  siteId: string,
  formId: string,
  formData: FormData
) {
  "use server";

  const radiusRaw = formData.get("themeRadius") as string;
  const radius = radiusRaw ? Number(radiusRaw) : null;

  const defaultTheme = {
    fontFamily: (formData.get("themeFontFamily") as string) || undefined,
    fontUrl: (formData.get("themeFontUrl") as string) || undefined,
    text: (formData.get("themeText") as string) || undefined,
    background: (formData.get("themeBackground") as string) || undefined,
    primary: (formData.get("themePrimary") as string) || undefined,
    border: (formData.get("themeBorder") as string) || undefined,
    radius: Number.isFinite(radius) ? radius : undefined,
    density: (formData.get("themeDensity") as string) || undefined,
  };

  await updateFormSettings(siteId, formId, {
    defaultTheme,
  });

  redirect(`/sites/${siteId}/forms/${formId}/edit`);
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
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!site || site.forms.length === 0) {
    notFound();
  }

  const form = site.forms[0];
  const defaultTheme =
    typeof form.defaultTheme === "object" && form.defaultTheme !== null
      ? (form.defaultTheme as Record<string, string | number>)
      : {};

  return (
    <div className="max-w-3xl space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <FormFieldsManager
            siteId={site.id}
            formId={form.id}
            fields={form.fields.map((field) => ({
              id: field.id,
              name: field.name,
              label: field.label,
              type: field.type,
              required: field.required,
              order: field.order,
              placeholder: field.placeholder,
              options: field.options,
              validation: field.validation,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Success Behavior</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={updateSuccessSettingsFromForm.bind(null, site.id, form.id)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="successMessage">Success Message</Label>
              <Textarea
                id="successMessage"
                name="successMessage"
                defaultValue={form.successMessage || ""}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redirectUrl">Redirect URL</Label>
              <Input
                id="redirectUrl"
                name="redirectUrl"
                defaultValue={form.redirectUrl || ""}
                placeholder="https://example.com/thanks"
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                If a redirect URL is provided, it takes precedence over the
                success message.
              </p>
            </div>
            <Button type="submit">Save Success Settings</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Embed Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={updateThemeSettingsFromForm.bind(null, site.id, form.id)}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="themeFontFamily">Font Family</Label>
                <Input
                  id="themeFontFamily"
                  name="themeFontFamily"
                  defaultValue={String(defaultTheme.fontFamily || "")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="themeFontUrl">Font CSS URL</Label>
                <Input
                  id="themeFontUrl"
                  name="themeFontUrl"
                  defaultValue={String(defaultTheme.fontUrl || "")}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="themeText">Text Color</Label>
                <Input
                  id="themeText"
                  name="themeText"
                  defaultValue={String(defaultTheme.text || "")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="themeBackground">Background Color</Label>
                <Input
                  id="themeBackground"
                  name="themeBackground"
                  defaultValue={String(defaultTheme.background || "")}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="themePrimary">Primary Color</Label>
                <Input
                  id="themePrimary"
                  name="themePrimary"
                  defaultValue={String(defaultTheme.primary || "")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="themeBorder">Border Color</Label>
                <Input
                  id="themeBorder"
                  name="themeBorder"
                  defaultValue={String(defaultTheme.border || "")}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="themeRadius">Border Radius (px)</Label>
                <Input
                  id="themeRadius"
                  name="themeRadius"
                  type="number"
                  min={0}
                  defaultValue={String(defaultTheme.radius || "")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="themeDensity">Density</Label>
                <Input
                  id="themeDensity"
                  name="themeDensity"
                  defaultValue={String(defaultTheme.density || "")}
                  placeholder="compact | normal | comfortable"
                />
              </div>
            </div>
            <Button type="submit">Save Appearance</Button>
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
          <DeleteFormButton
            formName={form.name}
            action={deleteForm.bind(null, site.id, form.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

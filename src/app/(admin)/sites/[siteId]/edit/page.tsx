import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";

async function updateSite(siteId: string, formData: FormData) {
  "use server";

  const userId = await getCurrentUserId();
  const name = formData.get("name") as string;
  const domain = formData.get("domain") as string;

  if (!name || !domain) {
    throw new Error("Name and domain are required");
  }

  await prisma.site.update({
    where: {
      id: siteId,
      userId,
    },
    data: {
      name,
      domain,
    },
  });

  redirect(`/sites/${siteId}`);
}

async function deleteSite(siteId: string) {
  "use server";

  const userId = await getCurrentUserId();

  await prisma.site.delete({
    where: {
      id: siteId,
      userId,
    },
  });

  redirect("/sites");
}

export default async function EditSitePage({
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
        <h1 className="text-3xl font-bold">Edit Site</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Update site configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Site Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={updateSite.bind(null, site.id)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Site Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={site.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                name="domain"
                defaultValue={site.domain}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>API Key (Read-only)</Label>
              <div className="flex gap-2">
                <code className="flex-1 text-sm bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded">
                  {site.apiKey}
                </code>
                <CopyButton text={site.apiKey} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Update Site</Button>
              <Link href={`/sites/${site.id}`}>
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
            Deleting a site will permanently remove all forms and submissions
            associated with it. This action cannot be undone.
          </p>
          <form action={deleteSite.bind(null, site.id)}>
            <Button
              type="submit"
              variant="destructive"
              onClick={(e) => {
                if (
                  !confirm(
                    `Are you sure you want to delete "${site.name}"? This will delete all forms and submissions.`
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              Delete Site
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

async function createSite(formData: FormData) {
  "use server";

  const userId = await getCurrentUserId();
  const name = formData.get("name") as string;
  const domain = formData.get("domain") as string;

  if (!name || !domain) {
    throw new Error("Name and domain are required");
  }

  const site = await prisma.site.create({
    data: {
      userId,
      name,
      domain,
    },
  });

  redirect(`/sites/${site.id}`);
}

export default async function NewSitePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Site</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Add a new site to manage forms for
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Site Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Site Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="My Personal Site"
                required
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                A friendly name to identify this site
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                name="domain"
                placeholder="example.com"
                required
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                The canonical domain for origin validation (without protocol)
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Create Site</Button>
              <Link href="/sites">
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

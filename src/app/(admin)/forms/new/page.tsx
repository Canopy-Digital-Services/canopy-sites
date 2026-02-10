import { redirect } from "next/navigation";
import { getCurrentAccountId } from "@/lib/auth-utils";
import { createForm } from "@/actions/forms";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

async function findUniqueSlug(baseSlug: string, accountId: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  // If slug is empty after generation, use a default
  if (!slug) {
    slug = "form";
  }

  while (true) {
    const existing = await prisma.form.findUnique({
      where: {
        accountId_slug: {
          accountId,
          slug,
        },
      },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug || "form"}-${counter}`;
    counter++;
  }
}

async function handleCreateForm(formData: FormData) {
  "use server";

  const name = formData.get("name") as string;
  const accountId = await getCurrentAccountId();

  if (!name) {
    throw new Error("Name is required");
  }

  const baseSlug = generateSlug(name);
  const slug = await findUniqueSlug(baseSlug, accountId);

  const form = await createForm({
    name,
    slug,
  });

  redirect(`/forms/${form.id}/edit`);
}

export default async function NewFormPage() {

  return (
    <div className="max-w-[640px] mx-auto space-y-8">
      <h1 className="text-3xl font-heading font-semibold tracking-tight">
        Create form
      </h1>

      <form action={handleCreateForm} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Form name</Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g., Newsletter signup, Contact form, Event registration"
            required
          />
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit">Create form</Button>
          <Link href="/forms">
            <Button type="button" variant="link" className="text-muted-foreground">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

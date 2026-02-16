import { requireAuth } from "@/lib/auth-utils";
import { getOwnedForm } from "@/lib/data-access/forms";
import { notFound } from "next/navigation";
import { FormEditor } from "@/components/forms/form-editor";

export default async function FormEditPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const session = await requireAuth();
  const accountId = (await import("@/lib/auth-utils")).getCurrentAccountId();

  let form;
  try {
    form = await getOwnedForm(formId, await accountId);
  } catch {
    notFound();
  }

  // Read from runtime env vars (server-side only) - this is the fix for localhost URLs
  // Strip trailing slash to prevent double slashes in API URLs
  const apiUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3006").replace(/\/$/, "");

  return <FormEditor apiUrl={apiUrl} form={form} ownerEmail={session.user.email || ""} />;
}

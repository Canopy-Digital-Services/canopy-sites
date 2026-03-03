import { requireAuth } from "@/lib/auth-utils";
import { getOwnedForm } from "@/lib/data-access/forms";
import { notFound } from "next/navigation";
import { FormViewPage } from "@/components/forms/form-view-page";

export default async function FormViewRoute({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  await requireAuth();
  const accountId = (await import("@/lib/auth-utils")).getCurrentAccountId();

  let form;
  try {
    form = await getOwnedForm(formId, await accountId);
  } catch {
    notFound();
  }

  const apiUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3006"
  ).replace(/\/$/, "");

  return <FormViewPage form={form} apiUrl={apiUrl} />;
}

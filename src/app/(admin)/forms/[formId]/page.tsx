import { requireAuth } from "@/lib/auth-utils";
import { getOwnedForm } from "@/lib/data-access/forms";
import { notFound } from "next/navigation";
import { FormWorkspace } from "@/components/forms/form-workspace";

export default async function FormViewRoute({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { formId } = await params;
  const { mode } = await searchParams;
  const session = await requireAuth();
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

  return (
    <FormWorkspace
      apiUrl={apiUrl}
      ownerEmail={session.user.email || ""}
      form={form}
      initialMode={mode === "edit" ? "edit" : "view"}
    />
  );
}

import { redirect } from "next/navigation";

export default async function SubmissionsRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ status?: string; spam?: string }>;
}) {
  const { formId } = await params;
  const { status, spam } = await searchParams;

  const qs = new URLSearchParams({ mode: "submissions" });
  if (status) qs.set("status", status);
  if (spam) qs.set("spam", spam);

  redirect(`/forms/${formId}?${qs.toString()}`);
}

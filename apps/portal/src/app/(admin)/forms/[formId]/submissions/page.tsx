import { redirect } from "next/navigation";

export default async function SubmissionsRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { formId } = await params;
  const { status } = await searchParams;

  const qs = new URLSearchParams({ mode: "submissions" });
  if (status) qs.set("status", status);

  redirect(`/forms/${formId}?${qs.toString()}`);
}

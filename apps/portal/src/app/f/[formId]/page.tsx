import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedForm, formExists } from "@/lib/data-access/forms";
import { HostedFormPage } from "@/components/forms/hosted-form-page";

type Props = {
  params: Promise<{ formId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { formId } = await params;
  const form = await getPublishedForm(formId);

  if (!form) {
    return { title: "Form Not Available | Canopy Forms" };
  }

  return {
    title: form.title || form.name,
    description: form.description || undefined,
    openGraph: {
      title: form.title || form.name,
      description: form.description || undefined,
      type: "website",
    },
  };
}

function FormNotAvailable() {
  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/forms-logo.svg"
            alt="Canopy Forms"
            width={48}
            height={48}
            className="opacity-60"
          />
        </div>
        <h1 className="text-2xl font-heading font-semibold tracking-tight text-foreground">
          Form Not Available
        </h1>
        <p className="text-muted-foreground">
          This form is not currently accepting responses. Please contact the
          form owner if you believe this is an error.
        </p>
      </div>
    </div>
  );
}

export default async function HostedFormRoute({ params }: Props) {
  const { formId } = await params;
  const form = await getPublishedForm(formId);

  if (!form) {
    // Distinguish true 404 from unpublished
    const exists = await formExists(formId);
    if (!exists) {
      notFound();
    }

    // Form exists but is unpublished — show friendly page (200 status)
    return <FormNotAvailable />;
  }

  // Embedded forms aren't reachable via /f/[formId] — show the same friendly
  // page as unpublished so the response stays 200 (avoids search-engine
  // caching a 404 if a user later switches to a HOSTED form at this URL).
  if (form.type === "EMBEDDED") {
    return <FormNotAvailable />;
  }

  return <HostedFormPage form={form} />;
}

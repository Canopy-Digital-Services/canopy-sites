import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { NewFormForm } from "./new-form-form";

export default function NewFormPage() {
  return (
    <PageContent>
      <div className="max-w-[640px] mx-auto space-y-8">
        <PageHeader title="Create form" backHref="/forms" />
        <NewFormForm />
      </div>
    </PageContent>
  );
}

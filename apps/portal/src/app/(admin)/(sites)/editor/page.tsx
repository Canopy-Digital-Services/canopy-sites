// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { getCurrentAccountId } from "@/lib/auth-utils";
import { getAccountSite } from "@/lib/data-access/sites";
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";

export default async function EditorPage() {
  const site = await getAccountSite(await getCurrentAccountId());

  return (
    <PageContent>
      <div className="space-y-6">
        <PageHeader title={site?.name ?? "Editor"} />
        <EmptyState
          title="Nothing to edit yet"
          description={site ? "Your pages will appear here." : "Your site will appear here once it's set up."}
        />
      </div>
    </PageContent>
  );
}

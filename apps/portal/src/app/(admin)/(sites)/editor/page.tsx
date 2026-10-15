// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";

export default function EditorPage() {
  return (
    <PageContent>
      <div className="space-y-6">
        <PageHeader title="Editor" />
        <EmptyState
          title="Nothing to edit yet"
          description="Your site will appear here once it's set up."
        />
      </div>
    </PageContent>
  );
}

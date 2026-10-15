// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";

export default function StatsPage() {
  return (
    <PageContent>
      <div className="space-y-6">
        <PageHeader title="Stats" />
        <EmptyState
          title="No stats yet"
          description="Visitors and page views for your site will appear here."
        />
      </div>
    </PageContent>
  );
}

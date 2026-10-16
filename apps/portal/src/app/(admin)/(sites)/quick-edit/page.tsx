// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { ExternalLink } from "lucide-react";
import { getCurrentAccountId } from "@/lib/auth-utils";
import { getAccountSite } from "@/lib/data-access/sites";
import { builderConfigured } from "@/lib/builder-client";
import { getContentView, getEditorChanges, ToolError } from "@/lib/site-tools";
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { QuickEditWorkspace, type EditorPage } from "./quick-edit-workspace";

export const dynamic = "force-dynamic";

export default async function QuickEditPage() {
  const accountId = await getCurrentAccountId();
  const site = await getAccountSite(accountId);

  if (!site || !builderConfigured()) {
    return (
      <PageContent>
        <div className="space-y-6">
          <PageHeader title="Quick Edit" />
          <EmptyState
            title="Nothing to edit yet"
            description={site ? "Your pages will appear here." : "Your site will appear here once it's set up."}
          />
        </div>
      </PageContent>
    );
  }

  let pages: EditorPage[] = [];
  let loadError: string | null = null;
  let isDemo = false;
  try {
    const view = await getContentView(accountId);
    isDemo = view.site.isDemo;
    const content = view.published as { pages?: Array<{ id: string; path: string; title: string; navLabel?: string }> };
    pages = (content.pages ?? []).map((p) => ({ id: p.id, path: p.path, title: p.navLabel ?? (p.id === "home" ? "Home" : p.title) }));
  } catch (err) {
    loadError = err instanceof ToolError ? err.message : "Your site couldn't be loaded.";
  }
  const changes = await getEditorChanges(accountId);
  // The demo is the only site the portal serves today (PRD D23); client
  // sites get their live address with E36.
  const liveUrl = isDemo ? "/demo" : null;

  return (
    <PageContent width="wide">
      <div className="space-y-6">
        <PageHeader
          title="Quick Edit"
          description={site.name}
          actions={
            liveUrl ? (
              <Button variant="outline" asChild>
                <a href={liveUrl} target="_blank" rel="noopener">
                  View site
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ) : null
          }
        />
        {loadError ? (
          <EmptyState title="Your site couldn't be loaded" description={loadError} />
        ) : (
          <QuickEditWorkspace
            pages={pages}
            liveUrl={liveUrl}
            pending={
              changes.pending
                ? {
                    id: changes.pending.id,
                    summary: changes.pending.summary,
                    status: changes.pending.status,
                    error: changes.pending.error,
                  }
                : null
            }
            recent={changes.recent.map((c) => ({
              id: c.id,
              summary: c.summary,
              publishedAt: c.publishedAt?.toISOString() ?? null,
              by: c.by,
            }))}
          />
        )}
      </div>
    </PageContent>
  );
}

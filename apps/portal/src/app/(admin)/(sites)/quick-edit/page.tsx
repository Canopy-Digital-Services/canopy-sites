// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { Suspense } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { getCurrentAccountId } from "@/lib/auth-utils";
import { getAccountSite } from "@/lib/data-access/sites";
import { builderConfigured } from "@/lib/builder-client";
import { getContentView, getEditorChanges, ToolError } from "@/lib/site-tools";
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { QuickEditWorkspace } from "./quick-edit-workspace";
import { PagesCard, PagesCardSkeleton, type EditorPage } from "./pages-card";

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

  // The demo is the only site the portal serves today (PRD D23); client
  // sites get their live address with E36.
  const liveUrl = site.isDemo ? "/demo" : null;
  const changes = await getEditorChanges(accountId);
  // Not awaited: reading content fetches from GitHub, so the page renders
  // at once and the pages list streams in.
  const pages = loadPages(accountId);

  return (
    <PageContent width="wide">
      <div className="space-y-6">
        <div className="flex items-end gap-4">
          {/* In the header until the page gutter has room for him (below). */}
          <Image
            src="/illustrations/canopy-boy.svg"
            alt=""
            width={409}
            height={656}
            unoptimized
            priority
            className="h-24 w-auto shrink-0 sm:h-32 min-[1720px]:hidden"
          />
          <div className="min-w-0 flex-1 pb-1">
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
          </div>
        </div>
        <div className="relative">
          {/* Wide screens: standing in the left gutter beside the chat. */}
          <Image
            src="/illustrations/canopy-boy.svg"
            alt=""
            width={409}
            height={656}
            unoptimized
            className="absolute right-full top-0 mr-6 hidden h-auto w-44 min-[1720px]:block"
          />
          <QuickEditWorkspace
            pagesCard={
              <Suspense fallback={<PagesCardSkeleton />}>
                <PagesCard pages={pages} liveUrl={liveUrl} />
              </Suspense>
            }
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
        </div>
      </div>
    </PageContent>
  );
}

async function loadPages(accountId: string): Promise<EditorPage[] | string> {
  try {
    const view = await getContentView(accountId);
    const content = view.published as { pages?: Array<{ id: string; path: string; title: string; navLabel?: string }> };
    return (content.pages ?? []).map((p) => ({ id: p.id, path: p.path, title: p.navLabel ?? (p.id === "home" ? "Home" : p.title) }));
  } catch (err) {
    return err instanceof ToolError ? err.message : "Your site couldn't be loaded.";
  }
}

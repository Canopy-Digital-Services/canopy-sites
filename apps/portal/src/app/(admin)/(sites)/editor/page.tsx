// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import type { Announcement, Page } from "@canopy/site-contract";
import { getCurrentAccountId, requireAuth } from "@/lib/auth-utils";
import { getAccountSite } from "@/lib/data-access/sites";
import { builderConfigured } from "@/lib/builder-client";
import { getDraftView, getSiteEditing, ToolError } from "@/lib/site-tools";
import { BUILDER_FAILED } from "@/lib/site-tools/builder-failure";
import { liveSite } from "@/lib/site-live";
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { BehindGlass, SiteHoldProvider } from "@/components/sites/site-hold";
import { CanvasEditor, type CanvasPage } from "./canvas-editor";

export const dynamic = "force-dynamic";

/**
 * The visual editor (Epic 33, PRD D35 to D45): the site on a canvas, its
 * marked fields edited in place, everything saved to the site's one draft.
 * The canvas's pages come from /canvas with the session and load their
 * assets from where the site is live (PRD D47), so a site needs a live
 * address (the demo's /demo, a client's production hostname) to have one.
 */
export default async function EditorPage() {
  const session = await requireAuth();
  const accountId = await getCurrentAccountId();
  const site = await getAccountSite(accountId);
  const header = <PageHeader title="Editor" description="Change the marked text right on your site." />;

  const live = site ? liveSite(site) : null;
  if (!site || !live || !builderConfigured()) {
    return (
      <PageContent>
        <div className="space-y-6">
          {header}
          <EmptyState title="The editor is coming to your site soon" description="Until then, Quick Edit makes any change to your site." />
        </div>
      </PageContent>
    );
  }

  let view: Awaited<ReturnType<typeof getDraftView>>;
  try {
    view = await getDraftView(accountId, site.id);
  } catch (err) {
    if (!(err instanceof ToolError)) throw err;
    return (
      <PageContent>
        <div className="space-y-6">
          {header}
          {/* The builder's failure already says what the title does; only its try-again is news. */}
          <EmptyState title="Your site couldn't be loaded" description={err.message === BUILDER_FAILED.read ? "Try again in a moment." : err.message} />
        </div>
      </PageContent>
    );
  }

  // Who has the site as the page renders (PRD D64). Opening the page takes nothing: the site
  // becomes this person's when they open a field.
  const editing = (await getSiteEditing(accountId, session.user.id)) ?? { by: null, marker: "", hasDraft: false, draftBy: null, draftSummary: null };
  const content = view.content as { pages?: Page[]; announcements?: Announcement[] };
  const pages: CanvasPage[] = (content.pages ?? []).map((p) => ({
    path: p.path.replace(/\/$/, "") || "/",
    title: p.id === "home" ? "Home" : (p.navLabel ?? p.title),
  }));

  return (
    <PageContent width="wide">
      <div className="space-y-6">
        {header}
        <SiteHoldProvider initial={editing}>
          <BehindGlass previewHref={`/preview/${site.id}`}>
            <CanvasEditor
              siteId={site.id}
              live={live}
              pages={pages}
              limits={view.guide.limits}
              announcements={(content.announcements ?? []).map((a) => ({ id: a.id, startsOn: a.startsOn ?? "", endsOn: a.endsOn ?? "" }))}
            />
          </BehindGlass>
        </SiteHoldProvider>
      </div>
    </PageContent>
  );
}

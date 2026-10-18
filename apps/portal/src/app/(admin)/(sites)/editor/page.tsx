// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import type { Announcement, Page } from "@canopy/site-contract";
import { getCurrentAccountId } from "@/lib/auth-utils";
import { getAccountSite } from "@/lib/data-access/sites";
import { builderConfigured } from "@/lib/builder-client";
import { getDraftView, ToolError } from "@/lib/site-tools";
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { CanvasEditor, type CanvasPage } from "./canvas-editor";

export const dynamic = "force-dynamic";

/**
 * The visual editor (Epic 33, PRD D35 to D45): the site on a canvas, its
 * marked fields edited in place, everything saved to the site's one draft.
 * The canvas loads pages through /demo, so only the demo site has one until
 * client sites get preview hostnames (PRD D43).
 */
export default async function EditorPage() {
  const accountId = await getCurrentAccountId();
  const site = await getAccountSite(accountId);
  const header = <PageHeader title="Editor" description="Change the marked text right on your site." />;

  if (!site?.isDemo || !builderConfigured()) {
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
          <EmptyState title="Your site couldn't be loaded" description={err.message} />
        </div>
      </PageContent>
    );
  }

  const content = view.content as { pages?: Page[]; announcements?: Announcement[] };
  const pages: CanvasPage[] = (content.pages ?? []).map((p) => ({
    path: p.path === "/" ? "/demo/" : `/demo${p.path.replace(/\/$/, "")}`,
    title: p.id === "home" ? "Home" : (p.navLabel ?? p.title),
  }));

  return (
    <PageContent width="wide">
      <div className="space-y-6">
        {header}
        <CanvasEditor
          siteId={site.id}
          pages={pages}
          limits={view.guide.limits}
          announcements={(content.announcements ?? []).map((a) => ({ id: a.id, startsOn: a.startsOn ?? "", endsOn: a.endsOn ?? "" }))}
        />
      </div>
    </PageContent>
  );
}

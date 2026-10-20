// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentAccountId, requireAuth } from "@/lib/auth-utils";
import { getAccountEntitlements } from "@/lib/data-access/entitlements";
import { requireHomeHost } from "@/lib/product";
import { builderConfigured } from "@/lib/builder-client";
import { previewableSite, previewStartPath } from "@/lib/site-tools";
import { liveSite } from "@/lib/site-live";
import { PreviewView } from "./preview-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/**
 * Preview (PRD D47): the site's draft in a tab of its own, the site filling
 * the window with the preview bar along the bottom, which holds the only
 * Publish. Outside (admin), so no Sites chrome. Without a path it opens on
 * the page the draft changes.
 */
export default async function PreviewPage({ params }: { params: Promise<{ siteId: string; path?: string[] }> }) {
  const { siteId, path } = await params;
  const session = await requireAuth();
  const accountId = await getCurrentAccountId();
  await requireHomeHost(await getAccountEntitlements(accountId));
  const site = await previewableSite(session.user.id, siteId);
  const live = site ? liveSite(site) : null;
  if (!site || !live || !builderConfigured()) notFound();

  const start = path?.length ? `/${path.join("/")}` : await previewStartPath(accountId, site.id).catch(() => "/");
  return (
    <PreviewView
      siteId={site.id}
      siteName={site.name}
      live={live}
      startPath={start}
      // The demo is served from its builds, so a publish is live at once; a client
      // site is live once its own deploy finishes, until E36 serves it from builds too.
      liveNow={site.isDemo}
      host={site.isDemo ? null : (site.productionHostnames[0] ?? null)}
    />
  );
}

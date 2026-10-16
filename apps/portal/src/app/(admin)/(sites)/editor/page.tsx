// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { Suspense } from "react";
import type { Category } from "@canopy/site-contract";
import { getCurrentAccountId } from "@/lib/auth-utils";
import { getAccountSite } from "@/lib/data-access/sites";
import { builderConfigured, fetchSiteFile } from "@/lib/builder-client";
import { getContentView } from "@/lib/site-tools";
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { VisualEditorConcept } from "./visual-editor-concept";
import { Inspector, InspectorSkeleton, PageTabs, PageTabsSkeleton, type ConceptData } from "./concept-panels";

export const dynamic = "force-dynamic";

/**
 * The visual editor, as a static concept for sales (Epic 30, D9): the demo
 * site framed with in-place editing drawn over it, and an inspector beside
 * it. Nothing here is interactive or saves anything; quick edit is the
 * working editor. Everything shown comes from the site itself, so no client
 * content lives in this repo.
 */
export default async function EditorPage() {
  const accountId = await getCurrentAccountId();
  const site = await getAccountSite(accountId);

  const header = (
    <PageHeader
      title="Editor"
      description="Click anything on your site to change it in place."
      actions={<Badge variant="brand">Coming soon</Badge>}
    />
  );

  if (!site?.isDemo || !builderConfigured()) {
    return (
      <PageContent>
        <div className="space-y-6">
          {header}
          <EmptyState title="The visual editor is coming soon" description="Until then, Quick Edit makes any change to your site." />
        </div>
      </PageContent>
    );
  }

  // Not awaited: the page and the framed site render at once, and the parts
  // that need the site's content stream in behind skeletons.
  const data = conceptData(accountId, site.slug).catch(() => null);

  return (
    <PageContent width="wide">
      <div className="space-y-6">
        {header}
        <VisualEditorConcept
          pageTabs={
            <Suspense fallback={<PageTabsSkeleton />}>
              <PageTabs data={data} />
            </Suspense>
          }
          inspector={
            <Suspense fallback={<InspectorSkeleton />}>
              <Inspector data={data} />
            </Suspense>
          }
        />
      </div>
    </PageContent>
  );
}

const LOCKED_LABELS: Record<string, string> = {
  "site.contact.phone": "Phone",
  "site.contact.email": "Email",
  "site.contact.address": "Address",
};

async function conceptData(accountId: string, slug: string): Promise<ConceptData> {
  // The content read fetches from GitHub; the stylesheet comes from the
  // builder's disk. Run them side by side.
  const [view, style] = await Promise.all([getContentView(accountId), siteStyle(slug).catch(() => ({ colors: [], fonts: [] }))]);
  const content = view.published as {
    pages?: Array<{ id: string; title: string; navLabel?: string; sections: Array<{ serviceIds?: string[] }> }>;
    services?: Category[];
  };

  // The price drawn mid-edit is the first featured service's.
  const featuredId = content.pages?.find((p) => p.id === "home")?.sections.find((s) => s.serviceIds?.length)?.serviceIds?.[0];
  let selected: ConceptData["selected"] = null;
  for (const category of content.services ?? []) {
    const lists = [category.services, ...(category.groups ?? []).map((g) => g.services), ...(category.sections ?? []).flatMap((s) => [s.services, ...(s.groups ?? []).map((g) => g.services)])];
    for (const service of lists.flat()) {
      if (service && (featuredId ? service.id === featuredId : true)) {
        selected = { category: category.name, service: service.name, price: service.priceLabel };
        break;
      }
    }
    if (selected) break;
  }

  return {
    pages: (content.pages ?? []).map((p) => (p.id === "home" ? "Home" : (p.navLabel ?? p.title))),
    selected,
    locked: view.site.lockedFields.map((f) => LOCKED_LABELS[f] ?? f.split(".").pop() ?? f),
    style,
  };
}

/** The site's own theme, read from its built stylesheet. */
async function siteStyle(slug: string): Promise<ConceptData["style"]> {
  const html = await (await fetchSiteFile(slug, "current", "")).text();
  const sheets = [...html.matchAll(/href="\/demo\/(_astro\/[^"]+\.css)"/g)].map((m) => m[1]);
  let css = "";
  for (const sheet of sheets.slice(0, 4)) css += await (await fetchSiteFile(slug, "current", sheet)).text();

  const colors = new Map<string, string>();
  for (const m of css.matchAll(/--color-([a-z][a-z-]*):\s*(#[0-9a-fA-F]{3,8})\b/g)) {
    // Skip Tailwind's numbered palette and plain black and white.
    if (/\d/.test(m[1]) || m[1] === "black" || m[1] === "white" || colors.has(m[1])) continue;
    colors.set(m[1], m[2]);
  }
  const fonts: ConceptData["style"]["fonts"] = [];
  for (const [role, name] of [["serif", "Headings"], ["sans", "Body"]] as const) {
    const m = css.match(new RegExp(`--font-${role}:\\s*["']?([^"',;]+)`));
    if (m) fonts.push({ role: name, family: m[1].trim() });
  }
  return {
    colors: [...colors].slice(0, 8).map(([name, hex]) => ({ name: name.replace(/-/g, " "), hex })),
    fonts,
  };
}

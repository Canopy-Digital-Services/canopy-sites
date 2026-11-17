// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { docsNavFor, getAllDocs } from "@/lib/docs";
import { getCurrentEntitlements } from "@/lib/auth-utils";
import { DocsSidebar, DocsSidebarMobile } from "@/components/docs/docs-sidebar";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sitesEnabled } = await getCurrentEntitlements();
  const docs = await getAllDocs(sitesEnabled);
  const bySlug = new Map(docs.map((d) => [d.slug, d]));

  const groups = docsNavFor(sitesEnabled).map((g) => ({
    group: g.group,
    items: g.slugs
      .map((slug) => {
        const doc = bySlug.get(slug);
        return doc ? { slug: doc.slug, title: doc.title } : null;
      })
      .filter((x): x is { slug: string; title: string } => x !== null),
  }));

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-background">
      <DocsSidebar groups={groups} />
      <div className="flex-1 min-w-0 px-4 py-6 md:px-10 md:py-10">
        <DocsSidebarMobile groups={groups} />
        {children}
      </div>
    </div>
  );
}

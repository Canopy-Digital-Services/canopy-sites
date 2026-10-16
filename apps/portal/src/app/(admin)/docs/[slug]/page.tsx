// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { getAllDocs, getDocBySlug, getPrevNext } from "@/lib/docs";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocTOC } from "@/components/docs/doc-toc";
import { PrevNext } from "@/components/docs/prev-next";

interface DocPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: DocPageProps) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);
  if (!doc) return {};
  return {
    title: `${doc.title} · Canopy Forms docs`,
    description: doc.description || undefined,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  if (slug === "index") {
    notFound();
  }

  const doc = await getDocBySlug(slug);
  if (!doc) {
    notFound();
  }

  const allDocs = await getAllDocs();
  const { prev, next } = getPrevNext(slug, allDocs);

  return (
    <div className="flex gap-10">
      <div className="flex-1 min-w-0">
        <DocsBreadcrumb title={doc.title} group={doc.group} />

        <header className="mb-8">
          <h1 className="text-4xl font-heading font-bold tracking-tight">
            {doc.title}
          </h1>
          {doc.description ? (
            <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
              {doc.description}
            </p>
          ) : null}
        </header>

        <Markdown content={doc.content} />

        <PrevNext prev={prev} next={next} />
      </div>

      <DocTOC headings={doc.headings} />
    </div>
  );
}

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { createElement } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { getAllDocs, getDocBySlug } from "@/lib/docs";
import { docsNav } from "../../../../content/docs/meta";
import { DocTOC } from "@/components/docs/doc-toc";

export const metadata = {
  title: "Help Documentation",
};

type TileProps = {
  slug: string;
  title: string;
  description: string;
  icon: string;
};

function resolveIcon(name: string): LucideIcon {
  const maybe = (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[name];
  if (maybe && typeof maybe === "function") return maybe;
  return FileText;
}

function Tile({ slug, title, description, icon }: TileProps) {
  const href = slug === "index" ? "/docs" : `/docs/${slug}`;
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-2 rounded-lg border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {createElement(resolveIcon(icon), { className: "h-4 w-4" })}
      </span>
      <div>
        <h3 className="text-sm font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default async function DocsPage() {
  const index = await getDocBySlug("index");
  const allDocs = await getAllDocs();

  if (!index) {
    return (
      <div>
        <h1 className="text-4xl font-heading font-bold tracking-tight">
          Help Documentation
        </h1>
        <p className="mt-4 text-muted-foreground">
          Documentation is being set up. Please check back soon.
        </p>
      </div>
    );
  }

  const bySlug = new Map(allDocs.map((d) => [d.slug, d]));
  const tileGroups = docsNav.map((g) => ({
    group: g.group,
    items: (g.slugs as unknown as string[])
      .filter((slug) => slug !== "index")
      .map((slug) => bySlug.get(slug))
      .filter((d): d is NonNullable<typeof d> => Boolean(d))
      .map((d) => ({
        slug: d.slug,
        title: d.title,
        description: d.description,
        icon: d.icon,
      })),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex gap-10">
      <div className="flex-1 min-w-0">
        <header className="mb-10">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-heading font-bold tracking-tight">
              {index.title}
            </h1>
            <Badge variant="outline" className="mt-1">
              Beta
            </Badge>
          </div>
          {index.description ? (
            <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
              {index.description}
            </p>
          ) : null}
        </header>

        <Markdown content={index.content} />

        <section className="mt-16" aria-labelledby="docs-browse">
          <h2
            id="docs-browse"
            className="text-2xl font-heading font-semibold tracking-tight pb-2 border-b border-border/60"
          >
            Browse the docs
          </h2>
          <div className="mt-6 space-y-8">
            {tileGroups.map((group) => (
              <div key={group.group}>
                <h3 className="mb-3 text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.group}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => (
                    <Tile key={item.slug} {...item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <DocTOC headings={index.headings} />
    </div>
  );
}

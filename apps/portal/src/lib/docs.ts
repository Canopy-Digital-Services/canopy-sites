import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";
import { docsNav } from "../../content/docs/meta";

const docsDir = path.join(process.cwd(), "content/docs");

export type DocHeading = {
  depth: 2 | 3;
  text: string;
  id: string;
};

export type Doc = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  group: string;
  content: string;
  headings: DocHeading[];
};

export type AdjacentDoc = {
  slug: string;
  title: string;
  description: string;
  group: string;
};

function slugify(text: string): string {
  return new GithubSlugger().slug(text);
}

export function extractHeadings(markdown: string): DocHeading[] {
  const slugger = new GithubSlugger();
  const headings: DocHeading[] = [];
  const lines = markdown.split("\n");

  let inFence = false;
  for (const rawLine of lines) {
    const line = rawLine;
    const fence = line.match(/^\s*```/);
    if (fence) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const depth = match[1].length as 2 | 3;
    const text = match[2].replace(/`([^`]+)`/g, "$1").trim();
    if (!text) continue;
    headings.push({ depth, text, id: slugger.slug(text) });
  }

  return headings;
}

export type DocsNavGroup = { group: string; slugs: readonly string[] };

/**
 * The help pages an account is shown: every group, less the ones about a
 * Canopy Sites website for an account without one. The sidebar, the index
 * tiles, previous and next, and whether a page opens at all go by this.
 */
export function docsNavFor(sitesEnabled: boolean): DocsNavGroup[] {
  return docsNav.filter((g) => sitesEnabled || !("sites" in g && g.sites));
}

function orderedSlugs(sitesEnabled: boolean): string[] {
  return docsNavFor(sitesEnabled).flatMap((g) => [...g.slugs]);
}

function groupForSlug(slug: string): string {
  for (const group of docsNav) {
    if ((group.slugs as unknown as string[]).includes(slug)) return group.group;
  }
  return "";
}

async function readDoc(slug: string): Promise<Doc | null> {
  const filePath = path.join(docsDir, `${slug}.md`);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }

  const parsed = matter(raw);
  const fm = parsed.data as Record<string, unknown>;
  const title =
    typeof fm.title === "string" && fm.title.length > 0
      ? fm.title
      : slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
  const description = typeof fm.description === "string" ? fm.description : "";
  const icon = typeof fm.icon === "string" ? fm.icon : "FileText";
  const content = parsed.content;

  return {
    slug,
    title,
    description,
    icon,
    group: groupForSlug(slug),
    content,
    headings: extractHeadings(content),
  };
}

/** The help pages this account is shown, in the manifest's order. */
export async function getAllDocs(sitesEnabled: boolean): Promise<Doc[]> {
  const slugs = orderedSlugs(sitesEnabled);
  const docs = await Promise.all(slugs.map((s) => readDoc(s)));
  return docs.filter((d): d is Doc => d !== null);
}

export async function getDocBySlug(slug: string): Promise<Doc | null> {
  return readDoc(slug);
}

export function getPrevNext(slug: string, docs: Doc[]): {
  prev: AdjacentDoc | null;
  next: AdjacentDoc | null;
} {
  const filtered = docs.filter((d) => d.slug !== "index");
  const idx = filtered.findIndex((d) => d.slug === slug);
  if (idx === -1) return { prev: null, next: null };

  const toAdjacent = (d: Doc): AdjacentDoc => ({
    slug: d.slug,
    title: d.title,
    description: d.description,
    group: d.group,
  });

  return {
    prev: idx > 0 ? toAdjacent(filtered[idx - 1]) : null,
    next: idx < filtered.length - 1 ? toAdjacent(filtered[idx + 1]) : null,
  };
}

export { slugify };

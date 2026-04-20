// Navigation manifest for /docs. Order here drives sidebar order, index tiles,
// and prev/next. Slugs must match filenames in content/docs/*.md (without .md).
//
// When adding a new doc page: create the .md file with frontmatter (title,
// description, icon) and add its slug to the appropriate group below.

export const docsNav = [
  { group: "Get started", slugs: ["index", "forms"] },
  { group: "Design & publish", slugs: ["appearance", "publishing", "hosted-forms"] },
  { group: "Operate", slugs: ["submissions", "account"] },
  { group: "Help", slugs: ["troubleshooting"] },
] as const;

export type DocsNav = typeof docsNav;
export type DocsGroup = DocsNav[number];

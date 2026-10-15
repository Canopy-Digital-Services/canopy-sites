// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import * as prod from "react/jsx-runtime";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkAlert from "remark-github-blockquote-alert";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeReact from "rehype-react";
import type { Plugin } from "unified";
import type { Root, Element, Text, RootContent } from "hast";
import { visit } from "unist-util-visit";
import {
  Info,
  Lightbulb,
  AlertTriangle,
  OctagonAlert,
  MessageSquareWarning,
} from "lucide-react";
import { CopyButton } from "./docs/copy-button";

type AlertVariant = "note" | "tip" | "important" | "warning" | "caution";

const ALERT_VARIANTS: Record<
  AlertVariant,
  {
    Icon: typeof Info;
    label: string;
    classes: string;
    iconClasses: string;
    titleClasses: string;
  }
> = {
  note: {
    Icon: Info,
    label: "Note",
    classes: "border-border/70 bg-muted/40",
    iconClasses: "text-muted-foreground",
    titleClasses: "text-foreground",
  },
  tip: {
    Icon: Lightbulb,
    label: "Tip",
    classes: "border-success/40 bg-success/5",
    iconClasses: "text-success-strong",
    titleClasses: "text-success-strong",
  },
  important: {
    Icon: MessageSquareWarning,
    label: "Important",
    classes: "border-primary/30 bg-primary/5",
    iconClasses: "text-primary",
    titleClasses: "text-primary",
  },
  warning: {
    Icon: AlertTriangle,
    label: "Warning",
    classes:
      "border-amber-200 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/20",
    iconClasses: "text-amber-600 dark:text-amber-400",
    titleClasses: "text-amber-800 dark:text-amber-300",
  },
  caution: {
    Icon: OctagonAlert,
    label: "Caution",
    classes: "border-destructive/30 bg-destructive/5",
    iconClasses: "text-destructive",
    titleClasses: "text-destructive",
  },
};

function getNodeText(node: RootContent | Element | Text | undefined | null): string {
  if (!node) return "";
  if (node.type === "text") return (node as Text).value;
  const children = (node as Element).children;
  if (Array.isArray(children)) {
    return children.map((c) => getNodeText(c as RootContent)).join("");
  }
  return "";
}

// Stashes raw code text on <pre> before rehype-pretty-code tokenizes it, so the
// copy button can read the unhighlighted source.
const rehypeCaptureRawCode: Plugin<[], Root> = () => (tree: Root) => {
  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "pre") return;
    const codeChild = node.children.find(
      (c): c is Element => (c as Element).type === "element" && (c as Element).tagName === "code"
    );
    if (!codeChild) return;
    node.properties = node.properties ?? {};
    node.properties["dataRawCode"] = getNodeText(codeChild);
  });
};

function classNamesArray(className: unknown): string[] {
  if (Array.isArray(className)) return className.map((c) => String(c));
  if (typeof className === "string") return className.split(/\s+/);
  return [];
}

function headingClasses(level: 1 | 2 | 3 | 4 | 5 | 6): string {
  switch (level) {
    case 1:
      return "text-4xl font-heading font-bold tracking-tight mb-4 scroll-mt-20";
    case 2:
      return "text-2xl font-heading font-semibold tracking-tight mt-12 mb-4 pb-2 border-b border-border/60 scroll-mt-20";
    case 3:
      return "text-lg font-heading font-semibold mt-8 mb-2 scroll-mt-20";
    case 4:
      return "text-base font-heading font-semibold mt-6 mb-2 scroll-mt-20";
    default:
      return "text-sm font-heading font-semibold mt-4 mb-2 scroll-mt-20";
  }
}

type JsxRuntime = {
  Fragment: typeof prod.Fragment;
  jsx: typeof prod.jsx;
  jsxs: typeof prod.jsxs;
};

const components = {
  h1: ({ children, ...props }: React.ComponentProps<"h1">) => (
    <h1 className={headingClasses(1)} {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.ComponentProps<"h2">) => (
    <h2 className={headingClasses(2)} {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.ComponentProps<"h3">) => (
    <h3 className={headingClasses(3)} {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: React.ComponentProps<"h4">) => (
    <h4 className={headingClasses(4)} {...props}>
      {children}
    </h4>
  ),
  p: ({ className, children, ...props }: React.ComponentProps<"p">) => {
    const classes = classNamesArray(className);
    // Skip the title paragraph injected by remark-github-blockquote-alert —
    // we render our own title in the blockquote component.
    if (classes.includes("markdown-alert-title")) return null;
    return (
      <p className="mb-4 leading-relaxed text-[15px] text-foreground/90" {...props}>
        {children}
      </p>
    );
  },
  ul: ({ children, ...props }: React.ComponentProps<"ul">) => (
    <ul
      className="mb-4 ml-6 list-disc space-y-2 text-[15px] leading-relaxed marker:text-muted-foreground"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.ComponentProps<"ol">) => (
    <ol
      className="mb-4 ml-6 list-decimal space-y-2 text-[15px] leading-relaxed marker:text-muted-foreground"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.ComponentProps<"li">) => (
    <li className="pl-1" {...props}>
      {children}
    </li>
  ),
  a: ({ href, children, ...props }: React.ComponentProps<"a">) => {
    const isExternal = typeof href === "string" && href.startsWith("http");
    let resolvedHref = href;
    if (typeof href === "string" && !isExternal && !href.startsWith("#")) {
      const mdMatch =
        href.match(/^(?:\.\/)?([\w-]+)\.md(#.*)?$/) ??
        href.match(/^\/docs\/([\w-]+)\.md(#.*)?$/);
      if (mdMatch) {
        const slug = mdMatch[1];
        resolvedHref = slug === "index" ? `/docs${mdMatch[2] ?? ""}` : `/docs/${slug}${mdMatch[2] ?? ""}`;
      }
    }
    return (
      <a
        href={resolvedHref}
        className="text-primary underline-offset-4 hover:underline"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    );
  },
  code: ({ className, children, ...props }: React.ComponentProps<"code">) => {
    const classes = classNamesArray(className);
    const isInline = !classes.some((c) => c.startsWith("language-"));
    if (isInline) {
      return (
        <code
          className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-0.5 text-[0.875em] font-mono text-foreground/90"
          {...props}
        >
          {children}
        </code>
      );
    }
    // Block code — pass through so rehype-pretty-code's tokenization + data
    // attributes (data-language, data-theme) stay intact.
    return (
      <code className={classes.join(" ")} {...props}>
        {children}
      </code>
    );
  },
  pre: ({
    children,
    ...props
  }: React.ComponentProps<"pre">) => {
    const allProps = props as Record<string, unknown>;
    const raw = allProps["data-raw-code"];
    const rawString = typeof raw === "string" ? raw : "";
    const preProps = Object.fromEntries(
      Object.entries(allProps).filter(([k]) => k !== "data-raw-code")
    ) as React.ComponentProps<"pre">;
    return (
      <div className="group relative my-5">
        {rawString ? <CopyButton value={rawString} /> : null}
        <pre
          className="overflow-x-auto rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-[13px] font-mono leading-relaxed"
          {...preProps}
        >
          {children}
        </pre>
      </div>
    );
  },
  blockquote: ({ className, children, ...props }: React.ComponentProps<"blockquote">) => {
    const classes = classNamesArray(className);
    const variantMatch = classes
      .map((c) => /^markdown-alert-(note|tip|important|warning|caution)$/.exec(c)?.[1])
      .find((v): v is AlertVariant => Boolean(v));

    if (variantMatch) {
      const { Icon, label, classes: wrapperClasses, iconClasses, titleClasses } =
        ALERT_VARIANTS[variantMatch];
      return (
        <div
          className={`my-6 flex gap-3 rounded-lg border px-4 py-3 ${wrapperClasses}`}
          role="note"
        >
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClasses}`} aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className={`mb-1 text-sm font-heading font-semibold ${titleClasses}`}>
              {label}
            </div>
            <div className="text-sm leading-relaxed text-foreground/90 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>p]:text-sm [&>p]:leading-relaxed [&_code]:text-[0.875em]">
              {children}
            </div>
          </div>
        </div>
      );
    }

    return (
      <blockquote
        className="my-6 border-l-4 border-border/60 pl-4 italic text-muted-foreground"
        {...props}
      >
        {children}
      </blockquote>
    );
  },
  table: ({ children, ...props }: React.ComponentProps<"table">) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: React.ComponentProps<"thead">) => (
    <thead className="bg-muted/40 border-b border-border/60" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: React.ComponentProps<"tbody">) => (
    <tbody className="divide-y divide-border/60" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: React.ComponentProps<"tr">) => (
    <tr className="transition-colors hover:bg-muted/30" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: React.ComponentProps<"th">) => (
    <th className="px-4 py-2.5 text-left text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.ComponentProps<"td">) => (
    <td className="px-4 py-2.5 align-top text-foreground/90" {...props}>
      {children}
    </td>
  ),
  hr: () => <hr className="my-10 border-border/60" />,
  img: ({ src, alt, ...props }: React.ComponentProps<"img">) => {
    const caption = alt && alt.trim().length > 0 ? alt : null;
    return (
      <figure className="my-6 overflow-hidden rounded-lg border border-border/60 bg-background shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} className="block w-full h-auto" {...props} />
        {caption ? (
          <figcaption className="px-4 py-2 text-xs text-muted-foreground border-t border-border/60 bg-muted/30">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    );
  },
};

type MarkdownProps = {
  content: string;
};

export async function Markdown({ content }: MarkdownProps) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAlert)
    .use(remarkRehype)
    .use(rehypeCaptureRawCode)
    .use(rehypePrettyCode, {
      theme: "github-light",
      keepBackground: false,
    })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: {
        className: ["heading-anchor"],
        ariaLabel: "Link to section",
        tabIndex: -1,
      },
      content: {
        type: "element",
        tagName: "span",
        properties: { className: ["heading-anchor-icon"], ariaHidden: "true" },
        children: [{ type: "text", value: "#" }],
      },
    })
    .use(rehypeReact, {
      Fragment: (prod as unknown as JsxRuntime).Fragment,
      jsx: (prod as unknown as JsxRuntime).jsx,
      jsxs: (prod as unknown as JsxRuntime).jsxs,
      components,
    } as unknown as Parameters<typeof rehypeReact>[0]);

  const file = await processor.process(content);
  const rendered = file.result as React.ReactNode;

  return <div className="docs-prose">{rendered}</div>;
}

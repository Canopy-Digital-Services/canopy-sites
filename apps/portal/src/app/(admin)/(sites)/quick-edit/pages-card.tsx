// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type EditorPage = { id: string; path: string; title: string };

/** The site's pages, once its content has loaded (streamed behind a skeleton). */
export async function PagesCard({ pages, liveUrl }: { pages: Promise<EditorPage[] | string>; liveUrl: string | null }) {
  const result = await pages;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Pages</CardTitle>
      </CardHeader>
      <CardContent>
        {typeof result === "string" ? (
          <p className="text-sm text-muted-foreground">{result}</p>
        ) : (
          <ul className="divide-y">
            {result.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span>{p.title}</span>
                {liveUrl ? (
                  <a href={`${liveUrl}${p.path === "/" ? "" : p.path}`} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground">
                    View
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function PagesCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Pages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {["w-16", "w-20", "w-28"].map((w) => (
          <div key={w} className={`h-5 ${w} animate-pulse rounded-md bg-muted`} />
        ))}
      </CardContent>
    </Card>
  );
}

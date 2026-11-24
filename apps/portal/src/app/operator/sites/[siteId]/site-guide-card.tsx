// UI: see docs/UX_PATTERNS.md for layout and component conventions.
// Where the site's published content breaks the contract or its SITE_GUIDE.md
// rules. Owner edits are checked only on what they change (ROADMAP E47), so a
// Canopy push or a tightened guide shows up here, not as refused edits.
// Rendered on the server; the page streams it in so a slow builder never
// holds up the rest of the page.
import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { publishedGuideIssues } from "@/lib/site-tools";

export function SiteGuideCardShell({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Site guide</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">{children}</CardContent>
    </Card>
  );
}

const STATUS_LINE = {
  "no-repo": "No repo.",
  unconfigured: "The builder isn't set up in this environment.",
  unreachable: "The site couldn't be read just now.",
} as const;

export async function SiteGuideCard({ siteId }: { siteId: string }) {
  const reading = await publishedGuideIssues(siteId);
  if (reading.status !== "read") {
    return (
      <SiteGuideCardShell>
        <p className="text-muted-foreground">{STATUS_LINE[reading.status]}</p>
      </SiteGuideCardShell>
    );
  }
  if (!reading.issues.length) {
    return (
      <SiteGuideCardShell>
        <p className="text-muted-foreground">Published content fits the guide.</p>
      </SiteGuideCardShell>
    );
  }
  return (
    <SiteGuideCardShell>
      <ul className="space-y-3">
        {reading.issues.map((issue, i) => (
          <li key={`${issue.address}:${i}`} className="flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-800" />
            <div className="min-w-0">
              <p className="font-mono text-xs break-all">{issue.address}</p>
              <p className="text-muted-foreground">{issue.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </SiteGuideCardShell>
  );
}

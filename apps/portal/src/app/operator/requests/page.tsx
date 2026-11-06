// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import Link from "next/link";
import { Inbox } from "lucide-react";
import { fieldInfo } from "@canopy/site-contract";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { listHelpRequestsForOperator } from "@/lib/site-tools/help-requests";
import { PageContent } from "@/components/patterns/page-content";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Card } from "@/components/ui/card";
import { CloseRequestForm } from "./close-request-form";

const STATUS = {
  OPEN: { label: "Open", dot: "bg-primary" },
  DONE: { label: "Done", dot: "bg-success" },
  DECLINED: { label: "Declined", dot: "bg-muted-foreground" },
} as const;

function fieldLabel(address: string | null): string | null {
  if (!address) return null;
  try {
    return fieldInfo(address)?.label ?? address;
  } catch {
    return address;
  }
}

/** What owners sent Canopy from Quick Edit (PRD D34): open first, then newest, across sites or for one. */
export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  await requireGlobalAdmin();
  const { site: siteId } = await searchParams;
  const requests = await listHelpRequestsForOperator({ siteId: siteId || undefined });
  const siteName = siteId ? requests[0]?.site.name : undefined;

  return (
    <PageContent>
      <div className="max-w-[720px] mx-auto space-y-6">
        <PageHeader
          title="Requests"
          description={siteId ? `${siteName ?? "This site"} only` : undefined}
          actions={
            siteId ? (
              <Link href="/operator/requests" className="text-sm text-muted-foreground hover:underline">
                All sites
              </Link>
            ) : null
          }
        />
        {requests.length === 0 ? (
          <EmptyState icon={<Inbox className="h-8 w-8" />} title="No requests yet" description="What owners send from Quick Edit lands here." />
        ) : (
          <Card className="divide-y p-0">
            {requests.map((r) => {
              const status = STATUS[r.status as keyof typeof STATUS];
              const when = (d: Date | null) =>
                d ? d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: r.site.timeZone }) : null;
              const about = fieldLabel(r.address);
              const acting = Boolean(r.actAsId);
              return (
                <div key={r.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm">
                        <Link href={`/operator/sites/${r.site.id}`} className="font-medium hover:underline">
                          {r.site.name}
                        </Link>
                        <span className="text-muted-foreground"> · {r.summary}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {acting ? `${r.createdBy?.email ?? "An operator"}, acting as the client` : (r.createdBy?.email ?? "Owner")}
                        {r.sentAt ? ` · ${when(r.sentAt)}` : null}
                        {about ? ` · ${about}` : null}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap rounded-md bg-muted px-3 py-2 text-sm">{r.message}</p>
                  {r.status === "OPEN" ? (
                    <CloseRequestForm requestId={r.id} acting={acting} />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {status.label} {when(r.closedAt)}
                      {r.closedBy ? ` by ${r.closedBy.email}` : null}
                      {r.note ? `: ${r.note}` : null}
                    </p>
                  )}
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </PageContent>
  );
}

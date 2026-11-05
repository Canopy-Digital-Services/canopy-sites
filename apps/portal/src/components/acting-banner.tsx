// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { getAccountSite } from "@/lib/data-access/sites";
import { getAccountOwnerEmail } from "@/lib/data-access/memberships";
import { stopActing } from "@/actions/admin/act-as";

/**
 * Shown on every page while a Global Admin acts as a client (PRD D49): whose
 * account this is, and Stop. Renders nothing otherwise.
 */
export async function ActingBanner() {
  const session = await getSession();
  if (!session?.actingAs) return null;

  const { accountId } = session.actingAs;
  const [site, ownerEmail] = await Promise.all([getAccountSite(accountId), getAccountOwnerEmail(accountId)]);
  const who = site?.name ?? ownerEmail ?? "a client";

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-100 px-4 py-1.5 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
    >
      <span>
        Acting as <span className="font-medium">{who}</span>
        {site && ownerEmail ? ` (${ownerEmail})` : null}
      </span>
      <form action={stopActing}>
        <Button type="submit" variant="outline" size="sm" className="h-7">
          Stop
        </Button>
      </form>
    </div>
  );
}

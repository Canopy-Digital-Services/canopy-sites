import { requireAuth, getCurrentAccountId } from "@/lib/auth-utils";
import { isActing } from "@/lib/act-as";
import { getAccountOwnerEmail } from "@/lib/data-access/memberships";
import { AccountDashboard } from "@/components/account/account-dashboard";
import { PageContent } from "@/components/patterns/page-content";
import { getAccountEntitlements } from "@/lib/data-access/entitlements";
import { getAccountSite } from "@/lib/data-access/sites";

export default async function AccountPage() {
  const session = await requireAuth();
  const accountId = await getCurrentAccountId();
  const entitlements = await getAccountEntitlements(accountId);
  const site = await getAccountSite(accountId);
  // Acting as the client (PRD D49), the page is the owner's: their email, and no password or deletion.
  const acting = isActing(session);
  const email = acting ? await getAccountOwnerEmail(accountId) : session.user.email;

  return (
    <PageContent>
      <AccountDashboard
        email={email ?? ""}
        planDisplayName={entitlements.planDisplayName}
        publishedFormsCount={entitlements.publishedFormsCount}
        maxPublishedForms={entitlements.maxPublishedForms}
        totalFormsCount={entitlements.totalFormsCount}
        hasSite={site !== null}
        acting={acting}
      />
    </PageContent>
  );
}

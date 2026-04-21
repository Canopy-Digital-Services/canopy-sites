import { requireAuth, getCurrentAccountId } from "@/lib/auth-utils";
import { AccountDashboard } from "@/components/account/account-dashboard";
import { PageContent } from "@/components/patterns/page-content";
import { getAccountEntitlements } from "@/lib/data-access/entitlements";

export default async function AccountPage() {
  const session = await requireAuth();
  const accountId = await getCurrentAccountId();
  const entitlements = await getAccountEntitlements(accountId);

  return (
    <PageContent>
      <AccountDashboard
        email={session.user?.email ?? ""}
        planDisplayName={entitlements.planDisplayName}
        publishedFormsCount={entitlements.publishedFormsCount}
        maxPublishedForms={entitlements.maxPublishedForms}
        totalFormsCount={entitlements.totalFormsCount}
      />
    </PageContent>
  );
}

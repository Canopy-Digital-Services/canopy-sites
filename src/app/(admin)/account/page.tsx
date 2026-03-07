import { requireAuth } from "@/lib/auth-utils";
import { AccountDashboard } from "@/components/account/account-dashboard";
import { PageContent } from "@/components/patterns/page-content";

export default async function AccountPage() {
  const session = await requireAuth();

  return (
    <PageContent>
      <AccountDashboard email={session.user?.email ?? ""} />
    </PageContent>
  );
}

import { requireAuth } from "@/lib/auth-utils";
import { AccountDashboard } from "@/components/account/account-dashboard";

export default async function AccountPage() {
  const session = await requireAuth();

  return <AccountDashboard email={session.user?.email ?? ""} />;
}

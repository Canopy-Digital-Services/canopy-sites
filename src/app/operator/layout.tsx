import { requireOperator } from "@/lib/auth-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { TopNavLayout } from "@/components/patterns/top-nav-layout";
import { UserMenu } from "@/components/patterns/user-menu";

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireOperator();

  const logo = (
    <span className="text-sm font-heading font-semibold">Operator Console</span>
  );

  const navItems = (
    <Link href="/operator/accounts">
      <Button variant="ghost" size="sm">
        <Users className="mr-2 h-4 w-4" />
        Accounts
      </Button>
    </Link>
  );

  return (
    <TopNavLayout
      logo={logo}
      navItems={navItems}
      userMenu={<UserMenu email={session.user?.email} />}
    >
      {children}
    </TopNavLayout>
  );
}

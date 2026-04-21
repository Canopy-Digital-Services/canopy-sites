import { requireGlobalAdmin } from "@/lib/auth-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, House } from "lucide-react";
import { TopNavLayout } from "@/components/patterns/top-nav-layout";
import { UserMenu } from "@/components/patterns/user-menu";

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireGlobalAdmin();

  const logo = (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/forms">
            <Button variant="ghost" size="icon-sm" aria-label="Back to forms">
              <House className="h-4 w-4" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>Back to forms</TooltipContent>
      </Tooltip>
      <span className="text-sm font-heading font-semibold">Operator Console</span>
    </div>
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
      userMenu={
        <UserMenu
          email={session.user?.email}
          isGlobalAdmin={session.user?.role === "GLOBAL_ADMIN"}
        />
      }
    >
      {children}
    </TopNavLayout>
  );
}

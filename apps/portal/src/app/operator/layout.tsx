import type { Metadata } from "next";
import { requireGlobalAdmin, getCurrentEntitlements } from "@/lib/auth-utils";
import { homePathFor, productFor, productMetadata, requireHomeHost } from "@/lib/product";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe, Users, House } from "lucide-react";
import { TopNavLayout } from "@/components/patterns/top-nav-layout";
import { UserMenu } from "@/components/patterns/user-menu";

export async function generateMetadata(): Promise<Metadata> {
  return productMetadata(productFor(await getCurrentEntitlements()));
}

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireGlobalAdmin();
  const entitlements = await getCurrentEntitlements();
  await requireHomeHost(entitlements);
  const homePath = homePathFor(entitlements);
  const homeLabel = homePath === "/quick-edit" ? "Back to Quick Edit" : "Back to forms";

  const logo = (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={homePath}>
            <Button variant="ghost" size="icon-sm" aria-label={homeLabel}>
              <House className="h-4 w-4" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>{homeLabel}</TooltipContent>
      </Tooltip>
      <span className="text-sm font-heading font-semibold">Operator Console</span>
    </div>
  );

  const navItems = (
    <>
      <Link href="/operator/accounts">
        <Button variant="ghost" size="sm">
          <Users className="mr-2 h-4 w-4" />
          Accounts
        </Button>
      </Link>
      <Link href="/operator/sites">
        <Button variant="ghost" size="sm">
          <Globe className="mr-2 h-4 w-4" />
          Sites
        </Button>
      </Link>
    </>
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

import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { FileText, BookOpen } from "lucide-react";
import { TopNavLayout } from "@/components/patterns/top-nav-layout";
import { UserMenu } from "@/components/patterns/user-menu";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  const logo = (
    <Link href="/forms">
      <BrandMark size="sm" className="gap-2" />
    </Link>
  );

  const navItems = (
    <>
      <Link href="/forms">
        <Button variant="ghost" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          Forms
        </Button>
      </Link>
      <Link href="/docs">
        <Button variant="ghost" size="sm">
          <BookOpen className="mr-2 h-4 w-4" />
          Help
        </Button>
      </Link>
    </>
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

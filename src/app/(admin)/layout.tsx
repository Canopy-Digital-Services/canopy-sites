import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { FileText, BookOpen } from "lucide-react";
import { ResponsiveSidebarLayout } from "@/components/patterns/responsive-sidebar-layout";
import { UserAccountFooter } from "@/components/patterns/user-account-footer";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  const nav = (
    <>
      <div className="mb-8">
        <BrandMark size="sm" className="gap-2" />
      </div>
      <nav className="space-y-2">
        <Link href="/forms">
          <Button variant="ghost" className="w-full justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Forms
          </Button>
        </Link>
        <Link href="/docs">
          <Button variant="ghost" className="w-full justify-start">
            <BookOpen className="mr-2 h-4 w-4" />
            Help
          </Button>
        </Link>
      </nav>
    </>
  );

  return (
    <ResponsiveSidebarLayout
      sidebar={nav}
      sidebarFooter={<UserAccountFooter email={session.user?.email} />}
    >
      {children}
    </ResponsiveSidebarLayout>
  );
}

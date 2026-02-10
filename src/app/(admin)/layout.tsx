import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { BrandMark } from "@/components/brand-mark";
import { FileText, BookOpen, LogOut } from "lucide-react";
import { ResponsiveSidebarLayout } from "@/components/patterns/responsive-sidebar-layout";
import { UserAccountFooter } from "@/components/patterns/user-account-footer";

async function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button type="submit" variant="ghost" className="w-full justify-start">
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </form>
  );
}

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
        <SignOutButton />
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

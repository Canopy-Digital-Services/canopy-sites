import { requireOperator } from "@/lib/auth-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { Users, LogOut } from "lucide-react";
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

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireOperator();

  const nav = (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-heading font-bold">Operator Console</h1>
      </div>
      <nav className="space-y-2">
        <Link href="/operator/accounts">
          <Button variant="ghost" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" />
            Accounts
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
